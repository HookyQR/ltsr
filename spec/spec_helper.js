require('chai/register-expect');

global.spy = require('sinon').spy;
global.stub = require('sinon').stub;

require('chai').use(require('sinon-chai'));
