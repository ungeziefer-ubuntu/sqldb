const SQLDB = (() => {
  'use strict';

  const typeOf = (o) => Object.prototype.toString.call(o).slice(8, -1);

  const initDelimiter = (Delimiter, QuoteDelimiter, MultiDelimiter) => {
    return MultiDelimiter()
      .extend(Delimiter(' ',  false))
      .extend(Delimiter('\t', false))
      .extend(Delimiter('\n', false))
      .extend(Delimiter('(',  true))
      .extend(Delimiter(')',  true))
      .extend(Delimiter(',',  true))
      .extend(Delimiter(';',  true))
      .extend(Delimiter('+',  true))
      .extend(Delimiter('-',  true))
      .extend(Delimiter('*',  true))
      .extend(Delimiter('/',  true))
      .extend(Delimiter('%',  true))
      .extend(Delimiter('<>', true))
      .extend(Delimiter('<=', true))
      .extend(Delimiter('<',  true))
      .extend(Delimiter('>=', true))
      .extend(Delimiter('>',  true))
      .extend(Delimiter('!=', true))
      .extend(Delimiter('=',  true))
      .extend(Delimiter(/^(?![a-z_])\d*\.\d+(?![a-z_])/i, true))
      .extend(Delimiter(/^(?![a-z_])\d+\.(?!\w)/i, true))
      .extend(Delimiter('.', true))
      .extend(QuoteDelimiter('\'', true))
      .extend(QuoteDelimiter('\"', true));
  };

  class SQLDB {
    constructor(...args) {
      const [Delimiter, QuoteDelimiter, MultiDelimiter, Tokenizer, TokenBuffer,
        Parser, ReservedWords, SQLParser, Database, SQLDBDriver, QueryCompiler,
        FieldList] = args;

      const delim  = initDelimiter(Delimiter, QuoteDelimiter, MultiDelimiter),
            parser = SQLParser(Parser, ReservedWords),
            driver = SQLDBDriver(Database, QueryCompiler, FieldList);

      this.execute = (str, session) => {
        if(typeOf(str) !== 'String') {
          throw new Error('FatalError: The input is not a string value');
        }
        if(!session) {
          session = this.session || {env: 'unknown', dbname: null};
          this.session = session;
        }
        if(this.debugging) {
          parser.debugging = true;
        }
        const stmt = parser.parse(this.createTokenBuffer(str), session);
        return driver.execute(stmt, session);
      };

      this.loadJSON = (data, stmt, session) => {
        if(!session) {
          session = this.session || {env: 'unknown', dbname: null};
          this.session = session;
        }
        return driver.loadJSON(data, stmt, session);
      }

      this.createTokenBuffer = (str) => TokenBuffer(Tokenizer(str, delim));

      this.debugging = false;
    }
  }

  return (...args) => new SQLDB(...args);
})();

if(!this.window) module.exports = SQLDB;
