var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var csso = require('gulp-csso');

var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');

gulp.task('html', function(){
    return gulp.src(['templates/home.html'])
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('.'))
});

gulp.task('css', function () {
    return gulp.src('styles/styles.css')
    .pipe(csso({}))
    .pipe(gulp.dest('.'));
});

gulp.task('js', function () {
    return gulp.src(
        [
            'shaderScripts/plaid.shader.js',
            'scripts/CanvasBackground.js',
            'scripts/main.js'
        ],
        {base: '.'}
    )
    .pipe(concat('johndavidfive.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('.'))
    .pipe(rename('johndavidfive.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('.'));
});

gulp.task('default', ['css', 'html', 'js']);