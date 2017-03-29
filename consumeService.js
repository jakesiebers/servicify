
const http = require('http');
const URL = require('url');


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
        reject(data.error);
        return;
      }

      if(data.data){
         resolve(data.data);
         return;
      }

      reject('Improper json data returned from service');
    }catch(e){
      reject('Improper json data returned from service');
    }
  });

};

const consumeService = (domain, port) => {

  const request = {
    get : (endpoint, args) => new Promise((resolve, reject) => {

      const url = URL.format({
        hostname: domain,
        port,
        pathname: endpoint.name,
        query: {
          data: JSON.stringify(args)
        },
        protocol: 'http',
      });

      const req = http.get(url, processRequestJSONResult(resolve, reject));

      req.on('error', e => reject(e));

      req.end();

    }),
    post : (endpoint, args) => new Promise((resolve, reject) => {

      const postData = JSON.stringify(args || {});

      const options = {
        hostname: domain,
        port,
        path: `/${endpoint.name}`,
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json'
        }
      };

      const req = http.request(options, processRequestJSONResult(resolve, reject));

      req.write(postData);

      req.on('error', e => reject(e));

      req.end();

    }),
  };

  const endpoints = request.get({ name: 'endpoints' });

  const service = endpoints.then(endpoints => {
    const res = {};
    endpoints.forEach(endpoint => {
      const method = endpoint.method.toLowerCase();
      res[endpoint.name] = (args) => request[method](endpoint, args);
    });
    return res;
  });

  return {
    then: service.then.bind(service),
    run: (name, args) => service.then(service => service[name](args))
  };

};

module.exports = consumeService;
