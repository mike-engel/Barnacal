let component = ReasonReact.statelessComponent("CalendarHeader");

let weekdays = [|"S", "M", "T", "W", "T", "F", "S"|];

let column_styles =
  ReactDOMRe.Style.make(
    ~textTransform="uppercase",
    ~textAlign="center",
    ~fontSize="0.725rem",
    ~color="#FFF",
    ~opacity="0.5",
    ~padding="0.3em 0",
    ~width="14.28%",
    ()
  );

let column_header = (idx: int, day) =>
  <th key=(string_of_int(idx)) style=column_styles> (ReasonReact.stringToElement(day)) </th>;

let make = (_children) => {
  ...component,
  render: (_self) =>
    <thead> <tr> (ReasonReact.arrayToElement(Array.mapi(column_header, weekdays))) </tr> </thead>
};
