import React from "react";
import styled from "styled-components";
import {
	getDate,
	getDaysInMonth,
	startOfMonth,
	getDay,
	setDate,
	getISODay,
	differenceInCalendarWeeks,
	differenceInCalendarISOWeeks,
	isSameMonth,
	format
} from "date-fns";
import { Stylable } from "./types";
import { Span, FontWeight } from "styled-typography";

type Props = Stylable & {
	date: Date;
	firstWeekday: number;
};

export const weekDayNumber = (date: Date, firstWeekday: number) => {
	return firstWeekday === 1 ? getDay(date) : getISODay(date);
};

export const weekOfMonth = (date: Date, firstWeekday: number) => {
	const firstOfMonth = startOfMonth(date);

	return firstWeekday === 1
		? differenceInCalendarWeeks(date, firstOfMonth)
		: differenceInCalendarISOWeeks(date, firstOfMonth);
};

export const weeks = (date: Date, firstWeekday: number) => {
	const totalDays = Array.from({ length: getDaysInMonth(date) }, () => null);
	const weeks = Array.from<number, (number | null)[]>({ length: 6 }, () =>
		new Array<number | null>(7).fill(null)
	);

	return totalDays.reduce((acc, _, dayOfMonth) => {
		const currentDay = setDate(date, dayOfMonth + 1);
		const week = weekOfMonth(currentDay, firstWeekday);
		const dayOfWeek = weekDayNumber(currentDay, firstWeekday) - (firstWeekday - 1);

		acc[week][dayOfWeek] = dayOfMonth + 1;

		return acc;
	}, weeks);
};

export const isToday = (date: Date, dayOfMonth: number) => {
	const now = new Date();

	return isSameMonth(now, date) && getDate(now) === dayOfMonth;
};

export const RawCalendarBody = ({ date, firstWeekday, className }: Props) => {
	const weeksOfMonth = weeks(date, firstWeekday);

	return (
		<tbody className={className}>
			{weeksOfMonth.map((week, weekIdx) => (
				<tr key={weekIdx}>
					{week.map((day, dayIdx) => (
						<td key={`${format(setDate(date, day || -1), "YYYY-MM-DD")}-${weekIdx}-${dayIdx}`}>
							<Span
								fontWeight={FontWeight.SemiBold}
								color={isToday(date, day || -1) ? "#F012BE" : "#FFF"}
							>
								{day}
							</Span>
						</td>
					))}
				</tr>
			))}
		</tbody>
	);
};

export const CalendarBody = styled(RawCalendarBody)``;
