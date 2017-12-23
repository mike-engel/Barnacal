let component = ReasonReact.statelessComponent("Calendar");

let calendar_styles = ReactDOMRe.Style.make(~width="100%", ~padding="0 1em", ());

let make = (~date, _children) => {
  ...component,
  render: (_self) =>
    <table style=calendar_styles> <CalendarHeader /> <CalendarBody date /> </table>
};
