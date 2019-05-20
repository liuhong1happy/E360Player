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

var icon_path = path.join(__dirname, 'logo.png');
if (process.platform == 'darwin') {
    app.dock.setIcon(icon_path);
}

function createWindow () {
  // Create the browser window.
  
  mainWindow = new BrowserWindow({
      width: 1200, 
      height: 800,
      icon:icon_path,
      darkTheme:true,
      webPreferences: {
          nodeIntegration: true,
      }
  });

  // and load the index.html of the app.

  mainWindow.loadURL('file://' + __dirname + '/360Player/index.html');

  mainWindow.setFullScreen(false);
  mainWindow.setMenuBarVisibility(true);
  // Open the DevTools.
  //  mainWindow.webContents.openDevTools();
  mainWindow.webContents.clearHistory();

  // Emitted when the window is closed.
  mainWindow.on("close",function(event){
//        var ok = dialog.showMessageBox({type:"question",title:"询问",message:"确定要退出吗？",buttons:["确定","取消"],defaultId:0,cancelId:1});
//        if(ok==1){
//            event.preventDefault();
//        }
      
  })
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    var windows = BrowserWindow.getAllWindows();
    for(var i=0;i<windows.length;i++){
        if(mainWindow!=windows[i]) windows[i].close();
    }
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

ipcMain.on('sync-clear-history',function(event,arg){
    mainWindow.webContents.clearHistory();
    event.returnValue = true;
})

ipcMain.on('sync-open-file', function(event, arg) {
  const results = dialog.showOpenDialog({ properties: [ 'openFile'],filters: [{ name: 'Movies', extensions: ['mp4'] }]});
  var _results = results?results:[];
  if(_results.length>0) app.addRecentDocument(_results[0]);
  event.returnValue = _results?_results:[];
});

ipcMain.on('async-app-quit', function(event, arg) {
    dialog.showMessageBox({type:"question",title:arg.title,message:arg.message,buttons:arg.buttons,defaultId:0,cancelId:1},function(ok){
        if(ok==0){
            var windows = BrowserWindow.getAllWindows();
            for(var i=0;i<windows.length;i++){
                windows[i].close();
            }
            app.quit();
        }
        event.sender.send('async-app-quit-reply',ok);
    });
});

ipcMain.on("sync-file-info",function(event,arg){
    if(fs.existsSync(arg)){
        const states = fs.statSync(arg);
        const basename = path.basename(arg);
        const extname = path.extname(arg);
        event.returnValue = {
            name:basename,
            size:states.size,
            src:arg,
            extname:extname,
            exist:true
        }
    }else{
        event.returnValue = {
            exist:false,
            src:arg
        }
    }
})

ipcMain.on("sync-read-dir",function(event,arg){
    if(fs.existsSync(arg)){
        const localization = fs.readdirSync(arg);
        event.returnValue = localization;
    }else{
        event.returnValue = [];
    }
})

ipcMain.on("sync-read-jsonfile",function(event,arg){
    if(fs.existsSync(arg)){
        const fileData = fs.readFileSync(arg,{encoding:"utf8"});
        event.returnValue = JSON.parse(fileData);
    }else{
        event.returnValue = [];
    }
})

ipcMain.on("sync-open-about",function(event,arg){
    var aboutWin = new BrowserWindow({
        width: 360, 
        height: 200,
        darkTheme:true,
        minimizable:false,
        maximizable:false,
        fullscreenable:false,
        resizable:false,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    if(aboutWin.setMenu) aboutWin.setMenu(null);
    aboutWin.loadURL('file://' + __dirname + '/360Player/about.html');
    event.returnValue = true;
})

ipcMain.on("sync-open-lang",function(event,arg){
    var langWin = new BrowserWindow({
        width: 360, 
        height: 200,
        darkTheme:true,
        minimizable:false,
        maximizable:false,
        fullscreenable:false,
        resizable:false,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    if(langWin.setMenu) langWin.setMenu(null);
    langWin.loadURL('file://' + __dirname + '/360Player/language.html');
    event.returnValue = true;
})

global.renderEventArgs = {
    online:{
        key:new Date().valueOf(),
        value:null
    }
}

ipcMain.on('sync-open-video-by-url',function(event,arg){
    var langWin = new BrowserWindow({
        width: 360, 
        height: 200,
        darkTheme:true,
        minimizable:false,
        maximizable:false,
        fullscreenable:false,
        resizable:false,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    if(langWin.setMenu) langWin.setMenu(null);
    langWin.loadURL('file://' + __dirname + '/360Player/open.html');
    event.returnValue = true;
})

ipcMain.on("async-open-video-by-url",function(event,arg){
    event.sender.send('replay-open-video-by-url',arg);
    
    global.renderEventArgs.online = {
        key:new Date().valueOf(),
        value:arg
    } 
    
    var windows = BrowserWindow.getAllWindows();
    for(var i=0;i<windows.length;i++){
        if(mainWindow!=windows[i]) windows[i].close();
    }
})

ipcMain.on('change-language',function(event,arg){
    var windows = BrowserWindow.getAllWindows();
    for(var i=0;i<windows.length;i++){
        if(mainWindow!=windows[i]) windows[i].close();
        else windows[i].reload();
    }
    event.returnValue = true;
})

ipcMain.on("sync-localization-path",function(event,arg){
    // win7 bug
    event.returnValue =  __dirname + '/360Player/i18n/localization';
})

