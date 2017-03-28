
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');



const makeDocs = endpoints => endpoints.map(endpoint => ({
  method: endpoint.method,
  name: endpoint.name,
  arguments: endpoint.arguments,
  description: endpoint.description,
}));

const Servicify = endpoints => {

  const docs = makeDocs(endpoints);
  endpoints.push({
    method: 'GET',
    name: 'endpoints',
    arguments: {},
    description: "Documentation on the endpoints provided by this service",
    action: () => docs
  });

  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  endpoints.forEach(endpoint => {
    const method = endpoint.method.toLowerCase();

    app[method](
      `/${endpoint.name}`,
      (req, res) => {
        if (endpoint.action.length > 1) {
          return endpoint.action(req, res);
        } else {
          const getArguments = () => {
            let res = {};
            if(req.query) res = Object.assign(res, req.query);
            if(req.body) res = Object.assign(res, req.body);
            return res;
          };

          return Promise.resolve()
            .then(() => endpoint.action(getArguments(req)))
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
    );
  });

  return app;

};

module.exports = Servicify;
