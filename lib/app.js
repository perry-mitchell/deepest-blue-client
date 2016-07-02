const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");
const io = require("socket.io-client");
const socketStream = require("socket.io-stream");
const http = require("http");
const fs = require("fs");

const debug = require("debug")("dbc");

const root = path.resolve(path.join(__dirname, ".."));

let mainWindow,
    controlWindow;

let serverData,
    trackSocket,
    trackStream;

let openDialogURL = `file://${root}/windows/init.html`,
    controlWindowURL = `file://${root}/windows/control.html`;

function requestTrack(host, port, path, filePath) {
    console.time("track");
    debug(`HTTP GET: ${host}${path} (${filePath})`);
    http.get(
        {
            host: host,
            port: port,
            path: `${path}?filename=${encodeURIComponent(filePath)}`
        },
        function(response) {
            console.log("Request response");
        }
    );
}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  //if (process.platform != 'darwin')
    app.quit();
});

ipcMain.on("connected", (event, data) => {
    debug("Connected")
    serverData = data;
    controlWindow = new BrowserWindow({ width: 900, height: 600 });
    controlWindow.loadURL(controlWindowURL);
    controlWindow.openDevTools();
    controlWindow.on('closed', function() {
        controlWindow = null;
    });
    mainWindow.close();
    // socket
    trackSocket = io.connect(`http://${data.address}:${data.dataPort}/track`);
    socketStream(trackSocket).on("track", function(stream, data) {
        let filename = path.basename(data.name);
        debug("Receive file: " + filename);
        stream.pipe(fs.createWriteStream(path.join(__dirname, "..", filename)));
        console.timeEnd("track");
    });
    //trackStream = socketStream.createStream();
    // init
    controlWindow.webContents.on("dom-ready", function() {
        debug("Control ready: booting");
        controlWindow.webContents.send("connected" , {
            info: data
        });
    });
});

ipcMain.on("get-track", (event, data) => {
    let filePath = data.filename;
    debug("Track request: " + filePath);
    requestTrack(serverData.address, serverData.infoPort, "/send-track", filePath);
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
