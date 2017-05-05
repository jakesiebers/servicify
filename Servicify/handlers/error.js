
const error = require('@withjoy/error');

module.exports = config => req => {
  req.arguments.error = error;
};
