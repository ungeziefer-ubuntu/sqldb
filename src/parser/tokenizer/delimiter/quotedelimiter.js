const QuoteDelimiter = (() => {
  'use strict';

  const T = (value, isQuoted, isInvalid) => ({value, isQuoted, isInvalid});

  class QuoteDelimiter {
    constructor(...args) {
      [this.delim, this.returnDelim] = args;
    }

    split(str, i) {
      const {delim, returnDelim} = this,
            dlen = delim.length;
      let slen = str.length;

      if(str.substr(i).indexOf(delim) !== 0) return null;

      let [j, endIdx] = [i+dlen, -1];
      while(j <= slen-dlen) {
        if(str.substr(j, 1+dlen) === '\\' + delim) {
          str = str.substr(0, j) + str.substr(j+dlen);
          slen = str.length;
          j += dlen;
        }
        else if(str.substr(j, 2) === '\\\\') {
          str = str.substr(0, j) + str.substr(j+1);
          slen = str.length;
          j++;
        }
        else if(str.substr(j, dlen) === delim) {
          endIdx = j;
          break;
        }
        else {
          j++;
        }
      }
      const isInvalid = endIdx === -1,
            value = !returnDelim && (i+dlen === endIdx) ? ''
              : str.substr(returnDelim ? i : i+dlen,
                isInvalid ? returnDelim ? slen-i : slen-i-dlen
                  : returnDelim ? endIdx+dlen-i : endIdx-i-dlen),
            buf = isInvalid || (slen === endIdx+dlen) ? null
              : str.substr(endIdx+dlen);

      return {
        token: i === 0 ? T(value, true, isInvalid)
          : T(str.substr(0, i), false, false),
        cache: i === 0 ? null : T(value, true, isInvalid),
        buf,
        delim: isInvalid ? delim : delim+delim,
        returnDelim
      };
    }
  }

  return (delim, returnDelim) => new QuoteDelimiter(delim, returnDelim);
})();

if(!this.window) module.exports = QuoteDelimiter;
