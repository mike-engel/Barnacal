const path = require("path");
const electron = require("electron");
const getDate = require("date-fns/get_date");
const firstRun = require("first-run");
const { platform } = require("os");
const isDev = require("electron-is-dev");
const Raven = require("raven");
const { version } = require("./package.json");
const autoUpdater = require("./auto-updater");
const ms = require("ms");

const BrowserWindow = electron.BrowserWindow;
const { app, ipcMain, Menu, MenuItem, Tray, Notification } = electron;
const TRAY_ARROW_HEIGHT = 50;
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 300;
const HORIZ_PADDING = 15;
const VERT_PADDING = 15;
const isWin = platform === "win32";

if (!isDev) {
  Raven.config(
    "https://f98d2418699d4fe9acac2e08621e31d0:f0dd6bacf1dc4560977c18ac28f57b15@sentry.io/204280",
    {
      release: version
    }
  ).install();
}

// prevent garbage collection & icon from dissapearing
let trayIcon = null;
let window = null;

process.on("beforeExit", () => app.quit());

const getTrayIconName = () =>
  `Design/icons/tray/BarnacalIcon${getDate(new Date())}Template@2x.png`;

// set the app to open on login
if (!isDev && firstRun()) {
  app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
}

const quitApp = (app, interval) => () => {
  clearInterval(interval);
  app.exit();
};

const toggleTray = (window, tray) => () => {
  const { screen } = electron;
  const trayBounds = tray.getBounds();
  const windowSize = window.getSize();
  const cursorPosition = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPosition);
  const displayArea = display.workArea;

  let horizontalPosition;
  let verticalPosition;

  if (isWin) {
    horizontalPosition = displayArea.x + displayArea.width - windowSize[0];
    verticalPosition = displayArea.y + displayArea.height - windowSize[1];
  } else {
    const trayCenter = trayBounds.x + trayBounds.width / 2;
    horizontalPosition = trayCenter - windowSize[0] / 2;

    // The macOS implementation of Electron.Tray ceils trayBounds.y to zero
    // making it unreliable for vertically positioning the window.
    // Use the display's work area instead.
    verticalPosition = displayArea.y + 5;

    const left = horizontalPosition + windowSize[0];
    const maxLeft = displayArea.width - 15;

    // Check if window would be outside screen
    // If yes, make sure it isn't
    if (left > maxLeft) {
      horizontalPosition = horizontalPosition - left - maxLeft;
    }
  }

  window.setPosition(horizontalPosition, verticalPosition);
  if (window.isVisible()) {
    window.hide();
  } else {
    window.show();
  }
};

app.on("ready", function() {
  const menu = new Menu();
  const menuIconPath = path.join(__dirname, getTrayIconName());
  const appIconPath = path.join(__dirname, "Design/icons/app/AppIcon.png");
  const htmlPath = `file://${__dirname}/index${isDev ? ".dev" : ""}.html`;

  trayIcon = new Tray(menuIconPath);

  let window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    resizable: false,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      backgroundThrottling: false
    }
  });

  window.webContents.on("crashed", err => {
    if (!isDev) Raven.captureException(err);
  });

  window.on("unresponsive", err => {
    if (!isDev) Raven.captureException(err);
  });

  // update the icon every day
  const iconUpdateInterval = setInterval(() => {
    trayIcon.setImage(path.join(__dirname, getTrayIconName()));
    if (!window.isVisible()) window.webContents.send("background-update");
  }, ms("1m"));

  if (process.platform === "darwin") app.dock.hide();

  window.loadURL(htmlPath);

  // configure the auto updater, only in prod
  if (!isDev) autoUpdater(window);

  window.on("close", function() {
    window = null;
  });

  window.on("blur", function() {
    window.hide();
    window.webContents.send("background-update");
  });

  const toggleTrayWithContext = toggleTray(window, trayIcon);
  const quitAppWithContext = quitApp(app, iconUpdateInterval);

  trayIcon.setToolTip("Barnacal");

  trayIcon.on("click", toggleTrayWithContext);
  trayIcon.on("double-click", toggleTrayWithContext);
  trayIcon.on("right-click", () => {
    menu.popup(window);
  });

  menu.append(
    new MenuItem({
      label: "Quit",
      click: quitAppWithContext
    })
  );

  ipcMain.on("show-config-menu", evt => {
    menu.popup(window);
  });

  ipcMain.on("quit-app", quitAppWithContext);
});
