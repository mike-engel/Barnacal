const autoUpdater = require("./auto-updater");
const electron = require("electron");
const firstRun = require("first-run");
const getDate = require("date-fns/get_date");
const isDev = require("electron-is-dev");
const isOnline = require("is-online");
const ms = require("ms");
const noop = require("noop2");
const path = require("path");
const { platform } = require("os");
const Raven = require("raven");
const { version } = require("./package.json");

const {
  app,
  ipcMain,
  Menu,
  MenuItem,
  Tray,
  Notification,
  BrowserWindow,
  systemPreferences
} = electron;

// Setup global remote
global.firstWeekDay = null

const TRAY_ARROW_HEIGHT = 50;
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 300;
const HORIZ_PADDING = 15;
const VERT_PADDING = 15;
const isWin = platform() === "win32";

// prevent garbage collection & icon from dissapearing
let trayIcon = null;
let window = null;
let aboutWindow = null;

const getTrayIconName = () =>
  `Design/icons/tray/BarnacalIcon${getDate(new Date())}Template@2x.png`;

const quitApp = (app, interval) => () => {
  clearInterval(interval);
  app.exit();
};

const reportToRaven = err => {
  if (!isDev)
    isOnline()
      .then(() => Raven.captureException(err))
      .catch(noop);
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
    // The macOS implementation of Electron.Tray ceils trayBounds.y to zero
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

const toggleTray = (window, tray) => () => {
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

const configureAboutWindow = () => {
  const htmlPath = `file://${__dirname}/about.html`;

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
    titleBarStyle: "hidden-inset",
    backgroundColor: "#000",
    webPreferences: {
      backgroundThrottling: false,
      devTools: true
    }
  });

  aboutWindow.on("close", evt => {
    evt.preventDefault();
    aboutWindow.hide();
  });

  aboutWindow.loadURL(htmlPath);

  return aboutWindow;
};

const showAbout = aboutWindow => () => {
  if (aboutWindow.isVisible()) {
    aboutWindow.hide();
  } else {
    aboutWindow.show();
  }
};

/**
 * This command `getUserDefault` is like doing this in your OSX Terminal:
 *   defaults read -g AppleFirstWeekday
 *
 * If all is ok should return something like this:
 *   { gregorian = 2; }
 *
 * But can return a not found:
 *   `The domain/default pair of
 *    (kCFPreferencesAnyApplication, AppleFirstWeekday) does not exist`
 *
 * We ignore it when there is an error:
 * If setting first day on Apple UI doesn't work. They can do this:
 * in command line:
 *   defaults write NSGlobalDomain AppleFirstWeekday -dict 'gregorian' 2
 *
 * This will setup first day of week to monday
 */
function readOSXUserFirstWeekDay () {
  const firstWeekdayPref = systemPreferences.getUserDefault(
    'AppleFirstWeekday',
    'dictionary'
  );

  if (!Object.keys(firstWeekdayPref).length) return null

  // key in this example is `gregorian` and day is `2`
  // { gregorian = 2; }
  const key = Object.keys(firstWeekdayPref)[0]
  return firstWeekdayPref[key]
}

/**
 * Send to calendar DOM window first weekday info
 */
function setUserFirstWeekday () {
  // By default Sunday is first day of the week
  let day = 1;

  if (platform() === 'darwin') {
    day = readOSXUserFirstWeekDay() || day;
  }

  global.firstWeekday = day;
}

const configureWindow = () => {
  const htmlPath = `file://${__dirname}/index${isDev ? ".dev" : ""}.html`;

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

  window.webContents.on("crashed", reportToRaven);
  window.on("unresponsive", reportToRaven);
  /* istanbul ignore next */
  window.on("close", () => (window = null));
  window.on("blur", () => {
    window.hide();
    window.webContents.send("background-update");
  });

  // configure the auto updater, only in prod
  if (!isDev) autoUpdater(window);

  window.loadURL(htmlPath);

  return window;
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
  }, ms("1m"));

  return iconUpdateInterval;
};

const configureApp = () => {
  setUserFirstWeekday();

  const menu = new Menu();
  const window = configureWindow();
  const iconUpdateInterval = configureTrayIcon(window, trayIcon, menu);
  const quitAppWithContext = quitApp(app, iconUpdateInterval);

  configureAboutWindow();

  if (platform() === "darwin") app.dock.hide();

  menu.append(
    new MenuItem({
      label: "Quit",
      click: quitAppWithContext
    })
  );

  menu.append(
    new MenuItem({
      label: "About",
      click: showAbout(aboutWindow)
    })
  );

  ipcMain.on("show-config-menu", () => menu.popup(window));
  ipcMain.on("show-about", showAbout(aboutWindow));
  ipcMain.on("quit-app", quitAppWithContext);
};

if (!isDev) {
  Raven.config(
    "https://f98d2418699d4fe9acac2e08621e31d0:f0dd6bacf1dc4560977c18ac28f57b15@sentry.io/204280",
    {
      release: version
    }
  ).install();
}

// set the app to open on login
if (!isDev && firstRun()) {
  app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
}

process.on("beforeExit", app.quit);

app.on("ready", configureApp);

module.exports = {
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
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
  HORIZ_PADDING,
  VERT_PADDING
};
