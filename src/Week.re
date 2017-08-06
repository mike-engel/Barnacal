let component = ReasonReact.statelessComponent "Week";

let week_styles = ReactDOMRe.Style.make textAlign::"center" color::"#FFF" ();

let day_styles is_today =>
  ReactDOMRe.Style.make
    padding::"0.25em 0" color::(is_today ? "#7FDBFF" : "#FFF") fontWeight::"700" ();

let weekday idx date => {
  let date_element =
    switch date {
    | (Some date_string, _) => string_of_int date_string
    | (None, _) => ""
    };
  let (_, is_today) = date;
  <td style=(day_styles is_today) key=(string_of_int idx)>
    (ReasonReact.stringToElement date_element)
  </td>
};

let make ::week _children => {
  ...component,
  render: fun _self => {
    let weekday_elements = Array.mapi weekday week;
    ReasonReact.createDomElement "tr" props::{"style": week_styles} weekday_elements
  }
};
