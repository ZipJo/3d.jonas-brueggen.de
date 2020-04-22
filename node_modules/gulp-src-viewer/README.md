# gulp-src-viewer

Tool for testing gulp.src() glob patterns

## What this does

Launches locally-served page that shows what files are returned by `gulp.src()` based on globs you enter.

## Install

```bash
npm install gulp-src-viewer -D
```

## Usage

In your `gulpfile.js`

```js
var gulp = require('gulp');
var gsv = require('gulp-src-viewer');

gulp.task('gsv', function() {
  gsv(gulp);
});
```

then run

```bash
gulp gsv
```

and a webpage for testing globs will open (or go to http://localhost:3333).

## License

MIT

## FAQ

### Webpage doesn't launch

The `gulp-src-viewer` server crashes and console shows

```
[gulp-src-viewer] Server listening on port 3333

events.js:72
        throw er; // Unhandled 'error' event
              ^
Error: EISDIR, read
```

These versions of gulp have some issues with symlinks:

- 3.8.0
- 3.9.0

These are ok:

- 3.6.0
- 3.7.0

`¯\_(ツ)_/¯`