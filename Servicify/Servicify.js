
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');

const Error = require('@withjoy/error');


const makeDocs = endpoints => endpoints.map(endpoint => ({
  method: endpoint.method,
  name: endpoint.name,
  path: endpoint.path,
  arguments: endpoint.arguments,
  description: endpoint.description,
}));


const rootProto = obj => {
  if(obj.__proto__ === {}.__proto__){
    return obj;
  }else{
    return rootProto(obj.__proto__);
  }
}


const Servicify = config => {

  rootProto(config).__proto__ = Servicify.defaults;
  const { name: serviceName, endpoints, use, afterUse, handlers } = config;
  const port = config.port || config.PORT;
  handlers.__proto__ = require('./handlers')(config);


  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const corsMiddleware = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  };
  app.use(corsMiddleware);


  const errorResponse = (res, err) => {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
        name: err.name,
      }
    });
  };


  const registerEndpoint = (endpoint, includeHandlers = true) => {

    const handlerChain = (includeHandlers ?
      []
        .concat('arguments')
        .concat('error')
        .concat(use)
        .concat(endpoint.use || [])
        .concat('action')
        .concat(endpoint.afterUse || [])
        .concat(afterUse) :
        ['action']
    ).map(name => handlers[name]);

    const endpointHandler = (endpoint.action.length > 1 ?
      endpoint.action :
      (req, res) => Promise.resolve()
        .then(() => {
          req.arguments = {};
        })
        .then(() => handlerChain.reduce((p, f) => p.then(() => f(req, res, endpoint)), Promise.resolve()))
        .then(
          // Successful response!
          data => {
            if (endpoint.method === 'POST') res.status(201);
            res.json({ data });
          },
          // Something went wrong :(
          err => {
            if(typeof err === 'string') err = new Error.server.InternalServerError(err);

            if(!(err instanceof Error.Error)) err = new Error.server.InternalServerError('Unknown error');

            errorResponse(res, err);
          }
        )
    );

    app[endpoint.method.toLowerCase()](endpoint.path, endpointHandler);

  };


  const docs = makeDocs(endpoints);
  docsEndpoint = {
    method: 'GET',
    path: '/endpoints',
    description: "Documentation on the endpoints provided by this service",
    action: () => docs
  };


  registerEndpoint(docsEndpoint, false);
  endpoints.forEach(endpoint => registerEndpoint(endpoint));


  app.all('*', (req, res) => {
    errorResponse(res, new Error.client.NotFound('Endpoint not found'));
  });

  app.listen(port, () => console.log(`${serviceName} is now listening`));


  const telemetry = handlers.logger.telemetry;
  telemetry.context().hostname = os.hostname();
  telemetry.context().app = "app-server-api";


  // Crash Handling
  ["SIGINT", "SIGTERM"].forEach(signalName => {
    process.on(signalName, () => {
      console.log("Received " + signalName);
      console.log("Server exit");
      process.exit();
    });
  });

  process.on("uncaughtException", err => {
    telemetry.error("server exit due to process exception");
    telemetry.error(err);

    const kill = timeout => {
      console.log("Server exit");
      setTimeout(() => process.exit(1), timeout || 500);
    };
    kill(10000);
  });

};

Servicify.defaults = {
  handlers: {},
  use: ['logger', 'services'],
  afterUse: []
};

module.exports = Servicify;
