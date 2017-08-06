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
    marginLeft::"-13px"
    position::"absolute"
    width::"0"
    ();

let onNextMonth _evt self => ReasonReact.Update (DateFns.add_months self.ReasonReact.state 1);

let onLastMonth _evt self => ReasonReact.Update (DateFns.sub_months self.ReasonReact.state 1);

let reset_date _evt _self =>
  if DomFns.hidden {
    ReasonReact.Update (Js.Date.now ())
  } else {
    ReasonReact.NoUpdate
  };

let make _children => {
  ...component,
  initialState: fun () => Js.Date.now (),
  render: fun self => {
    let date = self.state;
    DomFns.add_event_listener "visibilitychange" (self.ReasonReact.update reset_date);
    <div style=container_styles>
      <Popover> <Header self date onNextMonth onLastMonth /> <Calendar date /> <Menu /> </Popover>
      <div style=caret_styles />
    </div>
  }
};
