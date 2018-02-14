const RichFormat = (() => {
  'use strict';

  const E = (n) => document.createElement(n);

  const typeOf   = (o) => Object.prototype.toString.call(o).slice(8, -1);
  const isObject = (o) => typeOf(o) === 'Object';
  const isString = (o) => typeOf(o) === 'String';

  const toString = (v, q) =>
    v === null ? 'null'
      : (isString(v) ? q ? `'${v}'` : v : v.toString()).replace(/ /g, '&nbsp');

  class RichFormat {
    toTable(records) {
      const [table, thead, r] = [E('table'), E('tr'), records[0]];
      table.appendChild(thead);
      const th = E('th');
      th.innerHTML = 'no';
      thead.appendChild(th);
      if(isObject(r)) {
        const columns = [];
        for(let p in r) {
          let th = E('th');
          th.innerHTML = toString(p, false);
          thead.appendChild(th);
          columns.push(p);
        }
        let n = 1;
        for(let r of records) {
          let tr = E('tr');
          let td = E('td');
          td.innerHTML = n++;
          tr.appendChild(td);
          for(let p of columns) {
            let td = E('td');
            td.innerHTML = toString(r[p], true)
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
      }
      else {
        for(let p of r) {
          let th = E('th');
          th.innerHTML = toString(p, false);
          thead.appendChild(th);
        }
        for(let i=1; i<records.length; i++) {
          let r = records[i];
          let tr = E('tr');
          let td = E('td');
          td.innerHTML = i;
          tr.appendChild(td);
          for(let v of r) {
            let td = E('td');
            td.innerHTML = toString(v, true);
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
      }
      return table;
    }
  }

  return () => new RichFormat;
})();
