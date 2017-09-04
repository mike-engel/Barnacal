const { getDate } = require("date-fns");
const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const { version } = require("../package.json");
const { resolve } = require("path");

sinon.spy(process, "on");

const electronStub = {
  app: {
    quit: sinon.stub(),
    on: sinon.stub(),
    exit: sinon.stub(),
    setLoginItemSettings: sinon.stub(),
    dock: { hide: sinon.stub() }
  },
  ipcMain: {
    on: sinon.stub()
  },
  Menu: sinon.stub(),
  MenuItem: sinon.stub(),
  Tray: sinon.stub(),
  Notification: sinon.stub(),
  BrowserWindow: sinon.stub(),
  screen: {
    getCursorScreenPoint: sinon.stub(),
    getDisplayNearestPoint: sinon.stub()
  }
};

const ravenStub = {
  config: sinon.stub().returnsThis(),
  install: sinon.stub(),
  captureException: sinon.stub()
};

const autoUpdaterStub = sinon.stub();

const firstRunStub = sinon.stub().returns(true);

const {
  getTrayIconName,
  quitApp,
  reportToRaven,
  getWindowPosition,
  toggleTray,
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
  os: { platform: "darwin" },
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
    electronStub.app.quit.reset();
    electronStub.app.on.reset();
    electronStub.app.exit.reset();
    electronStub.app.dock.hide.reset();
    electronStub.ipcMain.on.reset();
    electronStub.Menu.reset();
    electronStub.MenuItem.reset();
    electronStub.Tray.reset();
    electronStub.Notification.reset();
    electronStub.BrowserWindow.reset();

    ravenStub.config.reset();
    ravenStub.install.reset();
    ravenStub.captureException.reset();

    autoUpdaterStub.reset();
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
        os: { platform: "darwin" },
        "is-online": sinon.stub().resolves(true),
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
        os: { platform: "darwin" },
        "is-online": sinon.stub().resolves(true),
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
        os: { platform: "darwin" },
        "is-online": sinon.stub().resolves(true),
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

    sinon.stub(global, "clearInterval");

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
        os: { platform: "darwin" },
        "is-online": sinon.stub().resolves(true),
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
        os: { platform: "darwin" },
        "is-online": sinon.stub().rejects(false),
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
      getBounds: sinon.stub().returns({ x: 500, width: 30 })
    };
    const windowStub = {
      getSize: sinon.stub().returns([WINDOW_WIDTH, WINDOW_HEIGHT])
    };

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
        os: { platform: "win32" },
        "is-online": sinon.stub().resolves(true),
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
      setPosition: sinon.stub(),
      isVisible: sinon.stub().returns(true),
      getSize: sinon.stub().returns([1024, 768]),
      hide: sinon.stub(),
      show: sinon.stub()
    };
    const trayStub = {
      getBounds: sinon.stub().returns({ x: 500, width: 30 })
    };

    beforeEach(() => {
      windowStub.isVisible.returns(true);
      windowStub.getSize.returns([1024, 768]);
      trayStub.getBounds.returns({ x: 500, width: 30 });
    });

    afterEach(() => {
      windowStub.setPosition.reset();
      windowStub.isVisible.reset();
      windowStub.getSize.reset();
      windowStub.hide.reset();
      windowStub.show.reset();
      trayStub.getBounds.reset();
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

  describe("configureWindow", () => {
    const windowStub = {
      on: sinon.stub(),
      webContents: { on: sinon.stub(), send: sinon.stub() },
      loadURL: sinon.stub(),
      hide: sinon.stub()
    };

    beforeEach(() => {
      electronStub.BrowserWindow.returns(windowStub);
    });

    afterEach(() => {
      windowStub.on.reset();
      windowStub.webContents.on.reset();
      windowStub.loadURL.reset();
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
        os: { platform: "win32" },
        "is-online": sinon.stub().resolves(true),
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

    it("should load the url and return the window object", () => {
      const { configureWindow: configureWindowDev } = proxyquire("../index", {
        electron: electronStub,
        raven: ravenStub,
        "first-run": firstRunStub,
        "electron-is-dev": true,
        os: { platform: "win32" },
        "is-online": sinon.stub().resolves(true),
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
      on: sinon.stub(),
      webContents: { on: sinon.stub(), send: sinon.stub() },
      loadURL: sinon.stub(),
      hide: sinon.stub(),
      isVisible: sinon.stub().returns(false)
    };
    const trayStub = {
      on: sinon.stub(),
      setToolTip: sinon.stub(),
      setImage: sinon.stub()
    };
    const menuStub = {
      popup: sinon.stub()
    };

    beforeEach(() => {
      electronStub.Tray.returns(trayStub);
    });

    afterEach(() => {
      windowStub.webContents.send.reset();

      trayStub.on.reset();
      trayStub.setToolTip.reset();
      trayStub.setImage.reset();
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

      sinon.spy(global, "setInterval");

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
      sinon.spy(global, "setInterval");

      windowStub.isVisible.returns(true);

      configureTrayIcon(windowStub, null, menuStub);

      setInterval.firstCall.args[0]();

      expect(windowStub.webContents.send.called).to.be.false;

      setInterval.restore();
    });
  });

  describe("configure app", () => {
    const windowStub = {
      on: sinon.stub(),
      webContents: { on: sinon.stub(), send: sinon.stub() },
      loadURL: sinon.stub(),
      hide: sinon.stub()
    };
    const trayStub = {
      on: sinon.stub(),
      setToolTip: sinon.stub(),
      setImage: sinon.stub()
    };
    const menuReturnStub = { popup: sinon.stub(), append: sinon.stub() };
    const menuItemStub = sinon.stub();

    beforeEach(() => {
      electronStub.BrowserWindow.returns(windowStub);
      electronStub.Tray.returns(trayStub);
      electronStub.Menu.returns(menuReturnStub);
    });

    afterEach(() => {
      electronStub.ipcMain.on.reset();
      electronStub.Menu.reset();
      electronStub.MenuItem.reset();

      trayStub.on.reset();
      trayStub.setToolTip.reset();
      trayStub.setImage.reset();

      menuReturnStub.popup.reset();
      menuReturnStub.append.reset();
    });

    it("should append a menu item to the menu", () => {
      configureApp();

      expect(electronStub.Menu.calledOnce).to.be.true;
      expect(menuReturnStub.append.calledOnce).to.be.true;
      expect(electronStub.MenuItem.calledOnce).to.be.true;
      expect(electronStub.MenuItem.firstCall.args[0].label).to.equal("Quit");
      expect(electronStub.MenuItem.firstCall.args[0].click).to.be.a("function");
    });

    it("should add listeners to ipcMain", () => {
      configureApp();

      electronStub.ipcMain.on.firstCall.args[1]();

      expect(electronStub.ipcMain.on.calledTwice).to.be.true;
      expect(electronStub.ipcMain.on.firstCall.args[0]).to.equal(
        "show-config-menu"
      );
      expect(menuReturnStub.popup.calledOnce).to.be.true;
      expect(electronStub.ipcMain.on.secondCall.args[0]).to.equal("quit-app");
      expect(electronStub.ipcMain.on.secondCall.args[1]).to.be.a("function");
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
        os: { platform: "win32" },
        "is-online": sinon.stub().resolves(true),
        "./auto-updater": autoUpdaterStub
      });

      configureAppWin();

      expect(electronStub.app.dock.hide.called).to.be.false;
    });
  });
});
