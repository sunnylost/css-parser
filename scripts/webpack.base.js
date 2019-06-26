let path = require('path')

module.exports = {
    mode: 'development',
    entry: path.resolve('./src/index.js'),
    output: {
        filename: 'index.js',
        path: path.resolve('./dist'),
        // library: 'CSSParser',
        libraryTarget: 'commonjs'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    }
}
