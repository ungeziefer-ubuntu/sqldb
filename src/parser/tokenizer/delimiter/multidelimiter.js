const MultiDelimiter = (() => {
  'use strict';

  class MultiDelimiter {
    constructor() {
      this.d = [];
    }

    extend(delimiter) {
      this.d.push(delimiter);
      return this;
    }

    split(str, i) {
      const {d} = this;
      for(let delimiter of d) {
        let r = delimiter.split(str, i);
        if(r) return r;
      }
      return null;
    }
  }

  return () => new MultiDelimiter;
})();

if(!this.window) module.exports = MultiDelimiter;
