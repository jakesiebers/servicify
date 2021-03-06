

const parseJSON = a => {
  try{
    return JSON.parse(parseObject)
  }catch(e){}
}

const parseJSONForConstructor = c => a => {
  if(typeof a === 'object'){
    if(a.constructor === c){
      return a;
    }
  }else{
    const parsed = parseJSON(a);
    if(typeof a === 'object' && a.constructor === c){
      return parsed;
    }
  }
}

const parsers = {
  number: a => {
    const res = Number(a);
    if(!isNaN(res)) return res;
  },
  string: a => a,
  object: parseJSONForConstructor(Object),
  array: parseJSONForConstructor(Array),
  domain: a => a,
}

const parseArgs = (template, input) => {
  var args = {};
  for(let key in template){
    let type = template[key];
    let value = input[key];

    if(value !== undefined && parsers[type]){
      const parsed = parsers[type](value);
      if(parsed !== undefined) args[key] = parsed;
    }
  }
  return args;
};

const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

const ofType = type => a => typeof a === type;

const formats = {
  number: ofType('number'),
  string: ofType('string'),
  object: a => ofType('object')(a) && !formats.array(a),
  array: a => ofType('object')(a) && a.constructor === Array,
  domain: a => domainRegex.test(a),
}

const validateType = (type, value, path) => {
  if(formats[type](value)){
    return Promise.resolve();
  }else{
    return Promise.reject(`Problem with key '${path.join('.')}' : must be of type '${type}'`);
  }
};

const validateInput = (template, input, path = []) => {

  if(typeof template !== 'object') return Promise.reject('Missing Required field');

  var res = [];
  for(let key in template){
    let type = template[key];

    if(typeof type === 'string'){
      res.push(validateType(type, input[key], path.concat(key)));
    }else{
      res.push(validateInput(template[key], input[key], path.concat(key)));
    }
  }
  return Promise.all(res);

};

module.exports = config => (req, res, endpoint) => {

  const getArgument = key => {
    if (req.params[key] !== undefined) return req.params[key];
    if (req.query[key] !== undefined) return req.query[key];
    if (req.body[key] !== undefined) return req.body[key];
  }

  if (endpoint.arguments) {
    Object.keys(endpoint.arguments).forEach(key => {
      const type = endpoint.arguments[key];

      const value = getArgument(key);

      if (value !== undefined && parsers[type]){
        const parsed = parsers[type](value);

        if (parsed !== undefined && formats[type](parsed)) {
          req.arguments[key] = parsed;
        } else {
          throw `Problem with key '${key}' : must be of type '${type}'`;
        }
      }
    });
  }

};
