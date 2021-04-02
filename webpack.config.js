const path = require('path')

module.exports = {
  entry: './client/main.js',
  mode: 'development',
  devtool: 'eval-source-map',
  // mode: 'production',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    modules: [path.resolve('/Users/oli/code'), 'node_modules'],
  },
}
