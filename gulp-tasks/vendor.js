const gulp = require('gulp');

const { PRODUCTION } = require('../config');
const PATHS = require('../paths');

module.exports = function() {
    return gulp.src([
        './node_modules/chessground/dist/*.*'
        ])
        .pipe(gulp.dest(PATHS.build.assets + '/vendor/chessground/'));
}