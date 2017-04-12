
const assert = require('assert');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();


const servicify = require('../Servicify/Servicify');
const consumeService = require('../ConsumeService/ConsumeService');
const jwt = require("jsonwebtoken");

// service 'one'

const authEndpoints = [
  {
    name: 'useronly',
    method: 'GET',
    path: '/useronly',
    use: ['auth'],
    action: () => 'success'
  }
];

const config = {
  name: 'auth',
  domain: '127.0.0.1',
  port: 3002,
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
  endpoints: authEndpoints
};

servicify(config);

// consume service 'one'

const authConfigClient = config.authClients[0];

const authConfigConsumer = {
  name: 'one',
  domain: '127.0.0.1',
  port: 3002,
};

const consumerWithoutAuth = consumeService(authConfigConsumer);

authConfigConsumer.jwt = jwt.sign(
  {},
  new Buffer(authConfigClient.secret.data, (authConfigClient.secret.encoding || 'utf8')),
  Object.assign(authConfigClient.options, { subject: 'testsub' })
);

const consumerWithAuth = consumeService(authConfigConsumer);

describe('regular auth', () => {
  it("Should fail to access the useronly endpoint", () => consumerWithoutAuth('useronly').should.be.rejected);
  it("Should access the useronly endpoint without issue", () => consumerWithAuth('useronly'));
});
