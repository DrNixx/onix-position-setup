const log = require('fancy-log');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpack = require('webpack');

const PATHS = require('../paths');
const webpackConfig = require('../webpack.config');
const { hmrEnabled } = require('../config');

const browserSync = require('browser-sync').create();
const bundler = webpack(webpackConfig);

let watchFiles = [
	PATHS.build.html + '*.html',
	PATHS.build.styles + '*.css'
];

if (!hmrEnabled) {
	watchFiles.push(PATHS.build.scripts + '*.js');
}

module.exports = function() {
	browserSync.init({
		server: {
			baseDir: './public',
			middleware: hmrEnabled
			? [
					webpackDevMiddleware(bundler, {
						publicPath: webpackConfig.output.publicPath
					}),
					webpackHotMiddleware(bundler, {
						log: log,
					}),
			  ]
			: [],
		},
		injectchanges: true,
		notify: false,
		open: false,
		port: 9000,
		logPrefix: 'SP.Starter',
		files: watchFiles,
	});
}

module.exports.displayName = 'server';