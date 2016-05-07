var gulp = require('gulp');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');

gulp.task('default', [ 'build' ]);

gulp.task('build', function () {
	return gulp.src('src/index.js')
		.pipe(plumber(e => {
			console.error(e instanceof Error ? e.stack : 'Error: ' + e);
			this.emit('end');
		}))
		.pipe(babel({ presets: [ 'es2015' ] }))
		.pipe(gulp.dest('lib'));
});

gulp.task('watch', [ 'build' ], function (callback) {
  return gulp.watch('src/index.js', [ 'build' ]);
});
