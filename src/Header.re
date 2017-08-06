let component = ReasonReact.statelessComponent "Header";
let header_styles = ReactDOMRe.Style.make
  marginBottom::"10px"
  textAlign::"center"
  height::"40px"
  backgroundColor::"#000"
  borderTopRightRadius::"4px"
  borderTopLeftRadius::"4px"
  paddingTop::"0px"
  ();
let header_text_styles = ReactDOMRe.Style.make
  margin::"0"
  lineHeight::"40px"
  color::"#fff"
  fontSize::"22px"
  ();
let make _children => {
  ...component,
  render: fun _self => {
    let current_date = Js.Date.now ();
    let current_month = DateFns.format_date current_date "MMMM YYYY";

    <div style=(header_styles)>
      <h1 style=(header_text_styles)> (ReasonReact.stringToElement current_month) </h1>
    </div>
  }
}
