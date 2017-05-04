
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');


const makeDocs = endpoints => endpoints.map(endpoint => ({
  method: endpoint.method,
  name: endpoint.name,
  path: endpoint.path,
  arguments: endpoint.arguments,
  description: endpoint.description,
}));


const Servicify = config => {

  config.__proto__ = Servicify.defaults;
  const { name: serviceName, endpoints, use, afterUse, handlers, port } = config;
  handlers.__proto__ = require('./handlers')(config);


  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());


  const docs = makeDocs(endpoints);
  endpoints.push({
    method: 'GET',
    path: '/endpoints',
    description: "Documentation on the endpoints provided by this service",
    action: () => docs
  });


  endpoints.forEach(endpoint => {

    const handlerChain = []
      .concat(use)
      .concat(endpoint.use || [])
      .concat('action')
      .concat(endpoint.afterUse || [])
      .concat(afterUse)
      .map(name => handlers[name]);

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
            res.json({
              data: data
            });
          },
          // Something went wrong :(
          err => {
            if(typeof err === 'string'){
              (/auth/.test(err) ? res.status(401) : res.status(400)).json({
                error: err
              });
              return;
            }

            if(err.message){
              res.status(500).json({
                error: err.message
              });
              return;
            }

            // Should never happen
            res.status(500).json({
              error: 'Unknown error'
            });
          }
        )
    );

    app[endpoint.method.toLowerCase()](endpoint.path, endpointHandler);

  });


  app.all('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found'
    });
  });

  app.listen(port, () => console.log(`${serviceName} is now listening`))

};

Servicify.defaults = {
  handlers: {},
  use: ['logger', 'services', 'arguments'],
  afterUse: []
};

module.exports = Servicify;
