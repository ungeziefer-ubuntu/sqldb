const describe =(() => {
  'use strict';

  const eq = (a, b) => {
    if(a === b) return true;
    if(!(a instanceof Object) || !(b instanceof Object)) return false;
    if(a.constructor !== b.constructor) return false;
    for(let p in a) {
      if(!a.hasOwnProperty(p)) continue;
      if(!b.hasOwnProperty(p)) return false;
      if(!eq(a[p], b[p])) return false;
    }
    for(let p in b) {
      if(b.hasOwnProperty(p) && !a.hasOwnProperty(p)) return false;
    }
    return true;
  };

  const stacktrace = () => {
    try {
      throw new Error('dummy');
    }
    catch(e) {
      return e.stack;
    }
  };

  class AssertionError {
    constructor(args) {
      this.args = args;
      this.stack = stacktrace();
      this.isAssertionError = true;
    }
  }

  function expect(actual) {
    return new Expect(actual, this.stats, this.reports);
  }

  class Expect {
    constructor(...args) {
      [this.actual, this.stats, this.reports] = args;
      this.stats.assertions++;
    }

    toBe(expected) {
      if(this.actual !== expected) {
        this.reports.push(new AssertionError({
          actual: this.actual,
          expected: expected
        }));
        this.stats.failures++;
      }
    }

    toBeEq(expected) {
      if(!eq(this.actual, expected)) {
        this.reports.push(new AssertionError({
          actual: this.actual,
          expected: expected
        }));
        this.stats.failures++;
      }
    }

    throws(expected) {
      try {
        this.actual();
      }
      catch(e) {
        if((e instanceof Error && e.message !== expected.message)
        || (!e instanceof Error && !eq(e, expected))) {
          this.reports.push(new AssertionError({
            actual: e,
            expected: expected
          }));
          this.stats.failures++;
        }
        return;
      }
      this.reports.push(new AssertionError({
        expected: expected,
        msg: 'No error is thrown'
      }));
      this.stats.failures++;
    }
  }

  class Context {
    constructor(description, context) {
      this.description = description;
      if(context) this.context = context;
      this.tests = [];
    }

    describe(description) {
      const context = new Context(description, this);
      this.tests.push(context);
      return context;
    }

    it(description, fn) {
      this.tests.push(new Test(description, fn));
      return this;
    }

    setup(fn) {
      this._setup = fn;
      return this;
    }

    teardown(fn) {
      this._teardown = fn;
      return this;
    }

    end() {
      return this.context || this;
    }

    extend(context) {
      this.tests.push(context);
      return this;
    }
  }

  class Test {
    constructor(...args) {
      [this.description, this.fn] = args;
    }
  }

  function run(reporter) {
    const stats = this.stats
      = {tests: 0, assertions: 0, failures: 0, errors: 0},
      start_ms = new Date().getTime();
    runTests(this, stats);
    this.stats.elapsed_ms = new Date().getTime() - start_ms;
    reporter.report(this);
  };

  const runTests = (context, stats) => {
    const {tests} = context;
    for(let test of tests) {
      if(context._setup) context._setup();
      if(test instanceof Context) runTests(test, stats);
      else runTest(test, stats);
      if(context._teardown) context._teardown();
    }
  };

  const runTest = (test, stats) => {
    const localStats = test.stats = {assertions: 0, failures: 0, errors: 0},
          start_ms = new Date().getTime();
    stats.tests++;
    const reports = test.reports = [];
    try {
      test.fn.call({
        stats: localStats,
        expect: expect,
        reports: reports
      });
    }
    catch(e) {
      reports.push(e)
      localStats.errors++;
    }
    localStats.elapsed_ms = new Date().getTime() - start_ms;
    for(let p in localStats) stats[p] += localStats[p];
  };

  return (description) => {
    const context = new Context(description);
    context.run = run;
    return context;
  }
})();

if(!this.window) module.exports = describe;
