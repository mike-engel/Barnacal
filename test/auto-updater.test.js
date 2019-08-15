const { expect } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire")
	.noCallThru()
	.noPreserveCache();
const { version } = require("../package.json");
const ms = require("ms");

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

const windowStub = {
	webContents: {
		send: sinon.stub()
	},
	on: sinon.stub()
};

const ravenStub = {
	captureException: sinon.stub()
};

const autoUpdater = proxyquire("../src/electron/auto-updater", {
	electron: electronStub,
	raven: ravenStub,
	"electron-is-dev": false,
	"is-online": sinon.stub().resolves(),
	os: { platform: () => "darwin" }
});

electronStub.Notification.isSupported = sinon.stub().returns(true);

describe("autoUpdater", () => {
	beforeEach(() => {
		electronStub.Notification.returns(notificationReturnStub);
		electronStub.Notification.isSupported.returns(true);
	});

	afterEach(() => {
		electronStub.autoUpdater.on.reset();
		electronStub.autoUpdater.setFeedURL.reset();
		electronStub.autoUpdater.checkForUpdates.reset();
		electronStub.autoUpdater.quitAndInstall.reset();
		electronStub.autoUpdater.removeAllListeners.reset();
		electronStub.ipcMain.on.reset();
		electronStub.Notification.reset();
		electronStub.Notification.isSupported.reset();

		windowStub.webContents.send.reset();
		windowStub.on.reset();

		notificationReturnStub.on.reset();
		notificationReturnStub.show.reset();

		ravenStub.captureException.reset();
	});

	describe("main", () => {
		it("should call init on first load", () => {
			autoUpdater(windowStub);

			expect(electronStub.autoUpdater.setFeedURL.calledOnce).to.be.true;
		});

		it("should not call init on later loads", () => {
			autoUpdater(windowStub);

			expect(electronStub.autoUpdater.setFeedURL.called).to.be.false;
		});

		it("should notify the user when the update has been downloaded", () => {
			autoUpdater(windowStub);

			electronStub.autoUpdater.on.firstCall.args[1](null, "yolo", "v1.0.0");

			expect(electronStub.autoUpdater.on.calledOnce).to.be.true;
			expect(electronStub.autoUpdater.on.firstCall.args[0]).to.equal("update-downloaded");
			expect(windowStub.webContents.send.calledTwice).to.be.true;
			expect(windowStub.webContents.send.firstCall.args).to.deep.equal(["update-downloaded"]);
			expect(windowStub.webContents.send.secondCall.args[0]).to.deep.equal("update-ready");
		});

		it("should listen for the event to install the update", () => {
			autoUpdater(windowStub);

			expect(electronStub.ipcMain.on.calledOnce).to.be.true;
			expect(electronStub.ipcMain.on.firstCall.args).to.deep.equal([
				"install-update",
				electronStub.autoUpdater.quitAndInstall
			]);
		});

		it("should remove all autoUpdater listeners on exit", () => {
			autoUpdater(windowStub);

			expect(windowStub.on.calledOnce).to.be.true;
			expect(windowStub.on.firstCall.args).to.deep.equal([
				"close",
				electronStub.autoUpdater.removeAllListeners
			]);
		});
	});

	describe("init", () => {
		it("should handle autoupdater errors", done => {
			autoUpdater.init();

			electronStub.autoUpdater.on.firstCall.args[1]("yolo", "test");

			setTimeout(() => {
				expect(electronStub.autoUpdater.on.calledOnce).to.be.true;
				expect(electronStub.autoUpdater.on.firstCall.args[0]).to.equal("error");
				expect(ravenStub.captureException.calledOnce).to.be.true;
				expect(ravenStub.captureException.firstCall.args).to.deep.equal(["yolo"]);
				done();
			});
		});

		it("should not report autoupdater errors to sentry in non-prod", done => {
			const autoUpdaterDev = proxyquire("../src/electron/auto-updater", {
				electron: electronStub,
				raven: ravenStub,
				"electron-is-dev": true,
				"is-online": sinon.stub().resolves(),
				os: { platform: () => "darwin" }
			});

			autoUpdaterDev.init();

			electronStub.autoUpdater.on.firstCall.args[1]("yolo", "test");

			setTimeout(() => {
				expect(ravenStub.captureException.called).to.be.false;
				done();
			});
		});

		it("should not report autoupdater errors to sentry if offline", done => {
			const autoUpdaterDev = proxyquire("../src/electron/auto-updater", {
				electron: electronStub,
				raven: ravenStub,
				"electron-is-dev": false,
				"is-online": sinon.stub().rejects(),
				os: { platform: () => "darwin" }
			});

			autoUpdaterDev.init();

			electronStub.autoUpdater.on.firstCall.args[1]("yolo", "test");

			setTimeout(() => {
				expect(ravenStub.captureException.called).to.be.false;
				done();
			});
		});

		it("should set the right feed url", () => {
			autoUpdater.init();

			expect(electronStub.autoUpdater.setFeedURL.calledOnce).to.be.true;
			expect(electronStub.autoUpdater.setFeedURL.firstCall.args).to.deep.equal([
				`https://barnacal-updates.now.sh/update/darwin/${version}`
			]);
		});

		it("should check for updates periodically", () => {
			sinon.spy(global, "setInterval");
			sinon.spy(global, "setTimeout");

			autoUpdater.init();

			setTimeout.firstCall.args[0]();
			setInterval.firstCall.args[0]();

			expect(setTimeout.calledOnce).to.be.true;
			expect(setInterval.calledOnce).to.be.true;
			expect(electronStub.autoUpdater.checkForUpdates.calledTwice).to.be.true;
			expect(setTimeout.firstCall.args[1]).to.equal(ms("10s"));
			expect(setInterval.firstCall.args[1]).to.equal(ms("60m"));

			setTimeout.restore();
			setInterval.restore();
		});
	});

	describe("onUpdate", () => {
		it("should display a notification to the user", () => {
			autoUpdater.onUpdate(windowStub, "yolo", "v1.0.0");

			expect(electronStub.Notification.isSupported.calledOnce).to.be.true;
			expect(electronStub.Notification.calledOnce).to.be.true;
			expect(electronStub.Notification.firstCall.args).to.deep.equal([
				{
					title: "Barnacal update available",
					body: "Barnacal v1.0.0 is ready to install. Click to apply the update."
				}
			]);
			expect(notificationReturnStub.show.calledOnce).to.be.true;
			expect(notificationReturnStub.on.calledOnce).to.be.true;
			expect(notificationReturnStub.on.firstCall.args).to.deep.equal([
				"click",
				electronStub.autoUpdater.quitAndInstall
			]);
		});

		it("should not display a notification to the user if they are not supported", () => {
			electronStub.Notification.isSupported.returns(false);

			autoUpdater.onUpdate(windowStub, "yolo", "v1.0.0");

			expect(electronStub.Notification.isSupported.calledOnce).to.be.true;
			expect(electronStub.Notification.called).to.be.false;
			expect(notificationReturnStub.show.called).to.be.false;
			expect(notificationReturnStub.on.called).to.be.false;
		});

		it("should sent a message to the app", () => {
			autoUpdater.onUpdate(windowStub, "yolo", "v1.0.0");

			expect(windowStub.webContents.send.calledOnce).to.be.true;
			expect(windowStub.webContents.send.firstCall.args).to.deep.equal([
				"update-ready",
				{ releaseNotes: "yolo", releaseName: "v1.0.0" }
			]);
		});
	});
});
