const expect = require('chai').expect;
const inquisitor = require('../../index');
const _ = require('lodash');
const manifest = require('../sample-manifest');

describe('::ask', function() {

  it('should be a valid method', function() {
    var prompt = new inquisitor(manifest);
    expect(prompt).to.have.property('ask').and.to.be.a('function');
  });

  it('should throw an error when no questions are passed', function() {
    var prompt = new inquisitor(manifest);
    expect(prompt.ask).to.throw('No questions were found');
  });

});
