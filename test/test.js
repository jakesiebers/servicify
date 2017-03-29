
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();


// Define the functions

const mathEndpoints = [
  {
    name: 'add',
    method: 'GET',
    path: '/add/:a/:b',
    // Arguments currently on validate
    // In the future they will parse too allowing for
    // custom query parameters and /url/ parameters
    arguments: {
      a: "number",
      b: "number",
    },
    action: ({ a, b }) => a + b,
    description: "add a and b",
  },
  {
    name: 'subtract',
    method: 'GET',
    path: '/subtract',
    arguments: {
      a: "number",
      b: "number",
    },
    // If you want to skip the default handling of the request and response,
    // you can have your action take 2 arguments (req, res) and you can write
    // completely custom handling. The arguments parsed as json and passed to a
    // function and then the result returned in the body as json works for 95%
    // of situations but for the others this is an escape hatch.
    action: (req, res) => {
      const query = req.query;
      res.json({
        data: Number(query.a) - Number(query.b)
      });
    },
    description: "subtract b from a",
  },
  {
    name: 'multiply',
    method: 'POST',
    path: '/multiply',
    arguments: {
      a: "number",
      b: "number",
    },
    action: ({ a, b }) => a * b,
    description: "multiply a and b together",
  },
  {
    name: 'join',
    method: 'GET',
    path: '/join',
    arguments: {
      separator: 'string',
      items: 'array',
    },
    action: ({ separator, items }) => items.join(separator),
    description: "multiply a and b together",
  }
];


// Make the service server side
// Servicify takes a list of endpoints and returns an express app
// Usually you can just start the app listening but you also have the option
// to add any custom middleware before you do so

const servicify = require('../servicify');

const mathService = servicify(mathEndpoints);

mathService.listen(8080, () => console.log('Listening'));


// Consume the service from the client side
// On the client side you import the consumeService library
// Consume service holds none of the server side code, it just takes a location,
// hits location/endpoints to get auto-generated docs, and then builds a facade
// to run those functions `locally` (though they are actually run remotely on the service)

const consumeService = require('../consumeService');

const math = consumeService('127.0.0.1', 8080);


// Run tests

describe('math', function() {
  it('.then(endpoints => endpoints.add({ a: 2, b: 3 }))', () => math.then(math => math.add({ a: 2, b: 3 })).should.eventually.equal(5));
  it(".run('add', { a: 2, b: 3 })", () => math.run('add', { a: 2, b: 3 }).should.eventually.equal(5));
  it(".run('subtract', { a: 8, b: 3 })", () => math.run('subtract', { a: 8, b: 3 }).should.eventually.equal(5));
  it(".run('multiply', { a: 2, b: 3 })", () => math.run('multiply', { a: 2, b: 3 }).should.eventually.equal(6));
  it(".run('join', { separator: ',', items: ['a', 'b', 'c'] })", () => math.run('join', { separator: ',', items: ['a', 'b', 'c'] }).should.eventually.equal('a,b,c'));
  it(".run('add', { a: 2, b: 'asdf' })", () => math.run('add', { a: 2, b: 'asdf' }).should.be.rejectedWith('Problem with key \'b\' : must be of type \'number\''));
});
