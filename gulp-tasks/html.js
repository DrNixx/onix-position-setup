/*
import gulp from 'gulp';
import log from 'fancy-log';
import nunjucksRender from 'gulp-nunjucks-api';
import notifier from 'node-notifier';
import plumber from 'gulp-plumber';
import beautify from 'gulp-jsbeautifier';

import { PRODUCTION } from '../config';
import PATHS from '../paths';
import * as extensions from '../src/templates/lib/extensions.js';
import filters from '../src/templates/lib/filters.js';
import functions from '../src/templates/lib/functions.js';
import gulpif from 'gulp-if';

const globalData = require('../global-data.json');
const pieces = require('../src/pieces/pieces.json');

export default function html() {
	return gulp
		.src(PATHS.src.nunj)
		.pipe(
			plumber({
				errorHandler: function(err) {
					log(err.message);
					notifier.notify({
						title: 'Nunjucks compilation error',
						message: err.message,
					});
				},
			})
		)
		.pipe(
			nunjucksRender({
				src: PATHS.src.templates,
				data: Object.assign(
					{
						DEVELOP: !PRODUCTION,
					},
					globalData,
					pieces
				),
				extensions,
				filters,
				functions,
				trimBlocks: true,
				lstripBlocks: true,
				autoescape: false,
			})
		)
		.pipe(
			gulpif(
				PRODUCTION,
				beautify({
					max_preserve_newlines: 1,
					wrap_line_length: 0,
				})
			)
		)
		.pipe(gulp.dest(PATHS.build.html));
}
*/