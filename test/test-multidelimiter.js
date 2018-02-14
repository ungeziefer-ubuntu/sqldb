const TestMultiDelimiter = (() => {
  'use strict';

  const {describe, TestReporter, Delimiter, QuoteDelimiter, MultiDelimiter,
    T1, T2} = require('./lib.js');

  const TestMultiDelimiter = describe('test MultiDelimiter')
    .describe('MultiDelimiter.split(str, i)')
      .it('should split a string on the multiple delimiters', function() {
        let delim;
        delim = MultiDelimiter()
          .extend(Delimiter('ab', true))
          .extend(Delimiter('cd', false))
          .extend(Delimiter('cdef', false))
          .extend(QuoteDelimiter('\'', true))
          .extend(QuoteDelimiter('\"', false));
        // return token
        this.expect(delim.split('ab', 0))
          .toBeEq(T1('ab', null, null, 'ab', true));
        this.expect(delim.split('abcdef', 2))
          .toBeEq(T1('ab', null, 'ef', 'cd', false));
        this.expect(delim.split('\'ab\"cd\"ef\'', 0))
          .toBeEq(T2(['\'ab\"cd\"ef\''], null, null, '\'\'', true));
        this.expect(delim.split('ab\"cd\'ef\"gh', 2))
          .toBeEq(T2(['ab', false, false], ['cd\'ef'], 'gh', '\"\"', false));
        // return null;
        this.expect(delim.split('1234', 0))
          .toBe(null);
      })
      .end()
    .end()
  .end();

  if(require.main === module) TestMultiDelimiter.run(TestReporter());

  return TestMultiDelimiter;
})();

module.exports = TestMultiDelimiter;
