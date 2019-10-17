const gulpWatch = require('gulp-watch');
const PATHS = require('../paths');
const html = require('./html');
const pieces = require('./pieces');
const boards = require('./boards');
const common = require('./common');

export default function watch() {
	gulpWatch([PATHS.watch.nunj], html);
	gulpWatch([PATHS.watch.pieces], pieces);
	gulpWatch([PATHS.watch.boards], boards);
	gulpWatch([PATHS.watch.common], common);
}
