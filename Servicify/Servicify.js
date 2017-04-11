
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');

const formats = require('./formats');


const makeDocs = endpoints => endpoints.map(endpoint => ({
  method: endpoint.method,
  name: endpoint.name,
  path: endpoint.path,
  arguments: endpoint.arguments,
  description: endpoint.description,
}));


const Servicify = config => {
  const { name: serviceName, port, domain, authClients, endpoints } = config;


  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());


  const handlers = {
    auth: require('./handlers/auth')(config)
  };


  const docs = makeDocs(endpoints);
  endpoints.push({
    method: 'GET',
    path: '/endpoints',
    description: "Documentation on the endpoints provided by this service",
    action: () => docs
  });


  endpoints.forEach(endpoint => {
/*
    const handlerAndDependencies = (acc, name) => {
      const handler = handlers[name];
      handler.name = name;
      if (!acc.includes(handler)) {
        const before = (handler.before || []).map(name => handlerAndDependencies(acc, name));
        acc.push(handler);
        const after = (handler.after || []).map(name => handlerAndDependencies(acc, name));
      }
      return acc;
    };
    let uses = (endpoint.uses || []).reduce(handlerAndDependencies, []);

    const shiftBefore = (handler, index) => {
      for(let a=index-1; a>=0; a--){
        if(uses[a].before && uses[a].before.includes(handler.name)){
          return uses.splice(index, 1).splice(a, 0, handler);
        }
      }
    }
    const shiftAfter = (handler, index) => {
      for(let a=index+1; a<uses.length; a++){
        if(uses[a].after && uses[a].after.includes(handler.name)){
          return uses.splice(a+1, 0, handler).splice(index, 1);
        }
      }
    }
    let sortedUses;
    do{
      uses = (sortedUses || uses);
    }
*/

    const action = (req, res) => {
      const getArguments = () => Object.assign(
        Object.assign(
          Object.assign(
            {},
            req.body
          ),
          formats.parseArgs(endpoint.arguments, req.query)
        ),
        formats.parseArgs(endpoint.arguments, req.params)
      );

      const validArguments = args => Promise.resolve(endpoint.arguments && formats.validateInput(endpoint.arguments, args)).then(() => args);

      return Promise.resolve()
        .then(getArguments)
        .then(validArguments)
        .then(endpoint.action);
    };

    const endpointHandlers = {
      __proto__: handlers,
      action
    };

    const handlerChain = (endpoint.use || [])
      .concat('action')
      .map(name => endpointHandlers[name]);

    const endpointHandler = (endpoint.action.length > 1 ?
      endpoint.action :
      (req, res) => handlerChain
        .reduce((p, f) => p.then(() => f(req, res)), Promise.resolve())
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

module.exports = Servicify;
