import React, { useCallback } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Stylable } from "./types";

type Props = Stylable & {
	updateAvailable: boolean;
};

export const UpdateAvailable = ({ updateAvailable }: Pick<Props, "updateAvailable">) => {
	if (!updateAvailable) return null;

	const updateApp = useCallback(() => {
		ipcRenderer.send("install-update");
	}, []);

	return (
		<>
			An update is available.{" "}
			<a href="#" onClick={updateApp}>
				Install now
			</a>
		</>
	);
};

export const RawMenu = ({ updateAvailable, className }: Props) => {
	const quitApp = useCallback(() => {
		ipcRenderer.send("quit-app");
	}, []);
	const showAbout = useCallback(() => {
		ipcRenderer.send("show-about");
	}, []);

	return (
		<div className={className}>
			<span>
				<UpdateAvailable updateAvailable={updateAvailable} />
			</span>
			<div>
				<a href="#" onClick={showAbout}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="#FFF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12" y2="8" />
					</svg>
				</a>
				<a href="#" onClick={quitApp}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="#FFF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
						<line x1="12" y1="2" x2="12" y2="12" />
					</svg>
				</a>
			</div>
		</div>
	);
};

export const Menu = styled(RawMenu)`
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: space-between;
	bottom: 5px;
	height: 26px;
	width: 100%;
	border-bottom-right-radius: 5px;
	border-bottom-left-radius: 5px;
	text-align: right;
	padding: 0 1em;
	margin-bottom: 0.5em;

	svg {
		display: inline-block;
		height: 15px;
		width: 15px;
		text-decoration: none;
		cursor: pointe;
		margin-left: 10px;
	}

	span {
		color: #fff;
		font-size: 12px;
	}

	a {
		color: #f012be;
		font-size: 12px;
		text-decoration: none;
	}
`;
