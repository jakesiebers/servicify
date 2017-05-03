
const telemetry = require('@withjoy/telemetry');

module.exports = config => req => {
  req.arguments.logger = telemetry;
  req.arguments.telemetry = telemetry;
};
