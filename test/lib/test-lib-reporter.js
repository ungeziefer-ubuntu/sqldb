const TestReporter = (() => {
  'use strict';

  const util = require('util');

  const print = (text, level) => {
    const [a, indent] = [text.split('\n'), ' '.repeat(level*2)];
    for(let l of a) console.log(indent + l);
  };

  const indent = (text) => {
    let a = text.split('\n');
    if(a.length > 1) a = ['', ...a];
    for(let i=1; i<a.length; i++) a[i] = ' '.repeat(2) + a[i];
    return a.join('\n');
  };

  const inspect = (o) => o instanceof Error ? o.stack
    : indent(util.inspect(o, {depth: null}));

  const epilogue = (stats, level) => {
    const a1 = ['tests', 'assertions', 'failures', 'errors'], a2 = [];
    for(let p of a1) if(stats[p] !== void 0) a2.push(`${stats[p]} ${p}`);
    print(a2.join(', ') + ` (finished in ${stats.elapsed_ms/1000}s)`, level);
  };

  const error = (reports, level) => {
    for(let err of reports) {
      if(err.isAssertionError) {
        const {args:{msg, expected, actual}, stack} = err;
        print('AssertionError:', level);
        if(msg)      print(msg, level+1);
        if(expected) print(`expected: ${inspect(expected)}`, level+1);
        if(actual)   print(`actual:   ${inspect(actual)}`, level+1);
        print(stack.split('\n').slice(3).join('\n'), level);
      }
      else {
        print(util.inspect(err, {depth: null}), level);
      }
    }
  };

  class TestReporter {
    constructor(option) {
      if(option) [this.depth, this.concise] = [option.depth, option.concise];
    }

    report(context, level=0) {
      const [{description, tests, reports}, {depth, concise}] = [context, this];
      print(description, level);
      if(reports) error(reports, level+1);
      if(tests && (depth === void 0 || this.depth > level)) {
        for(let test of context.tests) this.report(test, level+1);
      }
      if(context.stats && (level === 0 || !concise)) {
        epilogue(context.stats, level+1);
      }
    }
  }

  return (option) => new TestReporter(option);
})();

module.exports = TestReporter;
