const TokenBuffer = (() => {
  'use strict';

  class TokenBuffer {
    constructor(tokenizer) {
      const a = [];
      let t;
      while(t = tokenizer.getToken()) a.push(t);
      [this.a, this.i, this.m] = [a, -1, -1];
    }

    hasNext() {
      return this.i+1 < this.a.length;
    }

    next() {
      return this.hasNext() ? this.a[++this.i] : null;
    }

    current() {
      return this.i !== -1 ? this.a[this.i] : null;
    }

    mark() {
      return this.m = this.i;
    }

    reset(m=this.m) {
      return this.i = m;
    }

    get(i) {
      return this.a[i] || null;
    }

    size() {
      return this.a.length;
    }

    toString() {
      const [{a:a1}, a2] = [this, []];
      for(let i=this.i+1; i<a1.length; i++) a2.push(`\'${a1[i].value}\'`);
      return `[${a2.join(',')}]`;
    }
  }

  return (tokenizer) => new TokenBuffer(tokenizer);
})();

if(!this.window) module.exports = TokenBuffer;
