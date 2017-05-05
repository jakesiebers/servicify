
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

const Error = require("@withjoy/error");


// Define the functions

const errorEndpoints = [
  {
    name: 'makeError',
    method: 'GET',
    path: '/apperror',
    arguments: {},
    action: ({ error }) => {
      throw new error.server.ApplicationException('oh no!');
    },
    description: "throw an ApplicationException error",
  }
];


// Make the service server side
// Servicify takes a list of endpoints and returns an express app
// Usually you can just start the app listening but you also have the option
// to add any custom middleware before you do so

const servicify = require('../Servicify/Servicify');

servicify({
  port: 3006,
  domain: '127.0.0.1',
  endpoints: errorEndpoints
});


// Consume the service from the client side
// On the client side you import the consumeService library
// Consume service holds none of the server side code, it just takes a location,
// hits location/endpoints to get auto-generated docs, and then builds a facade
// to run those functions `locally` (though they are actually run remotely on the service)

const consumeService = require('../ConsumeService/ConsumeService');

const errors = consumeService({
  port: 3006,
  domain: '127.0.0.1'
});


// Run tests

describe('Error', () => {
  it(
    "errors('makeError')", () =>
      errors('makeError')
        .then(
          () => {
            throw 'Should not have been successful';
          },
          err => {
            const correctError = new Error.client.ApplicationException('oh no!');
            if (!(
              correctError.name === err.name &&
              correctError.statusCode === err.statusCode &&
              correctError.message === err.message
            )) throw 'Wrong info in error';
          }
        )
  );
});
