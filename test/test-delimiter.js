const TestDelimiter = (() => {
  'use strict';

  const {describe, TestReporter, Delimiter, T1} = require('./lib.js');

  const TestDelimiter = describe('test Delimiter')
    .describe('Delimiter.split(str, i)')
      .it('should split a string on the given delimiter', function() {
          let delim;
          // if delim = RegExp
          // if returnDelim = true
          // if i = 0
          delim = Delimiter(/(?<![a-z_])\d*\.\d+(?![a-z_])/i, true);
          // return token
          this.expect(delim.split('1.2', 0))
            .toBeEq(T1('1.2', null, null, '1.2', true));
          this.expect(delim.split('.1', 0))
            .toBeEq(T1('.1', null, null, '.1', true));
          this.expect(delim.split('1.2+ab', 0))
            .toBeEq(T1('1.2', null, '+ab', '1.2', true));
          this.expect(delim.split('0.0+ab', 0))
            .toBeEq(T1('0.0', null, '+ab', '0.0', true));
          this.expect(delim.split('1234567890.1234567890+ab', 0))
            .toBeEq(T1('1234567890.1234567890', null, '+ab',
              '1234567890.1234567890', true));
          this.expect(delim.split('.2+ab', 0))
            .toBeEq(T1('.2', null, '+ab', '.2', true));
          // return null
          this.expect(delim.split('+1.2', 0))
            .toBe(null);
          this.expect(delim.split('ab1.2', 0))
            .toBe(null);
          this.expect(delim.split('1.2ab', 0))
            .toBe(null);
          this.expect(delim.split('1.ab', 0))
            .toBe(null);
          this.expect(delim.split('.1ab', 0))
            .toBe(null);
          this.expect(delim.split('1', 0))
            .toBe(null);
          this.expect(delim.split('.', 0))
            .toBe(null);
          // if i > 0
          // return token
          delim = Delimiter(/(?<![a-z_])\d+\.(?!\w)/i, true);
          this.expect(delim.split('+1.', 1))
            .toBeEq(T1('+', '1.', null, '1.', true));
          this.expect(delim.split('+9.-ab', 1))
            .toBeEq(T1('+', '9.', '-ab', '9.', true));
          this.expect(delim.split('+0.(ab)', 1))
            .toBeEq(T1('+', '0.', '(ab)', '0.', true));
          // return null
          this.expect(delim.split('+1.0', 2))
            .toBe(null);
          this.expect(delim.split('+2.0', 1))
            .toBe(null);
          this.expect(delim.split('+2.ab', 1))
            .toBe(null);
      })
      .end()
    .end()
  .end();

  if(require.main === module) TestDelimiter.run(TestReporter());

  return TestDelimiter;
})();

module.exports = TestDelimiter;
