import React from "react";
import styled from "styled-components";
import { Stylable } from "./types";
import { Span } from "styled-typography";

type Props = Stylable & {
	firstWeekday: number;
};

export const weekdays = (firstWeekday: number) => {
	const index = firstWeekday - 1;

	const list = ["S", "M", "T", "W", "T", "F", "S"];

	if (index === 0) return list;

	return [...list.slice(1), list[0]];
};

export const RawCalendarHeader = ({ firstWeekday, className }: Props) => (
	<thead className={className}>
		<tr>
			{weekdays(firstWeekday).map((weekday, idx) => (
				<th key={`${weekday}-${idx}`}>
					<Span color="#FFF">{weekday}</Span>
				</th>
			))}
		</tr>
	</thead>
);

export const CalendarHeader = styled(RawCalendarHeader)`
	th {
		font-size: 0.725rem;
		opacity: 0.5;
		padding: 0.3em 0;
	}
`;
