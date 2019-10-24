import React from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { Heading } from "styled-typography";
import { Stylable } from "./types";

type Props = Stylable & {
	onNextMonth: () => void;
	onPreviousMonth: () => void;
	onResetMonth: () => void;
	date: Date;
};

export const RawHeader = ({
	onNextMonth: nextMonth,
	onPreviousMonth: previousMonth,
	onResetMonth: resetMonth,
	date,
	className
}: Props) => (
	<div className={className}>
		<a href="#" onClick={previousMonth}>
			←
		</a>
		<Heading color="#FFF" onClick={resetMonth}>
			{format(date, "LLLL yyyy")}
		</Heading>
		<a href="#" onClick={nextMonth}>
			→
		</a>
	</div>
);

export const Header = styled(RawHeader)`
	margin-bottom: 10px;
	text-align: center;
	background-color: #000;
	border-top-right-radius: 4px;
	border-top-left-radius: 4px;
	padding-top: 0px;
	display: flex;
	align-items: center;

	${Heading} {
		line-hight: 40px;
		font-size: 22px;
		padding: 0.5em 0;
		flex-grow: 2;
		cursor: pointer;
	}

	a {
		text-decoration: none;
		color: #fff;
		font-size: 1.2rem;
		width: 50px;
	}
`;
