const { getDate } = require("date-fns");
const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire")
	.noCallThru()
	.noPreserveCache();
const { version } = require("../package.json");
const { resolve } = require("path");

const testSandbox = sinon.createSandbox();

sinon.spy(process, "on");

const electronStub = {
	app: {
		quit: testSandbox.stub(),
		on: testSandbox.stub(),
		exit: testSandbox.stub(),
		setLoginItemSettings: sinon.stub(),
		dock: { hide: testSandbox.stub() },
		getAppPath: () => resolve(__dirname, "../src/electron")
	},
	ipcMain: {
		on: testSandbox.stub()
	},
	Menu: testSandbox.stub(),
	MenuItem: testSandbox.stub(),
	Tray: testSandbox.stub(),
	Notification: testSandbox.stub(),
	BrowserWindow: testSandbox.stub(),
	screen: {
		getCursorScreenPoint: testSandbox.stub(),
		getDisplayNearestPoint: testSandbox.stub()
	},
	systemPreferences: {
		getUserDefault: () => ({ gregorian: 2 })
	}
};

const ravenStub = {
	config: testSandbox.stub().returnsThis(),
	install: testSandbox.stub(),
	captureException: testSandbox.stub()
};

const autoUpdaterStub = testSandbox.stub();

const firstRunStub = testSandbox.stub().returns(true);

const {
	getTrayIconName,
	quitApp,
	reportToRaven,
	getWindowPosition,
	toggleTray,
	configureAboutWindow,
	showAbout,
	configureWindow,
	configureTrayIcon,
	configureBarnacal,
	WINDOW_WIDTH,
	WINDOW_HEIGHT
} = proxyquire("../src/electron/index", {
	electron: electronStub,
	raven: ravenStub,
	"first-run": firstRunStub,
	"electron-is-dev": false,
	os: { platform: () => "darwin" },
	"is-online": sinon.stub().resolves(true),
	"./auto-updater": autoUpdaterStub
});

describe("index", () => {
	beforeEach(() => {
		electronStub.screen.getDisplayNearestPoint.returns({
			workArea: { x: 500, y: 500, width: 1024, height: 768 }
		});

		ravenStub.config.returnsThis();
	});

	afterEach(() => {
		testSandbox.reset();
	});

	context("startup", () => {
		it("should add a listener for `beforeExit`", () => {
			expect(process.on.getCall(0).args).to.deep.equal([
				"beforeExit",
				electronStub.app.quit
			]);
		});

		it("should set the login settings on first run", () => {
			expect(electronStub.app.setLoginItemSettings.callCount).to.equal(1);
			expect(
				electronStub.app.setLoginItemSettings.getCall(0).args
			).to.deep.equal([{ openAtLogin: true, openAsHidden: true }]);
		});

		it("should not set the login settings in non-prod", () => {
			electronStub.app.setLoginItemSettings.reset();

			proxyquire("../src/electron/index", {
				electron: electronStub,
				raven: ravenStub,
				"first-run": firstRunStub,
				"electron-is-dev": true,
				os: { platform: () => "darwin" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			expect(electronStub.app.setLoginItemSettings.callCount).to.equal(0);
		});

		it("should not set the login settings if barnacal has already been run", () => {
			electronStub.app.setLoginItemSettings.reset();

			proxyquire("../src/electron/index", {
				electron: electronStub,
				raven: ravenStub,
				"first-run": firstRunStub.returns(false),
				"electron-is-dev": false,
				os: { platform: () => "darwin" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			expect(electronStub.app.setLoginItemSettings.callCount).to.equal(0);
		});
	});

	context("getTrayIconName", () => {
		const now = new Date();
		const date = getDate(now);

		it("should return the relative path to the icon for today", () => {
			expect(getTrayIconName()).to.equal(
				`./icons/tray/BarnacalIcon${date}Template@2x.png`
			);
		});
	});

	context("quitApp", () => {
		const interval = 1;

		testSandbox.stub(global, "clearInterval");

		afterEach(() => clearInterval.reset());
		after(() => clearInterval.restore());

		it("should clear the interval and exit the app on quit", () => {
			quitApp(electronStub.app, interval)();

			expect(electronStub.app.exit.callCount).to.equal(1);
			expect(clearInterval.callCount).to.equal(1);
			expect(clearInterval.getCall(0).args).to.deep.equal([interval]);
		});
	});

	context("reportToRaven", () => {
		const error = "YOLOERR";

		it("should not capture the exception in non-prod", done => {
			const { reportToRaven: reportToRavenDev } = proxyquire(
				"../src/electron/index",
				{
					electron: electronStub,
					raven: ravenStub,
					"first-run": firstRunStub,
					"electron-is-dev": true,
					os: { platform: () => "darwin" },
					"is-online": testSandbox.stub().resolves(true),
					"./auto-updater": autoUpdaterStub
				}
			);

			reportToRavenDev(error);

			setTimeout(() => {
				expect(ravenStub.captureException.called).to.be.false;
				done();
			});
		});

		it("should not capture the exception if offline", done => {
			const { reportToRaven: reportToRavenDev } = proxyquire(
				"../src/electron/index",
				{
					electron: electronStub,
					raven: ravenStub,
					"first-run": firstRunStub,
					"electron-is-dev": false,
					os: { platform: () => "darwin" },
					"is-online": testSandbox.stub().rejects(false),
					"./auto-updater": autoUpdaterStub
				}
			);

			reportToRavenDev(error);

			setTimeout(() => {
				expect(ravenStub.captureException.called).to.be.false;
				done();
			});
		});
	});

	context("getUserFirstWeekday", () => {
		it("should return 1 for non-darwin platforms", () => {
			const { getUserFirstWeekday } = proxyquire("../src/electron/index", {
				electron: electronStub,
				raven: ravenStub,
				"first-run": firstRunStub.returns(false),
				"electron-is-dev": false,
				os: { platform: () => "win32" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			const day = getUserFirstWeekday();

			expect(day).to.equal(1);
		});

		it("should return the preference for darwin platforms", () => {
			const { getUserFirstWeekday } = proxyquire("../src/electron/index", {
				electron: electronStub,
				raven: ravenStub,
				"first-run": firstRunStub.returns(false),
				"electron-is-dev": false,
				os: { platform: () => "darwin" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			const day = getUserFirstWeekday();

			expect(day).to.equal(2);
		});

		it("should return the default for darwin platforms if there is no system preference", () => {
			const { getUserFirstWeekday } = proxyquire("../src/electron/index", {
				electron: {
					...electronStub,
					systemPreferences: {
						getUserDefault: () => ({})
					}
				},
				raven: ravenStub,
				"first-run": firstRunStub.returns(false),
				"electron-is-dev": false,
				os: { platform: () => "darwin" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			const day = getUserFirstWeekday();

			expect(day).to.equal(1);
		});

		it("should return the default for darwin platforms if the preference is corrupt", () => {
			const { getUserFirstWeekday } = proxyquire("../src/electron/index", {
				electron: {
					...electronStub,
					systemPreferences: {
						getUserDefault: () => ({ gregorian: null })
					}
				},
				raven: ravenStub,
				"first-run": firstRunStub.returns(false),
				"electron-is-dev": false,
				os: { platform: () => "darwin" },
				"is-online": testSandbox.stub().resolves(true),
				"./auto-updater": autoUpdaterStub
			});

			const day = getUserFirstWeekday();

			expect(day).to.equal(1);
		});
	});

	context("getWindowPosition", () => {
		const trayStub = {
			getBounds: testSandbox.stub()
		};
		const windowStub = {
			getSize: testSandbox.stub()
		};

		beforeEach(() => {
			trayStub.getBounds.returns({ x: 500, width: 30 });
			windowStub.getSize.returns([WINDOW_WIDTH, WINDOW_HEIGHT]);
		});

		it("should return the x and y position", () => {
			const [x, y] = getWindowPosition(windowStub, trayStub);

			expect(x).to.equal(365);
			expect(y).to.equal(505);
		});

		it("should return the x and y position for windows machines", () => {
			const { getWindowPosition: getWindowPositionWin } = proxyquire(
				"../src/electron/index",
				{
					electron: electronStub,
					raven: ravenStub,
					"first-run": firstRunStub.returns(false),
					"electron-is-dev": false,
					os: { platform: () => "win32" },
					"is-online": testSandbox.stub().resolves(true),
					"./auto-updater": autoUpdaterStub
				}
			);

			const [x, y] = getWindowPositionWin(windowStub, trayStub);

			expect(x).to.equal(1224);
			expect(y).to.equal(978);
		});

		it("should avoid throwing the app off the left side of the screen", () => {
			electronStub.screen.getDisplayNearestPoint.returns({
				workArea: { x: 500, y: 500, width: 10, height: 768 }
			});

			const [x, y] = getWindowPosition(windowStub, trayStub);

			expect(x).to.equal(-295);
			expect(y).to.equal(505);
		});
	});

	context("toggleTray", () => {
		const windowStub = {
			setPosition: testSandbox.stub(),
			isVisible: testSandbox.stub().returns(true),
			getSize: testSandbox.stub().returns([1024, 768]),
			hide: testSandbox.stub(),
			show: testSandbox.stub()
		};
		const trayStub = {
			getBounds: testSandbox.stub().returns({ x: 500, width: 30 })
		};

		beforeEach(() => {
			windowStub.isVisible.returns(true);
			windowStub.getSize.returns([1024, 768]);
			trayStub.getBounds.returns({ x: 500, width: 30 });
		});

		it("should set the window position", () => {
			const [x, y] = getWindowPosition(windowStub, trayStub);

			toggleTray(windowStub, trayStub)();

			expect(windowStub.setPosition.callCount).to.equal(1);
			expect(windowStub.setPosition.getCall(0).args).to.deep.equal([x, y]);
		});

		it("should hide the window if it is already visible", () => {
			toggleTray(windowStub, trayStub)();

			expect(windowStub.hide.callCount).to.equal(1);
			expect(windowStub.show.called).to.be.false;
		});

		it("should show the window if it is already hidden", () => {
			windowStub.isVisible.returns(false);

			toggleTray(windowStub, trayStub)();

			expect(windowStub.hide.called).to.be.false;
			expect(windowStub.show.callCount).to.equal(1);
		});
	});

	context("configureAboutWindow", () => {
		const windowStub = {
			loadURL: testSandbox.stub(),
			on: testSandbox.stub(),
			hide: testSandbox.stub()
		};

		beforeEach(() => {
			electronStub.BrowserWindow.returns(windowStub);
		});

		it("should create the browser window with the correct options", () => {
			configureAboutWindow();

			expect(electronStub.BrowserWindow.callCount).to.equal(1);
			expect(electronStub.BrowserWindow.getCall(0).args).to.deep.equal([
				{
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
					webPreferences: {
						backgroundThrottling: false
					}
				}
			]);
		});

		it("should bind events to the about window", () => {
			const result = configureAboutWindow();
			const dir = resolve(__dirname, "..");
			const evtStub = { preventDefault: testSandbox.stub() };

			windowStub.on.getCall(0).args[1](evtStub);

			expect(windowStub.on.callCount).to.equal(1);
			expect(windowStub.on.getCall(0).args[0]).to.equal("close");
			expect(evtStub.preventDefault.callCount).to.equal(1);
			expect(windowStub.hide.callCount).to.equal(1);
			expect(result).to.deep.equal(windowStub);
		});

		it("should load the url and return the window object", () => {
			const result = configureAboutWindow();
			const dir = resolve(__dirname, "..");

			expect(windowStub.loadURL.callCount).to.equal(1);
			expect(windowStub.loadURL.getCall(0).args).to.deep.equal([
				`file://${dir}/src/ui/about.html`
			]);
			expect(result).to.deep.equal(windowStub);
		});
	});

	context("showAbout", () => {
		it("should hide the window if it's already visible", () => {
			const aboutWindowStub = {
				isVisible: testSandbox.stub().returns(true),
				hide: testSandbox.stub()
			};

			showAbout(aboutWindowStub)();

			expect(aboutWindowStub.isVisible.callCount).to.equal(1);
			expect(aboutWindowStub.hide.callCount).to.equal(1);
		});

		it("should show the window if it's already hidden", () => {
			const aboutWindowStub = {
				isVisible: testSandbox.stub().returns(false),
				show: testSandbox.stub()
			};

			showAbout(aboutWindowStub)();

			expect(aboutWindowStub.isVisible.callCount).to.equal(1);
			expect(aboutWindowStub.show.callCount).to.equal(1);
		});
	});

	context("configureWindow", () => {
		const windowStub = {
			on: testSandbox.stub(),
			webContents: { on: testSandbox.stub(), send: testSandbox.stub() },
			loadURL: testSandbox.stub(),
			hide: testSandbox.stub()
		};

		beforeEach(() => {
			electronStub.BrowserWindow.returns(windowStub);
		});

		it("should create the browser window with the correct options", () => {
			configureWindow();

			expect(electronStub.BrowserWindow.callCount).to.equal(1);
			expect(electronStub.BrowserWindow.getCall(0).args).to.deep.equal([
				{
					width: WINDOW_WIDTH,
					height: WINDOW_HEIGHT,
					hasShadow: false,
					resizable: false,
					frame: false,
					transparent: true,
					show: false,
					webPreferences: {
						backgroundThrottling: false,
						devTools: true,
						nodeIntegration: true
					}
				}
			]);
		});

		it("should set up error listeners", () => {
			configureWindow();

			expect(windowStub.webContents.on.callCount).to.equal(1);
			expect(windowStub.on.callCount).to.equal(4);
			expect(windowStub.webContents.on.getCall(0).args).to.deep.equal([
				"crashed",
				reportToRaven
			]);
			expect(windowStub.on.getCall(1).args).to.deep.equal([
				"unresponsive",
				reportToRaven
			]);
		});

		it("should hide and update the window on blur", () => {
			configureWindow();

			windowStub.on.getCall(3).args[1]();

			expect(windowStub.on.getCall(3).args[0]).to.equal("blur");
			expect(windowStub.hide.callCount).to.equal(1);
			expect(windowStub.webContents.send.callCount).to.equal(1);
			expect(windowStub.webContents.send.getCall(0).args).to.be.deep.equal([
				"background-update"
			]);
		});

		it("should configure the autoupdater", () => {
			configureWindow();

			expect(autoUpdaterStub.callCount).to.equal(1);
			expect(autoUpdaterStub.getCall(0).args).to.deep.equal([windowStub]);
		});

		it("should not configure the autoupdater in non-prod", () => {
			const { configureWindow: configureWindowDev } = proxyquire(
				"../src/electron/index",
				{
					electron: electronStub,
					raven: ravenStub,
					"first-run": firstRunStub,
					"electron-is-dev": true,
					os: { platform: () => "win32" },
					"is-online": testSandbox.stub().resolves(true),
					"./auto-updater": autoUpdaterStub
				}
			);

			configureWindowDev();

			expect(autoUpdaterStub.called).to.be.false;
		});

		it("should load the url and return the window object", () => {
			const result = configureWindow();
			const dir = resolve(__dirname, "..");

			expect(windowStub.loadURL.callCount).to.equal(1);
			expect(windowStub.loadURL.getCall(0).args).to.deep.equal([
				`file://${dir}/public/index.html`
			]);
			expect(result).to.deep.equal(windowStub);
		});
	});

	context("configureTrayIcon", () => {
		const windowStub = {
			on: testSandbox.stub(),
			webContents: { on: testSandbox.stub(), send: testSandbox.stub() },
			loadURL: testSandbox.stub(),
			hide: testSandbox.stub(),
			isVisible: testSandbox.stub().returns(false)
		};
		const trayStub = {
			on: testSandbox.stub(),
			setToolTip: testSandbox.stub(),
			setImage: testSandbox.stub()
		};
		const menuStub = {
			popup: testSandbox.stub()
		};

		beforeEach(() => {
			electronStub.Tray.returns(trayStub);
		});

		it("should create the browser window with the correct options", () => {
			const iconPath = resolve(__dirname, "../src/electron", getTrayIconName());

			configureTrayIcon(windowStub, null, menuStub);

			expect(electronStub.Tray.callCount).to.equal(1);
			expect(electronStub.Tray.getCall(0).args).to.deep.equal([iconPath]);
		});

		it("should set up error listeners", () => {
			configureTrayIcon(windowStub, null, menuStub);

			expect(trayStub.on.callCount).to.equal(3);
			expect(trayStub.on.getCall(0).args[0]).to.deep.equal("click");
			expect(trayStub.on.getCall(1).args[0]).to.deep.equal("double-click");
			expect(trayStub.on.getCall(0).args[1]).to.be.a("function");
			expect(trayStub.on.getCall(1).args[1]).to.be.a("function");
		});

		it("should open the context menu on right click", () => {
			configureTrayIcon(windowStub, null, menuStub);

			trayStub.on.getCall(2).args[1]();

			expect(trayStub.on.getCall(2).args[0]).to.equal("right-click");
			expect(menuStub.popup.callCount).to.equal(1);
		});

		it("should return the interval ID", () => {
			const result = configureTrayIcon(windowStub, null, menuStub);

			expect(result).to.be.ok;
		});

		it("should check refresh the icon every minute", () => {
			const iconPath = resolve(__dirname, "../src/electron", getTrayIconName());

			testSandbox.spy(global, "setInterval");

			configureTrayIcon(windowStub, null, menuStub);

			setInterval.getCall(0).args[0]();

			expect(setInterval.callCount).to.equal(1);
			expect(trayStub.setImage.callCount).to.equal(1);
			expect(trayStub.setImage.getCall(0).args).to.deep.equal([iconPath]);
			expect(windowStub.webContents.send.callCount).to.equal(1);
			expect(windowStub.webContents.send.getCall(0).args).to.deep.equal([
				"background-update"
			]);

			setInterval.restore();
		});

		it("should not send a background update message if the window is visible", () => {
			testSandbox.spy(global, "setInterval");

			windowStub.isVisible.returns(true);

			configureTrayIcon(windowStub, null, menuStub);

			setInterval.getCall(0).args[0]();

			expect(windowStub.webContents.send.called).to.be.false;

			setInterval.restore();
		});
	});

	context("configure app", () => {
		const windowStub = {
			on: testSandbox.stub(),
			webContents: { on: testSandbox.stub(), send: testSandbox.stub() },
			loadURL: testSandbox.stub(),
			hide: testSandbox.stub(),
			show: testSandbox.stub(),
			isVisible: testSandbox.stub()
		};
		const trayStub = {
			on: testSandbox.stub(),
			setToolTip: testSandbox.stub(),
			setImage: testSandbox.stub()
		};
		const menuReturnStub = {
			popup: testSandbox.stub(),
			append: testSandbox.stub()
		};

		beforeEach(() => {
			electronStub.BrowserWindow.returns(windowStub);
			electronStub.Tray.returns(trayStub);
			electronStub.Menu.returns(menuReturnStub);
		});

		it("should append a menu item to the menu", () => {
			configureBarnacal();

			expect(electronStub.Menu.callCount).to.equal(1);
			expect(menuReturnStub.append.callCount).to.equal(2);
			expect(electronStub.MenuItem.callCount).to.equal(2);
			expect(electronStub.MenuItem.getCall(0).args[0].label).to.equal("About");
			expect(electronStub.MenuItem.getCall(0).args[0].click).to.be.a(
				"function"
			);
			expect(electronStub.MenuItem.getCall(1).args[0].label).to.equal("Quit");
			expect(electronStub.MenuItem.getCall(1).args[0].click).to.be.a(
				"function"
			);
		});

		it("should add listeners to ipcMain", () => {
			configureBarnacal();

			electronStub.ipcMain.on.getCall(0).args[1]();
			electronStub.ipcMain.on.getCall(1).args[1]();

			expect(electronStub.ipcMain.on.callCount).to.equal(4);
			expect(electronStub.ipcMain.on.getCall(0).args[0]).to.equal(
				"show-config-menu"
			);
			expect(menuReturnStub.popup.callCount).to.equal(1);
			expect(electronStub.ipcMain.on.getCall(1).args[0]).to.equal("show-about");
			expect(electronStub.ipcMain.on.getCall(1).args[1]).to.be.a("function");
			expect(windowStub.isVisible.callCount).to.equal(1);
			expect(electronStub.ipcMain.on.getCall(2).args[0]).to.equal(
				"get-first-weekday"
			);
			expect(electronStub.ipcMain.on.getCall(2).args[1]).to.be.a("function");
			expect(electronStub.ipcMain.on.getCall(3).args[0]).to.equal("quit-app");
			expect(electronStub.ipcMain.on.getCall(3).args[1]).to.be.a("function");
		});

		it("should hide the dock icon on macOS", () => {
			configureBarnacal();

			expect(electronStub.app.dock.hide.callCount).to.equal(1);
		});

		it("should not hide the dock on non-macOS machines", () => {
			const { configureBarnacal: configureBarnacalWin } = proxyquire(
				"../src/electron/index",
				{
					electron: electronStub,
					raven: ravenStub,
					"first-run": firstRunStub,
					"electron-is-dev": false,
					os: { platform: () => "win32" },
					"is-online": testSandbox.stub().resolves(true),
					"./auto-updater": autoUpdaterStub
				}
			);

			configureBarnacalWin();

			expect(electronStub.app.dock.hide.called).to.be.false;
		});
	});
});
