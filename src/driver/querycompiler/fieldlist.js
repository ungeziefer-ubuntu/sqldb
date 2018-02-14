const FieldList = (() => {
  'use strict';

  const error = (msg) => {
    throw new Error(`SQLExecutionError: ${msg}`);
  }

  const addSelectItems = (fieldList, items, tableName) => {
    for(let i=0; i<items.length; i++)
      fieldList.push({
        tableName: tableName,
        columnName: items[i].name,
        columnId: i
      });
  };

  const getColumn = (fieldList, grouping, columnName, tableName) => {
    const columns = [];
    for(let column of fieldList)
      if((column.tableName === '_mainquery'
      || grouping === (column.grouping === true)) && !column.dummy
      && column.columnName === columnName
      && (!tableName || column.tableName === tableName)) {
        columns.push(column);
      }
    if(columns.length === 0) {
      error(`Column ${tableName ? `\'${tableName}\'` + '.': ''}` +
        `\'${columnName}\' does not exist in field list`);
    }
    if(columns.length > 1) {
      for(let column of columns) {
        if(column.tableName === '_mainquery') return column;
      }
      error(`Ambiguous column name \'${columnName}\'`);
    }
    return columns[0];
  };

  const getColumns = (fieldList, grouping, tableName) => {
    const columns = [];
    for(let column of fieldList) {
      if((column.tableName === '_mainquery'
        || grouping === (column.grouping === true)) && !column.dummy
        && (!tableName || column.tableName === tableName)) {
          columns.push(column);
      }
    }
    columns.sort((a, b) => {
      if(a.tableName < b.tableName)      return -1;
      else if(a.tableName > b.tableName) return 1;
      else if(a.columnId < b.columnId)   return -1;
      else if(a.columnId > b.columnId)   return 1;
      return 0;
    });
    if(tableName && columns.length === 0)
      error(`Unknown table \'${tableName}\'`);
    return columns;
  };

  class FieldList {
    constructor(db) {
      [this.db, this.fieldList] = [db, []];
    }

    addAllTableColumns(name, alias) {
      const {db, fieldList} = this;
      const columns = db.on('columns').filter({table_name: name})
        .order({column_id: 1}).find();
      for(let column of columns) {
        fieldList.push({
          tableName: alias || name,
          columnName: column.column_name,
          columnId: column.column_id-1
        });
      }
      return this;
    }

    addSelectItems(items) {
      addSelectItems(this.fieldList, items, '_mainquery');
      return this;
    }

    addSubSelectItems(items) {
      addSelectItems(this.fieldList, items, '_subquery');
      return this;
    }

    addGroupingColumns(grouping) {
      const {fieldList} = this;
      for(let i=0; i<grouping.length; i++) {
        const {tableName, columnName} = grouping[i];
        fieldList.push({
          tableName: tableName || '_grouping',
          columnName,
          columnId: '_g'+i,
          grouping: true
        });
      }
      return this;
    }

    addDummyGroupingColumn() {
      this.fieldList.push({
        grouping: true,
        dummy: true
      });
      return this;
    }

    hasDummyGroupingColumn() {
      return this.fieldList.some((column) => column.dummy);
    }

    getColumn(columnName, tableName) {
      return getColumn(this.fieldList, false, columnName, tableName);
    }

    getGroupingColumn(columnName, tableName) {
      return getColumn(this.fieldList, true, columnName, tableName);
    }

    getAllColumns() {
      return getColumns(this.fieldList, false);
    }

    getAllGroupingColumns() {
      return getColumns(this.fieldList, true);
    }

    getAllTableColumns(name) {
      return getColumns(this.fieldList, false, name);
    }

    getAllGroupingTableColumns(name) {
      return getColumns(this.fieldList, true, name);
    }

    grouping() {
      return this.fieldList.some((column) => column.grouping);
    }

    copy(fieldList) {
      fieldList = fieldList || new this.constructor(this.db);
      const grouping = this.grouping(),
            columns = grouping ?
              this.getAllGroupingColumns() : this.getAllColumns(),
            _columns = []
      for(let column of columns) {
        let _column = Object.assign({}, column);
        if(grouping) delete _column.grouping;
        _columns.push(_column);
      }
      Array.prototype.push.apply(fieldList.fieldList, _columns);
      return fieldList;
    }
  }

  return (db) => new FieldList(db);
})();

if(!this.window) module.exports = FieldList;
