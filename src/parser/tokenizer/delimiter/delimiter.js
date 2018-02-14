const Delimiter = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const T = (value) => ({value});

  class Delimiter {
    constructor(...args) {
      [this.delim, this.returnDelim] = args;
    }

    split(str, i) {
      const {delim, returnDelim} = this,
            [slen, dlen] = [str.length, delim.length];

      let r;
      return typeOf(delim) === 'RegExp' &&
        (r = str.match(delim)) && r.index === i ?
          i === 0 ? {
            token: returnDelim ? T(r[0]) : null,
            cache: null,
            buf: slen === r[0].length ? null : str.substr(r[0].length),
            delim: r[0],
            returnDelim
          }
          : {
            token: T(str.substr(0, i)),
            cache: returnDelim ? T(r[0]) : null,
            buf: i+r[0].length < slen ? str.substr(i+r[0].length): null,
            delim: r[0],
            returnDelim
          }
        : typeOf(delim) === 'String' && str.substr(i).indexOf(delim) === 0 ?
          i === 0 ? {
            token: returnDelim ? T(delim) : null,
            cache: null,
            buf: slen === dlen ? null : str.substr(dlen),
            delim,
            returnDelim
          }
          : {
            token: T(str.substr(0, i)),
            cache: returnDelim ? T(delim) : null,
            buf: (i+dlen < slen) ? str.substr(i+dlen) : null,
            delim,
            returnDelim
          }
        : null;
    }
  }

  return (delim, returnDelim) => new Delimiter(delim, returnDelim);
})();

if(!this.window) module.exports = Delimiter;
