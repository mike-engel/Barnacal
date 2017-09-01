// Generated by BUCKLESCRIPT VERSION 1.9.1, PLEASE EDIT WITH CARE
'use strict';

import * as Menu        from "./menu.js";
import * as Block       from "bs-platform/lib/es6/block.js";
import * as Curry       from "bs-platform/lib/es6/curry.js";
import * as React       from "react";
import * as Header      from "./header.js";
import * as Popover     from "./popover.js";
import * as Calendar    from "./calendar.js";
import * as Electron    from "electron";
import * as ReasonReact from "reason-react/lib/es6/src/reasonReact.js";
import * as Add_months  from "date-fns/add_months";
import * as Sub_months  from "date-fns/sub_months";

var component = ReasonReact.statefulComponent("Index");

var container_styles = {
  height: "100%"
};

var caret_styles = {
  borderRight: "solid transparent 10px",
  borderBottom: "solid #000 10px",
  borderLeft: "solid transparent 10px",
  content: "' '",
  height: "10px",
  left: "50%",
  marginLeft: "-10px",
  position: "absolute",
  top: "0",
  width: "0"
};

function onNextMonth(_, param) {
  var state = param[/* state */3];
  return /* Update */Block.__(0, [/* record */[
              /* date */Add_months(state[/* date */0], 1),
              /* updateAvailable */state[/* updateAvailable */1]
            ]]);
}

function onLastMonth(_, param) {
  var state = param[/* state */3];
  return /* Update */Block.__(0, [/* record */[
              /* date */Sub_months(state[/* date */0], 1),
              /* updateAvailable */state[/* updateAvailable */1]
            ]]);
}

function resetDate(_, param) {
  return /* Update */Block.__(0, [/* record */[
              /* date */Date.now(),
              /* updateAvailable */param[/* state */3][/* updateAvailable */1]
            ]]);
}

function updateAvailable(_, param) {
  return /* Update */Block.__(0, [/* record */[
              /* date */param[/* state */3][/* date */0],
              /* updateAvailable : true */1
            ]]);
}

function make() {
  var newrecord = component.slice();
  newrecord[/* didMount */4] = (function (param) {
      var update = param[/* update */2];
      Electron.ipcRenderer.on("background-update", Curry._1(update, resetDate));
      Electron.ipcRenderer.on("update-ready", Curry._1(update, updateAvailable));
      return /* NoUpdate */0;
    });
  newrecord[/* render */9] = (function (param) {
      var state = param[/* state */3];
      var date = state[/* date */0];
      var update_available = state[/* updateAvailable */1];
      return React.createElement("div", {
                  style: container_styles
                }, ReasonReact.element(/* None */0, /* None */0, Popover.make(/* array */[
                          ReasonReact.element(/* None */0, /* None */0, Header.make(param[/* update */2], date, onNextMonth, onLastMonth, resetDate, /* array */[])),
                          ReasonReact.element(/* None */0, /* None */0, Calendar.make(date, /* array */[])),
                          ReasonReact.element(/* None */0, /* None */0, Menu.make(update_available, /* array */[]))
                        ])), React.createElement("div", {
                      style: caret_styles
                    }));
    });
  newrecord[/* initialState */10] = (function () {
      return /* record */[
              /* date */Date.now(),
              /* updateAvailable : false */0
            ];
    });
  return newrecord;
}

export {
  component        ,
  container_styles ,
  caret_styles     ,
  onNextMonth      ,
  onLastMonth      ,
  resetDate        ,
  updateAvailable  ,
  make             ,
  
}
/* component Not a pure module */