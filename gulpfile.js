const gulp = require('gulp');
const clean = require('./gulp-tasks/clean');
const scripts = require('./gulp-tasks/scripts');
const styles = require('./gulp-tasks/styles');
const webpack = require('./gulp-tasks/webpack');
const vendor = require('./gulp-tasks/vendor');
const html = require('./gulp-tasks/html');
const watch = require('./gulp-tasks/watch');
const server = require('./gulp-tasks/server');

const { series, parallel } = require('gulp');

// let build = series(clean, parallel(webpack, html, vendor));
let build = series(clean, parallel(html, styles, vendor, webpack));
gulp.task("build", build, function() {
    console.log('Building public...');
});

let compile = series(clean, parallel(scripts, styles));
gulp.task("compile", compile, function() {
    console.log('Building scripts...');
});

gulp.task('default', parallel('build', watch, server));