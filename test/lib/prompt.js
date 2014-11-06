const expect = require('chai').expect;
const inquisitor = require('../../index');
const _ = require('lodash');

describe('::prompt', function() {

  it('should be a valid method', function() {
    expect(inquisitor).to.have.property('prompt').and.to.be.a('function');
  });

  it('should throw an error when no questions are passed', function() {
    expect(inquisitor.prompt).to.throw('No questions were found');
  });

  it('should throw an error when no manifest is specified', function() {
    var questions = {
      test: {
        type: 'input',
        message: 'Testing'
      }
    };
    var callback = _.partial(inquisitor.prompt, questions);
    expect(callback).to.throw('No manifest was found');
  });

});
