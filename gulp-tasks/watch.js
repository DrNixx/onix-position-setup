const gulpWatch = require('gulp-watch');
const PATHS = require('../paths');
const html = require('./html');

module.exports = function watch() {
	gulpWatch([PATHS.watch.nunj], html);
}

module.exports.displayName = 'watch';