
const fs = require('fs');

const handlers = {};
fs.readdirSync(__dirname)
  .map(fileName => fileName.split("."))
  .forEach(([name]) => {
    if (name !== 'index') handlers[name] = require(`./${name}`);
  });

module.exports = config => {
  const res = {};
  for(let name in handlers) res[name] = handlers[name](config);
  return res;
};
