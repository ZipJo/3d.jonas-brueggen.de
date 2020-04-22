var assert = require('assert');
var gulp = require('gulp');

var makeWrapper = require('../lib/gulp-src-wrapper');

describe('gulp src wrapper', function () {
  var wrapper;

  beforeEach(function () {
    wrapper = makeWrapper(gulp);
  });

  describe('run()', function () {
    it('can take one string pattern', function (done) {
      var pattern = './test/files/js/*.js';

      wrapper.run(pattern, function(error, files) {
        assert.equal(2, files.length);
        assert(has(files, 'test/files/js/index.js', 'file'));
        assert(has(files, 'test/files/js/helper.js', 'file'));
        done();
      });
    });

    it('can take array of string patterns', function (done) {
      var patterns = ['./test/files/index.html', './test/files/css/main.css'];

      wrapper.run(patterns, function(error, files) {
        assert.equal(2, files.length);
        assert(has(files, 'test/files/index.html', 'file'));
        assert(has(files, 'test/files/css/main.css', 'file'));
        done();
      });
    });

    it('identifies directories', function (done) {
      var pattern = './test/files/**';

      wrapper.run(pattern, function(error, files) {
        assert(has(files, 'test/files/js', 'directory'));
        done();
      });
    });

    it('shows current working directory as dot', function (done) {
      var pattern = '.';

      wrapper.run(pattern, function(error, files) {
        assert.equal(1, files.length);
        assert(has(files, '.', 'directory'));
        done();
      });
    });
  });
});

function has(array, path, type) {
  return array.filter(function(file) {
    return file.type == type && file.path == path;
  }).length == 1;
}