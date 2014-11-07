const inquisitor = require('../index');
const manifest = require('./questions');

// define the order for questioning
const questions = [
  'favoriteColor',
  ['favoriteShape', 'favoriteWord'],
  {
    question: 'animalChoice',
    branch: function(answer) {
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
var prompt = new inquisitor(manifest);

// now, prompt the user the following questions
prompt.ask(questions).then(function(answers) {
  console.log('Answers:', answers);
});
