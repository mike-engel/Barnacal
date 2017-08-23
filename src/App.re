type appState = {
  date: float,
  updateAvailable: bool
};

let component = ReasonReact.statefulComponent "Index";

let container_styles = ReactDOMRe.Style.make height::"100%" ();

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

let onNextMonth _evt {ReasonReact.state: state} =>
  ReasonReact.Update {...state, date: FFI.DateFns.add_months state.date 1};

let onLastMonth _evt {ReasonReact.state: state} =>
  ReasonReact.Update {...state, date: FFI.DateFns.sub_months state.date 1};

let resetDate _evt {ReasonReact.state: state} =>
  ReasonReact.Update {...state, date: Js.Date.now ()};

let updateAvailable _evt {ReasonReact.state: state} =>
  ReasonReact.Update {...state, updateAvailable: true};

let make _children => {
  ...component,
  initialState: fun () => {date: Js.Date.now (), updateAvailable: false},
  didMount: fun {ReasonReact.update: update} => {
    FFI.Electron.on "background-update" (update resetDate);
    FFI.Electron.on "update-available" (update updateAvailable);
    ReasonReact.NoUpdate
  },
  render: fun {state, update} => {
    let date = state.date;
    let update_available = state.updateAvailable;
    <div style=container_styles>
      <Popover>
        <Header update date onNextMonth onLastMonth resetDate />
        <Calendar date />
        <Menu update_available />
      </Popover>
      <div style=caret_styles />
    </div>
  }
};
