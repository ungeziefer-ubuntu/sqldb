const demo = async (term, richformat, db) => {
  const getJSON = (url) => {
    return new Promise((resolve) => {
      const req = new XMLHttpRequest();
      req.onreadystatechange = () => {
        if(req.readyState === 4 && req.status === 200) resolve(req.response);
      };
      req.open('GET', url, true);
      req.responseType = 'json';
      req.send(null);
    });
  };
  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  };

  db.execute('use demo;');
  db.execute('create table population' +
    ' (locid, location, varid, variant, time, midperiod,' +
    ' popmale, popfemale, poptotal);');
  db.execute('create table gdp (location, currency, year, gdp);');
  const pop = await getJSON('demo/pop.json');
  const gdp = await getJSON('demo/gdp.json');
  db.loadJSON(pop, {table:{name:'population'}});
  db.loadJSON(gdp, {table:{name:'gdp'}});

  const fn = {}
  const removeEventListener = () => {
    document.removeEventListener('keypress',   fn.keypress);
    document.removeEventListener('click',      fn.click);
    document.removeEventListener('touchstart', fn.touchstart);
  };
  let skip = false;
  const ENTER = 13;
  document.addEventListener('keypress', (() => {
    const f = fn.keypress = (e) => {
      if(e.keyCode === ENTER) {
        skip = true;
        removeEventListener()
      }
    };
    return f;
  })());
  document.addEventListener('click', (() => {
    const f = fn.click = (e) => {
      skip = true;
      removeEventListener()
    };
    return f;
  })());
  document.addEventListener('touchstart', (() => {
    const f = fn.touchstart = (e) => {
      skip = true;
      removeEventListener()
    };
    return f;
  })());

  let res;
  if(!skip) await term.prompt('databases;', 1000, 1000);
  if(!skip) res = db.execute('databases;');
  if(!skip) term.print(res.msg);
  if(!skip) term.appendTable(richformat.toTable(res.records));
  if(!skip) await term.prompt('', 1000);
  if(!skip) await term.prompt('', 50);
  if(!skip) await term.prompt('use demo;', 1000, 50);
  if(!skip) res = db.execute('use demo;');
  if(!skip) term.print(res.msg);
  if(!skip) await term.prompt('', 1000);
  if(!skip) await term.prompt('', 50);
  if(!skip) await term.prompt('tables;', 500, 50);
  if(!skip) await sleep(1000);
  if(!skip) res = db.execute('tables;');
  if(!skip) term.print(res.msg);
  if(!skip) term.appendTable(richformat.toTable(res.records));
  if(!skip) await term.prompt('', 2000);
  if(!skip) await term.prompt('', 50);
  if(!skip) await term.prompt('select count(0) from population;', 2000, 50);
  if(!skip) await sleep(1000);
  if(!skip) res = db.execute('select count(0) from population;');
  if(!skip) term.print(res.msg);
  if(!skip) term.appendTable(richformat.toTable(res.records));
  if(!skip) await term.prompt('', 2000);
  if(!skip) await term.prompt('', 50);
  const str1 = 'select location, time, popmale, popfemale, poptotal\n',
        str2 = 'from population\n',
        str3 = 'where time = \'2018\'\n'
        str4 = 'order by poptotal desc\n',
        str5 = 'limit 10;';
  if(!skip) await term.prompt(str1, 2500, 50);
  if(!skip) await term.prompt(str2, 1000, 50);
  if(!skip) await term.prompt(str3, 1000, 50);
  if(!skip) await term.prompt(str4, 1000, 50);
  if(!skip) await term.prompt(str5, 500, 50);
  if(!skip) await sleep(1000);
  if(!skip) res = db.execute(str1+str2+str3+str4+str5);
  if(!skip) term.print(res.msg);
  if(!skip) term.appendTable(richformat.toTable(res.records));
  if(!skip) await term.prompt('', 2000);
  if(!skip) await term.prompt('', 200);
  if(!skip) await term.prompt('exit database;', 1000, 50);
  if(!skip) res = db.execute('exit database;');
  if(!skip) term.print(res.msg);
  if(!skip) await term.prompt('', 1000);
  if(!skip) await term.prompt('', 50);
  if(!skip) await term.prompt('clear;', 500, 50);
  if(!skip) await sleep(500);
  term.clear();
  await term.prompt('Welcome', 500);
  await sleep(50);
};
