var path = require('path');
var http = require('http');

var makeGulpSrcWrapper = require('./gulp-src-wrapper');

var open = require('open');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = http.createServer(app);

module.exports = launch;

function launch(gulp) {
  var gulpSrcWrapper = makeGulpSrcWrapper(gulp);

  // populates req.body with parsed json of requests
  app.use(bodyParser.json());

  // serve front-end
  var pathToPublic = path.join(__dirname, '..', 'public');
  app.use(express.static(pathToPublic));

  var pathToNodeModules = path.join(__dirname, '..', 'node_modules');
  app.use(express.static(pathToNodeModules));

  // matched files
  // request body: array of glob strings
  app.post('/files', function(req, res, next) {
    var globs = req.body;

    gulpSrcWrapper.run(globs, function(error, files) {
      if (error) return next(error);

      res.send(files);
    });
  });

  // gulp version
  app.get('/gulp/version', function(req, res) {
    var gulpVersion = 'unknown';

    try {
      gulpVersion = require('gulp/package').version;
    } catch (ignored) {}

    res.send({
      version: gulpVersion
    });
  });

  var port = 3333;
  server.listen(port, function() {
    console.log('[gulp-src-viewer] Server listening on port ' + port);

    open('http://localhost:' + port);
  });
}