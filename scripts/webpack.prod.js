let baseConfig = require('./webpack.base')
let webpackMerge = require('webpack-merge')

module.exports = webpackMerge(baseConfig, {
    mode: 'production'
})
