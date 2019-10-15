import PATHS from '../paths';

import gulp from 'gulp';
import ts from 'gulp-typescript';
import sourcemaps from 'gulp-sourcemaps';
import merge from 'merge2';

const tsProj = ts.createProject('tsconfig.json');

export default function scripts() {
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
