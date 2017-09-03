const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const { version } = require("../package.json");
const { resolve } = require("path");

const notificationReturnStub = {
  show: sinon.stub(),
  on: sinon.stub()
};

const electronStub = {
  autoUpdater: {
    on: sinon.stub(),
    setFeedURL: sinon.stub(),
    checkForUpdates: sinon.stub(),
    quitAndInstall: sinon.stub(),
    removeAllListeners: sinon.stub()
  },
  ipcMain: {
    on: sinon.stub()
  },
  Notification: sinon.stub().returns(notificationReturnStub)
};

const ravenStub = {
  captureException: sinon.stub()
};

const autoUpdater = proxyquire("../auto-updater", {
  electron: electronStub,
  raven: ravenStub,
  "electron-is-dev": false,
  os: { platform: "darwin" }
});

describe("autoUpdater", () => {
  beforeEach(() => {
    electronStub.Notification.returns(notificationReturnStub);
  });

  afterEach(() => {
    electronStub.autoUpdater.on.reset();
    electronStub.autoUpdater.setFeedURL.reset();
    electronStub.autoUpdater.checkForUpdates.reset();
    electronStub.autoUpdater.quitAndInstall.reset();
    electronStub.ipcMain.on.reset();
    electronStub.Notification.reset();

    ravenStub.captureException.reset();
  });

  describe("init", () => {
    it("should handle autoupdater errors", () => {
      autoUpdater.init();

      electronStub.autoUpdater.on.firstCall.args[1]("yolo", "test");

      expect(electronStub.autoUpdater.on.calledOnce).to.be.true;
      expect(electronStub.autoUpdater.on.firstCall.args[0]).to.equal("error");
      expect(ravenStub.captureException.calledOnce).to.be.true;
      expect(ravenStub.captureException.firstCall.args).to.deep.equal(["yolo"]);
    });
  });
});
