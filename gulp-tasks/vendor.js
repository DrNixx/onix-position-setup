const gulp = require('gulp');

const { PRODUCTION } = require('../config');
const PATHS = require('../paths');

module.exports = function() {
    gulp.src([
        './node_modules/bootstrap/dist/**/*.*'
        ])
        .pipe(gulp.dest(PATHS.build.assets));

    return gulp.src([
        './node_modules/onix-board-assets/dist/assets/**/*.*'
        ])
        .pipe(gulp.dest(PATHS.build.assets));
}

module.exports.displayName = 'vendor';