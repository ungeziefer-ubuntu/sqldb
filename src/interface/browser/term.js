const Term = (() => {
  'use strict';

  const [ENTER, UP, DOWN] = [13, 38, 40];

  const stopPropagation = (o) => {
    ['click', 'mouseover', 'touchstart'].forEach((e) => {
      o.addEventListener(e, (e) => {
        e.stopPropagation();
      });
    });
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  };

  const setCursor = async (e) => {
    const range = document.createRange();
    range.selectNodeContents(e);
    range.collapse(false);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const activatePlaceholder = (e) => {
    const {target} = e;
    if(target.textContent === '') {
      e.target.setAttribute('placeholderactive', 'true');
    }
  };

  const deactivatePlaceholder = (e) => {
    e.target.setAttribute('placeholderactive', 'false');
  };

  class Term {
    constructor(id) {
      [this.container, this.fn, this.history, this.idx, this.isClosed,
        this.paused] = [document.getElementById(id), {}, [], -1, false, false];

      document.addEventListener('keypress', async (e) => {
        const {container, fn, history, idx, isClosed, paused, input} = this;
        if(isClosed || paused || document.activeElement !== input) return;
        if(e.keyCode === ENTER) {
          if(fn.line) {
            this.pause();
            const line = input.innerText;
            if(line === '') {
              input.textContent = null;
            }
            else {
              history.push(line);
            }
            input.blur();
            fn.line(line.replace(/\s/g, ' '));
          }
          this.idx = -1;
        }
        else if(e.keyCode === UP) {
          if(history.length === 0 || idx === 0) return;
          input.textContent
            = this.history[this.idx = idx === -1 ? history.length-1 : idx-1];
          await sleep(50);
          await setCursor(input);
        }
        else if(e.keyCode === DOWN) {
          if(history.length === 0 || idx === -1) return;
          if(idx === history.length-1) {
            this.idx = -1;
            input.textContent = '';
          }
          else {
            input.textContent = history[++this.idx];
          }
        }
      });

      document.addEventListener('click', (e) => {
        if(this.isClosed) return;
        if(this.input) this.input.focus();
      });

      document.addEventListener('mouseover', (e) => {
        if(this.isClosed) return;
        if(this.input) this.input.focus();
      });
      document.addEventListener('touchstart', (e) => {
        if(this.isClosed) return;
        if(this.input) this.input.click();
      });
    }

    on(event, fn) {
      this.fn[event] = fn;
    }

    print(str) {
      const {container} = this;
      const a = str.split('\n');
      let output;
      for(let l of a) {
        output = document.createElement('div');
        output.setAttribute('name', 'output');
        output.innerHTML = l.replace(/ /g, '&nbsp');
        stopPropagation(output);
        container.appendChild(output);
      }
      document.body.scrollTo(0, output.offsetTop);
    }

    close() {
      this.print('Process is completed');
      this.input.setAttribute('contenteditable', 'false');
      this.isClosed = true;
    }

    clear() {
      this.container.textContent = null;
      delete this.input;
    }

    setPrompt(prompt) {
      this._prompt = prompt;
    }

    setPlaceholder(placeholder) {
      this.placeholder = placeholder;
    }

    pause() {
      this.paused = true;
    }

    resume() {
      this.paused = false;
    }

    async prompt(str, duration, delay) {
      const {container, input:_input, _prompt, placeholder, preprompt,
            postprompt} = this,
            prompt = document.createElement('div'),
            input  = document.createElement('div'),
            line   = document.createElement('div');
      if(preprompt) preprompt();
      if(_input) {
        _input.setAttribute('contenteditable', 'false');
        _input.setAttribute('placeholderactive', 'false');
        _input.removeEventListener('blur', activatePlaceholder);
        _input.removeEventListener('focus', deactivatePlaceholder);
        stopPropagation(_input);
      }
      prompt.setAttribute('name', 'prompt');
      prompt.textContent = _prompt;
      input.setAttribute('name', 'input');
      line.setAttribute('name', 'line');
      line.appendChild(prompt);
      line.appendChild(input);
      container.appendChild(line);
      if(str || str === '') {
        await sleep(str === '' ? duration : delay);
        const len = str.length, ms = duration/len;
        for(let i=1; i<=len; i++) {
          await sleep(ms);
          input.innerHTML = str.substr(0, i).replace(/ /g, '&nbsp');
        }
      }
      else {
        input.setAttribute('contenteditable', 'true');
        input.setAttribute('placeholder', placeholder);
        input.addEventListener('blur', activatePlaceholder);
        input.addEventListener('focus', deactivatePlaceholder);
        this.input = input;
        await sleep(50);
        if(postprompt) postprompt();
        this.resume();
        input.focus();
      }
      document.body.scrollTo(0, prompt.offsetTop);
    }

    newLine() {
      this.container.appendChild(document.createElement('br'));
    }

    appendTable(e, defaultLength) {
      const [{container}, {children}, a] = [this, e, []];
      for(let i=defaultLength+1; i<children.length; i++) {
        let row = children[i];
        row.classList.add('hidden');
        a.push(row);
      }
      stopPropagation(e);
      container.appendChild(e);
      if(a.length) {
        const toggle = document.createElement('button');
        toggle.setAttribute('name', 'toggle');
        toggle.textContent = '...';
        stopPropagation(toggle);
        toggle.addEventListener('click', async (e) => {
          for(let o of a) {
            if(a.length <= 400) await sleep(50);
            o.classList.toggle('visible');
          }
          toggle.textContent = toggle.value
            = toggle.textContent === '...' ? '-' : '...';
        });
        toggle.addEventListener('focus', (e) => e.target.blur());
        container.appendChild(toggle);
      }
      document.body.scrollTo(0, e.offsetTop);
    }

    setPrePrompt(fn) {
      this.preprompt = fn;
    }

    setPostPrompt(fn) {
      this.postprompt = fn;
    }

    append(e, fn) {
      stopPropagation(e);
      container.appendChild(e);
      document.body.scrollTo(0, e.offsetTop);
      if(fn) fn();
    }
  }

  return (id) => new Term(id);
})();
