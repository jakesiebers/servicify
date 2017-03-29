
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
    return Promise.reject(`Problem with key ${path.join('.')} : must be of type ${type}`);
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

module.exports = validateInput;
