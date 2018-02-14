const SQLParser = (() => {
  'use strict';

  const a = [
    'Identifier',
    'Database',
    'Databases',
    'UseDatabase',
    'CreateDatabase',
    'DropDatabase',
    'Tables',
    'Table',
    'Columns',
    'ColumnDefinition',
    'CreateTable',
    'DropTable',
    'AllColumns',
    'AllTableColumns',
    'SelectExpressionItem',
    'IntoObject',
    'FromItem',
    'Join',
    'LeftJoin',
    'GroupByElement',
    'OrderByElement',
    'SelectBody',
    'SubSelect',
    'Select',
    'ItemsList',
    'Insert',
    'Delete',
    'Change',
    'Update',
    'NumberValue',
    'StringValue',
    'BooleanValue',
    'NullValue',
    'Column',
    'SignedExpression',
    'Function',
    'Parenthesis',
    'WhenClause',
    'CaseExpression',
    'ExistsExpression',
    'UnaryExpression',
    'ArithmeticOperator',
    'Addition',
    'Subtraction',
    'Multiplication',
    'Division',
    'Remainder',
    'ConditionalOperator',
    'And',
    'Or',
    'RelatinalOperator',
    'LessThan',
    'LessThanOrEqual',
    'GreaterThan',
    'GreaterThanOrEqual',
    'Equal',
    'NotEqual',
    'Operator',
    'BinaryExpression',
    'Expression',
    'Exit',
    'Clear',
    'Fields',
    'LoadData'
  ];

  const src1 = [];
  for(let p of a) src1.push(`const ${p} = submodules.${p} = Parser(\'${p}\');`);

  const src2 = () => {
    const isDuplicateColumnName = (items, buf, res) => {
      if(!res) return null;
      const columns = (items.columnDefinitions || items.columns).slice(0, -1);
      for(let column of columns) if(column.name === res.name) return null;
      return res;
    };

    const isDuplicateTableName = (items, buf, res) => {
      if(!res) return null;
      const tables = items.tableNames.slice(0, -1);
      for(let table of tables) if(table.name === res.name) return null;
      return res;
    };

    Identifier
    .from('identifier').in(/^[a-z]\w*$/i).error(false)
    .where((items, buf) => {
      return !ReservedWords.includes(items.identifier.toLowerCase());
    })
    .select((items, buf) => items.identifier.toLowerCase());

    Database
      .from('database').in(/^database$/i).error(false)
      .select((items, buf) => ({type: 'database'}));

    Databases
      .from('databases').in(/^databases$/i).error(false)
      .select((items, buf) => ({type: 'databases'}));

    UseDatabase
      .from('use').in(/^use$/i).error(false)
      .from('name').in(Identifier)
      .select((items, buf) => ({
        type: 'use_database',
        name: items.name
      }));

    CreateDatabase
      .from('create').in(/^create$/i).error(false)
      .from('database').in(/^database$/i).error(false)
      .from('name').in(Identifier)
      .select((items, buf) => ({
        type: 'create_database',
        name: items.name
      }));

    DropDatabase
      .from('drop').in(/^drop$/i).error(false)
      .from('database').in(/^database$/i).error(false)
      .from('name').in(Identifier)
      .select((items, buf) => ({
        type: 'drop_database',
        name: items.name
      }));

    Table
      .from('name').in(Identifier).error(false)
      .select((items, buf) => ({
        type: 'table',
        name: items.name
      }));

    Tables
      .from('tables').in(/^tables$/i).error(false)
      .select((items, buf) => ({type: 'tables'}));

    Columns
      .from('columns').in(/^columns$/i).optional()
      .from('from').in(/^from$/i).premise('columns')
      .from('describe').in(/^describe$/).for('columns').error(false)
      .from('table').in(Table)
      .select((items, buf) => ({
        type: 'columns',
        table: items.table
      }));

    ColumnDefinition
      .from('name').in(Identifier).error(false)
      .select((items, buf) => ({
        type: 'column_definition',
        name: items.name
      }));

    CreateTable
      .from('create').in(/^create$/i).error(false)
      .from('table').in(/^table$/i).error(false)
      .from('tableName').in(Table)
      .from('(').in('(').optional()
      .from('columnDefinitions').in(ColumnDefinition)
        .many(1).delim(',').filter(isDuplicateColumnName).premise('(')
      .from(')').in(')').premise('(')
      .from('as').in(/^as$/).for('columnDefinitions')
      .from('subSelect').in(SubSelect).premise('as')
      .select((items, buf) => ({
        type:  'create_table',
        table: items.tableName,
        columnDefinitions: items.columnDefinitions,
        subSelect: items.subSelect
      }));

    DropTable
      .from('drop').in(/^drop$/i).error(false)
      .from('table').in(/^table$/i)
      .from('tableNames').in(Table)
        .many(1).delim(',').filter(isDuplicateTableName)
      .select((items, buf) => ({
        type:   'drop_table',
        tables: items.tableNames
      }));

    AllColumns
      .from('*').in('*').error(false)
      .select((items, buf) => ({type: 'all_columns'}));

    AllTableColumns
      .from('table').in(Table).error(false)
      .from('.').in('.').error(false)
      .from('*').in('*').error(false)
      .select((items, buf) => ({
        type:  'all_table_columns',
        table: items.table
      }));

    SelectExpressionItem
      .from('expression').in(Expression).error(false)
      .from('as').in(/^as$/i).optional()
      .from('alias').in(Identifier).premise('as')
      .from('alias').in(Identifier).optional().for('as')
      .select((items, buf) => ({
        type:       'select_expression_item',
        expression: items.expression,
        alias:      items.alias
      }));

    IntoObject
      .from('objectType').in(/^json$/i).or(/^array$/i).or(/^file$/i)
        .filter((items, buf, res) => /^file$/.test(items.objectType) &&
          items.super.super.super.super.env !== 'browser' ? null : res)
      .from('filename').in(StringValue)
        .filter((items, buf, res) => res ? res.stringValue : res)
          .on((items, buf) => /^file$/.test(items.objectType))
      .from('fields').in(Fields).premise('filename')
      .select((items, buf) => {
        const stmt = {
          type:       'into_object',
          objectType: items.objectType.toLowerCase(),
          filename:   items.filename
        };
        if(items.fields) {
          const {fields:{format, delim, quote}} = items;
          [stmt.format, stmt.delim, stmt.quote]
            = [format ? format.toLowerCase() : null, delim, quote];
        }
        return stmt;
      });

    FromItem
      .from('table').in(Table).optional().error(false)
      .from('(').in('(').for('table')
      .from('subSelect').in(SubSelect).for('table')
      .from(')').in(')').for('table')
      .from('as').in(/^as$/i).optional()
      .from('alias').in(Identifier).premise('as')
      .from('alias').in(Identifier).optional().for('as')
      .from('join').in(Join).or(LeftJoin).optional()
      .select((items, buf) => ({
        type:      'from_item',
        table:     items.table,
        subSelect: items.subSelect,
        alias:     items.alias,
        join:      items.join
      }));

    Join
      .from('join').in(/^join$/i).optional()
      .from('join').in(',').for('join').error(false)
      .from('fromItem').in(FromItem)
      .from('on').in(/^on$/i).optional()
      .from('onExpression').in(Expression).premise('on')
      .select((items, buf) => ({
        type:         'join',
        fromItem:     items.fromItem,
        onExpression: items.onExpression
      }));

    LeftJoin
      .from('left').in(/^left$/i).error(false)
      .from('join').in(/^join$/i)
      .from('fromItem').in(FromItem)
      .from('on').in(/^on$/i).optional()
      .from('onExpression').in(Expression).premise('on')
      .select((items, buf) => ({
        type:         'left_join',
        fromItem:     items.fromItem,
        onExpression: items.onExpression
      }));

    GroupByElement
      .from('expression').in(Expression).error(false)
      .from('as').in(/^as$/i).optional()
      .from('alias').in(Identifier).premise('as')
      .from('alias').in(Identifier).optional().for('as')
      .select((items, buf) => ({
        type:       'group_by_element',
        expression: items.expression,
        alias:      items.alias
      }));

    OrderByElement
      .from('expression').in(Expression).error(false)
      .from('direction').in(/^asc$/i).or(/^desc$/i).optional()
      .select((items, buf) => ({
        type:       'order_by_element',
        expression: items.expression,
        direction:  items.direction
      }));

    SelectBody
      .from('select').in(/^select$/i).error(false)
      .from('distinct').in(/^distinct$/i).optional()
      .from('selectItems')
        .in(AllColumns).or(AllTableColumns).or(SelectExpressionItem)
          .many(1).delim(',')
      .from('into').in(/^into$/i).optional().filter((items, buf, res) =>
        items.super.mainQuery ? res : null)
      .from('intoObject').in(IntoObject).premise('into')
      .from('from').in(/^from$/i)
      .from('fromItem').in(FromItem)
      .from('where').in(/^where$/i).optional()
      .from('whereCondition').in(Expression).premise('where')
      .from('group').in(/^group$/i).optional()
      .from('by').in(/^by$/i).premise('group')
      .from('groupByElements').in(GroupByElement)
        .many(1).delim(',').premise('group')
      .from('having').in(/^having$/i).optional().premise('group')
      .from('havingCondition').in(Expression).premise('having')
      .from('order').in(/^order$/i).optional()
      .from('by').in(/^by$/i).premise('order')
      .from('orderByElements').in(OrderByElement)
        .many(1).delim(',').premise('order')
      .from('limit').in(/^limit$/i).optional()
      .from('rowCount').in(/^\d+$/).premise('limit')
      .select((items, buf) => ({
        type:            'select_body',
        distinct:        items.distinct !== void 0,
        selectItems:     items.selectItems,
        intoObject:      items.intoObject,
        fromItem:        items.fromItem,
        whereCondition:  items.whereCondition,
        groupByElements: items.groupByElements,
        havingCondition: items.havingCondition,
        orderByElements: items.orderByElements,
        rowCount:        items.rowCount
      }));

    SubSelect
    .from('selectBody').in(SelectBody).error(false)
    .select((items, buf) => ({
      type: 'sub_query',
      selectBody: items.selectBody
    }));

    Select
    .from('mainQuery').assigning(true)
    .from('selectBody').in(SelectBody).error(false)
    .select((items, buf) => ({
      type: 'main_query',
      selectBody: items.selectBody
    }));

    ItemsList
      .from('(').in('(').error(false)
      .from('expressionList').in(Expression).many(1).delim(',').error(false)
      .from(')').in(')')
      .select((items, buf) =>({
        type: 'items_list',
        expressionList: items.expressionList
      }));

    Insert
      .from('insert').in(/^insert$/i).error(false)
      .from('into').in(/^into$/i)
      .from('table').in(Table)
      .from('(').in('(').optional()
      .from('columns').in(Column).many(1).delim(',')
        .filter(isDuplicateColumnName).premise('(')
      .from(')').in(')').premise('(')
      .from('values').in(/^values$/i).optional()
      .from('itemsLists').in(ItemsList)
        .many(1).delim(',').filter((items, buf, res) => !items['columns']
          || items['columns'].length === res.expressionList.length ? res : null)
        .premise('values')
      .from('subSelect').in(SubSelect).for('values')
      .select((items, buf) => ({
        type:       'insert',
        table:      items.table,
        columns:    items.columns,
        itemsLists: items.itemsLists,
        subSelect:  items.subSelect
      }));

    Delete
      .from('delete').in(/^delete$/i).error(false)
      .from('from').in(/^from$/i)
      .from('table').in(Table)
      .from('where').in(/^where$/i).optional()
      .from('whereCondition').in(Expression).premise('where')
      .select((items, buf) => ({
        type:  'remove',
        table: items.table,
        whereCondition: items.whereCondition
      }));

    Change
      .from('column').in(Column).error(false)
      .from('=').in('=')
      .from('expression').in(Expression)
      .select((items, buf) => ({
        type:       'change',
        column:     items.column,
        expression: items.expression
      }));

    Update
      .from('update').in(/^update$/i).error(false)
      .from('table').in(Table)
      .from('set').in(/^set$/i)
      .from('changes').in(Change)
        .many(1).delim(',').filter((items, buf, res) => {
          if(!res) return null;
          const changes = items.changes.slice(0, -1);
          for(let change of changes) {
            if(change.column.name === res.column.name) return null;
          }
          return res;
        })
      .from('where').in(/^where$/i).optional()
      .from('whereCondition').in(Expression).premise('where')
      .select((items, buf) => ({
        type:           'update',
        table:          items.table,
        changes:        items.changes,
        whereCondition: items.whereCondition
      }));

    NumberValue
      .from('stringValue').in(/^\d+(\.\d*)?$/).or(/^\.\d+$/).error(false)
      .select((items, buf) => ({
        type: 'number',
        stringValue: items.stringValue
      }));

    StringValue
      .from('stringValue').in((items, buf) => {
        if(!buf.hasNext()) return null;
        const token = buf.next();
        return token.isQuoted && !token.isInvalid ? token.value.slice(1, -1)
          : null;
      }).error(false)
      .select((items, buf) => ({
        type: 'string',
        stringValue: items.stringValue
      }));

    BooleanValue
      .from('stringValue').in(/^true$/i).or(/^false$/i).error(false)
      .select((items, buf) => ({
        type: 'boolean',
        stringValue: items.stringValue.toLowerCase()
      }));

    NullValue
    .from('stringValue').in(/^null$/i).error(false)
    .select((items, buf) => ({
      type: 'null',
      stringValue: items.stringValue.toLowerCase()
    }));

    Column
      .from('column').in(
        Parser('Column')
          .from('table').in(Table).error(false)
          .from('.').in('.').error(false)
          .from('name').in(Identifier)
          .select((items, buf) => ({
            type:  'column',
            table: items.table,
            name:  items.name
          }))
      ).or(
        Parser('Column')
          .from('name').in(Identifier).error(false)
          .select((items, buf) => ({
            type: 'column',
            name: items.name
          }))
      ).error(false)
      .select('column');

    SignedExpression
      .from('sign').in('+').or('-').error(false)
      .from('expression').in(UnaryExpression)
      .select((items, buf) => ({
        type: 'signed_expression',
        sign: items.sign,
        expression: items.expression
      }));

    Function
      .from('name').in(Identifier).error(false)
      .from('(').in('(').error(false)
      .from('parameters').in(Expression).many(0).delim(',')
      .from(')').in(')')
      .select((items, buf) => ({
        type: 'function',
        name: items.name,
        parameters: items.parameters
      }));

    Parenthesis
      .from('(').in('(').error(false)
      .from('expression').in(Expression).error(false)
      .from(')').in(')')
      .select((items, buf) => ({
        type: 'parenthesis',
        expression: items.expression
      }));

    WhenClause
      .from('when').in(/^when$/i).error(false)
      .from('whenExpression').in(Expression)
      .from('then').in(/^then$/i)
      .from('thenExpression').in(Expression)
      .select((items, buf) => ({
        type: 'when',
        whenExpression: items.whenExpression,
        thenExpression: items.thenExpression
      }));

    CaseExpression
      .from('case').in(/^case$/i).error(false)
      .from('switchExpression').in(Expression).optional()
      .from('whenClauses').in(WhenClause).many(1)
      .from('else').in(/^else$/i)
      .from('elseExpression').in(Expression)
      .from('end').in(/^end$/i)
      .select((items, buf) => ({
        type: 'case',
        switchExpression: items.switchExpression,
        whenClauses:      items.whenClauses,
        elseExpression:   items.elseExpression
      }));

    ExistsExpression
      .from('not').in(/^not$/i).optional()
      .from('exists').in(/^exists$/i).error(false)
      .from('(').in('(')
      .from('subSelect').in(SubSelect)
      .from(')').in(')')
      .select((items, buf) => ({
        type: 'exists_expression',
        not:  items.not !== void 0,
        subSelect: items.subSelect
      }));

    UnaryExpression
      .from('expression')
        .in(NumberValue)
        .or(StringValue)
        .or(BooleanValue)
        .or(NullValue)
        .or(Function)
        .or(Column)
        .or(SignedExpression)
        .or(Parenthesis)
        .or(CaseExpression)
        .or(ExistsExpression).error(false)
        .select((items, buf) => Object.assign(items.expression, {
            toString() {
              const {expression:e} = items;
              switch(e.type) {
                case 'number':  return e.stringValue;
                case 'string':  return `\'${e.stringValue}\'`;
                case 'boolean': return e.stringValue;
                case 'null':    return e.stringValue;
                case 'column':  return e.name;
                case 'signed_expression':
                  return `${e.sign}${e.expression.toString()}`;
                case 'function':
                  const [{parameters}, param] = [e, []];
                  for(let p of parameters) param.push(p.toString());
                  return `${e.name}(${param.join(',')})`;
                case 'parenthesis': return `(${e.expression.toString()})`;
                case 'case':
                  const se = e.switchExpression ?
                          `${e.switchExpression.toString()} ` : null,
                        whenClauses = e.whenClauses,
                        wc = [],
                        ee = e.elseExpression.toString();
                  for(let w of whenClauses) {
                    wc.push(`when ${w.whenExpression.toString()}` +
                      ` then ${w.thenExpression.toString()}`);
                  }
                  return `case ${se || ''}${wc.join(' ')} else ${ee} end`
                default: '[SubQuery]'
              }
            }
        }));

    const generateOperator = (parser, operator, precedence) =>
      parser
        .from('operator').in(operator).error(false)
        .select((items, buf) => ({
          operator: items.operator.toLowerCase(),
          precedence
        }));

    ArithmeticOperator
      .from('operator')
        .in(Addition).or(Subtraction)
          .or(Multiplication).or(Division).or(Remainder).error(false)
      .select('operator');

    generateOperator(Addition,       '+', 4);
    generateOperator(Subtraction,    '-', 4);
    generateOperator(Multiplication, '*', 5);
    generateOperator(Division,       '/', 5);
    generateOperator(Remainder,      '%', 5);

    ConditionalOperator
      .from('operator')
        .in(And).or(Or).error(false)
      .select('operator');

    generateOperator(And, /^and$/i, 1);
    generateOperator(Or,  /^or$/i,  0);

    RelatinalOperator
      .from('operator')
        .in(LessThan).or(LessThanOrEqual).or(GreaterThan).or(GreaterThanOrEqual)
          .or(Equal).or(NotEqual).error(false)
      .select('operator');

    generateOperator(LessThan,           '<',  3);
    generateOperator(LessThanOrEqual,    '<=', 3);
    generateOperator(GreaterThan,        '>',  3);
    generateOperator(GreaterThanOrEqual, '>=', 3);
    generateOperator(Equal,              '=',  2);
    generateOperator(NotEqual, /^(<>|\!\=)$/,  2);

    Operator
      .from('operator')
        .in(ArithmeticOperator).or(ConditionalOperator).or(RelatinalOperator)
          .error(false)
      .select('operator');

    BinaryExpression
      .from('binary').in((items, buf, debugging) => {
        let tmp, operator;
        const root = tmp = {type: 'binary_expression'};
        if((root.leftExpression = UnaryExpression.parse
          (buf, items, debugging)) === null
        || (operator = Operator.parse(buf, items, debugging)) === null) {
          return 'not binary';
        }
        root.operator = operator.operator;
        root.precedence = operator.precedence;

        const toString = function() {
          const {leftExpression:left, operator:o, rightExpression:right} = this;
          return `${left.toString()}${o}${right.toString()}`;
        }
        root.toString = toString;

        let m;
        while(true) {
          if((tmp.rightExpression = UnaryExpression.parse
            (buf, items, debugging)) === null) {
            return null;
          }
          m = buf.mark();
          if((operator = Operator.parse(buf)) === null) {
            break;
          }
          let context = root;
          while(true) {
            if(context.precedence >= operator.precedence) {
              context.leftExpression = Object.assign({}, context);
              context.operator = operator.operator;
              context.precedence = operator.precedence;
              tmp = context;
              break;
            }
            else {
              tmp = context.rightExpression;
              if(tmp.type === 'binary_expression') {
                context = tmp;
                continue;
              }
              tmp = context.rightExpression = {
                type: 'binary_expression',
                leftExpression: tmp,
                operator: operator.operator,
                precedence: operator.precedence,
                toString: toString
              }
              break;
            }
          }
        }
        buf.reset(m);
        return root;
      })
      .where((items, buf) => items.binary !== 'not binary')
      .select('binary');

    Expression
      .from('expression').in(BinaryExpression).or(UnaryExpression).error(false)
      .select('expression');

    Exit
      .from('exit').in(/^exit$/i).or(/^quit$/i).error(false)
      .from('database').in(/^database$/i).optional()
      .select((items, buf) => ({
        type: 'exit',
        database: items.database !== void 0
      }));

    Clear
      .from('clear').in(/^clear$/i).error(false)
      .select((items, buf) => ({type: 'clear'}));

    Fields
    .from('fields').in(/^fields$/i).optional()
    .from('format').in(/^json$/i).or(/^csv$/i).optional().premise('fields')
    .from('terminated').in(/^terminated$/i).optional()
      .on((items, buf) => /^csv$/.test(items.format))
    .from('by').in(/^by$/i).premise('terminated')
    .from('delim').in(StringValue)
      .filter((items, buf, res) => res ? res.stringValue : null)
        .premise('terminated')
    .from('optionally').in(/^optionally$/i).optional()
      .on((items, buf) => /^csv$/.test(items.format))
    .from('enclosed').in(/^enclosed$/i).premise('optionally')
    .from('enclosed').in(/^enclosed$/i).optional().for('optionally')
    .from('by').in(/^by$/i).premise('enclosed')
    .from('quote').in(StringValue)
      .filter((items, buf, res) => res ? res.stringValue : null)
        .premise('enclosed')
    .select();

    LoadData
      .from('load').in(/^load$/i).filter((items, buf, res) =>
        items.super.super.env === 'browser' ? res : null).error(false)
      .from('data').in(/^data$/i)
      .from('into').in(/^into$/i)
      .from('table').in(/^table$/i)
      .from('tableName').in(Table)
      .from('fields').in(Fields).error(false)
      .select((items, buf) => ({
        type:   'load_data',
        table:  items.tableName,
        format: items.fields.format ? items.fields.format.toLowerCase() : null,
        delim:  items.fields.delim,
        quote:  items.fields.quote
      }));

    const parser = Parser('SQLParser')
      .from('statement')
        .in(Database)
        .or(Databases)
        .or(UseDatabase)
        .or(CreateDatabase)
        .or(DropDatabase)
        .or(Tables)
        .or(Columns)
        .or(CreateTable)
        .or(DropTable)
        .or(Select)
        .or(Insert)
        .or(Delete)
        .or(Update)
        .or(Exit)
        .or(Clear)
        .or(LoadData)
      .from(';').in(';')
      .select('statement');

    parser.submodules = submodules;

    return parser;
  };

  return eval(`(Parser, ReservedWords) => {` +
    `const submodules = {};` +
    `${src1.join('')}` +
    `${src2.toString().slice(12, -1)}` +
    `};`)
})();

if(!this.window) module.exports = SQLParser;
