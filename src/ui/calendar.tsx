import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Stylable } from "./types";
import { CalendarHeader } from "./calendar_header";
import { CalendarBody } from "./calendar_body";

type Props = Stylable & {
	date: Date;
};

export const RawCalendar = ({ date, className }: Props) => {
	const [firstWeekday, setFirstWeekday] = useState(1);

	useEffect(() => {
		const cb = (_: any, weekday: number) => {
			setFirstWeekday(weekday);
		};

		ipcRenderer.on("set-first-weekday", cb);

		ipcRenderer.send("get-first-weekday");

		return () => {
			ipcRenderer.removeListener("set-first-weekday", cb);
		};
	}, []);

	return (
		<table className={className}>
			<CalendarHeader firstWeekday={firstWeekday} />
			<CalendarBody date={date} firstWeekday={firstWeekday} />
		</table>
	);
};

export const Calendar = styled(RawCalendar)`
	width: 100%;
	padding: 0 1em;

	th,
	td {
		text-align: center;
		width: calc(100% / 7);
	}
`;
