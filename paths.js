const { PRODUCTION } = require('./config');
const base = PRODUCTION ? 'dist' : 'public';
const assets = base + (PRODUCTION ? '' : '/assets');

module.exports = {
	build: {
		html: base + '/',
		assets: assets + '/',
		scripts: assets + '/js/',
	},
	src: {
		scripts: './src/js/index.ts',
		tests: './src/test/index.ts',
		templates: './src/templates/',
		nunj: 'src/templates/*.nunj',
	},
	watch: {
		nunj: 'src/templates/**/*.nunj',
		scripts: 'src/js/**/*.ts',
	},
	clean: base + '/*',
	deploy: '../web/boards/',
};
