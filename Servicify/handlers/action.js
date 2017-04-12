
module.exports = config => (req, res, endpoint) => endpoint.action(req.arguments);
