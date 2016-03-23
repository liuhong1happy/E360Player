'use strict';

const path = require('path');
const fs = require("fs");
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

  mainWindow.setFullScreen(false);
  mainWindow.setMenuBarVisibility(true);
  // Open the DevTools.
  //  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("close",function(event){
        var ok = dialog.showMessageBox({type:"question",title:"询问",message:"确定要退出吗？",buttons:["确定","取消"],defaultId:0,cancelId:1});
        if(ok==1) event.preventDefault();
  })
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

ipcMain.on('sync-open-file', function(event, arg) {
  const results = dialog.showOpenDialog({ properties: [ 'openFile'],filters: [{ name: 'Movies', extensions: ['mp4'] }]});
  event.returnValue = results?results:[];
});

ipcMain.on('async-app-quit', function(event, arg) {
    dialog.showMessageBox({type:"question",title:"询问",message:"确定要退出吗？",buttons:["确定","取消"],defaultId:0,cancelId:1},function(ok){
        if(ok==0) app.quit();
        event.sender.send('async-app-quit-reply',ok);
    });
});

ipcMain.on("sync-file-info",function(event,arg){
    const states = fs.statSync(arg);
    const basename = path.basename(arg);
    event.returnValue = {
        name:basename,
        size:states.size,
        src:arg
    }
})