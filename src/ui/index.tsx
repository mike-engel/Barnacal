import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { ipcRenderer } from "electron";
import styled, { ThemeProvider } from "styled-components";
import { GlobalTypeStyles } from "styled-typography";
import { addMonths, subMonths } from "date-fns";
import { Header } from "./header";
import { Menu } from "./menu";
import { Calendar } from "./calendar";

enum DateAction {
	Next = "NEXT",
	Previous = "PREVIOUS",
	Reset = "RESET"
}

export const RawApp = ({ className }: any) => {
	const [date, setDate] = useState(new Date());
	const [updateAvailable, setUpdateAvailable] = useState(false);

	useEffect(() => {
		ipcRenderer.on("update-ready", () => setUpdateAvailable(true));
	}, []);

	const updateDate = (action: DateAction) =>
		useCallback(() => {
			switch (action) {
				case DateAction.Next:
					return setDate(addMonths(date, 1));
				case DateAction.Previous:
					return setDate(subMonths(date, 1));
				case DateAction.Reset:
					return setDate(new Date());
			}
		}, [date]);

	return (
		<ThemeProvider theme={{}}>
			<div className={className}>
				<GlobalTypeStyles />
				<Header
					date={date}
					onNextMonth={updateDate(DateAction.Next)}
					onPreviousMonth={updateDate(DateAction.Previous)}
					onResetMonth={updateDate(DateAction.Reset)}
				/>
				<Calendar date={date} />
				<Menu updateAvailable={updateAvailable} />
			</div>
		</ThemeProvider>
	);
};

export const App = styled(RawApp)`
	height: 100%;
	border-radius: 5px;
	height: 100vh;
	width: 300px;
	padding: 0;
	background-color: #000;
	margin: 0 auto;
	position: relative;
	cursor: default;
	padding-bottom: 1px;
`;

ReactDOM.render(<App />, document.querySelector("#app"));
