const RichUI = (() => {
  'use strict';

  const ENTER = 13;

  const getString = (e) => e.innerText.replace(/\s/g, ' ').trim();

  const getValue = (v) => {
    const n = Number(v);
    if(!Number.isNaN(n)) return n;
    if(/^true$/i.test(v)) return true;
    if(/^false$/i.test(v)) return false;
    return `\'${v}\'`;
  };

  const E = (type, name, text, callback, context, param) => {
    const e = document.createElement(type);
    if(name) e.setAttribute('name', name);
    if(text) e.innerHTML = text.replace(/\s/g, '&nbsp');
    if(callback) {
      e.addEventListener('click', (e) => callback(context, param, e));
    }
    return e;
  };

  const S = (str) => (context) => write(context, `${str};`);

  const select = (panel, name) => {
    const {options} = panel;
    for(let o of options) {
      if(name === o.name) {
        panel.selected = o;
        return;
      }
    }
  };

  const write = (context, str) => {
    const {term} = context;
    term.pause();
    term.input.textContent = str;
    term.fn.line(str);
  };

  const getDatabases = (context, param) => {
    const {db, session, tree, tree:[shortcuts]} = context;
    select(shortcuts, param);
    tree.splice(1, tree.length-1);
    const records = db.execute('databases;', session).records;
    const options = [];
    for(let r of records) {
      options.push({
        name: r.dbname,
        callback: (context, param) => {
          write(context, `use ${param};`);
        }
      });
    }
    tree.push({
      label: 'database: ',
      type: 'button',
      selected: null,
      options
    });
    display(context, tree, 1);
  };

  const getTables = (context, param) => {
    const {term, db, session, tree, tree:[shortcuts]} = context;
    if(!db.execute('database;', session).records[0].dbname) {
      term.pause();
      term.fn.line('load data into table dummy;', session);
      return;
    }
    select(shortcuts, param);
    tree.splice(1, tree.length-1);
    const records = db.execute('tables;', session).records;
    const options = [];
    const _param = param;
    for(let r of records) {
      options.push({
        name: r.table_name,
        callback: param === 'columns' ?
          (context, param) => {
            write(context, `columns from ${param};`);
          } : param === 'select count' ?
          (context, param) => {
            write(context, `select count(0) from ${param};`);
          } : param === 'select all' ?
          (context, param) => {
            write(context, `select * from ${param};`);
          } : param === 'into file' ?
         (context, param) => {
           getFileName(context, _param, param);
         } : param === 'insert' ?
          (context, param) => {
            getItemsList(context, param);
          } :
          (context, param) => {
            getFormat(context, _param, param);
          }
      });
    }
    tree.push({
      label: 'table:    ',
      type: 'button',
      selected: null,
      options
    });
    display(context, tree, 1);
  };

  const getFormat = (context, param, ...params) => {
    const {db, session, tree, tree:[,table]} = context,
          [name, filename] = params;
    if(param === 'load data') {
      select(table, name);
    }
    const idx = param === 'load data' ? 2 : 3;
    tree.splice(idx, tree.length-idx);
    const a = ['json', 'csv'];
    const options = [];
    for(let _name of a) {
      options.push({
        name: _name,
        callback: param === 'load data' ?
          (context, param) => {
            write(context,
              `load data into table ${name} fields ${param};`);
          } :
          (context, param) => {
            write(context, `select * into file \'${filename}\'` +
              ` fields ${param} from ${name};`);
          }
      });
    }
    tree.push({
      label: 'format:   ',
      type: 'button',
      selected: null,
      options
    });
    display(context, tree, idx);
  };

  const getDatabaseName = (context, param) => {
    const {term, db, session, tree, tree:[shortcuts]} = context;
    select(shortcuts, param);
    tree.splice(1, tree.length-1);
    const columns = ['dbname'];
    tree.push({
      label:   'database: ',
      type:    'form',
      mutable: false,
      button:  'execute',
      columns,
      callback: param === 'create database' ?
        (context, param) => {
          const {children:[{children:[td]}]}= param;
          write(context, `create database ${getString(td)};`);
        } :
        (context, param) => {
          const {children:[{children:[td]}]}= param;
          write(context, `drop database ${getString(td)};`);
        }
    });
    display(context, tree, 1);
  };

  const getTableName = (context, param) => {
    const {term, db, session, tree, tree:[shortcuts]} = context;
    select(shortcuts, param);
    if(!db.execute('database;', session).records[0].dbname) {
      term.pause();
      term.fn.line('create table dummy(dummy);', session);
      return;
    }
    tree.splice(1, tree.length-1);
    const columns = ['table_name'];
    tree.push({
      label:   'table:    ',
      type:    'form',
      mutable: false,
      button:  param === 'create table' ? 'next' : 'execute',
      columns,
      callback: param === 'create table' ?
        (context, param) => {
          const {children:[{children:[td]}]}= param;
          getColumnNames(context, getString(param));
        } :
        (context, param) => {
          const {children:[{children:[td]}]}= param;
          write(context, `drop table ${getString(td)};`);
        }
    });
    display(context, tree, 1);
  };

  const getColumnNames = (context, param) => {
    const {term, db, session, tree, tree:[shortcuts]} = context, name = param;
    tree.splice(2, tree.length-2);
    const columns = ['column_name'];
    tree.push({
      label:   'columns:  ',
      type:    'form',
      mutable: true,
      button:  'execute',
      columns,
      callback: (context, param) => {
        const {children}= param, columnNames = [];
        for(let {children:[td]} of children) columnNames.push(getString(td));
        write(context, `create table ${name} (${columnNames.join(', ')});`);
      }
    });
    display(context, tree, 2);
  };

  const getItemsList = (context, param) => {
    const {term, db, session, tree, tree:[shortcuts]} = context, name = param;
    tree.splice(2, tree.length-2);
    const records = db.execute(`columns from ${param};`, session).records;
    const columns = [];
    for(let r of records) columns.push(r.column_name);
    tree.push({
      label:   'values:   ',
      type:    'form',
      mutable: true,
      button:  'execute',
      columns,
      callback: (context, param) => {
        const {children}= param, itemsLists = [];
        for(let {children:tr} of children) {
          let itemsList = [];
          for(let td of tr) itemsList.push(getValue(getString(td)));
          itemsLists.push(`(${itemsList.join(', ')})`);
        }
        write(context, `insert into ${name} values${itemsLists.join(', ')};`);
      }
    });
    display(context, tree, 2);
  };

  const getFileName = (context, param, ...params) => {
    const {term, db, session, tree, tree:[,table]} = context,
          [name] = params;
    select(table, name);
    if(!db.execute('database;', session).records[0].dbname) {
      term.pause();
      term.fn.line('create table dummy(dummy);', session);
      return;
    }
    tree.splice(2, tree.length-2);
    const columns = ['filename'];
    tree.push({
      label:   'file:     ',
      type:    'form',
      mutable: false,
      button:  'next',
      columns,
      callback: (context, param) => {
        const {children:[{children:[td]}]}= param;
        getFormat(context, param, name, getString(td));
      }
    });
    display(context, tree, 2);
  };

  const addRow = (context, param, e) => {
    const {children, children:[{children:{length:len}}]}= param,
          _len = children.length,
          _tr = E('tr');
    let target;
    for(let i=0; i<len; i++) {
      let td = document.createElement('td');
      td.setAttribute('contenteditable', 'true');
      td.classList.add('fadeIn');
      td.addEventListener('keypress', (e) => {
        if(e.keyCode === ENTER) td.blur();
      });
      _tr.appendChild(td);
      if(!target) target = td;
    }
    param.appendChild(_tr);
    if(_len === 1) {
      e.target.parentNode.appendChild(
        E('button', '-', '-', removeRow, context, param));
    }
    setTimeout(() => {
      if(target) target.focus();
    }, 50);
  };

  const removeRow = (context, param, e) => {
    const {children:{length:len}, lastChild} = param;
    param.removeChild(lastChild);
    if(len === 2) {
      const {target} = e;
      target.parentNode.removeChild(target);
    }
    const target = param.lastChild.lastChild;
    setTimeout(() => {
      if(target) target.focus();
    }, 50);
  };

  const createTree = () => {
    return [
      {
        label: 'shortcuts:',
        type:  'button',
        selected: null,
        options: [
          {name: 'database',         callback: S('database')},
          {name: 'databases',        callback: S('databases')},
          {name: 'use database',     callback: getDatabases},
          {name: 'create database',  callback: getDatabaseName},
          {name: 'drop database',    callback: getDatabaseName},
          {name: 'tables',           callback: S('tables')},
          {name: 'columns',          callback: getTables},
          {name: 'create table',     callback: getTableName},
          {name: 'drop table',       callback: getTableName},
          {name: 'select count',     callback: getTables},
          {name: 'select all',       callback: getTables},
          {name: 'into file',        callback: getTables},
          {name: 'insert',           callback: getTables},
          {name: 'load data',        callback: getTables},
          {name: 'clear',            callback: S('clear')}
        ]
      }
    ];
  };

  const display = (context, tree, level=0) => {
    const {term, panel:_panel} = context;
    let panel;
    if(level) {
      panel = _panel;
    }
    else {
      panel = context.panel = E('div', 'shortcuts-panel');
      const statementPanel = E('div', 'statement-panel');
      const {options, label} = tree[0];
      const _label = E('div', 'label', label);
      statementPanel.appendChild(_label);
      for(let {name, callback, param} of options) {
        statementPanel.appendChild(
          E('button', 'level0', name, callback, context, name));
      }
      panel.appendChild(statementPanel);
    }
    const {children} = panel;
    if(level) for(let i=children.length-1; level<=i; i--) {
      panel.removeChild(children[i]);
    }
    if(level) {
      const idx = level-1;
      const {type, selected, options} = tree[idx],
            _panel = children[idx];
      let tbody, target;
      if(type === 'button') for(let i=0; i<options.length; i++) {
        let o = options[i], e = _panel.children[i+1];
        if(o === selected) {
          if(e.classList.contains('unselected')) {
            e.classList.remove('unselected');
          }
        }
        else {
          if(!e.classList.contains('unselected')) {
            e.classList.add('unselected');
          }
        }
      }
      else {
        const {lastChild:{lastChild:{children:tbody}}} = _panel
        for(let {children:tr} of tbody) {
          for(let td of tr) td.setAttribute('contenteditable', 'false');
        }
      }
      const parameterPanel = E('div', 'parameter-panel');
      const {type:_type, options:_options, columns, callback, label, mutable,
        button} = tree[level];
      const _label = E('div', 'label', label);
      parameterPanel.appendChild(_label);
      if(_type === 'button') {
        for(let i=0; i<_options.length; i++) {
          let {name, callback, param} = _options[i];
          let e = E('button', `level${level}`, name, callback, context, name);
          parameterPanel.appendChild(e);
          if(!target) target = e;
        }
      }
      else {
        const table = E('table', 'form');
        const thead = E('tr');
        tbody = E('tbody');
        const tr    = E('tr');
        for(let column of columns) {
          let th = E('th', null, column);
          thead.appendChild(th);
          let td = document.createElement('td');
          td.setAttribute('contenteditable', 'true');
          td.addEventListener('keypress', (e) => {
            if(e.keyCode === ENTER) td.blur();
          });
          tr.appendChild(td);
          if(!target) target = td;
        }
        tbody.appendChild(tr);
        table.appendChild(thead);
        table.appendChild(tbody);
        parameterPanel.appendChild(table);
      }
      panel.appendChild(parameterPanel);
      if(_type === 'form') {
        if(mutable) {
          const _addRow = E('div', 'parameter-panel');
          _addRow.appendChild(E('div', 'label', ' '.repeat(10)));
          _addRow.appendChild(E('button', '+', '+', addRow, context, tbody));
          panel.appendChild(_addRow);
        }
        const execButton = E('div', 'parameter-panel');
        execButton.appendChild(E('div', 'label', ' '.repeat(10)));
        execButton.appendChild(
          E('button', button, button, callback, context, tbody));
        panel.appendChild(execButton);
      }
      setTimeout(() => {
        if(target) target.focus();
      }, 50);
      document.body.scrollTo(0, panel.lastChild.offsetTop);
    }
    if(!level) term.append(panel);
  };

  class RichUI {
    constructor(term, db, session) {
      [this.term, this.db, this.session] = [term, db, session];
      term.setPrePrompt(() =>  this.removePanel());
      term.setPostPrompt(() => this.createPanel());
    }

    createPanel() {
      const tree = this.tree = createTree();
      display(this, tree);
    }

    removePanel() {
      const {term, panel} = this;
      if(panel) term.container.removeChild(panel);
    }

    clear() {
      this.panel = null;
    }
  }

  return (...args) => new RichUI(...args);
})();
