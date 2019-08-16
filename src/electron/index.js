const electron = require("electron");
const firstRun = require("first-run");
const getDate = require("date-fns/get_date");
const isDev = require("electron-is-dev");
const isOnline = require("is-online");
const path = require("path");
const { platform } = require("os");
const Sentry = require("@sentry/electron");
const autoUpdater = require("./auto-updater");
const { version } = require("../../package.json");

const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 290;
const HORIZ_PADDING = 15;
const VERT_PADDING = 15;

const {
	app,
	ipcMain,
	Menu,
	MenuItem,
	Tray,
	BrowserWindow,
	systemPreferences
} = electron;
const isWin = platform() === "win32";

// prevent garbage collection & icon from dissapearing
let trayIcon = null;
let window = null;
let aboutWindow = null;
/* istanbul ignore next */
let readyToShow = process.env.NODE_ENV === "test" ? true : false;

const getTrayIconName = () =>
	`./icons/tray/BarnacalIcon${getDate(new Date())}Template@2x.png`;

const quitApp = (app, interval) => () => {
	clearInterval(interval);
	app.exit();
};

/* istanbul ignore next */
const reportToRaven = err => {
	if (!isDev)
		isOnline()
			.then(() => Raven.captureException(err))
			.catch(() => {});
};

const getWindowPosition = (window, tray) => {
	const { screen } = electron;
	const trayBounds = tray.getBounds();
	const windowSize = window.getSize();
	const cursorPosition = screen.getCursorScreenPoint();
	const display = screen.getDisplayNearestPoint(cursorPosition);
	const displayArea = display.workArea;

	if (isWin) {
		const horizontalPosition =
			displayArea.x + displayArea.width - windowSize[0];
		const verticalPosition = displayArea.y + displayArea.height - windowSize[1];

		return [horizontalPosition, verticalPosition];
	} else {
		const trayCenter = trayBounds.x + trayBounds.width / 2;
		const horizontalPosition = trayCenter - windowSize[0] / 2;
		// The macOS implementation of Electron. Tray ceils trayBounds.y to zero
		// making it unreliable for vertically positioning the window.
		// Use the display's work area instead.
		const verticalPosition = displayArea.y + 5;
		const left = horizontalPosition + windowSize[0];
		const maxLeft = displayArea.width - 15;

		// Check if window would be outside screen
		// If yes, make sure it isn't
		if (left > maxLeft) {
			return [horizontalPosition - left - maxLeft, verticalPosition];
		}

		return [horizontalPosition, verticalPosition];
	}
};

function getUserFirstWeekday() {
	// By default Sunday is first day of the week
	let day = 1;

	if (platform() === "darwin") {
		const firstWeekdayPref = systemPreferences.getUserDefault(
			"AppleFirstWeekday",
			"dictionary"
		);

		if (!Object.keys(firstWeekdayPref).length) return day;

		// key in this example is `gregorian` and day is `2`
		// { gregorian = 2; }
		const key = Object.keys(firstWeekdayPref)[0];

		day = firstWeekdayPref[key] || day;
	}

	return day;
}

const toggleTray = (window, tray) => () => {
	/* istanbul ignore next */
	if (!readyToShow) return;

	const [horizontalPosition, verticalPosition] = getWindowPosition(
		window,
		tray
	);

	window.setPosition(horizontalPosition, verticalPosition);

	if (window.isVisible()) {
		window.hide();
	} else {
		window.show();
	}
};

const toggleAbout = aboutWindow => () => {
	if (aboutWindow.isVisible()) {
		aboutWindow.hide();
	} else {
		aboutWindow.show();
	}
};

const configureTrayIcon = (window, trayIcon, menu) => {
	const menuIconPath = path.join(__dirname, getTrayIconName());

	trayIcon = new Tray(menuIconPath);

	const toggleTrayWithContext = toggleTray(window, trayIcon);

	trayIcon.setToolTip("Barnacal");

	trayIcon.on("click", toggleTrayWithContext);
	trayIcon.on("double-click", toggleTrayWithContext);
	trayIcon.on("right-click", () => {
		menu.popup(window);
	});

	// update the icon every day
	const iconUpdateInterval = setInterval(() => {
		trayIcon.setImage(path.join(__dirname, getTrayIconName()));
		if (!window.isVisible()) window.webContents.send("background-update");
	}, 60000);

	return iconUpdateInterval;
};

const configureAboutWindow = () => {
	const htmlPath = `file://${path.resolve(__dirname, "../ui/about.html")}`;

	aboutWindow = new BrowserWindow({
		width: WINDOW_WIDTH,
		height: WINDOW_HEIGHT,
		resizable: false,
		frame: false,
		transparent: false,
		show: false,
		title: "About Barnacal",
		center: true,
		fullscreenable: false,
		maximizable: false,
		minimizable: false,
		titleBarStyle: "hidden",
		backgroundColor: "#000",
		// parent: window,
		webPreferences: {
			backgroundThrottling: false
		}
	});

	aboutWindow.on("close", evt => {
		evt.preventDefault();
		aboutWindow.hide();
	});

	aboutWindow.loadURL(htmlPath);

	return aboutWindow;
};

const configureWindow = () => {
	const htmlPath = `file://${path.resolve(
		__dirname,
		"../../public/index.html"
	)}`;

	window = new BrowserWindow({
		width: WINDOW_WIDTH,
		height: WINDOW_HEIGHT,
		resizable: false,
		hasShadow: false,
		frame: false,
		transparent: true,
		show: false,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			devTools: true
		}
	});

	window.loadURL(htmlPath);

	window.webContents.on("crashed", reportToRaven);
	window.on("ready-to-show", () => (readyToShow = true));
	window.on("unresponsive", reportToRaven);
	/* istanbul ignore next */
	window.on("close", () => (window = null));
	window.on("blur", () => {
		window.hide();
		window.webContents.send("background-update");
	});

	// configure the auto updater, only in prod
	if (!isDev) autoUpdater(window);

	return window;
};

const configureBarnacal = () => {
	configureWindow();
	configureAboutWindow();

	const menu = new Menu();
	const iconUpdateInterval = configureTrayIcon(window, trayIcon, menu);
	const quitAppWithContext = quitApp(app, iconUpdateInterval);

	if (platform() === "darwin") app.dock.hide();

	menu.append(
		new MenuItem({
			label: "About",
			click: toggleAbout(aboutWindow)
		})
	);
	menu.append(
		new MenuItem({
			label: "Quit",
			click: quitAppWithContext
		})
	);

	ipcMain.on("show-config-menu", () => menu.popup(window));
	ipcMain.on("show-about", toggleAbout(aboutWindow));
	ipcMain.on("get-first-weekday", event => {
		/* istanbul ignore next */
		event.reply("set-first-weekday", getUserFirstWeekday());
	});
	ipcMain.on("quit-app", quitAppWithContext);
};

/* istanbul ignore next */
if (!isDev && process.env.NODE_ENV !== "test") {
	Sentry.init({
		dsn: "https://f98d2418699d4fe9acac2e08621e31d0@sentry.io/204280"
	});
}

// set the app to open on login
if (!isDev && firstRun()) {
	app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
}

process.on("beforeExit", app.quit);

app.on("ready", configureBarnacal);

module.exports = {
	getTrayIconName,
	quitApp,
	reportToRaven,
	getWindowPosition,
	getUserFirstWeekday,
	toggleTray,
	configureAboutWindow,
	showAbout: toggleAbout,
	configureWindow,
	configureTrayIcon,
	configureBarnacal,
	WINDOW_HEIGHT,
	WINDOW_WIDTH,
	HORIZ_PADDING,
	VERT_PADDING
};
