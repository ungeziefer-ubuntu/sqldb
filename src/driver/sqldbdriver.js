const SQLDBDriver = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const isObject  = (o) => typeOf(o) === 'Object';
  const isArray   = (o) => typeOf(o) === 'Array';
  const isNumber  = (o) => typeOf(o) === 'Number';
  const isString  = (o) => typeOf(o) === 'String';
  const isBoolean = (o) => typeOf(o) === 'Boolean';
  const isNull    = (o) => typeOf(o) === 'Null';

  const copy = (o1, o2) => Object.assign(o1, o2);

  const validateValue = (v) =>
    isNumber(v) || isString(v) || isBoolean(v) || isNull(v);

  const initDatabase = (context, name) => {
    const db = context.Database(name);
    db.on('tables').insert([
      {table_name: 'tables'},
      {table_name: 'columns'}
    ]);
    db.on('columns').insert([
      {table_name: 'tables',  column_name: 'table_name',  column_id: 1},
      {table_name: 'columns', column_name: 'table_name',  column_id: 1},
      {table_name: 'columns', column_name: 'column_name', column_id: 2},
      {table_name: 'columns', column_name: 'column_id',   column_id: 3}
    ]);
    return db;
  };

  const dataDictionaries = [
    'tables',
    'columns'
  ];

  const exec_database = (context) => ({
    msg: `1 rows selected`,
    records: [{dbname: context.db ? context.db.name() : null}]
  });

  const exec_databases = (context) => {
    const [{dbs}, a] = [context, []];
    for(let dbname in dbs) a.push({dbname});
    return {
      msg: `${a.length} rows selected`,
      records: a
    };
  }

  const exec_use_database = (context, stmt) => {
    const [{dbs, session}, {name}] = [context, stmt];
    dbs[name] || (dbs[name] = initDatabase(context, name));
    session.dbname = name;
    return {msg: 'Database changed'};
  };

  const exec_create_database = (context, stmt) => {
    const [{dbs, fn}, {name}] = [context, stmt];
    if(dbs[name]) fn.error(`Database \'${name}\' already exists`);
    dbs[name] = initDatabase(context, name);
    return {msg: `Database \'${name}\' created`};
  };

  const exec_drop_database = (context, stmt) => {
    const [{dbs, db, fn, session}, {name}] = [context, stmt];
    if(!dbs[name]) fn.error(`Database \'${name}\' does not exist`);
    if(db === dbs[name]) session.dbname = null;
    delete dbs[name];
    return {msg: `Database \'${name}\' removed`};
  };

  const exec_tables = (context, stmt) => {
    const {db, fn} = context;
    fn.isConnected(db);
    const r = db.on('tables').find();
    return {
      msg: `${r.length} rows selected`,
      records: r
    };
  };

  const exec_columns = (context, stmt) => {
    const [{db, fn}, {name}] = [context, stmt.table];
    fn.isConnected(db);
    if(!fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' does not exist`);
    }
    const r = db.on('columns').filter({table_name: name})
      .order({column_id: 1}).select(['column_name', 'column_id']);
    return {
      msg: `${r.length} rows selected`,
      records: r
    };
  };

  const exec_create_table = (context, stmt) => {
    const [{db, fn},
      {table:{name}, columnDefinitions, subSelect}] = [context, stmt];
    fn.isConnected(db);
    if(fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' already exists`);
    }
    const columns = [];
    let records;
    if(columnDefinitions) {
      for(let i=0; i<columnDefinitions.length; i++) {
        let ColumnDefinition = columnDefinitions[i];
        columns.push({
          table_name:  name,
          column_name: ColumnDefinition.name,
          column_id:   i+1
        });
      }
    }
    else {
      context = copy({}, context);
      const fieldList = context.fieldList = fn.FieldList(db),
            query = fn.compile_query(context, subSelect),
            selectItems = fieldList.getAllTableColumns('_subquery');
      for(let i=0; i<selectItems.length; i++) {
        let {columnName} = selectItems[i];
        if(!/^[a-z]\w*$/i.test(columnName)) {
          fn.error(`Invalid column name \'${columnName}\'`);
        }
        columns.push({
          table_name:  name,
          column_name: columnName,
          column_id:   i+1
        });
        records = query().find();
      }
    }
    db.on('tables').insert({table_name: name});
    db.on('columns').insert(columns);
    db.createCollection(name);
    let count;
    if(subSelect) {
      count = db.on(name).insert(records).count();
    }
    return {
      msg: `Table \'${name}\' created` + (subSelect ? `(records: ${count})`: '')
    };
  };

  const exec_drop_table = (context, stmt) => {
    const [{db, fn}, tables] = [context, stmt.tables];
    fn.isConnected(db);
    const names = [];
    for(let table of tables) {
      let {name} = table;
      if(!fn.hasTable(db, name)) {
        fn.error(`Table \'${name}\' does not exist`);
      }
      if(dataDictionaries.includes(name)) {
        fn.error(`Can not remove data dictionary table \'${name}\'`);
      }
      names.push(name);
    }
    const a = [];
    for(let name of names) {
      db.on('tables').filter({table_name: name}).remove();
      db.on('columns').filter({table_name: name}).remove();
      db.dropCollection(name);
      a.push(`\'${name}\'`);
    }
    return {msg: `Table ${a.join(', ')} removed`};
  };

  const exec_main_query = (context, stmt) => {
    const [{db, fn}, {selectBody:{intoObject}}] = [context, stmt],
          objectType = intoObject ? intoObject.objectType : null;
    fn.isConnected(db);
    context = copy({}, context);
    const r = fn.compile_query(context, stmt)().find();
    return objectType === 'file' ? {
      storeData: true,
      stmt: stmt,
      records: r
    } : {
      msg: `${r.length} rows selected`,
      records: r
    };
  };

  const exec_insert = (context, stmt) => {
    const [{db, fn}, {table:{name}, columns, itemsLists, subSelect}]
      = [context, stmt];
    fn.isConnected(db);
    if(!fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' does not exist`);
    }
    if(dataDictionaries.includes(name)) {
      fn.error(`Can not modify data dictionary table \'${name}\'`);
    }
    const fieldList = fn.FieldList(db);
    fieldList.addAllTableColumns(name);
    let _columns;
    if(columns) {
      _columns = [];
      for(let {name, table} of columns) {
        _columns.push(fieldList.getColumn(name, table ? table.name : null));
      }
      const a = fieldList.getAllColumns();
      for(let o of a) {
        if(!_columns.some((column) => column.columnName === o.columnName)) {
          _columns.push(o);
        }
      }
    }
    else {
      _columns = fieldList.getAllColumns();
      if(itemsLists) {
        for(let {expressionList:e} of itemsLists) {
          if(e.length !== _columns.length) {
            fn.error(`Column count does not match value count`);
          }
        }
      }
    }
    const records = [];
    context = copy({}, context);
    if(itemsLists) {
      context.fieldList = fieldList;
      for(let {expressionList:e} of itemsLists) {
        let o = {}
        for(let i=0; i<_columns.length; i++) {
          o[_columns[i].columnName] = e[i] ?
            fn.compile_expr(context, e[i])() : null;
        }
        records.push(o);
      }
    }
    else {
      context.fieldList = fn.FieldList(db);
      const q = fn.compile_query(context, subSelect);
      const selectItems = context.fieldList.getAllTableColumns('_subquery');
      if(columns && columns.length !== selectItems.length) {
        fn.error(`Column count does not match value count`);
      }
      const r = q().find();
      for(let record of r) {
        let o = {};
        for(let i=0; i<_columns.length; i++) {
          o[_columns[i].columnName] = selectItems[i] ?
            record[selectItems[i].columnName] : null;
        }
        records.push(o);
      }
    }
    const count = db.on(name).insert(records).count();
    return {msg: `${count} rows created`};
  };

  const exec_remove = (context, stmt) => {
    const [{db, fn}, {table:{name}, whereCondition}] = [context, stmt];
    fn.isConnected(db);
    if(!fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' does not exist`);
    }
    if(dataDictionaries.includes(name)) {
      fn.error(`Can not modify data dictionary table \'${name}\'`);
    }
    context = copy({}, context);
    const fieldList = context.fieldList = fn.FieldList(db);
    fieldList.addAllTableColumns(name);
    const where = whereCondition ?
      fn.compile_expr(context, whereCondition) : null;
    const count = where ?
      db.on(name).remove((r) => where({[name]: r})) : db.on(name).remove();
    return {msg: `${count} rows removed`};
  };

  const exec_update = (context, stmt) => {
    const [{db, fn}, {table:{name}, changes, whereCondition}] = [context, stmt];
    fn.isConnected(db);
    if(!fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' does not exist`);
    }
    if(dataDictionaries.includes(name)) {
      fn.error(`Can not modify data dictionary table \'${name}\'`);
    }
    context = copy({}, context);
    const fieldList = context.fieldList = fn.FieldList(db);
    fieldList.addAllTableColumns(name);
    const where = whereCondition ?
      fn.compile_expr(context, whereCondition) : null;
    const _changes = fn.prepareChanges(context, changes);
    const count = (where ?
      db.on(name).filter((r) => where({[name]: r})) : db.on(name))
        .each((r) => {
          for(let change of _changes) r[change.name] = change.expr({[name]:r});
        }).count();
    return {msg: `${count} rows updated`};
  };

  const exec_exit = (context, stmt) => {
    const [{db, fn, session}, {database}] = [context, stmt];
    if(database) {
      fn.isConnected(db);
      session.dbname = null;
      return {msg: `exit database \'${db.name()}\'`};
    }
    return {closeTerminal: true};
  };

  const exec_clear = (context) => {
    return {clearTerminal: true};
  };

  const exec_load_data = (context, stmt) => {
    const [{db, fn}, {table:{name}}] = [context, stmt];
    fn.isConnected(db);
    if(!fn.hasTable(db, name)) {
      fn.error(`Table \'${name}\' does not exist`);
    }
    if(dataDictionaries.includes(name)) {
      fn.error(`Can not modify data dictionary table \'${name}\'`);
    }
    return {
      loadData: true,
      stmt: stmt
    };
  };

  class SQLDBDriver {
    constructor(Database, QueryCompiler, FieldList) {
      [this.Database, this.dbs, this.fn]
        = [Database, {}, QueryCompiler(FieldList)];
    }

    execute(stmt, session) {
      const {Database, dbs, fn} = this, {dbname, env} = session;
      const context = {
        Database,
        dbs,
        fn,
        db:  dbname ? dbs[dbname] : null,
        env: env,
        session
      };
      switch(stmt.type) {
        case 'database':        return exec_database(context);
        case 'databases':       return exec_databases(context);
        case 'use_database':    return exec_use_database(context, stmt);
        case 'create_database': return exec_create_database(context, stmt);
        case 'drop_database':   return exec_drop_database(context, stmt);
        case 'tables':          return exec_tables(context, stmt);
        case 'columns':         return exec_columns(context, stmt);
        case 'create_table':    return exec_create_table(context, stmt);
        case 'drop_table':      return exec_drop_table(context, stmt);
        case 'main_query':      return exec_main_query(context, stmt);
        case 'insert':          return exec_insert(context, stmt);
        case 'remove':          return exec_remove(context, stmt);
        case 'update':          return exec_update(context, stmt);
        case 'exit':            return exec_exit(context, stmt);
        case 'clear':           return exec_clear(context);
        case 'load_data':       return exec_load_data(context, stmt);
        default:
      }
    }

    loadJSON(data, stmt, session) {
      const [{dbs, fn}, {table:{name}}] = [this, stmt],
            db = dbs[session.dbname];
      fn.isConnected(db);
      if(!fn.hasTable(db, name)) {
        fn.error(`Table \'${name}\' does not exist`);
      }
      if(dataDictionaries.includes(name)) {
        fn.error(`Can not modify data dictionary table \'${name}\'`);
      }
      const fieldList = fn.FieldList(db);
      fieldList.addAllTableColumns(name);
      const columns = fieldList.getAllColumns();
      data = isArray(data) ? data : [data];
      const records = [];
      for(let o of data) {
        let r = {};
        if(isObject(o)) {
          for(let {columnName:p} of columns) {
            let v = o[p];
            r[p] = validateValue(v) ? v : null;
          }
        }
        else if(isArray(o)) {
          for(let i=0; i<columns.length; i++) {
            let v = o[i];
            r[columns[i].columnName] = validateValue(v) ? v : null;
          }
        }
        records.push(r);
      }
      const count = db.on(name).insert(records).count();
      return {msg: `${count} rows created`};
    }
  }
  return (...args) => new SQLDBDriver(...args);
})();

if(!this.window) module.exports = SQLDBDriver;
