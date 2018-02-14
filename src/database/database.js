const Database = (() => {
  'use strict';

  const EXIT = {};

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const isObject   = (o) => typeOf(o) === 'Object';
  const isFunction = (o) => typeOf(o) === 'Function';

  const filter = (records, args) => {
    const a = [];
    if(args.length === 0) return records.slice();
    loop:
    for(let i=0; i<records.length; i++) {
      let o = records[i];
      for(let arg of args) {
        let r = isObject(arg) ? lookup(o, arg)
          : isFunction(arg) ? arg.call({EXIT}, o, i, records) : null;
        if(r === EXIT) break loop;
        if(r) {
          a.push(o);
          break;
        }
      }
    }
    return a;
  };

  const lookup = (a, b) => {
    for(var p in b) if(a[p] !== b[p]) return false;
    return true;
  };

  const removeCommit = (root) => {
    const {records} = root;
    for(let i=records.length-1; i>=0; i--) {
      let r = records[i];
      if(r._removed) records.splice(i, 1);
    }
  };

  const each = (records, fn, mapping) => {
    let a;
    if(mapping) a = [];
    for(let i=0; i<records.length; i++) {
      const o = fn.call({EXIT}, records[i], i, records);
      if(o === EXIT) break;
      if(mapping && isObject(o)) a.push(o);
    }
    return mapping ? a : records.slice();
  };

  const order = (records, args) => {
    return records.slice().sort((a, b) => {
      let r = 0;
      for(let arg of args) {
        const {column:p, dir} = arg;
        if(a[p] < b[p])      r = -1;
        else if(a[p] > b[p]) r = 1;
        else continue;
        r = dir === 1 ? r : dir === -1 ? -r : 0;
        break;
      }
      return r;
    });
  };

  const group = (records, arg={}, grouping) => {
    const [{columns=[], aggregate}, a] = [arg, []];
    for(let r of records) {
      let dup = false;
      for(let o of a) {
        dup = true;
        for(let p of columns)
          if(r[p] !== o[p]) {
            dup = false;
            break;
          }
        if(dup) {
          if(grouping) o._group.push(r);
          if(aggregate) aggregate(r, o);
        }
      }
      if(!dup) {
        let tmp = {};
        a.push(tmp);
        if(grouping) tmp._group = [r];
        for(let p of columns) tmp[p] = r[p];
      }
    }
    return a;
  };

  const join = (r1, args, leftJoin) => {
    const [{records:r2}, condition, leftFilter, rightFilter] = args,
          [a, tmp] = [[], []];
    let m = false;
    for(let o1 of r1) {
      let join;
      o1 = leftFilter ? leftFilter(o1) : o1;
      if(leftJoin) join = false;
      for(let o2 of (m ? tmp : r2)) {
        if(!m) {
          o2 = rightFilter ? rightFilter(o2) : o2;
          tmp.push(o2);
        }
        if(!condition || condition(o1, o2)) {
          a.push(Object.assign(Object.assign({}, o1), o2));
          join = join || !join;
        }
      }
      m = m || !m;
      if(leftJoin && !join) {
        a.push(Object.assign({}, o1));
      }
    }
    return a;
  };

  class Database {
    constructor(dbname) {
      [this.dbname, this.collections] = [dbname, {}];
    }

    name() {
      return this.dbname;
    }

    rename(dbname) {
      this.dbname = dbname;
      return this;
    }

    createCollection(name) {
      return new Collection(name, this.collections[name] = [], this);
    }

    dropCollection(...args) {
      for(let name of args) if(this.has(name)) delete this.collections[name];
    }

    on(name) {
      return this.has(name) ? new Collection(name, this.collections[name], this)
        : this.createCollection(name);
    }

    has(name) {
      return this.collections[name] !== void 0;
    }
  }

  class Collection {
    constructor(...args) {
      [this._name, this.records, this.database, this.root] = [...args, this];
    }

    name() {
      return this._name;
    }

    rename(name) {
      const {database:{collections}} = this;
      delete collections[this._name];
      collections[(this._name = name)] = this.records;
      return this;
    }

    insert(records) {
      records = isObject(records) ? [records] : records;
      const a = [];
      for(let r of records) if(isObject(r)) a.push(r);
      Array.prototype.push.apply(this.records, a);
      return new Query(this.root, a);
    }

    find(...args) {
      return filter(this.records, args);
    }

    filter(...args) {
      return new Query(this.root, filter(this.records, args));
    }

    has() {
      return this.count() !== 0;
    }

    select(columns) {
      const [{records}, a] = [this, []];
      for(let r of records) {
        let o = {};
        for(let p of columns) o[p] = r[p];
        a.push(o);
      }
      return a;
    }

    update(changes) {
      if(isObject(changes)) {
        const {records} = this;
        for(let r of records) for(let p in changes) r[p] = changes[p];
      }
      return new Query(this.root, this.records.slice());
    }

    remove(...args) {
      const records = filter(this.records, args), count = records.length;
      for(let r of records) r._removed = true;
      removeCommit(this.root);
      return count;
    }

    count(...args) {
      return filter(this.records, args).length;
    }

    limit(num) {
      return new Query(this.root, this.records.slice(0, num));
    }

    map(fn) {
      return new Query(this.root, each(this.records, fn, true));
    }

    each(fn) {
      return new Query(this.root, each(this.records, fn, false));
    }

    order(...args) {
      const a = [];
      for(let arg of args){
        let column;
        if(column = Object.keys(arg)[0]) a.push({column, dir: arg[column]});
      }
      return new Query(this.root, order(this.records, a));
    }

    group(arg) {
      return new Query(this.root, group(this.records, arg, true));
    }

    distinct(columns) {
      return new Query(this.root, group(this.records, {columns}, false));
    }

    join(...args) {
      return new Query(this.root, join(this.records, args, false));
    }

    leftJoin(...args) {
      return new Query(this.root, join(this.records, args, true));
    }

    chain(fn) {
      fn();
      return this;
    }
  }

  class Query {
    constructor(...args) {
      [this.root, this.records] = args;
    }
  }

  for(let p of Object.getOwnPropertyNames(Collection.prototype)) {
    if(p !== 'constructor' && p !== 'insert' && p !== 'name' && p !== 'rename'){
      Query.prototype[p] = Collection.prototype[p];
    }
  }

  return (dbname) => new Database(dbname);
})();

if(!this.window) module.exports = Database;
