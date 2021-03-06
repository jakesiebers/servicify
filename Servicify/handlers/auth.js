
const Promise = require('bluebird');
const jwt = require("jsonwebtoken");


module.exports = (config) => {

  const { auth0Clients, authClients } = config;

  const clientObject = authClients || auth0Clients || {};

  const clients = [];
  for(let key in clientObject) clients.push(clientObject[key]);

  const getService = name => {
    return serviceConsumers.then(services => {
      const service = services.filter(service => service.name === name);
      if (service.length > 0) return service[0];
      throw 'Service not included in servicify initialization';
    });
  };

  return req => Promise.resolve(req.headers.authorization)
    // parse our auth header
    .then(authHeader => authHeader.split(' '))
    // Decode token with any client that works
    .then(([type, token]) => Promise.any(
      clients.map(
        client => new Promise((resolve, reject) => jwt.verify(
          token,
          new Buffer(client.secret.data, (client.secret.encoding || 'utf8')),
          client.options,
          (err, data) => {
            if (err) reject(err);
            resolve(data);
          }
        ))
      )
    ))
    // success/fail
    .then(
      token => {
        req.authToken = token;
      },
      err => {
        throw new req.arguments.error.client.Unauthorized('You are not authorized to use this endpoint');
      }
    );

};
