const merge = require("webpack-merge");
const config = require("./webpack.common");
const webpack = require("webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = merge(config, {
  plugins: [
    new UglifyJSPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    })
  ]
});
