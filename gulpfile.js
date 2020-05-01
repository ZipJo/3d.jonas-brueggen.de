/* ################ */
/* ### Includes ### */
/* ################ */

const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync');
const rename = require('gulp-rename');
const filter = require('gulp-ignore');
const useref = require('gulp-useref');
const minifyJs = require('gulp-javascript-obfuscator');
const csso = require('gulp-csso');
const minifyInline = require('gulp-minify-inline');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');
const fileinclude = require('gulp-file-include');
const connect = require('gulp-connect-php');
const print = require('gulp-print').default; //for debugging stuff
const sftp = require('gulp-sftp-up4');
const pug = require('gulp-pug');



/* ################# */
/* ### Variables ### */
/* ################# */

let developmentFolder = 'src';
let productionFolder = 'dist';
let excludeCondition = '*.psd';
let moveFiles = [
            '.htaccess',
            'impressum.htm',
            '**/*.json',
            'css/*.ttf',
            'js/three.min.js'
];


/* ############# */
/* ### Tasks ### */
/* ############# */

gulp.task('test', function(done){
    gulp.src(developmentFolder+'/**/!(index).htm?(l)')
        .pipe(print());
    done();
})

// -----------------
// development-tasks
// -----------------

//sass-compiler + autoprefix
gulp.task('sass', function () {
    return gulp.src(developmentFolder+'/scss/*.scss')
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulp.dest(developmentFolder+'/css'));
});

//pug-compiler
gulp.task('pug', function buildHTML() {
  return gulp.src(developmentFolder+'/*.pug')
  .pipe(pug({
    // Your options in here.
  }))
  .pipe(gulp.dest(developmentFolder));
});

//resolve index_dev file-includes
gulp.task('fileinclude', function() {
    return gulp.src(developmentFolder+"/index_dev.html")
        .pipe(rename("index.html"))
        .pipe(fileinclude())
        .pipe(gulp.dest(developmentFolder)); 
});

//start server
gulp.task('serve', function() {
    connect.server({
        base: developmentFolder,
        port: 4000,
        stdio: 'ignore'
    }, function (){
        browserSync({
            proxy: 'localhost:4000'
        });
    });
});

//reload browser
gulp.task('reload', function(done){
    browserSync.reload();
    done();
});

//change-watchers
gulp.task('watch', function() {
    gulp.watch(developmentFolder+'/scss/*.scss', gulp.series('sass','reload'));
    gulp.watch(developmentFolder+'/**/!(index).htm?(l)', gulp.series('fileinclude','reload'));
    gulp.watch(developmentFolder+'/index_*.html', gulp.series('fileinclude','reload'));
    gulp.watch(developmentFolder+'/js/*.js', gulp.series('reload'));
    gulp.watch(developmentFolder+'/files/**', gulp.series('reload'));
    gulp.watch(developmentFolder+'/*.pug', gulp.series('pug'));
});

//main dev task -  compile stuff and start server and watchers
gulp.task('dev',
    gulp.series(
        'pug',
        gulp.parallel('sass', 'fileinclude'),
        gulp.parallel('watch','serve')
    )
);

// ------------------------
// push to production-tasks
// ------------------------

//push all web-files, together with (files & inline) minified css and js dependencies to production 
gulp.task('compile-index', function () {
    return gulp.src(developmentFolder+"/index.html")
        .pipe(minifyInline())

        .pipe(useref())
        .pipe(gulpif('*.js', minifyJs()))
        .pipe(gulpif('*.css', csso()))
        
        .pipe(gulp.dest(productionFolder))
});

gulp.task('minify-index', function() {
    return gulp.src(productionFolder+'/index.html')
        .pipe(htmlmin({
            removeComments: true,
            removeEmptyAttributes: true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(productionFolder))
});

//push image-files to production
gulp.task('move-files', function(){
    return gulp.src(developmentFolder+'/files/**/*')
        .pipe(filter.exclude(excludeCondition))
        .pipe(gulp.dest(productionFolder+'/files'))
});

//push leftover files to production
gulp.task('move-leftovers', function(){
    return gulp.src(developmentFolder+'/**', { dot: true })
        .pipe(filter.include(moveFiles))
        .pipe(gulp.dest(productionFolder))
});

//main build task
gulp.task('build', gulp.series('compile-index', 'minify-index', 'move-files', 'move-leftovers'));

// ------------
// upload-tasks
// ------------

let connectionParams = {
    host: 'jonas-brueggen.de',
    user: 'hosting100386',
    pass: 'gZnq5_40',
    remotePath: '/3d.jonas-brueggen.de/httpdocs/'
};
let sftpExclude = [
    'files/**',
    '.htaccess'
];

gulp.task('sftp', function () {
    return gulp.src(productionFolder+"/**")
        .pipe(filter.exclude(sftpExclude))
        .pipe(sftp(connectionParams));
});

gulp.task('sftp-all', function () {
    return gulp.src(productionFolder+"/**", { dot: true })
        .pipe(sftp(connectionParams));
});

gulp.task('build-sftp', gulp.series('build', 'sftp'));
