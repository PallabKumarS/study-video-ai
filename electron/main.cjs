const { app, BrowserWindow } = require("electron");

function createWindow() {
	const win = new BrowserWindow({
		width: 1360,
		height: 900,
		minWidth: 1024,
		minHeight: 700,
		title: "Study Video Studio AI",
		backgroundColor: "#090c13",
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	});

	win.loadURL("http://localhost:3850");
}

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
