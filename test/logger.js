
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();


// Define the functions

const loggerEndpoints = [
  {
    name: 'logsomething',
    method: 'GET',
    path: '/logsomething',
    arguments: {
      message: 'string',
    },
    action: ({ logger, message }) => logger.info(message),
    description: "log a message as info",
  }
];


// Make the service server side
// Servicify takes a list of endpoints and returns an express app
// Usually you can just start the app listening but you also have the option
// to add any custom middleware before you do so

const servicify = require('../Servicify/Servicify');

servicify({
  port: 3005,
  domain: '127.0.0.1',
  endpoints: loggerEndpoints
});


// Consume the service from the client side
// On the client side you import the consumeService library
// Consume service holds none of the server side code, it just takes a location,
// hits location/endpoints to get auto-generated docs, and then builds a facade
// to run those functions `locally` (though they are actually run remotely on the service)

const consumeService = require('../ConsumeService/ConsumeService');

const logger = consumeService({
  port: 3005,
  domain: '127.0.0.1'
});


// Run tests

describe('Logger', () => {
  it("logger('logsomething', { message: 'asdf' })", () => logger('logsomething', { message: 'asdf' }));
});
