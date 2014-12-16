const _ = require('lodash');
const inquirer = require('inquirer');
const bPromise = require('bluebird');

/**
 * Constructor that takes a manifest and stores it to the object (to be used as
 * a dictionary lookup for questions asked later)
 *
 * Example Usage:
 * ```js
 * const manifest = require('./manifest');
 * const prompt = new Inquisitor(manifest);
 * ```
 * 
 * @param {Object} manifest Contains questions that could be asked by Inquisitor.
 *   keys are the question names and values are Inquirer question objects.
 */
function Inquisitor(manifest) {
  this._manifest = manifest || {};

  // ensure that the manifest contains at least 1 question before being
  // instantiated
  if (!_.isObject(this._manifest) || !Object.keys(this._manifest).length) {
    throw new Error('An invalid manifest was supplied');
  }
}

/**
 * Begins asking all of the specified questions in the array. The array of
 * questions that Inquisitor can ask contains values with the following object
 * types:
 *
 * - String: the question name that will be used when checking the manifest for
 *   the specified question.
 *
 *   Example: 'myQuestion'
 * 
 * - Array: an array containing any of the same values that are listed here;
 *   Used as a "child" container.
 *
 *   Example: ['questionOne', 'QuestionTwo']
 * 
 * - Object: an object containing logic for questions that can pivot the flow.
 *   An object must contain a valid "question" parameter (the name of the
 *   question to ask before pivoting) and a "logic" method that is used to
 *   determine the logic for the pivot.
 *
 *   Example: {
 *     question: 'myPivotQuestion',
 *     logic: function(answer) {
 *       if (answer === 'something') {
 *         return 'newQuestionToAsk';
 *       }
 *
 *       return 'regularQuestionToAsk';
 *     }
 *   }
 *
 * All of the questions that are specified are reduced until there are no
 * questions left to ask; this means they'll be asked synchronously.
 * 
 * @param {Array} questions An array of questions that will be asked
 * @return {Promise} Promise that, when executed, asks the questions in the
 *   order they were specified and returns the new results (with the answer)
 */
Inquisitor.prototype.ask = function ask(questions) {
  questions = questions || [];

  // ensure we're dealing with an array of questions
  if (!_.isArray(questions) || !questions.length) {
    throw new Error('No questions were found');
  }

  // now begin reducing the questions
  return bPromise.reduce(questions, this._manifestReducer.bind(this), {});
};

/**
 * Internal method that handles processing any questions that were specified as
 * a string (when passed in the `questions` array to `ask`)
 *
 * Ensures that the question exists and then sets the question up to be asked.
 * Also, handles updating the results based on what the user answers (when the
 * question is asked).
 * 
 * @param {Object} results An object whose keys are questions that were asked
 *   and their correlated values were the answers (from the user)
 * @param {String} questionName The name of the question that will be asked
 * @return {Promise} Promise that, when executed, asks the questions in the
 *   order they were specified and returns the new results (with the answer)
 */
Inquisitor.prototype._performStringInquiry = function _performStringInquiry(results, questionName) {
  if (!_.has(this._manifest, questionName) || !_.isObject(this._manifest[questionName])) {
    throw new Error('Question "' + questionName + '" not found in the manifest');
  }

  return this._promisifyInquiry(questionName, this._manifest[questionName])
    .then(function(answer) {
      results[questionName] = answer;
      return results;
    });
};

Inquisitor.prototype._performArrayInquiry = function _performArrayInquiry(results, questions) {
  return bPromise.reduce(questions, this._manifestReducer.bind(this), {})
    .then(function(answers) {
      results[questions] = answers;
      return results;
    });
};

Inquisitor.prototype._performPivotQuery = function _performPivotQuery(results, pivot) {
  if (!_.has(pivot, 'question') || !_.isString(pivot.question)) {
    throw new Error('Pivot does not contain a valid "question" property');
  } else if (!_.has(this._manifest, pivot.question) || !_.isObject(this._manifest[pivot.question])) {
    throw new Error('Question "' + pivot.question + '" not found in the manifest');
  } else if (!_.has(pivot, 'logic') && !_.isFunction(pivot.logic)) {
    throw new Error('Pivot does not contain a valid "logic" method')
  }

  // ask the question first
  var reducer = this._manifestReducer.bind(this);
  var question = this._manifest[pivot.question];
  return this._promisifyInquiry(pivot.question, question)
    .then(function(primaryAnswer) {
      // now, run the pivots `logic` method to get back a list of
      // branched questions to ask the user
      var branchedQuestions = pivot.logic.call(undefined, primaryAnswer);
      return bPromise.reduce(branchedQuestions, reducer, {
        _answer: primaryAnswer
      });
    })
    .then(function(answers) {
      results[pivot.question] = answers;
      return results;
    });
};

Inquisitor.prototype._manifestReducer = function _manifestReducer(results, obj) {
  var reducer = this._manifestReducer.bind(this);

  if (_.isString(obj)) {
    return this._performStringInquiry(results, obj);
  } else if (_.isArray(obj)) {
    return this._performArrayInquiry(results, obj);
  } else if (_.isObject(obj)) {
    return this._performPivotQuery(results, obj);
  }

  // if the name value was not something we were expecting, simply return the
  // unaltered results
  return results;
};

Inquisitor.prototype._promisifyInquiry = function _promisifyInquiry(name, question) {
  return new bPromise(function(resolve) {
    question.name = name;
    inquirer.prompt([question], function(answers) {
      if (!_.has(answers, name)) {
        throw new Error('Answer not found');
      }
      resolve(answers[name]);
    });
  });
};

module.exports = Inquisitor;
