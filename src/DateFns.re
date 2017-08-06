type format_options = { locale: string };

external format_date : float => string => string = "date-fns/format" [@@bs.module];
external format_date_with_options : float => string => format_options => string = "date-fns/format" [@@bs.module];
external get_year : float => float = "date-fns/get_year" [@@bs.module];
