const _ = require('lodash');
const inquirer = require('inquirer');
const bPromise = require('bluebird');

var Inquisitor = {

  prompt: function prompt(questions, manifest) {
    questions = questions || {};
    manifest = manifest || [];

    if (!_.isObject(questions) || !Object.keys(questions).length) {
      throw new Error('No questions were found');
    } else if (!_.isArray(manifest) || !manifest.length) {
      throw new Error('No manifest was found');
    }

    return bPromise.reduce(manifest, Inquisitor._manifestReducer.bind(questions), {});
  },

  _manifestReducer: function _manifestReducer(results, name) {
    // at this point, we need to figure out how to retrieve the question
    // if the name is a string, we have it easy
    // if the name is an array, we need to recursively iterate through
    //   that set of questions
    // if the name is an object, we need to parse how to interpret the
    //   object and prompt the user
    
    var reducer = Inquisitor._manifestReducer.bind(this);

    if (_.isString(name)) {
      if (!_.has(this, name) || !_.isObject(this[name])) {
        throw new Error('Question "' + name + '" not found');
      }

      var question = this[name];
      return Inquisitor._promisifyInquiry(name, question)
        .then(function(answer) {
          results[name] = answer;
          return results;
        });
    } else if (_.isArray(name)) {
      return bPromise.reduce(name, reducer, {})
        .then(function(answers) {
          results[name] = answers;
          return results;
        });
    } else if (_.isObject(name)) {
      if (!_.has(name, 'question') || !_.isString(name.question)) {
        throw new Error('Object does not contain a valid "question" property');
      } else if (!_.has(this, name.question) || !_.isObject(this[name.question])) {
        throw new Error('Question "' + name.question + '" not found');
      } else if (!_.has(name, 'fork') && !_.isFunction(name.fork)) {
        throw new Error('Object does not contain a valid "fork" property')
      }

      // ask the question first
      var question = this[name.question];
      return Inquisitor._promisifyInquiry(name.question, question)
        .then(function(primaryAnswer) {
          // now, run the manifest object's fork method to get back a list of
          // forked questions to ask the user
          var forkedQuestions = name.fork.call(undefined, primaryAnswer);
          return bPromise.reduce(forkedQuestions, reducer, {
            _answer: primaryAnswer
          });
        })
        .then(function(answers) {
          results[name.question] = answers;
          return results;
        });
    }
  },

  _promisifyInquiry: function _promisifyInquiry(name, question) {
    return new bPromise(function(resolve) {
      question.name = name;
      inquirer.prompt([question], function(answers) {
        if (!_.has(answers, name)) {
          throw new Error('Answer not found');
        }
        resolve(answers[name]);
      });
    });
  }

};

module.exports = Inquisitor;
