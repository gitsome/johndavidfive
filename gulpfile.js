const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const csso = require('gulp-csso');

const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

const task_html = () => {
    return gulp.src(['templates/home.html'])
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('.'))
};

const task_css = () => {
    return gulp.src('styles/styles.css')
        .pipe(csso({}))
        .pipe(gulp.dest('.'));
};

const task_js = () => {
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
};

exports.default = gulp.series(task_css, task_html, task_js);