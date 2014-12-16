// dependency libraries
const _ = require('lodash');
const inquirer = require('inquirer');
const bPromise = require('bluebird');

// dependency functions
const prompter = require('./lib/prompter');

/**
 * Constructor that takes in a manifest object OR an options object with a
 * manifest and/or custom prompter.
 *
 * The manifest will be stored to this manifest object and used as a dictionary
 * to lookup any questions needed when questioning.
 *
 * A custom prompter can be used in the event that the developer wants to use
 * something other than inquirer to perform questioning (ie - unit testing)
 *
 * Example Usage (basic):
 * ```js
 * const manifest = require('./manifest');
 * const prompt = new Inquisitor(manifest);
 * ```
 *
 * Example Usage (advanced):
 * ```js
 * const manifest = require('./manifest');
 * const prompt = new Inquisitor({
 *   manifest: manifest,
 *   prompter: function(name, question) {
 *     // create a new promise 
 *     return promise;
 *   }
 * });
 * ```
 * 
 * @param {Object} manifest Contains questions that could be asked by Inquisitor.
 *   keys are the question names and values are Inquirer question objects.
 */
function Inquisitor(opts) {
  opts = opts || {};

  // use the default prompter (unless a new one is passed)
  this.prompter = _.isFunction(opts.prompter) ? opts.prompter : prompter;

  // handle a case where the developer could have passed JUST the manifest in
  // instead of an options object
  if (opts.manifest) {
    this.manifest = opts.manifest;
  } else if (!opts.manifest && opts.prompter) {
    this.manifest = {};
  } else if (!opts.manifest && !opts.prompter) {
    this.manifest = opts;
  }

  // ensure that the manifest contains at least 1 question before being
  // instantiated
  if (!_.isObject(this.manifest) || !Object.keys(this.manifest).length) {
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
  return bPromise.reduce(questions, this._reduceInquiries.bind(this), {});
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
  if (!_.has(this.manifest, questionName) || !_.isObject(this.manifest[questionName])) {
    throw new Error('Question "' + questionName + '" not found in the manifest');
  }

  return this.prompter(questionName, this.manifest[questionName])
    .then(function(answer) {
      results[questionName] = answer;
      return results;
    });
};

/**
 * Internal method that handles processing an array of questions by reducing
 * them and then storing the results for future use.
 * 
 * @param {Object} results An object whose keys are questions that were asked
 *   and their correlated values were the answers (from the user)
 * @param {Array} An array containing mixed values of questions that need to be
 *   asked
 * @return {Promise} Promise that, when executed, asks the questions in the
 *   order they were specified and returns the new results (with the answer)
 */
Inquisitor.prototype._performArrayInquiry = function _performArrayInquiry(results, questions) {
  return bPromise.reduce(questions, this._reduceInquiries.bind(this), {})
    .then(function(answers) {
      results[questions] = answers;
      return results;
    });
};

/**
 * Internal method that handles processing a "pivot" question (a question whose
 * response changes the flow of questioning performed by inquisitor)
 *
 * Example:
 * Ask the user if they like dogs or cats.
 *   - If the user likes dogs, ask them questions that only refer to dogs.
 *   - If the user likes cats, ask them questions that only refer to cats.
 * 
 * @param {Object} results An object whose keys are questions that were asked
 *   and their correlated values were the answers (from the user)
 * @param {Object} An object that contains logic for how to pivot the
 *   questioning
 * @return {Promise} Promise that, when executed, asks the questions in the
 *   order they were specified and returns the new results (with the answer)
 */
Inquisitor.prototype._performPivotInquiry = function _performPivotInquiry(results, pivot) {
  if (!_.has(pivot, 'question') || !_.isString(pivot.question)) {
    throw new Error('Pivot does not contain a valid "question" property');
  } else if (!_.has(this.manifest, pivot.question) || !_.isObject(this.manifest[pivot.question])) {
    throw new Error('Question "' + pivot.question + '" not found in the manifest');
  } else if (!_.has(pivot, 'logic') && !_.isFunction(pivot.logic)) {
    throw new Error('Pivot does not contain a valid "logic" method')
  }

  // ask the question first
  var reducer = this._reduceInquiries.bind(this);
  var question = this.manifest[pivot.question];
  return this.prompter(pivot.question, question)
    .then(function(primaryAnswer) {
      // now, run the pivot's `logic` method to get back a list of
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

/**
 * Linearly reduces questions by determining the type of inquiries to be
 * performed.
 * 
 * @param {Object} results A container that will be used to store the results of
 *   the questions that have been asked.
 * @param {String|Array|Object} inquiries A variable whose type directly affects
 *   how the inquiry should be performed.
 * @return {Object} An object containing the answers of the questions that were
 *   asked.
 */
Inquisitor.prototype._reduceInquiries = function _reduceInquiries(results, inquiries) {
  if (_.isString(inquiries)) {
    return this._performStringInquiry(results, inquiries);
  } else if (_.isArray(inquiries)) {
    return this._performArrayInquiry(results, inquiries);
  } else if (_.isObject(inquiries)) {
    return this._performPivotInquiry(results, inquiries);
  }

  // if the name value was not something we were expecting, simply return the
  // unaltered results
  return results;
};

module.exports = Inquisitor;
