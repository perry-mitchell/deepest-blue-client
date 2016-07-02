const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");

const debug = require("debug")("dbc");

const root = path.resolve(path.join(__dirname, ".."));

let mainWindow,
    controlWindow;

let openDialogURL = `file://${root}/windows/init.html`,
    controlWindowURL = `file://${root}/windows/control.html`;


// Quit when all windows are closed.
app.on('window-all-closed', function() {
  //if (process.platform != 'darwin')
    app.quit();
});

ipcMain.on('connected', (event, data) => {
    debug("Connected")
    controlWindow = new BrowserWindow({ width: 900, height: 600 });
    controlWindow.loadURL(controlWindowURL);
    controlWindow.openDevTools();
    controlWindow.on('closed', function() {
        controlWindow = null;
    });
    mainWindow.close();
    // init
    controlWindow.webContents.on("dom-ready", function() {
        console.log("Will send", data);
        controlWindow.webContents.send("connected" , {
            info: data
        });
    });
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600});

    // and load the index.html of the app.
    mainWindow.loadURL(openDialogURL);

    mainWindow.openDevTools();

    // setTimeout(function() {
    //     mainWindow.webContents.send('info' , {msg:'hello from main process'});
    // }, 3000);

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});
