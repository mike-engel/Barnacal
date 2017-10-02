let quit_app _evt => FFI.Electron.send "quit-app";

let update_app _evt => FFI.Electron.send "install-update";
let show_about _evt => FFI.Electron.send "show-about";

let menu_styles =
  ReactDOMRe.Style.make
    position::"relative"
    display::"flex"
    alignItems::"center"
    justifyContent::"space-between"
    bottom::"0"
    height::"26px"
    width::"100%"
    borderBottomRightRadius::"5px"
    borderBottomLeftRadius::"5px"
    textAlign::"right"
    padding::"0 1em"
    marginBottom::"0.5em"
    ();

let quit_styles =
  ReactDOMRe.Style.make
    display::"inline-block"
    height::"15px"
    width::"15px"
    marginLeft::"0.5em"
    textDecoration::"none"
    cursor::"pointer"
    ();

let show_about_styles =
  ReactDOMRe.Style.make
    display::"inline-block"
    height::"15px"
    width::"15px"
    textDecoration::"none"
    cursor::"pointer"
    ();

let update_styles = ReactDOMRe.Style.make color::"#FFF" fontSize::"12px" ();

let link_styles =
  ReactDOMRe.Style.make color::"#F012BE" fontSize::"12px" textDecoration::"none" ();

let component = ReasonReact.statelessComponent "Menu";

let power =
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FFF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>;

let info =
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FFF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="8" />
  </svg>;

let make ::update_available _children => {
  ...component,
  render: fun _self => {
    let update_el =
      update_available ?
        <span style=update_styles>
          (ReasonReact.stringToElement "An update is available. ")
          <a style=link_styles href="#" onClick=update_app>
            (ReasonReact.stringToElement "Install now")
          </a>
        </span> :
        ReasonReact.stringToElement "";
    <div style=menu_styles>
      <span style=update_styles> update_el </span>
      <div>
        <a style=show_about_styles href="#" onClick=show_about> info </a>
        <a style=quit_styles href="#" onClick=quit_app> power </a>
      </div>
    </div>
  }
};
