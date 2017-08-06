let component = ReasonReact.statelessComponent "Index";
let container_styles = ReactDOMRe.Style.make
  height::"255px"
  ();
let caret_styles = ReactDOMRe.Style.make
  borderLeft::"solid transparent 10px"
  borderRight::"solid transparent 10px"
  borderBottom::"solid #000 10px"
  top::"0"
  content::" "
  height::"10px"
  left::"50%"
  marginLeft::"-13px"
  position::"absolute"
  width::"0"
  ();
let make _children => {
  ...component,
  render: fun _self => {
    <div style=(container_styles)>
      <Popover>
        <Header />
        <Menu />
      </Popover>
      <div style=(caret_styles) />
    </div>
  }
};
