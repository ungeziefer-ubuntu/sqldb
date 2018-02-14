const TestTokenizer = (() => {
  'use strict';

  const {describe, TestReporter, Delimiter, MultiDelimiter, Tokenizer, T3}
    = require('./lib.js');

  const TestTokenizer = describe('test Tokenizer')
    .describe('Tokenizer.getToken()')
      .it('should return the next token', function() {
        let delim, tokenizer;
        delim = MultiDelimiter()
          .extend(Delimiter(' ', false))
          .extend(Delimiter('\n', false))
          .extend(Delimiter('(', true))
          .extend(Delimiter(')', true))
          .extend(Delimiter(';', true));
        tokenizer = Tokenizer('create table tbl_name\n(col_name);', delim);
        this.expect(tokenizer.getToken()).toBeEq(T3('create', 0, 0));
        this.expect(tokenizer.getToken()).toBeEq(T3('table', 0, 7));
        this.expect(tokenizer.getToken()).toBeEq(T3('tbl_name', 0, 13));
        this.expect(tokenizer.getToken()).toBeEq(T3('(', 1, 0));
        this.expect(tokenizer.getToken()).toBeEq(T3('col_name', 1, 1));
        this.expect(tokenizer.getToken()).toBeEq(T3(')', 1, 9));
        this.expect(tokenizer.getToken()).toBeEq(T3(';', 1, 10));
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
        tokenizer = Tokenizer('abcd', delim);
        this.expect(tokenizer.getToken()).toBeEq(T3('abcd', 0, 0));
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
        tokenizer = Tokenizer(' abcd', delim);
        this.expect(tokenizer.getToken()).toBeEq(T3('abcd', 0, 1));
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
        tokenizer = Tokenizer('abcd ', delim);
        this.expect(tokenizer.getToken()).toBeEq(T3('abcd', 0, 0));
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
        tokenizer = Tokenizer('abcd \n', delim);
        this.expect(tokenizer.getToken()).toBeEq(T3('abcd', 0, 0));
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
        tokenizer = Tokenizer(' \n', delim);
        this.expect(tokenizer.getToken()).toBe(null);
        this.expect(tokenizer.getToken()).toBe(null);
      })
      .end()
    .end()
  .end();

  if(require.main === module) TestTokenizer.run(TestReporter());

  return TestTokenizer;
})();

module.exports = TestTokenizer;
