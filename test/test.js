
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
      res.json({
        data: Number(req.query.a) - Number(req.query.b)
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
  }
];


// Make the service server side

const servicify = require('../servicify');

const mathService = servicify(mathEndpoints);

mathService.listen(8080, () => console.log('Listening'));


// Consume the service from the client side

const consumeService = require('../consumeService');

const clientSideMathService = consumeService('127.0.0.1', 8080);


// Run tests

describe('Servicify', function() {
  it('Should return 5', () => clientSideMathService.then(math => math.add({ a: 2, b: 3 })).should.eventually.equal(5));
  it('Should return 5', () => clientSideMathService.run('add', { a: 2, b: 3 }).should.eventually.equal(5));
  it('Should return 5', () => clientSideMathService.run('subtract', { a: 8, b: 3 }).should.eventually.equal(5));
  it('Should return 6', () => clientSideMathService.run('multiply', { a: 2, b: 3 }).should.eventually.equal(6));
});
