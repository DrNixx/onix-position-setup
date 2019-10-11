import gulp from 'gulp';
import clean from './gulp-tasks/clean';
import scripts from './gulp-tasks/scripts';
import vendor from './gulp-tasks/vendor';
import watch from './gulp-tasks/watch';
import server from './gulp-tasks/server';

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