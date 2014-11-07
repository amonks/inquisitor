module.exports = {
  favoriteColor: {
    type: 'list',
    message: 'What\'s your favorite color?',
    choices: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
  },
  favoriteShape: {
    type: 'list',
    message: 'What\'s your favorite shape?',
    choices: ['square', 'circle', 'rectangle', 'triangle']
  },
  favoriteWord: {
    type: 'input',
    message: 'What\'s your favorite word?',
    default: 'quizzical'
  },
  favoriteNumber: {
    type: 'input',
    message: 'What\'s your favorite number?',
    default: 13
  },
  animalChoice: {
    type: 'list',
    message: 'Between a dog and a cat, which would you prefer to own?',
    choices: ['dog', 'cat']
  },
  favoriteDogType: {
    type: 'input',
    message: 'What\'s your favorite type of dog?',
    default: 'German Shepherd'
  },
  favoriteDogName: {
    type: 'input',
    message: 'What\'s your favorite name for a dog?',
    default: 'Lucky'
  },
  favoriteCatType: {
    type: 'input',
    message: 'What\'s your favorite type of cat?',
    default: 'Bengal'
  },
  favoriteCatName: {
    type: 'input',
    message: 'What\'s your favorite name for a cat?',
    default: 'Bella'
  }
};
