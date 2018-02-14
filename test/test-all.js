var TestAll = (() => {
  'use strict';

  const {describe, TestReporter} = require('./lib.js');

  const TestAll = describe('test all')
    .extend(require('./test-delimiter.js'))
    .extend(require('./test-quotedelimiter.js'))
    .extend(require('./test-multidelimiter.js'))
    .extend(require('./test-tokenizer.js'))
    .extend(require('./test-tokenbuffer.js'))
    .extend(require('./test-sqldb1.js'))
    .extend(require('./test-sqldb2.js'))
    .extend(require('./test-sqldb3.js'))
    .extend(require('./test-sqldb4.js'))
    .extend(require('./test-sqldb5.js'))
    .extend(require('./test-csvparser.js'))
    .end()
  .end();

  if(require.main === module) TestAll.run(TestReporter());

  return TestAll;
})();

module.exports = TestAll;
