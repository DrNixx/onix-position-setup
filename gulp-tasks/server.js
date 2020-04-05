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
						publicPath: webpackConfig.output.publicPath,
						logLevel: 'info',
						reporter: (middlewareOptions, options) => {
							const { state, stats } = options;
							if (state) {
								if (stats.hasErrors()) {
									const msg = stats.compilation.errors[0].message;
									console.error(msg);
									var justText = msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
									notifier.notify({
										title: 'Webpack compilation error',
										message: justText
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