const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: ["./lib/es6/src/index.js"],
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "./public"),
    publicPath: "/public"
  },
  plugins: [new CleanWebpackPlugin(["public"], { verbose: false })],
  target: "electron-main"
};
