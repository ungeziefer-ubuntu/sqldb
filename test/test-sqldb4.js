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
      .describe('update')
        .setup(initSQLDB)
        .it('should modify exsisting records in a table', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name1 (col_name);');
          this.expect(db.execute('update tbl_name1 set col_name = 0;')).toBeEq({
              msg: '0 rows updated'
            });
          db.execute('insert into tbl_name1 values(1);');
          this.expect(db.execute('update tbl_name1 set col_name = 2;')).toBeEq({
              msg: '1 rows updated'
            });
          this.expect(db.execute('select col_name from tbl_name1\n' +
            'order by col_name;')).toBeEq({
              msg: '1 rows selected',
              records: [{col_name: 2}]
            });
          db.execute('create table tbl_name2 (a, b);');
          db.execute('insert into tbl_name2 values(1, 1);');
          db.execute('insert into tbl_name2 values(1, 2);');
          db.execute('insert into tbl_name2 values(2, 3);');
          db.execute('insert into tbl_name2 values(2, 4);');
          this.expect(db.execute('update tbl_name2 set b = 9 where a = 1;'))
            .toBeEq({
              msg: '2 rows updated'
            });
          this.expect(db.execute('select a, b from tbl_name2 order by a, b;'))
            .toBeEq({
              msg: '4 rows selected',
              records: [
                {a: 1, b: 9},
                {a: 1, b: 9},
                {a: 2, b: 3},
                {a: 2, b: 4}
              ]
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
