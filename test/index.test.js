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
    dock: { hide: testSandbox.stub() }
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
  configureApp,
  TRAY_ARROW_HEIGHT,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
  HORIZ_PADDING,
  VERT_PADDING
} = proxyquire("../index", {
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

  describe("startup", () => {
    it("should config and install raven", () => {
      expect(ravenStub.config.calledOnce).to.be.true;
      expect(ravenStub.install.calledOnce).to.be.true;
      expect(ravenStub.config.firstCall.args[0]).to.be.a("string");
      expect(ravenStub.config.firstCall.args[1]).to.deep.equal({
        release: version
      });
      expect(ravenStub.install.firstCall.args).to.deep.equal([]);
    });

    it("should add a listener for `beforeExit`", () => {
      expect(process.on.getCall(0).args).to.deep.equal([
        "beforeExit",
        electronStub.app.quit
      ]);
    });

    it("should set the login settings on first run", () => {
      expect(electronStub.app.setLoginItemSettings.calledOnce).to.be.true;
      expect(
        electronStub.app.setLoginItemSettings.firstCall.args
      ).to.deep.equal([{ openAtLogin: true, openAsHidden: true }]);
    });

    it("should not install raven in non-prod", () => {
      proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: () => "darwin" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      expect(ravenStub.config.calledOnce).to.be.false;
    });

    it("should not set the login settings in non-prod", () => {
      electronStub.app.setLoginItemSettings.reset();

      proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: () => "darwin" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      expect(electronStub.app.setLoginItemSettings.calledOnce).to.be.false;
    });

    it("should not set the login settings if barnacal has already been run", () => {
      electronStub.app.setLoginItemSettings.reset();

      proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub.returns(false),
        "electron-is-dev": false,
        os: { platform: () => "darwin" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      expect(electronStub.app.setLoginItemSettings.calledOnce).to.be.false;
    });
  });

  describe("getTrayIconName", () => {
    const now = new Date();
    const date = getDate(now);

    it("should return the relative path to the icon for today", () => {
      expect(getTrayIconName()).to.equal(
        `Design/icons/tray/BarnacalIcon${date}Template@2x.png`
      );
    });
  });

  describe("quitApp", () => {
    const interval = 1;

    testSandbox.stub(global, "clearInterval");

    afterEach(() => clearInterval.reset());
    after(() => clearInterval.restore());

    it("should clear the interval and exit the app on quit", () => {
      quitApp(electronStub.app, interval)();

      expect(electronStub.app.exit.calledOnce).to.be.true;
      expect(clearInterval.calledOnce).to.be.true;
      expect(clearInterval.firstCall.args).to.deep.equal([interval]);
    });
  });

  describe("reportToRaven", () => {
    const error = "YOLOERR";

    it("should only capture the exception in prod", done => {
      reportToRaven(error);

      setTimeout(() => {
        expect(ravenStub.captureException.calledOnce).to.be.true;
        expect(ravenStub.captureException.firstCall.args).to.deep.equal([
          error
        ]);
        done();
      });
    });

    it("should not capture the exception in non-prod", done => {
      const { reportToRaven: reportToRavenDev } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: () => "darwin" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      reportToRavenDev(error);

      setTimeout(() => {
        expect(ravenStub.captureException.called).to.be.false;
        done();
      });
    });

    it("should not capture the exception if offline", done => {
      const { reportToRaven: reportToRavenDev } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": false,
        os: { platform: () => "darwin" },
        "is-online": testSandbox.stub().rejects(false),
        "./auto-updater": autoUpdaterStub
      });

      reportToRavenDev(error);

      setTimeout(() => {
        expect(ravenStub.captureException.called).to.be.false;
        done();
      });
    });
  });

  describe("getWindowPosition", () => {
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
      const {
        getWindowPosition: getWindowPositionWin
      } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub.returns(false),
        "electron-is-dev": false,
        os: { platform: () => "win32" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      const [x, y] = getWindowPositionWin(windowStub, trayStub);

      expect(x).to.equal(1224);
      expect(y).to.equal(968);
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

  describe("toggleTray", () => {
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

      expect(windowStub.setPosition.calledOnce).to.be.true;
      expect(windowStub.setPosition.firstCall.args).to.deep.equal([x, y]);
    });

    it("should hide the window if it is already visible", () => {
      toggleTray(windowStub, trayStub)();

      expect(windowStub.hide.calledOnce).to.be.true;
      expect(windowStub.show.called).to.be.false;
    });

    it("should show the window if it is already hidden", () => {
      windowStub.isVisible.returns(false);

      toggleTray(windowStub, trayStub)();

      expect(windowStub.hide.called).to.be.false;
      expect(windowStub.show.calledOnce).to.be.true;
    });
  });

  describe("configureAboutWindow", () => {
    const windowStub = {
      loadURL: testSandbox.stub()
    };

    beforeEach(() => {
      electronStub.BrowserWindow.returns(windowStub);
    });

    it("should create the browser window with the correct options", () => {
      configureAboutWindow();

      expect(electronStub.BrowserWindow.calledOnce).to.be.true;
      expect(electronStub.BrowserWindow.firstCall.args).to.deep.equal([
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
          titleBarStyle: "hidden-inset",
          backgroundColor: "#000",
          webPreferences: {
            backgroundThrottling: false,
            devTools: true
          }
        }
      ]);
    });

    it("should load the url and return the window object", () => {
      const result = configureAboutWindow();
      const dir = resolve(__dirname, "..");

      expect(windowStub.loadURL.calledOnce).to.be.true;
      expect(windowStub.loadURL.firstCall.args).to.deep.equal([
        `file://${dir}/about.html`
      ]);
      expect(result).to.deep.equal(windowStub);
    });
  });

  describe("showAbout", () => {
    it("should hide the window if it's already visible", () => {
      const aboutWindowStub = {
        isVisible: testSandbox.stub().returns(true),
        hide: testSandbox.stub()
      };

      showAbout(aboutWindowStub)();

      expect(aboutWindowStub.isVisible.calledOnce).to.be.true;
      expect(aboutWindowStub.hide.calledOnce).to.be.true;
    });

    it("should show the window if it's already hidden", () => {
      const aboutWindowStub = {
        isVisible: testSandbox.stub().returns(false),
        show: testSandbox.stub()
      };

      showAbout(aboutWindowStub)();

      expect(aboutWindowStub.isVisible.calledOnce).to.be.true;
      expect(aboutWindowStub.show.calledOnce).to.be.true;
    });
  });

  describe("configureWindow", () => {
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

      expect(electronStub.BrowserWindow.calledOnce).to.be.true;
      expect(electronStub.BrowserWindow.firstCall.args).to.deep.equal([
        {
          width: WINDOW_WIDTH,
          height: WINDOW_HEIGHT,
          resizable: false,
          frame: false,
          transparent: true,
          show: false,
          webPreferences: {
            backgroundThrottling: false
          }
        }
      ]);
    });

    it("should set up error listeners", () => {
      configureWindow();

      expect(windowStub.webContents.on.calledOnce).to.be.true;
      expect(windowStub.on.calledThrice).to.be.true;
      expect(windowStub.webContents.on.firstCall.args).to.deep.equal([
        "crashed",
        reportToRaven
      ]);
      expect(windowStub.on.firstCall.args).to.deep.equal([
        "unresponsive",
        reportToRaven
      ]);
    });

    it("should hide and update the window on blur", () => {
      configureWindow();

      windowStub.on.thirdCall.args[1]();

      expect(windowStub.on.thirdCall.args[0]).to.equal("blur");
      expect(windowStub.hide.calledOnce).to.be.true;
      expect(windowStub.webContents.send.calledOnce).to.be.true;
      expect(windowStub.webContents.send.firstCall.args).to.be.deep.equal([
        "background-update"
      ]);
    });

    it("should configure the autoupdater", () => {
      configureWindow();

      expect(autoUpdaterStub.calledOnce).to.be.true;
      expect(autoUpdaterStub.firstCall.args).to.deep.equal([windowStub]);
    });

    it("should not configure the autoupdater in non-prod", () => {
      const { configureWindow: configureWindowDev } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: () => "win32" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      configureWindowDev();

      expect(autoUpdaterStub.called).to.be.false;
    });

    it("should load the url and return the window object", () => {
      const result = configureWindow();
      const dir = resolve(__dirname, "..");

      expect(windowStub.loadURL.calledOnce).to.be.true;
      expect(windowStub.loadURL.firstCall.args).to.deep.equal([
        `file://${dir}/index.html`
      ]);
      expect(result).to.deep.equal(windowStub);
    });

    it("should load the url and return the window object in dev", () => {
      const { configureWindow: configureWindowDev } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: () => "win32" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      const result = configureWindowDev();
      const dir = resolve(__dirname, "..");

      expect(windowStub.loadURL.calledOnce).to.be.true;
      expect(windowStub.loadURL.firstCall.args).to.deep.equal([
        `file://${dir}/index.dev.html`
      ]);
      expect(result).to.deep.equal(windowStub);
    });
  });

  describe("configureTrayIcon", () => {
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
      const iconPath = resolve(__dirname, "..", getTrayIconName());

      configureTrayIcon(windowStub, null, menuStub);

      expect(electronStub.Tray.calledOnce).to.be.true;
      expect(electronStub.Tray.firstCall.args).to.deep.equal([iconPath]);
    });

    it("should set up error listeners", () => {
      configureTrayIcon(windowStub, null, menuStub);

      expect(trayStub.on.calledThrice).to.be.true;
      expect(trayStub.on.firstCall.args[0]).to.deep.equal("click");
      expect(trayStub.on.secondCall.args[0]).to.deep.equal("double-click");
      expect(trayStub.on.firstCall.args[1]).to.be.a("function");
      expect(trayStub.on.secondCall.args[1]).to.be.a("function");
    });

    it("should open the context menu on right click", () => {
      configureTrayIcon(windowStub, null, menuStub);

      trayStub.on.thirdCall.args[1]();

      expect(trayStub.on.thirdCall.args[0]).to.equal("right-click");
      expect(menuStub.popup.calledOnce).to.be.true;
    });

    it("should return the interval ID", () => {
      const result = configureTrayIcon(windowStub, null, menuStub);

      expect(result).to.be.ok;
    });

    it("should check refresh the icon every minute", () => {
      const iconPath = resolve(__dirname, "..", getTrayIconName());

      testSandbox.spy(global, "setInterval");

      configureTrayIcon(windowStub, null, menuStub);

      setInterval.firstCall.args[0]();

      expect(setInterval.calledOnce).to.be.true;
      expect(trayStub.setImage.calledOnce).to.be.true;
      expect(trayStub.setImage.firstCall.args).to.deep.equal([iconPath]);
      expect(windowStub.webContents.send.calledOnce).to.be.true;
      expect(windowStub.webContents.send.firstCall.args).to.deep.equal([
        "background-update"
      ]);

      setInterval.restore();
    });

    it("should not send a background update message if the window is visible", () => {
      testSandbox.spy(global, "setInterval");

      windowStub.isVisible.returns(true);

      configureTrayIcon(windowStub, null, menuStub);

      setInterval.firstCall.args[0]();

      expect(windowStub.webContents.send.called).to.be.false;

      setInterval.restore();
    });
  });

  describe("configure app", () => {
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
    const menuItemStub = testSandbox.stub();

    beforeEach(() => {
      electronStub.BrowserWindow.returns(windowStub);
      electronStub.Tray.returns(trayStub);
      electronStub.Menu.returns(menuReturnStub);
    });

    it("should append a menu item to the menu", () => {
      configureApp();

      expect(electronStub.Menu.calledOnce).to.be.true;
      expect(menuReturnStub.append.calledTwice).to.be.true;
      expect(electronStub.MenuItem.calledTwice).to.be.true;
      expect(electronStub.MenuItem.firstCall.args[0].label).to.equal("Quit");
      expect(electronStub.MenuItem.firstCall.args[0].click).to.be.a("function");
      expect(electronStub.MenuItem.secondCall.args[0].label).to.equal("About");
      expect(electronStub.MenuItem.secondCall.args[0].click).to.be.a(
        "function"
      );
    });

    it("should add listeners to ipcMain", () => {
      configureApp();

      electronStub.ipcMain.on.firstCall.args[1]();
      electronStub.ipcMain.on.secondCall.args[1]();

      expect(electronStub.ipcMain.on.calledThrice).to.be.true;
      expect(electronStub.ipcMain.on.firstCall.args[0]).to.equal(
        "show-config-menu"
      );
      expect(menuReturnStub.popup.calledOnce).to.be.true;
      expect(electronStub.ipcMain.on.secondCall.args[0]).to.equal("show-about");
      expect(electronStub.ipcMain.on.secondCall.args[1]).to.be.a("function");
      expect(windowStub.isVisible.calledOnce).to.be.true;
      expect(electronStub.ipcMain.on.thirdCall.args[0]).to.equal("quit-app");
      expect(electronStub.ipcMain.on.thirdCall.args[1]).to.be.a("function");
    });

    it("should hide the dock icon on macOS", () => {
      configureApp();

      expect(electronStub.app.dock.hide.calledOnce).to.be.true;
    });

    it("should not hide the dock on non-macOS machines", () => {
      const { configureApp: configureAppWin } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": false,
        os: { platform: () => "win32" },
        "is-online": testSandbox.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      configureAppWin();

      expect(electronStub.app.dock.hide.called).to.be.false;
    });
  });
});
