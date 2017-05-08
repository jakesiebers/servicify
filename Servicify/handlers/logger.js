
const telemetry = require('@withjoy/telemetry');

module.exports = config => {
  const handler = req => {
    req.arguments.logger = telemetry;
    req.arguments.telemetry = telemetry;
  };
  handler.telemetry = telemetry;
  return handler;
};
