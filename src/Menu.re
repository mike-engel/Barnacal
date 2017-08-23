let quit_app _evt => FFI.Electron.send "quit-app";

let update_app _evt => FFI.Electron.send "install-update";

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

let config_styles =
  ReactDOMRe.Style.make
    display::"inline-block"
    height::"15px"
    width::"14px"
    textDecoration::"none"
    cursor::"default"
    ();

let update_styles = ReactDOMRe.Style.make color::"#FFF" fontSize::"12px" ();

let link_styles =
  ReactDOMRe.Style.make color::"#F012BE" fontSize::"12px" textDecoration::"none" ();

let component = ReasonReact.statelessComponent "Menu";

let cog =
  <svg width="14px" height="15px" viewBox="0 0 14 15">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <rect fill="#FFF" x="6" y="0" width="2" height="8" rx="1" />
      <path
        d="M2.99266802,3.53436007 C1.76942592,4.63279117 1,6.22654106 1,8 C1,11.3137085 3.6862915,14 7,14 C10.3137085,14 13,11.3137085 13,8 C13,6.21282738 12.2186285,4.60815384 10.9788737,3.50896745"
        stroke="#FFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
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
      <a style=config_styles href="#" onClick=quit_app> cog </a>
    </div>
  }
};
