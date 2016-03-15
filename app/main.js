'use strict';

const path = require('path');
const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

var icon_path = path.join(__dirname, 'logo.jpg');
if (process.platform == 'darwin') {
    app.dock.setIcon(icon_path);
}

function createWindow () {
  // Create the browser window.
  
  mainWindow = new BrowserWindow({width: 1200, height: 800,icon:icon_path,darkTheme:true});

  // and load the index.html of the app.

  mainWindow.loadURL('file://' + __dirname + '/360Player/index.html');

  // Open the DevTools.
//  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


// In main process.

ipcMain.on('asynchronous-message', function(event, arg) {
  console.log(arg);  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('sync-open-file', function(event, arg) {
  var results = dialog.showOpenDialog({ properties: [ 'openFile'],filters: [{ name: 'Movies', extensions: ['mp4'] }]});
  event.returnValue = results?results:[];
});

ipcMain.on('sync-app-quit', function(event, arg) {
   app.quit();
  event.returnValue = true;
});