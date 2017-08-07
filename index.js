const path = require("path");
const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;
const getDate = require("date-fns/get_date");
const firstRun = require("first-run");
const { platform } = require("os");

const { app, ipcMain, Menu, MenuItem, Tray } = electron;
const TRAY_ARROW_HEIGHT = 50;
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 300;
const HORIZ_PADDING = 15;
const VERT_PADDING = 15;
const env = process.env.NODE_ENV;
const isDev = env === "development";
const isProd = env === "production";
const isWin = platform === "win32";

// prevent garbage collection & icon from dissapearing
let trayIcon = null;
let window = null;

process.on("beforeExit", () => app.quit());

const getTrayIconName = () =>
  `Design/icons/tray/BarnacalIcon${getDate(new Date())}Template@2x.png`;

// set the app to open on login
if (!isDev && firstRun()) {
  app.setLoginItemSettings({ openAtLogin: true });
}

const quitApp = (app, interval) => () => {
  clearInterval(interval);
  app.exit();
};

const openTray = (window, tray) => () => {
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
  window.isVisible() ? window.hide() : window.show();
};

app.on("ready", function() {
  const menu = new Menu();
  const iconPath = path.join(__dirname, getTrayIconName());
  const htmlPath = `file://${__dirname}/index${isProd ? "" : ".dev"}.html`;

  trayIcon = new Tray(iconPath);

  // update the icon every day
  const iconUpdateInterval = setInterval(() => {
    trayIcon.setImage(getTrayIconName());
  }, 60000);

  let window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    resizable: false,
    frame: false,
    transparent: true,
    show: false
  });

  if (process.platform === "darwin") app.dock.hide();

  window.loadURL(htmlPath);

  window.on("close", function() {
    window = null;
  });

  window.on("blur", function() {
    window.hide();
  });

  const openTrayWithContext = openTray(window, trayIcon);
  const quitAppWithContext = quitApp(app, iconUpdateInterval);

  trayIcon.setToolTip("Barnacal");

  trayIcon.on("click", openTrayWithContext);
  trayIcon.on("double-click", openTrayWithContext);
  trayIcon.on("right-click", openTrayWithContext);

  menu.append(new MenuItem({ label: "Quit", click: quitAppWithContext }));

  ipcMain.on("show-config-menu", evt => {
    menu.popup(window);
  });

  ipcMain.on("quit-app", quitAppWithContext);
});
