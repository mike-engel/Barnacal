let component = ReasonReact.statelessComponent "Popover";
let popover_styles = ReactDOMRe.Style.make
  borderRadius::"5px"
  height::"159px"
  width::"250px"
  padding::"0"
  backgroundColor::"#fff"
  margin::"0 auto"
  marginTop::"10px"
  boxShadow::"0 10px 20px 4px rgba(0, 0, 0, 0.25)"
  position::"relative"
  cursor::"default"
  ();
let make children => {
  ...component,
  render: fun _self => ReasonReact.createDomElement "div" props::{"style": popover_styles} children
}
