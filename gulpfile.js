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
const uglify = require('gulp-uglify-es').default;
const minifyInline = require('gulp-minify-inline');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');
const fileinclude = require('gulp-file-include');
const connect = require('gulp-connect-php');
const print = require('gulp-print').default; //for debugging stuff
const sftp = require('gulp-sftp-up4');

sass.compiler = require('dart-sass');



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
			'css/**',
			'js/stats.min.js',
			'js/three.min.js',
			'js/smoothscroll.min.js',
			'js/canvasworker.js',
			'js/canvasanimations-config.js',
			'js/*.gif',
			'js/*.bmp',
			'js/*.png',
];


/* ############# */
/* ### Tasks ### */
/* ############# */

// -----------------
// development-tasks
// -----------------

//sass-compiler + autoprefix
gulp.task('sass', function () {
	return gulp.src(developmentFolder+'/scss/*.scss')
		.pipe(sass(
			{outputStyle: 'compressed'}))
		.pipe(autoprefixer())
		.pipe(gulp.dest(developmentFolder+'/css'));
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
});

//main dev task -  compile stuff and start server and watchers
gulp.task('dev',
	gulp.series(
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
		.pipe(gulpif('*.js', uglify()))		
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

let sftpParams = {
	host: 'jonas-brueggen.de',
	remotePath: '/dev.jonas-brueggen.de/httpdocs/',
	auth: 'connectionParams'
};
let sftpExclude = [
	'files/**'
];

gulp.task('sftp', function () {
	return gulp.src(productionFolder+"/**", { dot: true })
		.pipe(filter.exclude(sftpExclude))
		.pipe(sftp(sftpParams));
});

gulp.task('sftp-all', function () {
	return gulp.src(productionFolder+"/**", { dot: true })
		.pipe(sftp(sftpParams));
});

gulp.task('build-sftp', gulp.series('build', 'sftp'));
