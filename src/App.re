 external send : string => unit = "" [@@bs.scope "ipcRenderer"] [@@bs.module "electron"];

let show_config_menu _evt => send "show-config-menu";
let component = ReasonReact.statelessComponent "Index";
let make _children => {
  ...component,
  render: fun _self => {
    <div className="container">
      <div className="popover">
        <div className="header">
          <h1> (ReasonReact.stringToElement "Hello World") </h1>
        </div>
        <div className="menu">
          <a className="config" href="#" onClick=show_config_menu> </a>
        </div>
      </div>
    </div>
  }
};
