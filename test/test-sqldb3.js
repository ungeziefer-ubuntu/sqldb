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
      .describe('insert')
        .describe('should insert new records into a table')
          .setup(initSQLDB)
          .it('should insert new records into a table',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            this.expect(db.execute('insert into tbl_name1 values(1);')).toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select col_name from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{col_name: 1}]
              });
            db.execute('create table tbl_name2 (a, b, c);');
            this.expect(db.execute('insert into tbl_name2(a, b, c)\n' +
              'values(0, 1234567890, -0987654321);')).toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{a: 0, b: 1234567890, c: -987654321}]
              });
            this.expect(db.execute('insert into tbl_name2(a, b, c)\n' +
              'values(1, \'ABCD\', true);')).toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name2 order by a;'))
              .toBeEq({
                msg: '2 rows selected',
                records: [
                  {a: 0, b: 1234567890, c: -987654321},
                  {a: 1, b: 'ABCD', c: true}
                ]
              });
            this.expect(db.execute('insert into tbl_name2(a, b)\n' +
              'values(2, null);')).toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name2 order by a;'))
              .toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 0, b: 1234567890, c: -987654321},
                  {a: 1, b: 'ABCD', c: true},
                  {a: 2, b: null, c: null}
                ]
              });
            db.execute('create table tbl_name3 (a, b, c);');
            this.expect(db.execute('insert into tbl_name3 values(-a, -b, -c);'))
              .toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name3;'))
              .toBeEq({
                msg: '1 rows selected',
                records: [{a: -0, b: -0, c: -0}]
              });
            this.expect(db.execute('insert into tbl_name3\n' +
              'values(a, substr(\'ABCD\', 1, 2), substr(1234, 2, 1));'))
              .toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name3 order by a;'))
              .toBeEq({
                msg: '2 rows selected',
                records: [
                  {a: -0, b: -0, c: -0},
                  {a: null, b: 'AB', c: '2'}]
                });
            db.execute('create table tbl_name4 (col_name);');
            this.expect(db.execute('insert into tbl_name4 values(1),(2),(3);'))
              .toBeEq({
                msg: '3 rows created'
              });
            this.expect(db.execute('select col_name from tbl_name4\n' +
            'order by col_name;')).toBeEq({
                msg: '3 rows selected',
                records: [{col_name: 1}, {col_name: 2}, {col_name: 3}]
              });
            db.execute('create table tbl_name5 (a, b, c);');
            this.expect(db.execute('insert into tbl_name5(c, b, a)' +
              'values(1,2,3), (4, 5 ,6), (7, 8, 9);')).toBeEq({
                msg: '3 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name5\n' +
            'order by a;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 3, b: 2, c: 1},
                  {a: 6, b: 5, c: 4},
                  {a: 9, b: 8, c: 7}
                ]
              });
          })
          .end()
        .end()
      .describe('insert select')
        .setup(initSQLDB)
        .describe('should copy records from a table into another table')
          .it('should copy records from a table into another table', function(){
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (col_name);');
            db.execute('insert into tbl_name1 values(1);');
            this.expect(db.execute('insert into tbl_name2(col_name)\n' +
              'select col_name from tbl_name1;'))
              .toBeEq({
                msg: '1 rows created'
              });
            this.expect(db.execute('select col_name from tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{col_name: 1}]
              });
            db.execute('create table tbl_name3 (a, b, c);');
            db.execute('create table tbl_name4 (a, b, c);');
            db.execute('insert into tbl_name3 values(1, 2, 3);');
            db.execute('insert into tbl_name3 values(4, 5, 6);');
            db.execute('insert into tbl_name3 values(7, 8, 9);');
            this.expect(db.execute('insert into tbl_name4\n' +
              'select * from tbl_name3;')).toBeEq({
                msg: '3 rows created'
              });
            this.expect(db.execute('select a, b, c from tbl_name4\n' +
            'order by a;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 1, b: 2, c: 3},
                  {a: 4, b: 5, c: 6},
                  {a: 7, b: 8, c: 9}
                ]
              });
          })
          .end()
        .end()
      .describe('delete')
        .setup(initSQLDB)
        .it('should remove records from a table', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name1 (col_name);');
          db.execute('insert into tbl_name1 values(1);');
          this.expect(db.execute('delete from tbl_name1;')).toBeEq({
              msg: '1 rows removed'
            })
          this.expect(db.execute('select col_name from tbl_name1;')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          db.execute('create table tbl_name2 (a, b);');
          db.execute('insert into tbl_name2 values(1, 1);');
          db.execute('insert into tbl_name2 values(1, 2);');
          db.execute('insert into tbl_name2 values(2, 3);');
          db.execute('insert into tbl_name2 values(2, 4);');
          this.expect(db.execute('delete from tbl_name2 where a = 1;')).toBeEq({
              msg: '2 rows removed'
            });
          this.expect(db.execute('select a, b from tbl_name2;')).toBeEq({
              msg: '2 rows selected',
              records: [{a: 2, b: 3}, {a: 2, b: 4}]
            });
          this.expect(db.execute('delete from tbl_name2 where a = 2;')).toBeEq({
            msg: '2 rows removed'
          });
          this.expect(db.execute('select a, b from tbl_name2;')).toBeEq({
              msg: '0 rows selected',
              records: []
            });
          this.expect(db.execute('delete from tbl_name2;')).toBeEq({
              msg: '0 rows removed'
            });
        })
        .end()
      .end()
    .end()
  .end();

  if(require.main === module) TestSQLDB.run(TestReporter());

  return TestSQLDB;
})();

module.exports = TestSQLDB;
