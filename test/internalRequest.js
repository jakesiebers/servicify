
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();


const servicify = require('../Servicify/Servicify');
const consumeService = require('../ConsumeService/ConsumeService');


const mathConfig = {
  name: 'math',
  domain: '127.0.0.1',
  port: 3003,
  endpoints: [
    {
      name: 'add',
      method: 'GET',
      path: '/add/:a/:b',
      arguments: {
        a: "number",
        b: "number",
      },
      action: ({ a, b, service }) => service('internalmath', 'add', { a: 2, b: 3 }),
      description: "add a and b",
    }
  ],
  services: {
    internalmath: {
      domain: '127.0.0.1',
      port: 3004,
      authClient: {
        options: {
          issuer: 'https://withjoy.auth0.com/',
          audience: 'audience'
        },
        secret: {
          encoding: "base64",
          data: '6Gx5asdfjahdfkajdhfakdjshfajhdfgakjdhfgakjfgakjhdfgaskjhdfgaskhf'
        }
      }
    }
  }
};

servicify(mathConfig);

const internalMathConfig = {
  name: 'internalmath',
  domain: '127.0.0.1',
  port: 3004,
  authClients: [
    {
      options: {
        issuer: 'https://withjoy.auth0.com/',
        audience: 'audience'
      },
      secret: {
        encoding: "base64",
        data: '6Gx5asdfjahdfkajdhfakdjshfajhdfgakjdhfgakjfgakjhdfgaskjhdfgaskhf'
      }
    }
  ],
  endpoints: [
    {
      name: 'add',
      method: 'GET',
      path: '/add/:a/:b',
      arguments: {
        a: "number",
        b: "number",
      },
      use: ['auth'],
      action: ({ a, b }) => a + b,
      description: "add a and b",
    }
  ]
};

servicify(internalMathConfig);



const math = consumeService({
  domain: '127.0.0.1',
  port: 3003,
});

describe('internal service requests', () => {
  it("call and endpoint that calls a second service (only available internally via auth)", () => math('add', { a: 2, b: 3 }).should.eventually.equal(5));
});
