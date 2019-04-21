type weekday = (int, int, int, bool);

let component = ReasonReact.statelessComponent("CalendarBody");

let table_styles = ReactDOMRe.Style.make();

/*
 * Sunday is first day for JS Date
 * sunday_index = 1
 */
let week_day_number = (date) => {
  let sunday_index = 1;
  let user_first_day = FFI.Electron.getGlobal("global")##firstWeekday;
  let day_index = FFI.DateFns.get_day(date);

  let offset_index = user_first_day - sunday_index;
  let index = day_index - offset_index;

  switch index {
  | index when index === day_index => day_index
  | index when index > 0 => index
  | index when index < 0 => 7 + index
  | index when index === 0 => 0
  };
};

let week_of_month = (date, day_of_month) => {
  let first_of_month = FFI.DateFns.start_of_month(date);
  let first_weekday = week_day_number(first_of_month);
  let offset = day_of_month + first_weekday - 1;
  offset / 7
};

let month_date = (date, idx, _val) => {
  let day_of_month = idx + 1;
  let date = FFI.DateFns.set_date(date, day_of_month);
  let day_of_week = week_day_number(date);
  let week = week_of_month(date, day_of_month);
  let is_today = FFI.DateFns.is_today(date);
  (week, day_of_week, day_of_month, is_today)
};

let fold_weeks = (container, weekday) => {
  let (week, day_of_week, date, is_today) = weekday;
  container[week][day_of_week] = (Some(date), is_today);
  container
};

let parse_weeks = (date, day_count) => {
  let empty_dates = Array.make(day_count, date);
  let dates = Array.mapi(month_date(date), empty_dates);
  let empty_weeks = Array.make_matrix(6, 7, (None, false));
  let weeks = Array.fold_left(fold_weeks, empty_weeks, dates);
  weeks
};

let week_component = (idx, week) => <Week key=(string_of_int(idx)) week />;

let make = (~date, _children) => {
  ...component,
  render: (_self) => {
    let day_count = FFI.DateFns.get_days_in_month(date);
    let weeks = parse_weeks(date, day_count);
    ReasonReact.createDomElement(
      "tbody",
      ~props={"style": table_styles},
      Array.mapi(week_component, weeks)
    )
  }
};
