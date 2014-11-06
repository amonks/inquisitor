const _ = require('lodash');
const inquisitor = require('../index');
const questions = require('./questions');

// define the order for questioning
const manifest = [
  'favoriteColor',
  ['favoriteShape', 'favoriteWord'],
  {
    question: 'animalChoice',
    fork: function(answer) {
      if (answer === 'dog') {
        return ['favoriteDogType', 'favoriteDogName'];
      }

      return ['favoriteCatType', 'favoriteCatName'];
    }
  },
  'favoriteNumber'
];

// setup the prompting by declaring the question dictionary first (great for
// re-use)
var promptUser = _.partial(inquisitor.prompt, questions);

// now, prompt the user the following questions
promptUser(manifest).then(function(answers) {
  console.log('Answers:', answers);
});
