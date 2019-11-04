const gulp = require('gulp');
const log = require('fancy-log');
const nunjucksRender = require('gulp-nunjucks-api');
const notifier = require('node-notifier');
const plumber = require('gulp-plumber');
const beautify = require('gulp-jsbeautifier');

const { PRODUCTION } = require('../config');
const PATHS = require('../paths');
const extensions = require('../src/templates/lib/extensions.js');
const filters = require('../src/templates/lib/filters.js');
const functions = require('../src/templates/lib/functions.js');
const gulpif = require('gulp-if');

const globalData = {}; //require('../global-data.json');
const pieces = {}; //require('../src/pieces/pieces.json');

module.exports = function() {
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

module.exports.displayName = 'html';