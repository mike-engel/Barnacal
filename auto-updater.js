const { autoUpdater, Notification, ipcMain } = require("electron");
const Raven = require("raven");
const { version } = require("./package");
const ms = require("ms");
const isDev = require("electron-is-dev");

const { platform } = process;
const updateHost = "https://barnacal-updates.now.sh";

let isInitialized = false;

const init = () => {
  autoUpdater.on("error", (err, msg) => {
    console.error("Error checking for updates: ", msg, err.stack);

    if (!isDev) {
      Raven.captureException(err);
    }
  });

  autoUpdater.setFeedURL(`${updateHost}/update/${platform}/${version}`);

  // Don't check immediately on start for windows
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, ms("10s"));

  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, ms("60m"));

  isInitialized = true;
};

const onUpdate = (window, evt, releaseNotes, releaseName) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: "Barnacal update available",
      body: `Barnacal ${releaseName} is ready to install. Click to apply the update.`
    });

    notification.show();

    notification.on("click", autoUpdater.quitAndInstall);
  }

  window.webContents.send("update-ready", { releaseNotes, releaseName });
};

module.exports = window => {
  if (!isInitialized) init();

  autoUpdater.on("checking-for-update", () => {
    window.webContents.send("checking-for-updates");
  });

  autoUpdater.on("update-available", () => {
    window.webContents.send("update-available");
  });

  autoUpdater.on("update-downloaded", (evt, releaseNotes, releaseName) => {
    window.webContents.send("update-downloaded");
    onUpdate(window, evt, releaseNotes, releaseName);
  });

  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall();
  });

  window.on("close", autoUpdater.removeAllListeners);
};
