import PATHS from '../paths';

const browserSync = require('browser-sync').create();

let watchFiles = [
	PATHS.build.assets + '*.css',
	PATHS.build.boards + '*.css',
	PATHS.build.pieces + '*.css', 
	PATHS.build.html + '*.html'
];

export default function server() {
	browserSync.init({
		server: {
			baseDir: './public',
			middleware: [],
		},
		injectchanges: true,
		notify: false,
		open: false,
		port: 9000,
		logPrefix: 'SP.Starter',
		files: watchFiles,
	});
}
