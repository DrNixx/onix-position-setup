const log = require('fancy-log');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpack = require('webpack');
const notifier = require('node-notifier');

const PATHS = require('../paths');
const webpackConfig = require('../webpack.config');
const { hmrEnabled } = require('../config');

const browserSync = require('browser-sync').create();
const bundler = webpack(webpackConfig);

let watchFiles = [
	PATHS.build.html + '*.html'
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
						publicPath: webpackConfig.output.publicPath,
						logLevel: 'info',
						reporter: (middlewareOptions, options) => {
							const { state, stats } = options;
							log(state);
							log(stats);
							if (state) {
								if (stats.hasErrors()) {
									notifier.notify({
										title: 'Webpack compilation error',
										message: stats.compilation.errors[0].error.toString(),
									});
								}
							}
						},
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