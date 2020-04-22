var gulp = require('gulp');
var gsv = require('./');

var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');

// for testing gulp-src-viewer
gulp.task('default', function() {
  gsv(gulp);
});

gulp.task('build', function() {
  return gulp.src('public/css/app.css')
    .pipe(autoprefixer({
      browsers: [
        'last 2 versions',
        'Chrome >= 31',
        'Firefox >= 38',
        'Opera >= 30',
        'Safari >= 7.1',
        'Explorer >= 10'
      ]
    }))
    .pipe(rename('app.good.css'))
    .pipe(gulp.dest('public/css'))
});