const CSVParser = (() => {
  'use strict';

class CSVParser {
  parse(text, delim=',', quote='"') {
    const [dlen, qlen, len] = [delim.length, quote.length, text.length],
          records = [];
    let newLine = true, i = 0, q, j, k, record;
    while(true) {
      q = false;
      if(newLine) {
        record = [];
        newLine = false;
      }
      while(/[ \t]/.test(text.charAt(i))) i++;
      if(text.substr(i, qlen) === quote) {
        if((j = text.indexOf(quote, (i=i+qlen))) !== -1) {
          record.push(text.slice(i, j).trim());
          i = j+qlen;
          q = true;
        }
        else {
          record.push(text.slice(i).trim());
          i = len;
        }
      }
      if(i < len) {
        j = text.indexOf(delim, i); j = j === -1 ? len : j;
        k = text.indexOf('\n', i);  k = k === -1 ? len : k;
        if(j < k) {
          if(!q) record.push(text.slice(i, j).trim());
          i = j+dlen;
        }
        else {
          if(!q) record.push(text.slice(i, k).trim());
          i = k+1;
          newLine = true;
          if(record.length) records.push(record);
        }
      }
      else if(!q && j < k) {
        record.push('');
      }
      if(i >= len) {
        if(!newLine && record.length) records.push(record);
        break;
      }
    }
    return records;
  }

  toCSV(arrays, delim=",", quote='') {
    const records = [];
    for(let array of arrays) {
      let record = [];
      for(let v of array) record.push(`${quote}${v}${quote}`);
      records.push(record.join(delim));
    }
    return records.join('\n');
  }
}

return () => new CSVParser();
})();

if(!this.window) module.exports = CSVParser;
