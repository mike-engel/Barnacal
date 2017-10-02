type appState = {
  date: float,
  updateAvailable: bool
};

type action =
  | NextMonth
  | PreviousMonth
  | ResetDate
  | UpdateAvailable;

let component = ReasonReact.reducerComponent "Index";

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

let onNextMonth _evt =>
  NextMonth;

let onLastMonth _evt =>
  PreviousMonth;

let resetDate _evt =>
  ResetDate;

let updateAvailable _evt =>
  UpdateAvailable;

let make _children => {
  ...component,
  initialState: fun () => {date: Js.Date.now (), updateAvailable: false},
  didMount: fun {ReasonReact.reduce: reduce} => {
    FFI.Electron.on "background-update" (reduce resetDate);
    FFI.Electron.on "update-ready" (reduce updateAvailable);
    ReasonReact.NoUpdate
  },
  reducer: fun action state => {
    switch action {
    | NextMonth => ReasonReact.Update {...state, date: FFI.DateFns.add_months state.date 1}
    | PreviousMonth => ReasonReact.Update {...state, date: FFI.DateFns.sub_months state.date 1}
    | ResetDate => ReasonReact.Update {...state, date: Js.Date.now ()}
    | UpdateAvailable => ReasonReact.Update {...state, updateAvailable: true};
    }
  },
  render: fun {state, reduce} => {
    let date = state.date;
    let update_available = state.updateAvailable;
    <div style=container_styles>
      <Popover>
        <Header reduce date onNextMonth onLastMonth resetDate />
        <Calendar date />
        <Menu update_available />
      </Popover>
      <div style=caret_styles />
    </div>
  }
};
