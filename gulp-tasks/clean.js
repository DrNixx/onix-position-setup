const del = require('del');
const PATHS = require('../paths');

module.exports = function(cb) {
	del.sync(PATHS.clean, {force: true});
  	cb();
}

module.exports.displayName = 'clean';