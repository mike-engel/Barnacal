const merge = require("webpack-merge");
const config = require("./webpack.common");
const webpack = require("webpack");
const WriteFilePlugin = require("write-file-webpack-plugin");
const ClosureCompilerPlugin = require("webpack-closure-compiler");

module.exports = merge(config, {
  entry: [
    "webpack-dev-server/client?http://localhost:8080",
    "webpack/hot/only-dev-server"
  ],
  plugins: [
    new WriteFilePlugin({
      log: false,
      test: /main\.js/
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development")
    })
  ]
});
