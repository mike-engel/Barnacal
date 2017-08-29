const path = require("path");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const config = require("../webpack.dev.js");
const defaultPort = 8080;
const compiler = webpack(config);

const PORT = process.env.PORT || defaultPort;

const server = new WebpackDevServer(compiler, {
  contentBase: path.resolve(__dirname, "../public"),
  publicPath: "/",
  compress: true,
  watchContentBase: true,
  watchOptions: {
    ignored: /node_modules/
  },
  overlay: true,
  clientLogLevel: "error",
  stats: "errors-only",
  hot: true
});

try {
  server.listen(PORT);
} catch (e) {
  console.error(e);
  process.exit(1);
}

["SIGINT", "SIGTERM", "exit"].forEach(sig => {
  process.on(sig, () => {
    server.close();
    process.exit();
  });
});
