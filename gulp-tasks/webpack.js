const log = require('fancy-log')
const webpack = require('webpack');

const config = require('../webpack.config.js');

const defaultStatsOptions = {
	colors: true,
	hash: false,
	timings: false,
	chunks: false,
	chunkModules: false,
	modules: false,
	children: true,
	version: true,
	cached: false,
	cachedAssets: false,
	reasons: false,
	source: false,
	errorDetails: false,
};

module.exports = function() {
	return new Promise(resolve =>
		webpack(config, (err, stats) => {
			if (err) {
				log('Webpack', err);
			}

			// log(stats.toString(defaultStatsOptions));

			resolve();
		})
	);
}

module.exports.displayName = 'scripts';