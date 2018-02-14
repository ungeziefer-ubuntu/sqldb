const FileLoader = (() => {
  'use strict';

class FileLoader {
    loadFile(type) {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type;
        input.onchange = (e) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(e.target.files[0]);
        }
        input.click();
      });
    }

    downloadFile(text, name, type) {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([text], {type}));
      a.download = name;
      a.style = 'display: none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(a.href);
      }, 100);
    }
  }

  return () => new FileLoader;
})();
