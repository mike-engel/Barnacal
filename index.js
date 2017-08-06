const path = require("path");
const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;
const getDate = require("date-fns/get_date");

const { app, ipcMain, Menu, MenuItem, Tray } = electron;
const TRAY_ARROW_HEIGHT = 50;
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 300;
const HORIZ_PADDING = 15;
const VERT_PADDING = 15;

process.on("beforeExit", () => app.quit());

const getIconName = () =>
  `Design/icons/BarnacalIcon${getDate(new Date())}Template@2x.png`;

app.on("ready", function() {
  const menu = new Menu();
  const iconName = getIconName();
  const iconPath = path.join(__dirname, iconName);
  const trayIcon = new Tray(iconPath);

  // update the icon every day
  const iconUpdateInterval = setInterval(() => {
    trayIcon.setImage(getIconName());
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

  window.loadURL(
    `file://${__dirname}/index${process.env.NODE_ENV !== "production"
      ? ".dev"
      : ""}.html`
  );

  window.on("close", function() {
    window = null;
  });

  window.on("blur", function() {
    window.hide();
  });

  trayIcon.setToolTip("Barnacal");

  trayIcon.on("click", event => {
    const { screen } = electron;
    const cursorPosition = screen.getCursorScreenPoint();
    const primarySize = screen.getPrimaryDisplay().workAreaSize;
    const trayPositionVert =
      cursorPosition.y >= primarySize.height / 2 ? "bottom" : "top";
    const trayPositionHoriz =
      cursorPosition.x >= primarySize.width / 2 ? "right" : "left";

    window.setPosition(getTrayPosX(), getTrayPosY());
    window.isVisible() ? window.hide() : window.show();

    function getTrayPosX() {
      const horizBounds = {
        left: cursorPosition.x - WINDOW_WIDTH / 2,
        right: cursorPosition.x + WINDOW_WIDTH / 2
      };
      if (trayPositionHoriz == "left") {
        return horizBounds.left <= HORIZ_PADDING
          ? HORIZ_PADDING
          : horizBounds.left;
      } else {
        return horizBounds.right >= primarySize.width
          ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH
          : horizBounds.right - WINDOW_WIDTH;
      }
    }

    function getTrayPosY() {
      return trayPositionVert == "bottom"
        ? cursorPosition.y - WINDOW_HEIGHT - VERT_PADDING
        : cursorPosition.y + VERT_PADDING;
    }
  });

  menu.append(new MenuItem({ label: "Quit", click: () => app.quit() }));

  ipcMain.on("show-config-menu", evt => {
    menu.popup(window);
  });

  ipcMain.on("quit-app", evt => {
    clearInterval(iconUpdateInterval);
    app.quit();
  });
});
