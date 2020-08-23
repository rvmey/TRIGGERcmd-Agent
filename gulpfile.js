var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    concatCss = require('gulp-concat-css'),
    run = require('gulp-run');

var src = './process',
    app = './app';

gulp.task('js', gulp.series(function(done) {
  return gulp.src( src + '/js/*.js' )
    .pipe(browserify({
      transform: 'reactify',
      extensions: 'browserify-css',
      debug: true
    }))
    .on('error', function (err) {
      console.error('Error!', err.message);
    })
    .pipe(gulp.dest(app + '/js'));
  done();
}));

gulp.task('html', gulp.series(function(done) {
  gulp.src( src + '/**/*.html');
  done();
}));

gulp.task('css', gulp.series(function(done) {
  gulp.src( src + '/css/*.css')
  .pipe(concatCss('app.css'))
  .pipe(gulp.dest(app + '/css'));
  done();
}));

gulp.task('fonts', gulp.series(function(done) {
    gulp.src('node_modules/bootstrap/dist/fonts/**/*')
    .pipe(gulp.dest(app + '/fonts'));
    done();
}));

gulp.task('serve', gulp.series('html', 'js', 'css', function(done) {
  run('electron app/main.js').exec();
  done();
}));

gulp.task('watch', gulp.series('serve', function(done) {
  gulp.watch( src + '/js/**/*', gulp.series('js'));
  gulp.watch( src + '/css/**/*.css', gulp.series('css'));
  gulp.watch([ app + '/**/*.html'], gulp.series('html'));
  done();
}));


gulp.task('default', gulp.series('watch', 'fonts', 'serve'));
