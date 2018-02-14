# sqldb
SQL database library written in pure javascript
 (this project is for learning purpose)

## Demo
https://ungeziefer-ubuntu.github.io/sqldb

## SQL Syntax Supported
### database
show the current database
```
database;
```
### databases
show all databases
```
databases;
```
### use database
select an existing database or create a new one when it does not exist
```
use <db_name>;
```
### create database
create a new database
```
create database <db_name>;
```
### drop database
remove a database
```
drop database <db_name>;
```
### tables
show all tables in the current database
```
tables;
```
### columns
show information about columns in a table
```
columns from <db_name>;
or:
describe <db_name>;
```
### create table
create a new table in a database
```
create table <tbl_name> (<col_name>, ...);
```
### drop table
remove tables from a database
```
drop table <tbl_name>, ...;
```
### select
select records from a database
```
select [distinct] * | <expression> [[as] <alias>], ...
[into json|array|file <filename>
  [fields [json|csv]
    [terminated by <delim>]
    [[optionally] enclosed by <quote>]]]
from <tbl_name>, ...
[where <expression>]
[group by <expression>, ...]
[having <expression>]
[order by <expression>, ...]
[limit <number>];
```
### select distinct
extract distinct values
### where
filter records
### group by
group records
### having
filter group records
### order by
sort records
### limit
constrain the number of records
### join
combine records from two or more tables
### select into
format result-set (the default format is JSON) or write it to a file
### insert
insert new records into a table
```
insert into <tbl_name>
[(<col_name>, ...)]
values(<expression>, ...), ...;
```
### delete
remove records from a table
```
delete from <tbl_name>
where <expression>;
```
### update
modify existing records in a table
```
update <tbl_name>
set <col_name> = <expression>, ...
where <expression>;
```
### create as select
create a new table from an existing table
```
create table <tbl_name>
as <select statement>;
```
### insert select
copy records from a table into another table
```
insert into <tbl_name>
[(<col_name>, ...)]
<select statement>;
```
### load data
load records from a file (the default format is JSON)
```
load data
into table <tbl_name>
  [fields [json|csv]
    [terminated by <delim>]
      [[optionally] enclosed by <quote>]];
```
