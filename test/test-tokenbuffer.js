const TestTokenBuffer = (() => {
  'use strict';

  const {describe, TestReporter, Delimiter, MultiDelimiter, Tokenizer,
    TokenBuffer, T3} = require('./lib.js');

  const TestTokenBuffer = describe('test TokenBuffer')
    .describe('TokenBuffer.next()')
      .it('should return the next token', function() {
        let delim, buf;
        delim = MultiDelimiter()
          .extend(Delimiter(' ', false))
          .extend(Delimiter('\n', false))
          .extend(Delimiter('(', true))
          .extend(Delimiter(')', true))
          .extend(Delimiter(';', true));
        buf = TokenBuffer(Tokenizer(
          'create table tbl_name\n(col_name);', delim));
        this.expect(buf.next()).toBeEq(T3('create', 0, 0));
        this.expect(buf.next()).toBeEq(T3('table', 0, 7));
        this.expect(buf.next()).toBeEq(T3('tbl_name', 0, 13));
        this.expect(buf.next()).toBeEq(T3('(', 1, 0));
        this.expect(buf.next()).toBeEq(T3('col_name', 1, 1));
        this.expect(buf.next()).toBeEq(T3(')', 1, 9));
        this.expect(buf.next()).toBeEq(T3(';', 1, 10));
        this.expect(buf.next()).toBe(null);
        this.expect(buf.next()).toBe(null);
      })
      .end()
    .end()
  .end();

  if(require.main === module) TestTokenBuffer.run(TestReporter());

  return TestTokenBuffer;
})();

module.exports = TestTokenBuffer;
