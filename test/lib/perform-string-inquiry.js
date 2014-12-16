const inquisitor = require('../../index');
const _ = require('lodash');
const expect = require('chai').expect;
const bPromise = require('bluebird');
const manifest = require('../sample-manifest');
require('chai-as-promised');

describe('::_performStringInquiry', function() {

  it('should throw an error when an invalid question name is passed', function() {
    var prompt = new inquisitor(manifest);
    var callback = function() {
      prompt._performStringInquiry({}, 'questionThatDoesNotExist');
    };
    expect(callback).to.throw('Question "questionThatDoesNotExist" not found in the manifest');
  });

  it('should return a valid promise', function() {
    var prompt = new inquisitor({
      manifest: manifest,
      prompter: bPromise.resolve
    });
    var promise = prompt._performStringInquiry({}, 'favoriteColor');
    expect(promise).to.be.an('object').and.to.have.property('then');
  });

  it('should return a promise that modifies the results wth an answer', function(done) {
    var prompt = new inquisitor({
      manifest: manifest,
      prompter: _.partial(bPromise.resolve, 'it works')
    });
    prompt._performStringInquiry({}, 'favoriteColor').then(function(newResults) {
      expect(newResults)
        .to.be.an('object').and
        .to.have.property('favoriteColor').and
        .to.equal('it works');
      done();
    }).catch(function(err) {
      done(err);
    });
  });

});
