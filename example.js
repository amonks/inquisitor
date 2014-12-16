const inquisitor = require('./index');
const manifest = require('./test/sample-manifest');
const prompt = new inquisitor(manifest);


prompt.ask(['favoriteColor']).then(function(answers) {
  console.log('answers', answers);
}).catch(function(err) {
  console.log('errs', err);
});
