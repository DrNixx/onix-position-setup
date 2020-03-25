const path = require('path');
const webpack = require('webpack');

const { PRODUCTION, hmrEnabled } = require('./config');
const PATHS = require('./paths');

const entryPoints = {
    //app: path.resolve(__dirname, PATHS.src.scripts),
    tests: path.resolve(__dirname, PATHS.src.tests),
};

const hotMiddlewareString = 'webpack-hot-middleware/client?quiet=true&noInfo=true';

module.exports = {
    entry: Object.keys(entryPoints).reduce((acc, currentKey) => {
		acc[currentKey] = [entryPoints[currentKey]];
		!PRODUCTION && hmrEnabled && acc[currentKey].push(hotMiddlewareString);
		return acc;
    }, {}),
    
	output: {
        libraryTarget: "umd",
        library: "onix",
		filename: 'pos-builder.[name].js',
		path: path.resolve(__dirname, PATHS.build.scripts),
		publicPath: '/assets/js',
    },
    
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { configFile: 'tsconfig.webpack.json' },
                exclude: /node_modules/
            },
            {
				type: 'javascript/auto',
				test: /\.json$/,
				loader: 'json-loader',
			},
        ] 
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        modules: ['node_modules'],
    },

    plugins: PRODUCTION ? [] : [new webpack.HotModuleReplacementPlugin()],
	devtool: PRODUCTION ? false : '#eval-source-map',
	mode: PRODUCTION ? 'production' : 'development',
	optimization: {
		minimize: PRODUCTION,
	},
	watch: !PRODUCTION && !hmrEnabled,
};