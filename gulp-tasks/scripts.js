import PATHS from '../paths';

import gulp from 'gulp';
import ts from 'gulp-typescript';

const tsProject = ts.createProject('tsconfig.json');

export default function scripts() {
	return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(PATHS.build.scripts));
}
