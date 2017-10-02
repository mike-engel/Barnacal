let component = ReasonReact.statelessComponent "Header";

let header_styles =
  ReactDOMRe.Style.make
    marginBottom::"10px"
    textAlign::"center"
    backgroundColor::"#000"
    borderTopRightRadius::"4px"
    borderTopLeftRadius::"4px"
    paddingTop::"0px"
    display::"flex"
    alignItems::"center"
    ();

let header_text_styles =
  ReactDOMRe.Style.make
    margin::"0"
    lineHeight::"40px"
    color::"#fff"
    fontSize::"22px"
    padding::"0.5em 0"
    flexGrow::"2"
    cursor::"pointer"
    ();

let navigation_styles =
  ReactDOMRe.Style.make textDecoration::"none" color::"#FFF" fontSize::"1.2rem" width::"50px" ();

let make ::reduce ::date ::onNextMonth ::onLastMonth ::resetDate _children => {
  ...component,
  render: fun _self => {
    let current_month = FFI.DateFns.format_date date "MMMM YYYY";
    <div style=header_styles>
      <a
        href="#"
        style=navigation_styles
        dangerouslySetInnerHTML={"__html": "&larr;"}
        onClick=(reduce onLastMonth)
      />
      <h1 style=header_text_styles onClick=(reduce resetDate)>
        (ReasonReact.stringToElement current_month)
      </h1>
      <a
        href="#"
        style=navigation_styles
        dangerouslySetInnerHTML={"__html": "&rarr;"}
        onClick=(reduce onNextMonth)
      />
    </div>
  }
};
