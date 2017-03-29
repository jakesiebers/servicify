
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();


// Define the functions

const mathEndpoints = [
  {
    method: 'GET',
    name: 'add',
    arguments: {
      a: "number",
      b: "number",
    },
    action: ({ a, b }) => Number(a) + Number(b),
    description: "add a and b",
  },
  {
    method: 'GET',
    name: 'subtract',
    arguments: {
      a: "number",
      b: "number",
    },
    action: (req, res) => {
      const query = JSON.parse(req.query.data);
      res.json({
        data: Number(query.a) - Number(query.b)
      });
    },
    description: "subtract b from a",
  },
  {
    method: 'POST',
    name: 'multiply',
    arguments: {
      a: "number",
      b: "number",
    },
    action: ({ a, b }) => Number(a) * Number(b),
    description: "multiply a and b together",
  },
  {
    method: 'GET',
    name: 'join',
    arguments: {
      separator: 'string',
      items: 'array',
    },
    action: ({ separator, items }) => items.join(separator),
    description: "multiply a and b together",
  }
];


// Make the service server side

const servicify = require('../servicify');

const mathService = servicify(mathEndpoints);

mathService.listen(8080, () => console.log('Listening'));


// Consume the service from the client side

const consumeService = require('../consumeService');

const math = consumeService('127.0.0.1', 8080);


// Run tests

describe('math', function() {
  it('.then(endpoints => endpoints.add({ a: 2, b: 3 }))', () => math.then(math => math.add({ a: 2, b: 3 })).should.eventually.equal(5));
  it(".run('add', { a: 2, b: 3 })", () => math.run('add', { a: 2, b: 3 }).should.eventually.equal(5));
  it(".run('subtract', { a: 8, b: 3 })", () => math.run('subtract', { a: 8, b: 3 }).should.eventually.equal(5));
  it(".run('multiply', { a: 2, b: 3 })", () => math.run('multiply', { a: 2, b: 3 }).should.eventually.equal(6));
  it(".run('join', { separator: ',', items: ['a', 'b', 'c'] })", () => math.run('join', { separator: ',', items: ['a', 'b', 'c'] }).should.eventually.equal('a,b,c'));
  it(".run('add', { a: 2, b: 'asdf' })", () => math.run('add', { a: 2, b: 'asdf' }).should.be.rejectedWith('Problem with key b : must be of type number'));
});
