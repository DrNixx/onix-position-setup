var path = require("path");
var webpack = require('webpack');

module.exports = {
    entry: {
        react: ['react', 'react-dom'],
        app: ["./built/index.js"],
        tests: ["./built/test/index.js"],
    },

    output: {
        libraryTarget: "umd",
        library: "onix",
        path: path.join(__dirname, "public"),
		filename: "pos-builder.[name].js"
    },

    plugins:[
        new webpack.optimize.CommonsChunkPlugin({ name: "react" }),
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        extensions: [".webpack.js", ".web.js", ".js"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, enforce: "pre", loader: "source-map-loader" }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
    },
};