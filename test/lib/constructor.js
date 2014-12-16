const expect = require('chai').expect;
const inquisitor = require('../../index');
const _ = require('lodash');
const manifest = require('../sample-manifest');

describe('Inquisitor construction', function() {
  
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

  it('should be able to take a manifest as a parameter', function() {
    var prompt = new inquisitor(manifest);
    expect(prompt.manifest).to.be.an('object').and.to.deep.equal(manifest);
  });

  it('should be able to take an options object with a manifest specified', function() {
    var prompt = new inquisitor({
      manifest: manifest
    });
    expect(prompt.manifest).to.be.an('object').and.to.deep.equal(manifest);
  });

  it('should be able to take an options object with a manifest and a custom prompter specified', function() {
    function prompter() {}

    var prompt = new inquisitor({
      manifest: manifest,
      prompter: prompter
    });
    expect(prompt.prompter).to.be.a('function').and.to.equal(prompter);
  });

  it('should throw an error when a custom prompter is specified but no manifest is passed', function() {
    function prompter() {}

    var callback = function() {
      new inquisitor({
        prompter: prompter
      });
    };
    expect(callback).to.throw('An invalid manifest was supplied');
  });

});
