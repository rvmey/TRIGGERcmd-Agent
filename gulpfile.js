var gulp = require('gulp'),
   //  browserify = require('gulp-browserify'),
    concatCss = require('gulp-concat-css'),
    run = require('gulp-run');

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babelify = require('babelify');


var src = './process',
    app = './app';

// gulp.task('js', gulp.series(function(done) {
//   return gulp.src( src + '/js/*.js' )
//     .pipe(browserify({
//       transform: 'reactify',
//       extensions: 'browserify-css',
//       debug: true
//     }))
//     .on('error', function (err) {
//       console.error('Error!', err.message);
//     })
//     .pipe(gulp.dest(app + '/js'));
//   done();
// }));

gulp.task('AddAppointment', () => {
  return browserify(src + '/js/AddAppointment.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('AddAppointment.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('AptList', () => {
  return browserify(src + '/js/AptList.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('AptList.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('EditAppointment', () => {
  return browserify(src + '/js/EditAppointment.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('EditAppointment.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('exampleAptList', () => {
  return browserify(src + '/js/exampleAptList.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('exampleAptList.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('exampleHeaderNav', () => {
  return browserify(src + '/js/exampleHeaderNav.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('exampleHeaderNav.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('examples', () => {
  return browserify(src + '/js/examples.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('examples.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('exampleToolbar', () => {
  return browserify(src + '/js/exampleToolbar.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('exampleToolbar.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('HeaderNav', () => {
  return browserify(src + '/js/HeaderNav.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('HeaderNav.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('render', () => {
  return browserify(src + '/js/render.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('render.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

gulp.task('Toolbar', () => {
  return browserify(src + '/js/Toolbar.js')
      .transform(babelify, { extensions: ['.tsx', '.ts', '.js'], presets: ['@babel/preset-env', '@babel/preset-react'] })
      .bundle()
      .pipe(source('Toolbar.js')) // Readable Stream -> Stream Of Vinyl Files
      .pipe(buffer()) // Vinyl Files -> Buffered Vinyl Files
      // Pipe Gulp Plugins Here
      .pipe(gulp.dest('app/js'));
});

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


gulp.task('serve', gulp.series(
  'html', 
  'AddAppointment', 
  'AptList', 
  'EditAppointment', 
  'exampleAptList', 
  'exampleHeaderNav', 
  'examples', 
  'exampleToolbar', 
  'HeaderNav', 
  'render', 
  'Toolbar', 
  'css', 
  function(done) {
  run('electron app/main.js').exec();
  done();
}));

gulp.task('watch', gulp.series('serve', function(done) {
  gulp.watch( src + '/js/**/*', gulp.series('render'));
  gulp.watch( src + '/css/**/*.css', gulp.series('css'));
  gulp.watch([ app + '/**/*.html'], gulp.series('html'));
  done();
}));


gulp.task('default', gulp.series('watch', 'fonts', 'serve'));
