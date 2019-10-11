import gulp from 'gulp';

import { PRODUCTION } from '../config';
import PATHS from '../paths';

export default function vendor() {
    return gulp.src([
        './node_modules/chessground/dist/*.*'
        ])
        .pipe(gulp.dest(PATHS.build.assets + '/vendor/chessground/'));
}