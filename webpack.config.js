const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'source-map', 

    entry: {
        app: ["./src/js/index.ts"],
        tests: ["./src/test/index.ts"]
    },

    output: {
        libraryTarget: "umd",
        library: "onix",
        path: path.join(__dirname, "public/js"),
        filename: "pos-builder.[name].js"
    },

    plugins: [
        new CleanWebpackPlugin(['public/js'])
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { configFile: 'tsconfig.webpack.json' },
                exclude: /node_modules/
            }
        ]
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    }
};