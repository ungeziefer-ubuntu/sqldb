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
      .describe('select')
        .describe('should return records from a database')
          .setup(initSQLDB)
          .it('should return no record when the table is empty', function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            this.expect(db.execute('select * from tbl_name1;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select tbl_name1.* from tbl_name1;'))
              .toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select col_name from tbl_name1;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select * from tbl_name1\n' +
              'where col_name = 1;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select tbl_name1.* from tbl_name1\n' +
              'where col_name <> 1;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select col_name from tbl_name1\n' +
              'where col_name = 1 or col_name != 1;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            db.execute('create table tbl_name2 (a, b, c);');
            this.expect(db.execute('select * from tbl_name2;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select tbl_name2.* from tbl_name2;'))
              .toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select a, b, c from tbl_name2;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
            this.expect(db.execute('select a from tbl_name2;')).toBeEq({
                msg: '0 rows selected',
                records: []
              });
          })
          .it('should return all records from the table' +
          ' when no condition is specified',
          function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name1 (col_name);');
            db.execute('insert into tbl_name1 values(1);');
            this.expect(db.execute('select * from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{col_name: 1}]
              });
            this.expect(db.execute('select tbl_name1.* from tbl_name1;'))
              .toBeEq({
                msg: '1 rows selected',
                records: [{col_name: 1}]
              });
            this.expect(db.execute('select col_name from tbl_name1;')).toBeEq({
                msg: '1 rows selected',
                records: [{col_name: 1}]
              });
            db.execute('create table tbl_name2 (a, b, c);');
            db.execute('insert into tbl_name2 values(1, \'a\', true);');
            db.execute('insert into tbl_name2 values(2, \'b\', false);');
            db.execute('insert into tbl_name2 values(3, \'c\', null);');
            this.expect(db.execute('select * from tbl_name2 order by a;'))
            .toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 1, b: 'a', c: true},
                  {a: 2, b: 'b', c: false},
                  {a: 3, b: 'c', c: null}
                ]
              });
            this.expect(db.execute('select tbl_name2.* from tbl_name2\n' +
              'order by a;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 1, b: 'a', c: true},
                  {a: 2, b: 'b', c: false},
                  {a: 3, b: 'c', c: null}
                ]
              });
            this.expect(db.execute('select a, b, c from tbl_name2\n' +
              'order by a;')).toBeEq({
                msg: '3 rows selected',
                records: [
                  {a: 1, b: 'a', c: true},
                  {a: 2, b: 'b', c: false},
                  {a: 3, b: 'c', c: null}
                ]
              });
            this.expect(db.execute('select a from tbl_name2 order by a;'))
              .toBeEq({
                msg: '3 rows selected',
                records: [{a: 1}, {a: 2}, {a: 3}]
              });
          })
          .it('should gerenete an alias based on the expression'+
          ' when it is not specified', function() {
            db.execute('use db_name;');
            db.execute('create table tbl_name (col_name);');
            db.execute('insert into tbl_name values(1);');
            this.expect(db.execute('select 1 from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'1': 1}]
              });
            this.expect(db.execute('select \'ABCD\' from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'\'ABCD\'': 'ABCD'}]
              });
            this.expect(db.execute('select true from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{true: true}]
              });
            this.expect(db.execute('select null from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{null: null}]
              });
            this.expect(db.execute('select -9 from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'-9': -9}]
              });
            this.expect(db.execute('select count(0) from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'count(0)': 1}]
              });
            this.expect(db.execute('select (1) from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'(1)': 1}]
              });
            this.expect(db.execute('select case 4 when 1 then 2 else 3 end\n' +
              'from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'case 4 when 1 then 2 else 3 end': 3}]
              });
            this.expect(db.execute('select case when 1=2 then 3\n' +
              'when 4<>5 then 6 else 7 end from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [
                  {'case when 1=2 then 3 when 4<>5 then 6 else 7 end':6}
                ]
              });
            this.expect(db.execute('select 2+3-4 from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'2+3-4': 1}]
              });
            this.expect(db.execute('select 1+2*3 from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'1+2*3': 7}]
              });
            this.expect(db.execute('select 3-4/5 from tbl_name;')).toBeEq({
                msg: '1 rows selected',
                records: [{'3-4/5': 2.2}]
              });
          })
        .end()
      .end()
    .describe('select distinct')
      .it('should extract distinct values', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a, b, c);');
        db.execute('insert into tbl_name values(1, 3, 5);');
        db.execute('insert into tbl_name values(1, 3, 6);');
        db.execute('insert into tbl_name values(2, 3, 7);');
        db.execute('insert into tbl_name values(2, 4, 8);');
        this.expect(db.execute('select distinct a from tbl_name\n' +
          'order by a;')).toBeEq({
            msg: '2 rows selected',
            records: [
              {a: 1}, {a: 2}
            ]
          });
        this.expect(db.execute('select distinct a, b from tbl_name\n' +
          'order by a;')).toBeEq({
            msg: '3 rows selected',
            records: [
              {a: 1, b: 3}, {a: 2, b: 3}, {a: 2, b: 4}
            ]
          });
        this.expect(db.execute('select distinct a, b, c from tbl_name\n' +
          'order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 1, b: 3, c: 5},
              {a: 1, b: 3, c: 6},
              {a: 2, b: 3, c: 7},
              {a: 2, b: 4, c: 8}
            ]
          });
        this.expect(db.execute('select distinct * from tbl_name\n' +
          'order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 1, b: 3, c: 5},
              {a: 1, b: 3, c: 6},
              {a: 2, b: 3, c: 7},
              {a: 2, b: 4, c: 8}
            ]
          });
      })
      .end()
    .describe('where')
      .it('should filter records', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a, b, c, d);');
        db.execute('insert into tbl_name values(\'A\', 25, 1, true);');
        db.execute('insert into tbl_name values(\'B\', 20, 2, true);');
        db.execute('insert into tbl_name values(\'C\', 35, 3, false);');
        db.execute('insert into tbl_name values(\'D\', 40, 4, false);');
        db.execute('insert into tbl_name values(\'E\', 0,  5, true);');
        db.execute('insert into tbl_name values(\'F\', 50, 6, true);');
        this.expect(db.execute('select a from tbl_name where a = \'A\';'))
          .toBeEq({
            msg: '1 rows selected',
            records: [{a: 'A'}]
          });
        this.expect(db.execute('select a from tbl_name\n' +
          'where 25 <= b order by b;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A'}, {a: 'C'}, {a: 'D'}, {a: 'F'}
            ]
          });
        this.expect(db.execute('select a from tbl_name\n' +
          'where (b = 40 or b = 50) or (c <> 1 and d) order by a;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'B'}, {a: 'D'}, {a: 'E'}, {a: 'F'}
            ]
          });
        this.expect(db.execute('select b from tbl_name\n' +
          'where true order by a;'))
          .toBeEq({
            msg: '6 rows selected',
            records: [
              {b: 25}, {b: 20}, {b: 35}, {b: 40}, {b: 0}, {b: 50}
            ]
          });
        this.expect(db.execute('select b from tbl_name\n' +
          'where 1=1 order by a;'))
          .toBeEq({
            msg: '6 rows selected',
            records: [
              {b: 25}, {b: 20}, {b: 35}, {b: 40}, {b: 0}, {b: 50}
            ]
          });
        this.expect(db.execute('select a from tbl_name\n' +
          'where b = 40 and b = 50;')).toBeEq({
            msg: '0 rows selected',
            records: []
          });
        this.expect(db.execute('select a from tbl_name where false;'))
          .toBeEq({
            msg: '0 rows selected',
            records: []
          });
        this.expect(db.execute('select a from tbl_name where 1<>1;'))
          .toBeEq({
            msg: '0 rows selected',
            records: []
          });
      })
      .end()
    .describe('group by')
      .it('should group records', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a, b, c, d);');
        db.execute('insert into tbl_name values(\'A\', 1, 2, true);');
        db.execute('insert into tbl_name values(\'A\', 2, 3, true);');
        db.execute('insert into tbl_name values(\'A\', 3, 4, false);');
        db.execute('insert into tbl_name values(\'A\', 4, 5, false);');
        db.execute('insert into tbl_name values(\'B\', 5, 6, true);');
        db.execute('insert into tbl_name values(\'B\', 6, 7, true);');
        db.execute('insert into tbl_name values(\'B\', 7, 8, false);');
        db.execute('insert into tbl_name values(\'C\', 8, 9, true);');
        db.execute('insert into tbl_name values(\'C\', 9, 0, false);');
        db.execute('insert into tbl_name values(\'D\', 0, 1, true);');
        this.expect(db.execute('select a from tbl_name group by a order by a;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [{a: 'A'}, {a: 'B'}, {a: 'C'}, {a: 'D'}]
          });
        this.expect(db.execute('select a, d from tbl_name group by a, d\n' +
          'order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true},
              {a: 'A', d: false},
              {a: 'B', d: true},
              {a: 'B', d: false},
              {a: 'C', d: true},
              {a: 'C', d: false},
              {a: 'D', d: true}
            ]
          });
        this.expect(db.execute('select a e, d f from tbl_name\n' +
          'group by a, d order by e, f desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {e: 'A', f: true},
              {e: 'A', f: false},
              {e: 'B', f: true},
              {e: 'B', f: false},
              {e: 'C', f: true},
              {e: 'C', f: false},
              {e: 'D', f: true}
            ]
          });
        this.expect(db.execute('select count(b) a from tbl_name;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 10}]
          });
        this.expect(db.execute('select a, count(b) b from tbl_name\n' +
          'group by a order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', b: 4},
              {a: 'B', b: 3},
              {a: 'C', b: 2},
              {a: 'D', b: 1}
            ]
          });
        this.expect(db.execute('select a, d, count(b+c) b from tbl_name\n' +
          'group by a, d order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true,  b: 2},
              {a: 'A', d: false, b: 2},
              {a: 'B', d: true,  b: 2},
              {a: 'B', d: false, b: 1},
              {a: 'C', d: true,  b: 1},
              {a: 'C', d: false, b: 1},
              {a: 'D', d: true,  b: 1}
            ]
          });
        this.expect(db.execute('select a, d, count(b+c) b from tbl_name\n' +
          'group by a, d having count(b+c) = 2 order by a, d desc;'))
          .toBeEq({
            msg: '3 rows selected',
            records: [
              {a: 'A', d: true,  b: 2},
              {a: 'A', d: false, b: 2},
              {a: 'B', d: true,  b: 2}
            ]
          });
        this.expect(db.execute('select sum(b) a from tbl_name;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 45}]
          });
        this.expect(db.execute('select a, sum(b) b from tbl_name\n' +
          'group by a order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', b: 10},
              {a: 'B', b: 18},
              {a: 'C', b: 17},
              {a: 'D', b: 0}
            ]
          });
        this.expect(db.execute('select a, sum(b) b from tbl_name\n' +
          'group by a having a = \'C\' or a = \'D\' order by a;')).toBeEq({
            msg: '2 rows selected',
            records: [
              {a: 'C', b: 17},
              {a: 'D', b: 0}
            ]
          });
        this.expect(db.execute('select a, d, sum(b+c) b from tbl_name\n' +
          'group by a, d order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true,  b: 8},
              {a: 'A', d: false, b: 16},
              {a: 'B', d: true,  b: 24},
              {a: 'B', d: false, b: 15},
              {a: 'C', d: true,  b: 17},
              {a: 'C', d: false, b: 9},
              {a: 'D', d: true,  b: 1}
            ]
          });
        this.expect(db.execute('select max(b) a from tbl_name;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 9}]
          });
        this.expect(db.execute('select a, max(b) b from tbl_name\n' +
          'group by a order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', b: 4},
              {a: 'B', b: 7},
              {a: 'C', b: 9},
              {a: 'D', b: 0}
            ]
          });
        this.expect(db.execute('select a, d, max(b+c) b from tbl_name\n' +
          'group by a, d order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true,  b: 5},
              {a: 'A', d: false, b: 9},
              {a: 'B', d: true,  b: 13},
              {a: 'B', d: false, b: 15},
              {a: 'C', d: true,  b: 17},
              {a: 'C', d: false, b: 9},
              {a: 'D', d: true,  b: 1}
            ]
          });
        this.expect(db.execute('select min(b) a from tbl_name;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 0}]
          });
        this.expect(db.execute('select a, min(b) b from tbl_name\n' +
          'group by a order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', b: 1},
              {a: 'B', b: 5},
              {a: 'C', b: 8},
              {a: 'D', b: 0}
            ]
          });
        this.expect(db.execute('select a, d, min(b+c) b from tbl_name\n' +
          'group by a, d order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true,  b: 3},
              {a: 'A', d: false, b: 7},
              {a: 'B', d: true,  b: 11},
              {a: 'B', d: false, b: 15},
              {a: 'C', d: true,  b: 17},
              {a: 'C', d: false, b: 9},
              {a: 'D', d: true,  b: 1}
            ]
          });
        this.expect(db.execute('select avg(b) a from tbl_name;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 4.5}]
          });
        this.expect(db.execute('select a, avg(b) b from tbl_name\n' +
          'group by a order by a;')).toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', b: 2.5},
              {a: 'B', b: 6},
              {a: 'C', b: 8.5},
              {a: 'D', b: 0}
            ]
          });
        this.expect(db.execute('select a, d, avg(b+c) b from tbl_name\n' +
          'group by a, d order by a, d desc;')).toBeEq({
            msg: '7 rows selected',
            records: [
              {a: 'A', d: true,  b: 4},
              {a: 'A', d: false, b: 8},
              {a: 'B', d: true,  b: 12},
              {a: 'B', d: false, b: 15},
              {a: 'C', d: true,  b: 17},
              {a: 'C', d: false, b: 9},
              {a: 'D', d: true,  b: 1}
            ]
          });
      })
      .end()
    .describe('having')
      .it('should filter group records', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a, b, c, d);');
        db.execute('insert into tbl_name values(\'A\', 1, 2, true);');
        db.execute('insert into tbl_name values(\'A\', 2, 3, true);');
        db.execute('insert into tbl_name values(\'A\', 3, 4, false);');
        db.execute('insert into tbl_name values(\'A\', 4, 5, false);');
        db.execute('insert into tbl_name values(\'B\', 5, 6, true);');
        db.execute('insert into tbl_name values(\'B\', 6, 7, true);');
        db.execute('insert into tbl_name values(\'B\', 7, 8, false);');
        db.execute('insert into tbl_name values(\'C\', 8, 9, true);');
        db.execute('insert into tbl_name values(\'C\', 9, 0, false);');
        db.execute('insert into tbl_name values(\'D\', 0, 1, true);');
        this.expect(db.execute('select a, count(b) b from tbl_name\n' +
          'group by a having a = \'A\' or a = \'B\' order by a;')).toBeEq({
            msg: '2 rows selected',
            records: [
              {a: 'A', b: 4},
              {a: 'B', b: 3}
            ]
          });
        this.expect(db.execute('select a, d, sum(b+c) b from tbl_name\n' +
          'group by a, d having sum(b+c) = 8;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 'A', d: true,  b: 8}]
          });
      })
      .end()
    .describe('order by')
      .it('should sort records', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a);');
        db.execute('insert into tbl_name values(4);');
        db.execute('insert into tbl_name values(2);');
        db.execute('insert into tbl_name values(3);');
        db.execute('insert into tbl_name values(1);');
        this.expect(db.execute('select a from tbl_name order by a;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [{a: 1}, {a: 2}, {a: 3}, {a: 4}]
          });
        this.expect(db.execute('select a from tbl_name order by a asc;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [{a: 1}, {a: 2}, {a: 3}, {a: 4}]
          });
        this.expect(db.execute('select a from tbl_name order by a desc;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [{a: 4}, {a: 3}, {a: 2}, {a: 1}]
          });
      })
      .end()
    .describe('limit')
      .it('should constrain the number of records', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name (a, b, c);');
        db.execute('insert into tbl_name values(1, \'a\', true);');
        db.execute('insert into tbl_name values(2, \'b\', false);');
        db.execute('insert into tbl_name values(3, \'c\', null);');
        this.expect(db.execute('select a from tbl_name limit 1;')).toBeEq({
            msg: '1 rows selected',
            records: [{a: 1}]
          });
        this.expect(db.execute('select a from tbl_name order by a\n' +
          'limit 2;')).toBeEq({
            msg: '2 rows selected',
            records: [{a: 1}, {a: 2}]
          });
        this.expect(db.execute('select a from tbl_name order by a\n' +
          'limit 3;')).toBeEq({
            msg: '3 rows selected',
            records: [{a: 1}, {a: 2}, {a:3}]
          });
        this.expect(db.execute('select a from tbl_name limit 0;')).toBeEq({
            msg: '0 rows selected',
            records: []
          });
        this.expect(db.execute('select a from tbl_name limit 4;')).toBeEq({
            msg: '3 rows selected',
            records: [{a: 1}, {a: 2}, {a:3}]
          });
      })
      .end()
    .describe('join')
      .it('should combine records from two or more tables', function() {
        db.execute('use db_name;');
        db.execute('create table tbl_name1 (a, b, c);');
        db.execute('create table tbl_name2 (a, b, d);');
        db.execute('insert into tbl_name1 values(\'A\', 1, 3);');
        db.execute('insert into tbl_name1 values(\'A\', 2, 4);');
        db.execute('insert into tbl_name1 values(\'B\', 3, 5);');
        db.execute('insert into tbl_name1 values(\'C\', 4, 6);');
        db.execute('insert into tbl_name2 values(\'A\', 1, 7);');
        db.execute('insert into tbl_name2 values(\'B\', 2, 8);');
        db.execute('insert into tbl_name2 values(\'B\', 3, 9);');
        db.execute('insert into tbl_name2 values(\'D\', 4, 0);');
        this.expect(db.execute('select tbl_name1.a, c, d\n' +
          'from tbl_name1 join tbl_name2\n' +
          'on tbl_name1.a = tbl_name2.a order by a;'))
          .toBeEq({
            msg: '4 rows selected',
            records: [
              {a: 'A', c: 3, d: 7},
              {a: 'A', c: 4, d: 7},
              {a: 'B', c: 5, d: 8},
              {a: 'B', c: 5, d: 9}
            ]
          });
        this.expect(db.execute('select tbl_name1.a, c, d\n' +
          'from tbl_name1 left join tbl_name2\n' +
          'on tbl_name1.a = tbl_name2.a order by a, c, d;'))
          .toBeEq({
            msg: '5 rows selected',
            records: [
              {a: 'A', c: 3, d: 7},
              {a: 'A', c: 4, d: 7},
              {a: 'B', c: 5, d: 8},
              {a: 'B', c: 5, d: 9},
              {a: 'C', c: 6, d: null}
            ]
          });
        this.expect(db.execute('select e.a, e.b, c, d\n' +
          'from tbl_name1 e, tbl_name2 f\n' +
          'on e.a = f.a and e.b = f.b order by a, b, c, d;'))
          .toBeEq({
            msg: '2 rows selected',
            records: [
              {a: 'A', b: 1, c: 3, d: 7},
              {a: 'B', b: 3, c: 5, d: 9}
            ]
          });
        db.execute('create table tbl_name3 (a, e);');
        db.execute('insert into tbl_name3 values(\'A\', 9);');
        db.execute('insert into tbl_name3 values(\'D\', 0);');
        this.expect(db.execute('select tbl_name1.a, c, d, e\n' +
          'from tbl_name1 join tbl_name2 join tbl_name3\n' +
          'on tbl_name1.a = tbl_name2.a and tbl_name1.a = tbl_name3.a\n' +
          'order by a;'))
          .toBeEq({
            msg: '2 rows selected',
            records: [
              {a: 'A', c: 3, d: 7, e: 9},
              {a: 'A', c: 4, d: 7, e: 9}
            ]
          });
      })
      .end()
    .describe('select into')
      .describe('into array')
        .it('should return an array of arrays', function() {
          db.execute('use db_name;');
          db.execute('create table tbl_name1 (col_name);');
          db.execute('insert into tbl_name1 values(0);');
          this.expect(db.execute('select col_name into array from tbl_name1;'))
            .toBeEq({
              msg: '2 rows selected',
              records: [['col_name'], [0]]
            });
          db.execute('insert into tbl_name1 values(\'A\');');
          db.execute('insert into tbl_name1 values(true);');
          this.expect(db.execute('select col_name into array from tbl_name1;'))
            .toBeEq({
              msg: '4 rows selected',
              records: [['col_name'], [0], ['A'], [true]]
            });
          db.execute('create table tbl_name2 (a, b, c, d);');
          db.execute('insert into tbl_name2 values(0,-0,99999999,-99999999);');
          db.execute('insert into tbl_name2 values(\'A\',\'B\',\'C\',\'D\');');
          db.execute('insert into tbl_name2 values(true,TRUE,false,FALSE);');
          db.execute('insert into tbl_name2 values(1=1,1<>1,null,NULL);');
          this.expect(db.execute('select a,b,c,d into array from tbl_name2;'))
            .toBeEq({
              msg: '5 rows selected',
              records: [
                ['a', 'b', 'c', 'd'],
                [0, -0, 99999999, -99999999],
                ['A', 'B', 'C', 'D'],
                [true, true, false, false],
                [true, false, null, null]
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
