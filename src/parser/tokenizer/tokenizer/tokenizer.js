const Tokenizer = (() => {
  'use strict';

  const setLineNumber = (value, self) => {
    if(self.newLine.includes(value)) {
      self.line++;
      self.column = 0;
    }
    else {
      self.column += value.length;
    }
  };

  const T = (token, line, column) => {
    const r = {
      value: token.value,
      line,
      column
    };
    if(token.isQuoted)
      [r.isQuoted, r.isInvalid] = [token.isQuoted, token.isInvalid];
    return r;
  };

  class Tokenizer {
    constructor(str, delim) {
      [this.str, this.buf, this.d, this.line, this.column, this.newLine]
        = [str, str, delim, 0, 0, ['\n']];
    }

    getToken(buf=this.buf) {
      const {d, cache:cache1, line, column} = this;

      if(cache1) {
        const {value, isQuoted, delim, returnDelim} = cache1;
        setLineNumber(value, this);
        if(isQuoted && !returnDelim) setLineNumber(delim, this);
        this.cache = null;
        return T(cache1, line, column);
      }

      if(!buf) return null;

      let res;
      for(let i=0; i<buf.length; i++) {
        if(res = d.split(buf, i)) {
          let {token, cache, buf, delim, returnDelim} = res;
          if(i === 0 && !token && buf) {
            setLineNumber(delim, this);
            return this.getToken(buf);
          }
          if(token) setLineNumber(token.value, this);
          if(token && token.isQuoted && !returnDelim)
            setLineNumber(delim, this);
          if(i !== 0 && !cache) setLineNumber(delim, this);
          break;
        }
      }

      const cache2 = this.cache = res ? res.cache : null;
      if(cache2 && cache2.isQuoted)
        [cache.delim, cache.returnDelim] = [r.delim, r.returnDelim];
      this.buf = res ? res.buf : null;
      return !res || res.token ? T(res ? res.token : {value: buf}, line, column)
        : null;
    }
  }

  return (text, delim) => new Tokenizer(text, delim);
})();

if(!this.window) module.exports = Tokenizer;
