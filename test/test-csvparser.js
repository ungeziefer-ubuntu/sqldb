const TestCSVParser = (() => {
  'use strict';

  const {describe, TestReporter, CSVParser} = require('./lib.js');

  const csvparser = CSVParser();

  const TestCSVParser = describe('test CSVParser')
    .describe('CSVParser.parse(text)')
      .it('should convert csv text into arrays', function() {
        this.expect(csvparser.parse('1, 2, 3, 4')).toBeEq([
            ['1', '2', '3', '4']
          ]);
        this.expect(csvparser.parse('1,2,3,4\n5,6,7,8\n9,10,11,12\n')).toBeEq([
            ['1', '2', '3', '4'],
            ['5', '6', '7', '8'],
            ['9', '10', '11', '12']
          ]);
        this.expect(csvparser.parse(' a , bc , def , ')).toBeEq([
            ['a', 'bc', 'def', '']
          ]);
        this.expect(csvparser.parse('a b, c d, e f, \n')).toBeEq([
            ['a b', 'c d', 'e f', '']
          ]);
        this.expect(csvparser.parse('"a", "b", "c", "d"')).toBeEq([
            ['a', 'b', 'c', 'd']
          ]);
        this.expect(csvparser.parse('"a,b", "c\nd"')).toBeEq([
            ['a,b', 'c\nd']
          ]);
        this.expect(csvparser.parse('"ab"cd, ef\n"gh", ij')).toBeEq([
            ['ab', 'ef'],
            ['gh', 'ij']
          ]);
        this.expect(csvparser.parse('"abcd')).toBeEq([
            ['abcd']
          ]);
        this.expect(csvparser.parse('"abcd ')).toBeEq([
            ['abcd']
          ]);
        this.expect(csvparser.parse('"abcd \n')).toBeEq([
            ['abcd']
          ]);
        this.expect(csvparser.parse('"1,2,3\n4",5,6')).toBeEq([
            ['1,2,3\n4', '5', '6']
          ]);
        this.expect(csvparser.parse('1\n\n2\n\n')).toBeEq([
            ['1'], [''], ['2'], ['']
          ]);
        this.expect(csvparser.parse('12\t34\n56\t78', '\t')).toBeEq([
            ['12', '34'],
            ['56', '78']
          ]);
        this.expect(csvparser.parse('""1""\t""2""\n', '\t', '""')).toBeEq([
            ['1', '2']
          ]);
        this.expect(csvparser.parse('\n\n\n')).toBeEq([
            [''],[''],['']
          ]);
        this.expect(csvparser.parse('  \n  \n  \n')).toBeEq([
            [''],[''],['']
          ]);
        this.expect(csvparser.parse('\t\n\t\n\t\n')).toBeEq([
            [''],[''],['']
          ]);
      })
      .end()
    .describe('CSVParser.toCSV(arrays)')
      .it('should convert arrays into csv', function() {
        this.expect(csvparser.toCSV([[1, 2, 3]])).toBe(
          '1,2,3');
        this.expect(csvparser.toCSV([
            [0, -99999999, 9999.9999],
            ['a', 'bc', 'def'],
            [true, false, null]
          ])).toBe(
            '0,-99999999,9999.9999\n' +
            'a,bc,def\n' +
            'true,false,null'
          );
      })
      .end()
    .end()
  .end();

  if(require.main === module) TestCSVParser.run(TestReporter());

  return TestCSVParser;
})();

module.exports = TestCSVParser;
