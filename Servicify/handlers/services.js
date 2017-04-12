
const consumeService = require('../../ConsumeService/ConsumeService');
const JWT = require("jsonwebtoken");

module.exports = ({ services = [] }) => {

  const serviceConsumers = {};
  for(let name in services){
    serviceConsumers[name] = consumeService(services[name]);
  }

  return req => {
    req.arguments.service = (serviceName, functionName, args) => {
      const service = serviceConsumers[serviceName];
      if (!service) throw 'Service is not available';
      const { authClient } = services[serviceName];
      const jwt = JWT.sign(
        {},
        new Buffer(authClient.secret.data, (authClient.secret.encoding || 'utf8')),
        Object.assign(authClient.options, { subject: req.user && req.user.sub || 'internal'})
      );
      return service(functionName, args, jwt);
    };
  };

};
