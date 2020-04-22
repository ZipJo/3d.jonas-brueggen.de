var pathSeparator = require('path').sep;

module.exports = makeWrapper;

function makeWrapper(gulp) {
  return {
    run: function(patterns, callback) {
      var files = [];
      var options = {
        read: false
      };

      gulp.src(patterns)
        .on('data', recordFile)
        .on('end', done);

      function recordFile(file) {
        files.push({
          path: normalizeToCwd(file.path),
          type: fileType(file)
        });
      }

      function done() {
        callback(null, files);
      }
    }
  };
}

function normalizeToCwd(path) {
  if (path == process.cwd()) {
    return '.';
  }

  return removePrefix(process.cwd() + pathSeparator, path);
}

function removePrefix(prefix, str) {
  if (str.indexOf(prefix) == 0) {
    return str.slice(prefix.length);
  }

  return str;
}

function fileType(file) {
  return file.stat.isDirectory() ? 'directory' : 'file';
}