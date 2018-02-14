const QueryCompiler = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);
  const isFunction = (o) => typeOf(o) === 'Function';

  const aggregationFunctions = ['count', 'sum', 'max', 'min', 'avg'];

  const copy = (o1, o2) => Object.assign(o1, o2);

  const fn = {};

  class QueryCompiler {
    constructor(FieldList) {
      this.FieldList = FieldList;
    }

    fatal(msg) {
      throw new Error(`FatalError: ${msg}`);
    }

    error(msg) {
      throw new Error(`SQLExecutionError: ${msg}`);
    }

    isConnected(db) {
      if(!db) fn.error('No database is selected');
    }

    hasTable(db, name) {
      return db.has(name);
    }

    compile_query(context, stmt) {
      const {db, fieldList:_fieldList} = context,
        {type, selectBody:{distinct, selectItems, intoObject, fromItem,
        whereCondition, groupByElements, havingCondition, orderByElements,
        rowCount:limit}} = stmt,
        fieldList = _fieldList ?
          _fieldList.copy() : context.fn.FieldList(db);

      context = copy({}, context);
      context.fieldList = fieldList;

      const fromItems = fn.prepareFromItems(context, fromItem);

      const where = whereCondition ?
        fn.compile_expr(context, whereCondition) : null;

      const grouping = groupByElements ?
        fn.prepareGroupByElements(context, groupByElements) : null;
      const groupByColumns = grouping ?
        fn.prepareGroupByColumns(grouping) : null;
      const g = grouping !== null;

      const having = havingCondition ?
        fn.compile_expr(context, havingCondition, true) : null;

      const items = fn.prepareSelectItems(context, selectItems, g);
      if(type === 'sub_query') _fieldList.addSubSelectItems(items);
      const [_grouping, _groupByColumns]
        = fieldList.hasDummyGroupingColumn() ?
          [[], []] : [grouping, groupByColumns];

      const distinctColumns = distinct ?
        fn.prepareDistinctColumns(items) : null;

      const order = orderByElements ?
        fn.prepareOrderByElements(context, orderByElements, g) : null;
      const orderByColumns = order ?
        fn.prepareOrderByColumns(order) : null;

      const _limit = limit !== void 0 ? Number(limit) : null;

      return (record) => fn.exec_query(db, type, fromItems, where, _grouping,
          _groupByColumns, having, items, distinctColumns, order,
          orderByColumns, _limit, intoObject, record);
    }

    exec_query(db, type, fromItems, where, grouping, groupByColumns, having,
      items, distinctColumns, order, orderByColumns, limit, intoObject, _r) {
      let query, alias, m = false;
      for(let fromItem of fromItems) {
        const {name, subSelect, join, leftJoin, on} = fromItem;
        let tmp = fromItem.subSelect ? fromItem.subSelect()
          : db.on(name);
        query = join || leftJoin ? (join ? query.join : query.leftJoin)
          .call(query, tmp, (left, right) =>
            !on || on(copy(copy({}, left), right)),
          (left)  => (m ? left : {[alias]: left}),
          (right) => ({[fromItem.alias]: right}))
          .chain(() => {m = m || !m;}) : tmp;
        if(!m) alias = fromItem.alias;
      }

      const _limit = order ? limit : null;
      limit = order ? null : limit;
      let count = 0;
      const collect = function(r) {
        if(grouping || distinctColumns) {
          if(count === limit) return this.EXIT;
          count++;
        }
        const o = {};
        for(let i=0; i<items.length; i++) {
          let item = items[i];
          o[item.name] = distinctColumns ? r[distinctColumns[i]] : item.expr(r);
        }
        r._mainquery = o;
        if(order) {
          for(let i=0; i<order.length; i++) o['_o'+i] = order[i].expr(r);
        }
        return o;
      };

      query = query.map(function(r) {
        if(count === limit) return this.EXIT;
        const _o = fromItems.length === 1 ? {[fromItems[0].alias]: r} : r,
              o = _r ? copy(_o, _r) : _o;
        if(where && !where(o)) return null;
        if(grouping) {
          for(let i=0; i<grouping.length; i++) o['_g'+i] = grouping[i].expr(o);
        }
        if(!grouping && !distinctColumns) count++;
        return (grouping || distinctColumns) ? o : collect.call(this, o);
      });

      query = grouping ? query.group({columns: groupByColumns})
        .map(function(r) {
          return !having || having(r) ? distinctColumns ? r
          : collect.call(this, r) : null
        }) : query;

      query = distinctColumns ? query.map((r) => {
        const o = {};
        for(let i=0; i<items.length; i++) {
          let item = items[i];
          o[item.name] = o['_d'+i] = item.expr(r);
        }
        return o;
      }).group({columns: distinctColumns}).map(function(r) {
        return collect.call(this, r);
      }) :query;

      query = order ? query.order.apply(query, orderByColumns).each((r) => {
        for(let i=0; i<orderByColumns.length; i++) delete r['_o'+i];
      }) : query;

      query = _limit !== null ? query.limit(_limit) : query;

      if(intoObject) {
        const {objectType, format} = intoObject;
        if(objectType === 'array' || format === 'csv') {
          let records = query.find(), _records = [], columns = [];
          for(let item of items) columns.push(item.name);
          _records.push(columns);
          for(let r of records) {
            let _r = [];
            for(let item of items) _r.push(r[item.name]);
            _records.push(_r);
          }
          query = {find: () => _records};
        }
      }

      return query;
    }

    compile_expr(context, e, grouping) {
      const expr = fn.expr(context, e, grouping);
      return isFunction(expr) ? (r) => (expr(r)) : () => (expr);
    }

    expr(...args) {
      const [context, e, grouping] = args;
      switch(e.type) {
        case 'number':            return Number(e.stringValue);
        case 'string':            return e.stringValue;
        case 'boolean':           return e.stringValue === 'true';
        case 'null':              return null;
        case 'column':            return fn.expr_column(...args);
        case 'signed_expression': return fn.expr_signed(...args);
        case 'function':          return fn.expr_function(...args);
        case 'case':              return fn.expr_case(...args);
        case 'exists_expression': return fn.expr_exists(...args);
        case 'binary_expression': return fn.expr_binary(...args);
        case 'parenthesis':
          return fn.expr(context, e.expression, grouping);
        default:
      }
    }

    expr_column(context, e, grouping) {
      const {db, fieldList} = context,
            {table, name:columnName} = e,
            {tableName, columnId} = (grouping ?
              fieldList.getGroupingColumn : fieldList.getColumn)
                .call(fieldList, columnName, table ? table.name : null);
      const _columnName = grouping ? columnId : columnName;
      return grouping ? (r) => (r ? r[_columnName] : null)
        : (r) => (r && r[tableName] ? r[tableName][_columnName] : null);
    }

    expr_signed(context, e, grouping) {
      const expr = fn.expr(context, e.expression, grouping);
      let v;
      return isFunction(expr) ?
        (r) => {
          const v = e.sign === '+' ? +(expr(r)) : -(expr(r));
          return Number.isNaN(v) ? null : v
        }
        : Number.isNaN(v = e.sign === '-' ? -expr : +expr) ? null : v;
    }

    expr_function(...args) {
      const [context, e, grouping] = args;
      switch(e.name) {
        case 'count':  return fn.fn_count(...args);
        case 'sum':    return fn.fn_sum(...args);
        case 'max':    return fn.fn_max(...args);
        case 'min':    return fn.fn_min(...args);
        case 'avg':    return fn.fn_avg(...args);
        case 'substr': return fn.fn_substr(...args);
        default: fn.error(`Function ${e.name} does not exist`);
      }
    }

    fn_count(context, e, grouping) {
      if(!grouping) {
        fn.error(`Aggregated query without GROUP BY`);
      }
      if(e.parameters.length !== 1 && e.paramaters.length !== 0) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      fn.compile_expr(context, e.parameters[0]);
      return (r) => r._group.length;
    }

    fn_sum(context, e, grouping) {
      if(!grouping) {
        fn.error(`Aggregated query without GROUP BY`);
      }
      if(e.parameters.length !== 1) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      const f = fn.compile_expr(context, e.parameters[0]);
      return (r) => {
        let sum = 0;
        for(let o of r._group) sum += f(o);
        return sum;
      };
    }

    fn_max(context, e, grouping) {
      if(!grouping) {
        fn.error(`Aggregated query without GROUP BY`);
      }
      if(e.parameters.length !== 1) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      const f = fn.compile_expr(context, e.parameters[0]);
      return (r) => {
        let max, n
        for(let o of r._group) {
          n = f(o)
          max = max === void 0 || max < n ? n : max;
        }
        return max;
      };
    }

    fn_min(context, e, grouping) {
      if(!grouping) {
        fn.error(`Aggregated query without GROUP BY`);
      }
      if(e.parameters.length !== 1) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      const f = fn.compile_expr(context, e.parameters[0]);
      return (r) => {
        let min, n
        for(let o of r._group) {
          n = f(o)
          min = min === void 0 || min > n ? n : min;
        }
        return min;
      };
    }

    fn_avg(context, e, grouping) {
      if(!grouping) {
        fn.error(`Aggregated query without GROUP BY clause`);
      }
      if(e.parameters.length !== 1) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      const f = fn.compile_expr(context, e.parameters[0]);
      return (r) => {
        let sum = 0;
        for(let o of r._group) sum += f(o);
        return sum / r._group.length;
      };
    }

    fn_substr(context, e, grouping) {
      const {parameters:param} = e;
      if(param.length !== 2 && param.length !== 3) {
        fn.error(`Wrong number of parameters for ${e.name}`);
      }
      const str = fn.compile_expr(context, param[0], grouping),
            idx = fn.compile_expr(context, param[1], grouping),
            len = param.length === 3 ?
              fn.compile_expr(context, param[2], grouping) : void 0;
      return (r) => (str(r)+'').substr(idx(r)-1, len ? len(r) : len);
    }

    expr_case(context, e, grouping) {
      const se = e.switchExpression ?
              fn.compile_expr(context, e.switchExpression, grouping)
              : null,
            whenClauses = e.whenClauses,
            wc = [],
            ee = fn.compile_expr(context, e.elseExpression, grouping);
      for(let w of whenClauses) {
        wc.push({
          when: fn.compile_expr(context, w.whenExpression, grouping),
          then: fn.compile_expr(context, w.thenExpression, grouping)
        });
      }
      return se ? (r) => {
        for(let w of wc) if(se(r) === w.when(r)) return w.then(r);
        return ee(r);
      }
      : (r) => {
        for(let w of wc) if(w.when(r)) return w.then(r);
        return ee(r);
      };
    }

    expr_exists(context, e, grouping) {
      const {not, subSelect:{selectBody}} = e;
      let query;
      if(!not) selectBody.rowCount = 1;
      context = copy({}, context);
      context.fieldList = context.fieldList.copy();
      query = fn.compile_query(context, e.subSelect);
      return not ?
        (r) => query(r).count() === 0 :
        (r) => query(r).count() === 1;
    }

    expr_binary(context, e, grouping) {
      const [left, right]
        = [fn.expr(context, e.leftExpression, grouping),
           fn.expr(context, e.rightExpression, grouping)];
      return !isFunction(left) && !isFunction(right) ?
        fn.compute_expr_binary(left, e.operator, right)
        : (r) => (fn.compute_expr_binary(
          isFunction(left) ? left(r) : left,
          e.operator,
          isFunction(right) ? right(r) : right
        ));
    }

    compute_expr_binary(left, operator, right) {
      const r = (() => {
        switch(operator) {
          case '+':   return left + right;
          case '-':   return left - right;
          case '*':   return left * right;
          case '/':   return left / right;
          case '%':   return left % right;
          case 'and': return left && right;
          case 'or':  return left || right;
          case '<':   return left < right;
          case '<=':  return left <= right;
          case '>':   return left > right;
          case '>=':  return left >= right;
          case '=':   return left === right;
          case '<>':
          case '!=':  return left !== right;
          default:
        }
      })();
      return Number.isNaN(r) ? null : r;
    }

    prepareFromItems(context, fromItem) {
      const {db, fieldList} = context, fromItems = [];
      let _join;
      while(true) {
        let {table, subSelect, alias, join} = fromItem,
            name = table ? table.name : null;
        if(table) {
          if(!fn.hasTable(db, name)) {
            fn.error(`Table \'${name}\' does not exist`);
          }
          fieldList.addAllTableColumns(name, alias);
        }
        const _context = copy({}, context),
              _fieldList = subSelect ? context.fn.FieldList(db) : null;
        _context.fieldList = _fieldList;
        fromItems.push({
          name,
          subSelect: subSelect ?
            fn.compile_query(_context, subSelect) : null,
          alias:    alias || name || '_t' + fromItems.length,
          join:     _join && _join.type === 'join',
          leftJoin: _join && _join.type === 'left_join',
          on:       _join && _join.onExpression ?
            fn.compile_expr(context, _join.onExpression) : null
        });
        if(subSelect) {
          const subSelectItems = _fieldList.getAllTableColumns('_subquery');
          for(let subSelectItem of subSelectItems){
            subSelectItem.tableName = alias || '_t' + (fromItems.length-1);
          }
          _fieldList.copy(fieldList);
        }
        if(!join) break;
        _join = join;
        fromItem = _join.fromItem;
      }
      return fromItems;
    }

    prepareGroupByElements(context, groupByElements) {
      const {fieldList} = context, grouping = [];
      for(let groupByElement of groupByElements) {
        let {expression, alias} = groupByElement;
        grouping.push({
          expr: fn.compile_expr(context, expression),
          tableName: !alias && expression.type === 'column' && expression.table
            && expression.table.name || null,
          columnName: alias || expression.type === 'column' && expression.name
            || null
        });
      }
      fieldList.addGroupingColumns(grouping);
      return grouping;
    }

    prepareGroupByColumns(grouping) {
      const groupByColumns = [];
      for(let i=0; i<grouping.length; i++) groupByColumns.push('_g'+i);
      return groupByColumns;
    }

    prepareSelectItems(context, selectItems, grouping) {
      const {fieldList} = context, items = [];
      if(!grouping) {
        for(let selectItem of selectItems) {
          if(selectItem.type === 'select_expression_item'
          && fn.hasAggregateFunction(selectItem.expression)) {
            fieldList.addDummyGroupingColumn();
            grouping = true;
            break;
          }
        }
      }
      const names = [];
      for(let selectItem of selectItems) {
        let {type, table, expression, alias} = selectItem;
        switch(type) {
          case 'all_columns':
          case 'all_table_columns':
            const columns = grouping ?
              type === 'all_columns' ? fieldList.getAllGroupingColumns()
              : fieldList.getAllGroupingTableColumns(table.name) :
              type === 'all_columns' ? fieldList.getAllColumns()
              : fieldList.getAllTableColumns(table.name);
            for(let column of columns) {
              let {columnName:name} = column;
              if(names.includes(name)) {
                fn.error(`Duplicate column name ${name}`);
              }
              names.push(name);
              items.push({
                name,
                expr: fn.expr_column(context, {
                  table: {name: column.tableName},
                  name: column.columnName
                }, grouping)
              });
            }
            break;
          case 'select_expression_item':
            const name = alias || expression.toString();
            if(names.includes(name)){
              fn.error(`Duplicate column name \'${name}\'`);
            }
            names.push(name);
            items.push({
              name,
              expr: fn.compile_expr(context, expression, grouping)
            });
            break;
          default:
        }
      }
      fieldList.addSelectItems(items);
      return items;
    }

    prepareDistinctColumns(items) {
      const distinctColumns = [];
      for(let i=0; i<items.length; i++) distinctColumns.push('_d'+i);
      return distinctColumns;
    }

    prepareOrderByElements(context, orderByElements, grouping) {
      const order = [];
      for(let orderByElement of orderByElements) {
        order.push({
          expr: fn.compile_expr
            (context, orderByElement.expression, grouping),
          dir: orderByElement.direction !== 'desc' ? 1 : -1
        });
      }
      return order;
    }

    prepareOrderByColumns(order) {
      const orderByColumns = [];
      for(let i=0; i<order.length; i++) {
        orderByColumns.push({['_o'+i]: order[i].dir});
      }
      return orderByColumns;
    }

    prepareChanges(context, changes) {
      const {fieldList} = context, _changes = [];
      for(let change of changes) {
        const {column:{table, name:columnName}, expression} = change,
              tableName = table ? table.name : null;
        const column = fieldList.getColumn(columnName, tableName);
        _changes.push({
          name: columnName,
          expr: fn.compile_expr(context, expression)
        });
      }
      return _changes;
    }

    hasAggregateFunction(e) {
      const f = (e) => fn.hasAggregateFunction(e);
      switch(e.type) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'null':
        case 'column': return false;
        case 'signed_expression': return f(e.expression);
        case 'function':    return aggregationFunctions.includes(e.name);
        case 'parenthesis': return f(e.expression);
        case 'case':
          if(e.switchExpression && f(e.switchExpression)) return true;
          const {whenClauses} = e;
          for(let w of whenClauses) {
              if(f(w.whenExpression) || f(w.thenExpression)) return true;
          }
          return f(e.elseExpression);
        case 'binary_expression':
          return f(e.leftExpression) || f(e.rightExpression);
        default:
      }
    }
  }

  for(let p of Object.getOwnPropertyNames(QueryCompiler.prototype)) {
    fn[p] = QueryCompiler.prototype[p];
  }

  return (...args) => new QueryCompiler(...args);
})();

if(!this.window) module.exports = QueryCompiler;
