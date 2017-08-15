let component = ReasonReact.statefulComponent "Index";

let container_styles = ReactDOMRe.Style.make height::"255px" ();

let caret_styles =
  ReactDOMRe.Style.make
    borderLeft::"solid transparent 10px"
    borderRight::"solid transparent 10px"
    borderBottom::"solid #000 10px"
    top::"0"
    content::"' '"
    height::"10px"
    left::"50%"
    marginLeft::"-10px"
    position::"absolute"
    width::"0"
    ();

let onNextMonth _evt self => ReasonReact.Update (FFI.DateFns.add_months self.ReasonReact.state 1);

let onLastMonth _evt self => ReasonReact.Update (FFI.DateFns.sub_months self.ReasonReact.state 1);

let resetDate _evt _self => ReasonReact.Update (Js.Date.now ());

let make _children => {
  ...component,
  initialState: fun () => Js.Date.now (),
  render: fun self => {
    let date = self.state;
    FFI.DOM.add_event_listener "visibilitychange" (self.ReasonReact.update resetDate);
    <div style=container_styles>
      <Popover>
        <Header self date onNextMonth onLastMonth resetDate />
        <Calendar date />
        <Menu />
      </Popover>
      <div style=caret_styles />
    </div>
  }
};
