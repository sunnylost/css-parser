let path = require('path');

module.exports = {
    entry: path.resolve('./src/index.js'),

    output: {
        filename: 'index.js',
        path: path.resolve('./dist'),
        library: 'CSSParser',
        libraryTarget: 'umd',
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
};
