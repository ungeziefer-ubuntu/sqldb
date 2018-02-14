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
      .describe('database')
        .describe('should show the current database')
          .setup(initSQLDB)
          .it('should return the current database name', function() {
            db.execute('use db_name1;');
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            db.execute('use db_name2;');
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name2'}]
              });
          })
          .it('should return \'null\' when no database is selected',
          function() {
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
          })
          .end()
        .end()
      .describe('databases')
        .describe('should show all databases')
          .setup(initSQLDB)
          .it('should return the list of database names', function() {
            db.execute('create database db_name1;');
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            db.execute('create database db_name2;');
            this.expect(db.execute('databases;')).toBeEq({
                msg: '2 rows selected',
                records: [{dbname: 'db_name1'}, {dbname: 'db_name2'}]
              });
            db.execute('create database db_name3;');
            this.expect(db.execute('databases;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {dbname: 'db_name1'},
                  {dbname: 'db_name2'},
                  {dbname: 'db_name3'}
                ]
              });
          })
          .it('should return nothing when no database exists', function() {
            this.expect(db.execute('databases;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
          })
          .end()
        .end()
      .describe('use database')
        .describe('should select a database')
          .setup(initSQLDB)
          .it('should create a new database when it does not exist',
          function() {
            this.expect(db.execute('use db_name1;')).toBeEq({
              msg: 'Database changed'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
          })
          .it('should connect the existing database when it already exist',
          function() {
            db.execute('create database db_name1;');
            db.execute('create database db_name2;');
            this.expect(db.execute('use db_name1;')).toBeEq({
              msg: 'Database changed'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            db.execute('create table tbl_name1 (col_name1);');
            this.expect(db.execute('use db_name2;')).toBeEq({
              msg: 'Database changed'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name2'}]
              });
            db.execute('create table tbl_name2 (col_name2);');
            this.expect(db.execute('use db_name1;')).toBeEq({
              msg: 'Database changed'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            this.expect(db.execute('tables;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'}
                ]
              });
            this.expect(db.execute('columns from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name1',  column_id: 1}]
              });
            this.expect(db.execute('use db_name2;')).toBeEq({
              msg: 'Database changed'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name2'}]
              });
            this.expect(db.execute('tables;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name2'}
                ]
              });
            this.expect(db.execute('columns from tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name2',  column_id: 1}]
              });
            this.expect(db.execute('databases;')).toBeEq({
                msg: '2 rows selected',
                records: [{dbname: 'db_name1'}, {dbname: 'db_name2'}]
              });
          })
          .end()
        .end()
      .describe('create database')
        .describe('should create a new database')
          .setup(initSQLDB)
          .it('should create a new database when it does not exist',
          function() {
            this.expect(db.execute('create database db_name1;')).toBeEq({
              msg: 'Database \'db_name1\' created'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            this.expect(db.execute('create database db_name2;')).toBeEq({
              msg: 'Database \'db_name2\' created'});
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
            this.expect(db.execute('databases;')).toBeEq({
                msg: '2 rows selected',
                records: [{dbname: 'db_name1'}, {dbname: 'db_name2'}]
              });
          })
          .it('should throw an execution error when it already exists',
          function() {
            db.execute('create database db_name1;');
            this.expect(db.execute.bind(db, 'create database db_name1;'))
              .throws(new Error(
                'SQLExecutionError: Database \'db_name1\' already exists'));
            db.execute('use db_name2;');
            this.expect(db.execute.bind(db, 'create database db_name2;'))
              .throws(new Error(
                'SQLExecutionError: Database \'db_name2\' already exists'));
          })
          .end()
        .end()
      .describe('drop database')
        .describe('should remove a database')
          .setup(initSQLDB)
          .it('should remove a database when it exists', function() {
            db.execute('create database db_name1;');
            db.execute('create database db_name2;');
            this.expect(db.execute('drop database db_name1;')).toBeEq({
              msg: 'Database \'db_name1\' removed'});
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name2'}]
              });
            this.expect(db.execute('drop database db_name2;')).toBeEq({
              msg: 'Database \'db_name2\' removed'});
            this.expect(db.execute('databases;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            db.execute('create database db_name1;');
            db.execute('create database db_name2;');
            this.expect(db.execute('databases;')).toBeEq({
                msg: '2 rows selected',
                records: [{dbname: 'db_name1'}, {dbname: 'db_name2'}]
              });
          })
          .it('should throw an execution error when it does not exist',
          function() {
            db.execute('create database db_name1;');
            this.expect(db.execute.bind(db, 'drop database db_name2;'))
              .throws(new Error(
                'SQLExecutionError: Database \'db_name2\' does not exist'));
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            this.expect(db.execute.bind(db, 'drop database db_name3;'))
              .throws(new Error(
                'SQLExecutionError: Database \'db_name3\' does not exist'));
            this.expect(db.execute('databases;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: 'db_name1'}]
              });
            this.expect(db.execute('drop database db_name1;')).toBeEq({
              msg: 'Database \'db_name1\' removed'});
            this.expect(db.execute('databases;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
          })
          .end()
        .end()
      .describe('tables')
        .describe('should show all tables in the current database')
          .setup(initSQLDB)
          .it('should return the list of table names', function() {
            db.execute('use db_name1;');
            this.expect(db.execute('tables;')).toBeEq({
                msg: '2 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'}
                ]
              });
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (col_name);');
            this.expect(db.execute('tables;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                  {table_name: 'tbl_name2'}
                ]
              });
            db.execute('use db_name2;');
            this.expect(db.execute('tables;')).toBeEq({
                msg: '2 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'}
                ]
              });
            db.execute('create table tbl_name3 (col_name);');
            db.execute('create table tbl_name4 (col_name);');
            this.expect(db.execute('tables;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name3'},
                  {table_name: 'tbl_name4'}
                ]
              });
          })
          .it('should throw an execution error when no database connected',
          function() {
            this.expect(db.execute.bind(db, 'tables;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
            db.execute('use db_name;');
            this.expect(db.execute('tables;')).toBeEq({
                msg: '2 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'}
                ]
              });
            db.execute('exit database;');
            this.expect(db.execute.bind(db, 'tables;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
          })
          .end()
        .end()
      .describe('columns')
        .describe('should show information about columns in a table')
          .setup(initSQLDB)
          .it('should return the list of columns in a given table',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name (a, b, c);');
            this.expect(db.execute('columns from tbl_name;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {column_name: 'a',  column_id: 1},
                  {column_name: 'b',  column_id: 2},
                  {column_name: 'c',  column_id: 3}
                ]
              });
            this.expect(db.execute('describe tbl_name;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {column_name: 'a',  column_id: 1},
                  {column_name: 'b',  column_id: 2},
                  {column_name: 'c',  column_id: 3}
                ]
              });
          })
          .it('should throw an execution error when no database connected',
          function() {
            this.expect(db.execute.bind(db, 'columns from tbl_name;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
            db.execute('use db_name;');
            db.execute('create table tbl_name (col_name);')
            db.execute('exit database;');
            this.expect(db.execute.bind(db, 'describe tbl_name;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
          })
          .it('should throw an execution error when the table does not exist',
          function() {
            db.execute('use db_name1;');
            db.execute('create table tbl_name1 (col_name);')
            this.expect(db.execute.bind(db, 'describe tbl_name2;'))
              .throws(new Error(
                'SQLExecutionError: Table \'tbl_name2\' does not exist'));
            this.expect(db.execute('columns from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name',  column_id: 1}]
              });
            db.execute('use db_name2;');
            this.expect(db.execute.bind(db, 'describe tbl_name1;'))
              .throws(new Error(
                'SQLExecutionError: Table \'tbl_name1\' does not exist'));
          })
          .end()
        .end()
      .describe('create table')
        .describe('should create a new table in a database')
          .setup(initSQLDB)
          .it('should create a table' +
          ' with the given table name and column definitions', function() {
            db.execute('use db_name;');
            this.expect(db.execute('create table tbl_name1 (col_name);'))
              .toBeEq({msg: 'Table \'tbl_name1\' created'});
            this.expect(db.execute('tables;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                ]
              });
            this.expect(db.execute('columns from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name',  column_id: 1}]
              });
            this.expect(db.execute('create table tbl_name2 (a, b, c, d);'))
              .toBeEq({
                msg: 'Table \'tbl_name2\' created'
              });
            this.expect(db.execute('tables;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                  {table_name: 'tbl_name2'}
                ]
              });
            this.expect(db.execute('columns from tbl_name2;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {column_name: 'a',  column_id: 1},
                  {column_name: 'b',  column_id: 2},
                  {column_name: 'c',  column_id: 3},
                  {column_name: 'd',  column_id: 4}
                ]
              });
          })
          .it('should throw an execution error when no database connected',
          function() {
            this.expect(db.execute.bind(db, 'create table tbl_name(col_name);'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
            db.execute('use db_name;');
            db.execute('create table tbl_name (col_name);');
            db.execute('exit database;');
            this.expect(db.execute.bind(db, 'create table tbl_name(col_name);'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
          })
          .it('should throw an execution error when it already exists',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (col_name);');
            this.expect(db.execute.bind(db,
              'create table tbl_name1 (col_name1);')).throws(new Error(
                'SQLExecutionError: Table \'tbl_name1\' already exists'));
            this.expect(db.execute.bind(db,
              'create table tbl_name2 (col_name2);')).throws(new Error(
                'SQLExecutionError: Table \'tbl_name2\' already exists'));
            this.expect(db.execute('describe tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name',  column_id: 1}]
              });
            this.expect(db.execute('describe tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name',  column_id: 1}]
              });
          })
          .it('should create a new table from an existing table' +
          ' with a select statement', function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name1);');
            this.expect(db.execute('create table tbl_name2\n' +
              'as select col_name1 from tbl_name1;')).toBeEq({
                msg: 'Table \'tbl_name2\' created(records: 0)'});
            this.expect(db.execute('tables;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                  {table_name: 'tbl_name2'}
                ]
              });
            this.expect(db.execute('describe tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name1',  column_id: 1}]
              });
            this.expect(db.execute('describe tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name1',  column_id: 1}]
              });
            this.expect(db.execute('select col_name1 from tbl_name2;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            db.execute('insert into tbl_name2 values(1);');
            db.execute('insert into tbl_name2 values(2);');
            db.execute('insert into tbl_name2 values(3);');
            this.expect(db.execute('create table tbl_name3\n' +
              'as select col_name1 col_name2, 0 col_name3 from tbl_name2;'))
              .toBeEq({msg: 'Table \'tbl_name3\' created(records: 3)'});
            this.expect(db.execute('tables;')).toBeEq({
                msg: '5 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                  {table_name: 'tbl_name2'},
                  {table_name: 'tbl_name3'}
                ]
              });
            this.expect(db.execute('select col_name2, col_name3\n' +
              'from tbl_name3 order by col_name2;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {col_name2: 1, col_name3: 0},
                  {col_name2: 2, col_name3: 0},
                  {col_name2: 3, col_name3: 0}
                ]
              });
            this.expect(db.execute('describe tbl_name2;')).toBeEq({
                msg: '1 rows selected',
                records: [{column_name: 'col_name1',  column_id: 1}]
              });
            this.expect(db.execute('describe tbl_name3;')).toBeEq({
                msg: '2 rows selected',
                records: [
                  {column_name: 'col_name2',  column_id: 1},
                  {column_name: 'col_name3',  column_id: 2}
                ]
              });
          })
          .it('should throw an execution error when it occurred in subquery',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name1);');
            db.execute('insert into tbl_name1 values(1);');
            this.expect(db.execute.bind(db, 'create table tbl_name2\n' +
              'as select col_name2 from tbl_name1;')).throws(
                new Error('SQLExecutionError: Column \'col_name2\'' +
                  ' does not exist in field list'));
            this.expect(db.execute.bind(db, 'create table tbl_name2\n' +
              'as select col_name1 from tbl_name2;')).throws(
                new Error(
                  'SQLExecutionError: Table \'tbl_name2\' does not exist'));
          })
          .it('should throw an execution error' +
          ' when the subquery returned an invalid column name',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name1);');
            db.execute('insert into tbl_name1 values(1);');
            this.expect(db.execute.bind(db, 'create table tbl_name2\n' +
              'as select 0 from tbl_name1;')).throws(
                new Error('SQLExecutionError: Invalid column name \'0\''));
          })
          .end()
        .end()
      .describe('drop table')
        .describe('should remove tables from a database')
          .setup(initSQLDB)
          .it('should remove tables with the given names', function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (a, b, c);');
            this.expect(db.execute('drop table tbl_name1;')).toBeEq({
                msg: 'Table \'tbl_name1\' removed'
              });
            this.expect(db.execute('tables;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name2'}
                ]
              });
            this.expect(db.execute('drop table tbl_name2;')).toBeEq({
                msg: 'Table \'tbl_name2\' removed'
              });
            this.expect(db.execute('tables;')).toBeEq({
                msg: '2 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'}
                ]
              });
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (a, b, c);');
            this.expect(db.execute('drop table tbl_name1, tbl_name2;'))
              .toBeEq({msg: 'Table \'tbl_name1\', \'tbl_name2\' removed'});
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (a, b, c);');
            db.execute('create table tbl_name3 (a, b, c);');
            this.expect(db.execute('drop table tbl_name1,tbl_name2,tbl_name3;'))
              .toBeEq({
                msg:
                  'Table \'tbl_name1\', \'tbl_name2\', \'tbl_name3\' removed'});
          })
          .it('should throw an execution error when no database connected',
          function() {
            this.expect(db.execute.bind(db, 'drop table tbl_name1;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
            this.expect(db.execute('database;')).toBeEq({
                msg: '1 rows selected',
                records: [{dbname: null}]
              });
            db.execute('use db_name;');
            db.execute('create table tbl_name (col_name);');
            db.execute('exit database;');
            this.expect(db.execute.bind(db, 'drop table tbl_name1;'))
              .throws(new Error(
                'SQLExecutionError: No database is selected'));
          })
          .it('should throw an execution error when the tables do not exist',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            db.execute('create table tbl_name2 (col_name);');
            this.expect(db.execute.bind(db, 'drop table tbl_name3;'))
              .throws(new Error(
                'SQLExecutionError: Table \'tbl_name3\' does not exist'));
            this.expect(db.execute.bind(db,
              'drop table tbl_name1, tbl_name2, tbl_name3;')).throws(new Error(
                'SQLExecutionError: Table \'tbl_name3\' does not exist'));
            this.expect(db.execute('tables;')).toBeEq({
                msg: '4 rows selected',
                records: [
                  {table_name: 'tables'},
                  {table_name: 'columns'},
                  {table_name: 'tbl_name1'},
                  {table_name: 'tbl_name2'}
                ]
              });
            db.execute('drop table tbl_name1;');
            this.expect(db.execute.bind(db, 'drop table tbl_name1;'))
              .throws(new Error(
                'SQLExecutionError: Table \'tbl_name1\' does not exist'));
            this.expect(db.execute.bind(db,
              'drop table tbl_name1, tbl_name2;')).throws(new Error(
                'SQLExecutionError: Table \'tbl_name1\' does not exist'));
            db.execute('drop table tbl_name2;');
            this.expect(db.execute.bind(db,
              'drop table tbl_name1, tbl_name2;')).throws(new Error(
                'SQLExecutionError: Table \'tbl_name1\' does not exist'));
          })
          .end()
          .it('should throw an execution error' +
          ' when the table is a data dictionary', function() {
            db.execute('use db_name;');
            this.expect(db.execute.bind(db, 'drop table tables;'))
              .throws(new Error(
                'SQLExecutionError: Can not remove data dictionary table' +
                  ' \'tables\''));
            this.expect(db.execute.bind(db, 'drop table columns;'))
              .throws(new Error(
                'SQLExecutionError: Can not remove data dictionary table' +
                  ' \'columns\''));
          })
        .end()
      .end()
    .end()
  .end();

  if(require.main === module) TestSQLDB.run(TestReporter());

  return TestSQLDB;
})();

module.exports = TestSQLDB;
