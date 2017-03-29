
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

const ofType = type => a => typeof a === type;

const formats = {
  number: ofType('number'),
  string: ofType('string'),
  object: a => ofType('object')(a) && !formats.array(input),
  array: a => ofType('object')(a) && a.constructor === Array,
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

module.exports = {
  validateInput,
  parseArgs
};
