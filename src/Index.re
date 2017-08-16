if (FFI.Process.node_env === "production") {
  FFI.Raven.(
    config
      "https://970be29a9988418ebe1215c7f12223ef@sentry.io/204281"
      {"release": FFI.PackageJSON.version} |>
    install ()
  )
};

ReactDOMRe.renderToElementWithId <App /> "app";
