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

const onUpdate = window => (evt, releaseNotes, releaseName) => {
  const notification = new Notification({
    title: "Barnacal update available",
    body: "An update for Barnacal is available. Click to apply the update."
  });

  window.webContents.emit("update-available", { releaseNotes, releaseName });

  notification.on("click", autoUpdater.quitAndInstall);
};

module.exports = window => {
  if (!isInitialized) init();

  autoUpdater.on("update-downloaded", onUpdate);
  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall;
  });

  window.on("close", () => autoUpdater.removeAllListeners());
};
