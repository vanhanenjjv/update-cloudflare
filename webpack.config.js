const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',
  entry: './src/index.js',
  output: {
    filename: "update-cloudflare.js",
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })
  ]
};
