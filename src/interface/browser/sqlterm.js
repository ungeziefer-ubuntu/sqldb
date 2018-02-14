const SQLTerm = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const isArray    = (o) => typeOf(o) === 'Array';
  const isObject   = (o) => typeOf(o) === 'Object';
  const isString   = (o) => typeOf(o) === 'String';

  const type = (format) => format !== 'csv' ? 'application/json' : 'text/csv';

  const toString = (o, level=0) => {
    if(isArray(o) || isObject(o)) {
      const [a1, a2] = [[], []],
            [l, r] = isArray(o) ? ['[', ']'] : ['{', '}'];
      let _level = level === 0 ? 1 : 3;
      if(isArray(o)) {
        for(let obj of o) {
          a2.push(toString(obj, _level));
          _level = _level === 1 ? 2 : _level;
        }
      }
      else {
        for(let p in o) {
          a2.push(`${p}: ${toString(o[p], _level)}`);
          _level = _level === 1 ? 2 : _level;
        }
      }
      a1.push((level === 2 ? '  ' : '') + l);
      a1.push(a2.join(level === 0 ? '\n' : ', '));
      a1.push(r);
      return a1.join(' ');
    }
    else if(isString(o)) {
      return `\'${o}\'`;
    }
    return o;
  };

  class SQLTerm {
    constructor(...args) {
        [this.term, this.fileloader, this.csvparser, this.richformat,
          this.RichUI, this.db] = args;
        const term = this.term;
        term.setPrompt('>');
        term.setPlaceholder('click here and type your query');
        this.buf = ''
    }

    run() {
      const [{db, term, fileloader, csvparser, richformat, RichUI}, session]
              = [this, {env: 'browser', dbname: null}],
            richui = RichUI(term, db, session);
      term.on('line', async (line) => {
        let buf = db.createTokenBuffer(line);
        if(buf.size() === 0) {
          this.buf = '';
          term.prompt();
          return;
        }
        let idx = 0, str;
        while(buf.hasNext()) {
          let token = buf.next();
          if(token.value === ';') {
            let res;
            try {
              str = this.buf + line.substr(idx, token.column-idx+1);
              idx += str.length;
              this.buf = '';
              res = db.execute(str, session);
              if(res.closeTerminal) {
                richui.removePanel();
                term.close();
                return;
              }
              if(res.clearTerminal) {
                term.clear();
                richui.clear();
                continue;
              }
              if(res.loadData) {
                const {stmt} = res, {format, delim, quote} = stmt;
                const text = await fileloader.loadFile(type(format));
                let records;
                if(format !== 'csv') {
                  try {
                    records = JSON.parse(text);
                  }
                  catch(e) {
                    throw new Error('SQLExecutionError: Invalid file format');
                  }
                }
                else {
                  records = csvparser.parse(text, delim, quote);
                }
                res = db.loadJSON(records, stmt, session);
              }
              if(res.storeData) {
                const {stmt:{selectBody:{intoObject}}, records} = res,
                      {filename, format, delim, quote} = intoObject;
                let data;
                if(format !== 'csv') {
                  data = `${JSON.stringify(records)}\n`;
                }
                else {
                  data = `${csvparser.toCSV(records, delim, quote)}\n`;
                }
                fileloader.downloadFile(data, filename, type(format));
                break;
              }
              const {msg, records} = res, len = records ? records.length : 0;
              term.print(msg);
              if(len) {
                term.appendTable(richformat.toTable(records), 10);
              }
            }
            catch(e) {
              const {message:msg} = e;
              term.print(msg);
              console.error(e);
              line = '';
              this.buf = '';
              break;
            }
          }
        }
        this.buf += (((str = line.substr(idx)) === '') ? '' : `${str}\n`);
        term.prompt();
      });
      term.prompt();
    }
  }

  return (...args) => new SQLTerm(...args);
})();
