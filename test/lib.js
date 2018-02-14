module.exports = {
  describe:     require('./lib/test-lib.js'),
  TestReporter: require('./lib/test-lib-reporter.js'),
  Delimiter:    require('../src/parser/tokenizer/delimiter/delimiter.js'),
  QuoteDelimiter:
    require('../src/parser/tokenizer/delimiter/quotedelimiter.js'),
  MultiDelimiter:
    require('../src/parser/tokenizer/delimiter/multidelimiter.js'),
  Tokenizer:     require('../src/parser/tokenizer/tokenizer/tokenizer.js'),
  TokenBuffer:   require('../src/parser/tokenizer/tokenizer/tokenbuffer.js'),
  Parser:        require('../src/parser/parser/parser-generator.js'),
  ReservedWords: require('../src/parser/parser/reservedwords.js'),
  SQLParser:     require('../src/parser/parser/sqlparser.js'),
  Database:      require('../src/database/database.js'),
  SQLDBDriver:   require('../src/driver/sqldbdriver.js'),
  QueryCompiler: require('../src/driver/querycompiler/querycompiler.js'),
  FieldList:     require('../src/driver/querycompiler/fieldlist.js'),
  SQLDB:         require('../src/main/sqldb.js'),
  CSVParser:     require('../src/parser/parser/csvparser.js'),
  T1(v1, v2, buf, delim, returnDelim) {
    return {
      token: v1 ? {value: v1} : null,
      cache: v2 ? {value: v2} : null,
      buf,
      delim,
      returnDelim
    };
  },
  T2(t1, t2, buf, delim, returnDelim) {
    return {
      token: {
        value: t1[0],
        isQuoted:  t1.length === 3 ? t1[1] : true,
        isInvalid: t1.length === 3 ? t1[2] : false
      },
      cache: t2 === null ? null : {
        value: t2[0],
        isQuoted:  t2.length === 3 ? t2[1] : true,
        isInvalid: t2.length === 3 ? t2[2] : false
      },
      buf,
      delim,
      returnDelim
    };
  },
  T3(...args) {
    const r = {};
    if(args.length === 3)
      [r.value, r.line, r.column] = args;
    else if(args.length === 5)
      [r.value, r.isQuoted, r.isInvalid, r.line, r.column] = args;
    return r;
  }
};
