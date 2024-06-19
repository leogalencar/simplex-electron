const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

// const isDev = require("electron-is-dev");

// Enable live reload for Electron too
// require('electron-reload')(__dirname, {
//     // Note that the path to electron may vary according to the main file
//     electron: require(`${__dirname}/node_modules/electron`)
// });

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.webContents.on("will-navigate", function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    win.setMenuBarVisibility(false);
    win.isMenuBarAutoHide(true);
    win.maximize();
    // win.loadURL("http://localhost:3000"); // dev
    win.loadURL(`file://${path.join(__dirname, "../build/index.html")}`); // prod
}

app.whenReady().then(() => {
    createWindow();

    app.on("active", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
