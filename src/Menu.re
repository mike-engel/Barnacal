external send : string => unit = "" [@@bs.scope "ipcRenderer"] [@@bs.module "electron"];

let show_config_menu _evt => send "show-config-menu";
let menu_styles = ReactDOMRe.Style.make
  position::"absolute"
  bottom::"0"
  height::"26px"
  width::"100%"
  borderBottomRightRadius::"5px"
  borderBottomLeftRadius::"5px"
  textAlign::"right"
  ();
let config_styles = ReactDOMRe.Style.make
  background::"transparent url(Design/cog.png) right center no-repeat"
  backgroundSize::"100% 100%"
  display::"inline-block"
  height::"18px"
  width::"18px"
  marginRight::"10px"
  textDecoration::"none"
  color::"#8d8d8d"
  cursor::"default"
  opacity::"0.7"
  ();
let component = ReasonReact.statelessComponent "Menu";
let make _children => {
  ...component,
  render: fun _self => {
    <div style=(menu_styles)>
      <a style=(config_styles) href="#" onClick=show_config_menu> </a>
    </div>
  }
}
