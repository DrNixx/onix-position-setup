const gulp = require('gulp');
const clean = require('./gulp-tasks/clean');
const scripts = require('./gulp-tasks/scripts');
//var vendor from './gulp-tasks/vendor';
//var watch from './gulp-tasks/watch';
//var server from './gulp-tasks/server';

const { series, parallel } = require('gulp');

/*
let build = series(clean, parallel(webpack, html, vendor));
gulp.task("build", build, function() {
    console.log('Building public...');
});
*/

let compile = series(clean, parallel(scripts));
gulp.task("compile", compile, function() {
    console.log('Building scripts...');
});

/*
gulp.task('default', parallel('build', watch, server));
*/