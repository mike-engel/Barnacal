if (FFI.Process.node_env === "production") {
  FFI.Raven.(
    config
      "https://d29fde94d1814ac09585e75e67d565a5@sentry.io/203834"
      {"release": FFI.PackageJSON.version} |>
    install ()
  )
};

ReactDOMRe.renderToElementWithId <App /> "app";
