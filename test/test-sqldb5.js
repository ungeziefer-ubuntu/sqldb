const TestSQLDB = (() => {
  'use strict';

  const {describe, TestReporter, Delimiter, QuoteDelimiter, MultiDelimiter,
    Tokenizer, TokenBuffer, Parser, ReservedWords, SQLParser, Database,
    SQLDBDriver, QueryCompiler, FieldList, SQLDB}
      = require('./lib.js');

  let db;

  const initSQLDB = () => {
    db = SQLDB(Delimiter, QuoteDelimiter, MultiDelimiter, Tokenizer,
      TokenBuffer, Parser, ReservedWords, SQLParser, Database, SQLDBDriver,
      QueryCompiler, FieldList);
  };

  const TestSQLDB = describe('test SQLDB')
    .describe('SQLDB.execute(str)')
      .setup(initSQLDB)
      .describe('expression')
        .setup(initSQLDB)
        .it('number', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select 0 a, 1 b, -99999999 c, 99999999 d\n' +
            ' from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 0, b: 1, c: -99999999, d: 99999999}]
            });
          this.expect(db.execute('select 0000, -0001, 9, 1234567890\n' +
            ' from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [
                {'0000': 0, '-0001': -1, '9': 9, '1234567890': 1234567890}
              ]
            });
          this.expect(db.execute('select 0.1, 1., .9, 12.34 from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'0.1': 0.1, '1.': 1, '.9': 0.9, '12.34': 12.34}]
            });
          this.expect(db.execute('select -56.78, 00.00, +.1, -1.\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{'-56.78': -56.78, '00.00': 0, '+.1': 0.1, '-1.': -1}]
            });
        })
        .it('string', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select \'A\'a, \"BC\"b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: 'A', b: 'BC'}]
            });
          this.expect(db.execute('select \'\', \"1\'2\", \'3\"4\'\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{'\'\'': '', '\'1\'2\'': '1\'2', '\'3\"4\'': '3\"4'}]
            });
        })
        .it('boolean', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select true a, false b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: true, b: false}]
            });
          this.expect(db.execute('select TRUE, FALSE from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'true': true, 'false': false}]
            });
        })
        .it('null', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select null a, NULL b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: null, b: null}]
            });
        })
        .it('column', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select col_name from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
          this.expect(db.execute('select tbl_name.col_name from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
        })
        .it('sign expression', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select -123 a, +456 b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: -123, b: 456}]
            });
          this.expect(db.execute('select -\'A\', +\"B\" from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'-\'A\'': null, '+\'B\'': null}]
            });
          this.expect(db.execute('select -true, -false from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'-true': -1, '-false': -0}]
            });
          this.expect(db.execute('select -null, +null from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'-null': -0, '+null': 0}]
            });
          this.expect(db.execute('select +col_name from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'+col_name': 1}]
            });
          this.expect(db.execute('select -col_name from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'-col_name': -1}]
            });
          this.expect(db.execute('select +(1-2) from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'+(1-2)': -1}]
            });
          this.expect(db.execute('select -(3-4) from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'-(3-4)': 1}]
            });
        })
        .it('parenthesis', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select (1) a, (\'A\') b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: 1, b: 'A'}]
            });
          this.expect(db.execute('select 2*(3+4), 4/(3-2) from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{'2*(3+4)': 14, '4/(3-2)': 4}]
            });
        })
        .it('binary expression', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select 1 + 2 a, 3 - 4 b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: 3, b: -1}]
            });
          this.expect(db.execute('select 2*3 a, 4/5 b, 60%7 c from tbl_name;')
            ).toBeEq({
              msg: '1 rows selected',
              records: [{a: 6, b: 0.8, c: 4}]
            });
          this.expect(db.execute('select 1<2 a, 2<2 b, 3<=3 c, 3<=0 d\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: true, b: false, c: true, d: false}]
            });
          this.expect(db.execute('select 1>2 a, 2>2 b, 3>=3 c, 3>=0 d\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: false, b: false, c: true, d: true}]
            });
          this.expect(db.execute('select 1 = 1 a, 2 <> 3 b, 4 != 4 c\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: true, b: true, c: false}]
            });
          this.expect(db.execute('select true and true a, true and false b,' +
            'false and false c, true or true d, false or true e,' +
            'false or false f from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [
                {a: true, b: false, c: false, d: true, e: true, f: false}
              ]
            });
          this.expect(db.execute('select 1+2-3 a, 4-5+6-7 b from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: 0, b: -2}]
            });
          this.expect(db.execute('select 1++2-+3+-4 a, 5+6-7--8++9 b\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: -4, b: 21}]
            });
          this.expect(db.execute('select 1+2*3 a, 4/5-6 b, 7+80%9-9 c\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 7, b: -5.2, c: 6}]
            });
          this.expect(db.execute('select (1+2)*3 a, 4/(5-6) b, (7+80)%9-9 c\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 9, b: -4, c: -3}]
            });
        })
        .it('case expression', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select case 1 when 1 then 2 else 3 end a\n'+
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 2}]
            });
          this.expect(db.execute('select case 4 when 1 then 2 else 3 end a\n'+
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 3}]
            });
          this.expect(db.execute('select case when 1=1 then 2 else 3 end a\n'+
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 2}]
            });
          this.expect(db.execute('select case when 1=4 then 2 else 3 end a\n'+
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 3}]
            });
          this.expect(db.execute('select case when 1=2 then 3\n' +
            'when 4<>5 then 6 else 7 end a from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 6}]
            });
        })
        .it('substr', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name (col_name);');
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select substr(\'ABCD\', 2) a from tbl_name;'))
            .toBeEq({
              msg: '1 rows selected',
              records: [{a: 'BCD'}]
            });
          this.expect(db.execute('select substr(\'ABCD\', 2, 2) a\n' +
            'from tbl_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{a: 'BC'}]
            });
        })
        .it('exists', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name1 (col_name);');
          db.execute('insert into tbl_name1 values(1);');
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where exists (select b.col_name from tbl_name1 b);')).toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where exists\n' +
            '(select b.col_name from tbl_name1 b\n' +
            'where a.col_name = b.col_name);')).toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where exists\n' +
            '(select b.col_name from tbl_name1 b\n' +
            'where a.col_name <> b.col_name);')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where not exists (select b.col_name from tbl_name1 b);')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where not exists\n' +
            '(select b.col_name from tbl_name1 b\n' +
            'where a.col_name = b.col_name);')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          this.expect(db.execute('select col_name from tbl_name1 a\n' +
            'where not exists\n' +
            '(select b.col_name from tbl_name1 b\n' +
            'where a.col_name <> b.col_name);')).toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
          db.execute('create table tbl_name2 (a, b);');
          db.execute('create table tbl_name3 (a, c);');
          db.execute('insert into tbl_name2 values(\'A\', 1);');
          db.execute('insert into tbl_name2 values(\'A\', 2);');
          db.execute('insert into tbl_name2 values(\'A\', 3);');
          db.execute('insert into tbl_name2 values(\'A\', 4);');
          db.execute('insert into tbl_name2 values(\'B\', 5);');
          db.execute('insert into tbl_name2 values(\'B\', 6);');
          db.execute('insert into tbl_name2 values(\'B\', 7);');
          db.execute('insert into tbl_name2 values(\'C\', 8);');
          db.execute('insert into tbl_name2 values(\'C\', 9);');
          db.execute('insert into tbl_name2 values(\'D\', 10);');
          db.execute('insert into tbl_name3 values(\'A\', true);');
          db.execute('insert into tbl_name3 values(\'A\', false);');
          db.execute('insert into tbl_name3 values(\'B\', false);');
          db.execute('insert into tbl_name3 values(\'B\', false);');
          db.execute('insert into tbl_name3 values(\'C\', true);');
          this.expect(db.execute('select a, sum(b) from tbl_name2\n' +
            'where exists\n' +
            '(select 0 from tbl_name3\n' +
            'where tbl_name2.a = tbl_name3.a)' +
            'group by a order by a;')).toBeEq({
              msg: '3 rows selected',
              records: [
                {a: 'A', 'sum(b)': 10},
                {a: 'B', 'sum(b)': 18},
                {a: 'C', 'sum(b)': 17}
              ]
            });
          this.expect(db.execute('select a, sum(b) from tbl_name2\n' +
            'where exists\n' +
            '(select 0 from tbl_name3 group by tbl_name2.a, tbl_name3.a, c\n' +
            'having tbl_name2.a = tbl_name3.a and c)\n' +
            'group by a order by a;')).toBeEq({
              msg: '2 rows selected',
              records: [
                {a: 'A', 'sum(b)': 10},
                {a: 'C', 'sum(b)': 17}
              ]
            });
        })
        .end()
      .describe('subquery')
        .it('in the from clause', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name(col_name);');
          this.expect(db.execute('select col_name from\n' +
            '(select col_name from tbl_name);')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          db.execute('insert into tbl_name values(1);');
          this.expect(db.execute('select col_name from\n' +
            '(select col_name from tbl_name);')).toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 1}]
            });
        })
      .end()
    .end()
  .end();

  if(require.main === module) TestSQLDB.run(TestReporter());

  return TestSQLDB;
})();

module.exports = TestSQLDB;
