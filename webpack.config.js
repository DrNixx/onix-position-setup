const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map', 

    entry: {
        react: ['react', 'react-dom'],
        app: ["./src/index.ts"],
        tests: ["./src/test/index.ts"]
    },

    output: {
        libraryTarget: "umd",
        library: "onix",
        path: path.join(__dirname, "public"),
        filename: "pos-builder.[name].js"
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },

    devServer: {
      contentBase: './public'
    }
};