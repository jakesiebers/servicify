
const http = require('http');
const URL = require('url');
const JWT = require("jsonwebtoken");

const Error = require('@withjoy/error');


const makePath = (endpoint, args) =>
  endpoint
  .path
  .split('/')
  .map(part => {
    if(part[0] === ':'){
      let argKey = part.substring(1);
      let argValue = args[argKey];
      delete args[argKey];
      return argValue;
    }
    return part;
  })
  .join('/');

function consumeService(config) {

  if (config.authClient) {
    config.jwt = JWT.sign(
      {},
      new Buffer(config.authClient.secret.data, (config.authClient.secret.encoding || 'utf8')),
      config.authClient.options
    );
  }

  const { domain, port, serviceName, jwt, isUpstream } = config;

  const processRequestJSONResult = (resolve, reject) => res => {

    // Process Body
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => {
      body += chunk;
    });

    // Request is completed
    res.on('end', () => {
      try{
        const data = JSON.parse(body.trim());

        if(data.error){
          if (isUpstream) {
            reject(new Error.server.BadGateway('Bad response from the upstream server.'));
          } else {
            reject(new Error.Error(data.error.statusCode, data.error.name, data.error.message));
          }
        } else {
          resolve(data.data);
        }
      }catch(e){
        reject('Improper json data returned from service');
      }
    });

  };

  const request = {
    get : (endpoint, args, jwt) => new Promise((resolve, reject) => {

      const options = {
        hostname: domain,
        port,
        path: URL.format({
          pathname: makePath(endpoint, args),
          query: args,
        }),
        method: 'GET',
        headers: {}
      };
      if (jwt) options.headers.authorization = `Bearer ${jwt}`;

      const req = http.request(options, processRequestJSONResult(resolve, reject));

      req.on('error', e => (isUpstream ? reject(new Error.server.BadGateway('Bad response from the upstream server.')) : reject(e)));

      req.end();

    }),
    post : (endpoint, args, jwt) => new Promise((resolve, reject) => {

      const postData = JSON.stringify(args || {});

      const options = {
        hostname: domain,
        port,
        path: makePath(endpoint, args),
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json'
        }
      };
      if (jwt) options.headers.authorization = `Bearer ${jwt}`;

      const req = http.request(options, processRequestJSONResult(resolve, reject));

      req.write(postData);

      req.on('error', e => (isUpstream ? reject(new Error.server.BadGateway('Bad response from the upstream server.')) : reject(e)));

      req.end();

    }),
  };

  const endpoints = request.get({ path: '/endpoints' });

  const service = endpoints.then(endpoints => {
    const res = {
      name: serviceName
    };
    endpoints.forEach(endpoint => {
      const method = endpoint.method.toLowerCase();
      res[endpoint.name] = (args, jwt) => request[method](endpoint, args, jwt);
    });
    return res;
  });

  function run(name, args = {}, jwt) {
    return service.then(service => {
      const f = service[name];
      if(!f) throw 'Not a valid endpoint name.';
      return f(args, jwt);
    });
  }
  run.withJWT = jwt => (name, args) => run(name, args, jwt);
  run.then = service.then.bind(service);
  run.name = serviceName;
  if (jwt) return run.withJWT(jwt);
  return run;

};

module.exports = consumeService;
