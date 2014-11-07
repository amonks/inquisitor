const expect = require('chai').expect;
const inquisitor = require('../../index');
const _ = require('lodash');
const manifest = require('../sample-manifest');

describe('::ask', function() {

  it('should throw an error if no manifest was passed', function() {
    var callback = function() {
      new inquisitor();
    };
    expect(callback).to.throw('An invalid manifest was supplied');
  });

  it('should throw an error if an empty manifest was passed', function() {
    var callback = function() {
      new inquisitor({});
    };
    expect(callback).to.throw('An invalid manifest was supplied');
  });

  it('should be a valid method', function() {
    var prompt = new inquisitor(manifest);
    expect(prompt).to.have.property('ask').and.to.be.a('function');
  });

  it('should throw an error when no questions are passed', function() {
    var prompt = new inquisitor(manifest);
    expect(prompt.ask).to.throw('No questions were found');
  });

});

describe('::_performStringInquiry', function() {

  it('should throw an error when an invalid question name is passed', function() {
    var prompt = new inquisitor(manifest);
    var callback = function() {
      prompt._performStringInquiry({}, 'questionThatDoesNotExist');
    };
    expect(callback).to.throw('Question "questionThatDoesNotExist" not found in the manifest');
  });

  it('should return a valid promise', function() {
    var prompt = new inquisitor(manifest);
    var result = prompt._performStringInquiry({}, 'favoriteColor');
    expect(result).to.be.an('object').and.to.have.property('then');

  });

});
