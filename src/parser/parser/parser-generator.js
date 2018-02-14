const Parser = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const isString   = (o) => typeOf(o) === 'String';
  const isRegExp   = (o) => typeOf(o) === 'RegExp';
  const isFunction = (o) => typeOf(o) === 'Function';
  const isParser   = (o) => Object.getPrototypeOf(o.constructor) === Parser;

  const parse = (items, buf, f, self, debugging) => {
    const [{_a, _and, _or}, m] = [f, buf.mark()];
    self.debug(`parse: next=\'${buf.hasNext() ? buf.get(m+1).value : null}\'`,
      debugging);

    let r = null;
    for(let e of _a) {
      self.debug(`parse: expected=${isString(e) ? `\'${e}\'`
        : isRegExp(e) ? e : isFunction(e) ? 'Function' : isParser(e) ? e.name
        : null}`, debugging);

      let v;
      r = isString(e) && buf.hasNext() && buf.next().value === e ? e
        : isRegExp(e) && buf.hasNext() && e.test((v = buf.next().value)) ? v
        : isFunction(e) ? e(items, buf, debugging)
        : isParser(e) ? e.parse(buf, items, self.debugging || debugging)
        : null;
      if(_and && r !== null || _or && r === null) {
        buf.reset(m);
        buf.mark();
        continue;
      }
      if((_or ||!_and && !_or) && r !== null) {
        return r;
      }
      return null;
    }
    if(_or) {
      buf.reset(m);
      if(buf.hasNext()) buf.next();
    }
    else {
      buf.reset();
    }
    return r;
  };

  const error = (items, buf, e) => {
    if(isString(e)) {
      throw new Error(e);
    }
    else if(isFunction(e)) {
      e(items, buf);
    }
    else {
      const current = buf.current() || buf.next();
      if(current === null) throw new Error('SyntaxError at line 0 column 0');
      const {value, line, column} = current;
      throw new Error(
      `SyntaxError at or near \'${value}\' at line ${line} column ${column}`);
    }
  };

  const hasDelim = (items, buf, f) => {
    const [{_d:d}, m] = [f, buf.mark()];
    if(isString(d) && buf.hasNext() && buf.next().value === d
    || isRegExp(d) && buf.hasNext() && d.test(buf.next().value)) {
      return true;
    }
    else {
      buf.reset(m);
      return false;
    }
  };

  const options = {
    and:         0,
    or:          0,
    optional:    1,
    atLeastOnce: 1,
    many:        1,
    delim:       2,
    setup:       3,
    filter:      4,
    end:         5,
    on:          6,
    premise:     7,
    for:         8,
    error:       9
  };

  const deleteOptions = (self, p) => {
    const n = options[p];
    for(let p in options) if(self[p] && n >= options[p]) self[p] = void 0;
  };

  class Parser {
    constructor(name='Parser') {
      [this.name, this._p, this.debugging] = [name, {_f: [], _r: this}, false];
    }

    from(id) {
      const f = new From(id, this._p);
      this._p._f.push(f);
      return f;
    }

    where(w) {
      this._p._w = w;
      return this._p._r;
    }

    select(s) {
      this._p._s = s;
      return this._p._r;
    }

    setDefaultError(e) {
      this._p._e = e;
      return this._p._r;
    }

    parse(buf, items, debugging) {
      items = {super: items};
      const {_p:{_f, _w, _s, _e}} = this;

      this.debug(`parse: buf=${buf}`, debugging);
      for(let fr of _f) {
        let {_id, _assigning, _v, _max, _min, _d, _setup, _filter, _end, _on,
          _premise, _for, _error} = fr;

        if(_assigning) {
          items[_id] = _v;
          continue;
        }

        if(_on && !_on(items, buf) || _premise && items[_premise] === void 0
        || _for && items[_for] !== void 0) continue;

        this.debug(`parse: id=${_id}`, debugging);
        if(_setup) _setup(items, buf);

        const a = [];
        let [t, i, err] = [[], 0, false];
        if(_max !== 1) items[_id] = t;
        while(_max === void 0 || i < _max) {
          const [m, r1] = [buf.mark(), parse(items, buf, fr, this, debugging)];
          if(r1 !== null) {
            t.push(r1);
            if(_max === 1) items[_id] = t[0];
          }
          const r2 = _filter ? _filter(items, buf, r1) : r1;
          this.debug(`parse: res=${r2}`, debugging);
          if(r2 === null) {
            if(i > 0 && _d) err = true;
            else if(i >= _min) buf.reset(m);
            break;
          }
          a.push(r2);
          t = a.slice();
          items[_id] = _max === 1 ? t[0] : t;
          i++;
          if(_d && !hasDelim(items, buf, fr)) break;
        }

        if(_end && !_end(items, buf) || err || i < _min) {
          delete items[_id];
          if(_error !== false) (_e || error)(items, buf, _error);
          this.debug('parse: return null', debugging);
          return null;
        }
      }

      const r = (!_w || _w(items, buf)) ? isString(_s) ? items[_s]
        : isFunction(_s) ? _s(items, buf) : items : null;
      this.debug(`parse: return ${r}`, debugging);
      return r;
    }

    debug(m, debugging=this.debugging) {
      if(debugging) console.log(`DEBUG: ${this.name}.${m}`);
    }
  }

  class From {
    constructor(id, p) {
      [this._id, this._p, this._a] = [id, p, []];
    }

    in(e) {
      this._a.push(e);
      [this._max, this._min] = [1, 1];
      return new Option(this);
    }

    assigning(v) {
      [this._assigning, this._v] = [true, v];
      return this._p._r;
    }
  }

  class Option {
    constructor(f) {
      [this._f, this._p] = [f, f._p];
    }

    optional() {
      return this.many(0, 1);
    }

    atLeastOnce() {
      return this.many(1);
    }

    many(min=0, max) {
      [this._f._min, this._f._max] = [min, max];
      if(max === void 0 || max > 1) this.delim = (d) => {
        this._f._d = d;
        deleteOptions(this, 'delim');
        return this;
      };
      deleteOptions(this, 'many');
      return this;
    }
  }

  for(let p of Object.getOwnPropertyNames(Parser.prototype)) {
    if(p !== 'constructor') Option.prototype[p] = Parser.prototype[p];
  }

  const a1 = [{p1: 'and', p2: 'or'}, {p1: 'or', p2: 'and'}];
  for(let {p1, p2} of a1)
    eval(
      `Option.prototype.${p1} = function(e) {` +
      `  this._f._a.push(e);` +
      `  if(!this._f._${p1}) {` +
      `    this._f._${p1} = true;` +
      `    this.${p2} = void 0;` +
      `  }` +
      `  return this;` +
      `};`
    );

  const a2 = ['setup', 'filter', 'end', 'on', 'premise', 'for', 'error'];
  for(let p of a2)
    eval(
      `Option.prototype.${p} = function(a) {` +
      ` this._f._${p} = a;` +
      ` deleteOptions(this, \'${p}\');` +
      ` return this;` +
      `};`
    );

  return (name) => {
    let p;
    eval(`class ${name} extends Parser {} p = ${name};`);
    return new p(name);
  };
})();

if(!this.window) module.exports = Parser;
