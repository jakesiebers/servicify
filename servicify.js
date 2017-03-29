
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

const Servicify = endpoints => {

  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());


  const docs = makeDocs(endpoints);
  endpoints.push({
    method: 'GET',
    path: '/endpoints',
    arguments: {},
    description: "Documentation on the endpoints provided by this service",
    action: () => docs
  });


  endpoints.forEach(endpoint =>
    app[endpoint.method.toLowerCase()](
      endpoint.path,
      (req, res) => {
        if (endpoint.action.length > 1) {
          return endpoint.action(req, res);
        } else {
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

          const validArguments = args => (endpoint.arguments && formats.validateInput(endpoint.arguments, args)).then(() => args);

          return Promise.resolve()
            .then(getArguments)
            .then(validArguments)
            .then(endpoint.action)
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
                  res.status(400).json({
                    error: err
                  });
                  return;
                }

                if(err.constructor === Error){
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
            );
        }
      }
    )
  );


  app.all('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found'
    });
  });


  return app;

};

module.exports = Servicify;
