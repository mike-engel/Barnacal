type event;

external add_event_listener : string => (event => unit) => unit =
  "document.addEventListener" [@@bs.val];

external hidden : bool = "document.hidden" [@@bs.val];
