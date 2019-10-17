const PATHS = require('../paths');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge2');

const tsProj = ts.createProject('tsconfig.json');

module.exports = function() {
        const reporter = ts.reporter.fullReporter();

        const tsResult = gulp.src(['src/js/**/*.ts', 'src/js/**/*.tsx'])
            .pipe(sourcemaps.init())
            .pipe(tsProj(reporter));

        return merge([
            tsResult.dts
                .pipe(gulp.dest(PATHS.build.scripts)),
            tsResult.js
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(PATHS.build.scripts))
        ]);
}

module.exports.displayName = 'scripts';
