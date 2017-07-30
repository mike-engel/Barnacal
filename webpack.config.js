const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: ["./lib/js/src/index.js"],
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "./public"),
    publicPath: "/public"
  },
  target: "electron-main"
};
