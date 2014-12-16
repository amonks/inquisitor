const bPromise = require('bluebird');
const inquirer = require('inquirer');
const _ = require('lodash');

module.exports = function(name, question) {
  return new bPromise(function(resolve) {
    // simply modify the question object so we can pass it along to
    // inquirer to handle
    question.name = name;

    // let inquirer prompt the user for their answer to the specified
    // question
    inquirer.prompt([question], function(answers) {
      if (!_.has(answers, name)) {
        throw new Error('Answer not found');
      }
      resolve(answers[name]);
    });
  });
};
