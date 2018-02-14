const TestQuoteDelimiter = (() => {
  'use strict';

  const {describe, TestReporter, QuoteDelimiter, T2} = require('./lib.js');

  const TestQuoteDelimiter = describe('test QuoteDelimiter')
    .describe('QuoteDelimiter.split(str, i)')
      .it('should split a string on quotes', function() {
          let delim;
          // if returnDelim = true
          delim = QuoteDelimiter('\'', true);
          // if i = 0
          // return token
          this.expect(delim.split('\'abcd\'', 0))
            .toBeEq(T2(['\'abcd\''], null, null, '\'\'', true));
          this.expect(delim.split('\'ab\'cd', 0))
            .toBeEq(T2(['\'ab\''], null, 'cd', '\'\'', true));
          this.expect(delim.split('\'\'cd', 0))
            .toBeEq(T2(['\'\''], null, 'cd', '\'\'', true));
          this.expect(delim.split('\'ab\\\'cd\'', 0))
            .toBeEq(T2(['\'ab\'cd\''], null, null, '\'\'', true));
          this.expect(delim.split('\'ab\\\\cd\'ef', 0))
            .toBeEq(T2(['\'ab\\cd\''], null, 'ef', '\'\'', true));
          // return null
          this.expect(delim.split('ab\'cd\'', 0))
            .toBe(null);
          this.expect(delim.split('ab', 0))
            .toBe(null);
          this.expect(delim.split('', 0))
            .toBe(null);
          // if i > 0
          this.expect(delim.split('ab\'cd\'', 2))
            .toBeEq(T2(['ab',false, false], ['\'cd\''], null, '\'\'', true));
          this.expect(delim.split('ab\'cd\'ef', 2))
            .toBeEq(T2(['ab',false, false], ['\'cd\''], 'ef', '\'\'', true));
        })
        .end()
      .end()
    .end();

    if(require.main === module) TestQuoteDelimiter.run(TestReporter());

    return TestQuoteDelimiter;
  })();

  module.exports = TestQuoteDelimiter;
