const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const ipcRenderer = electron.ipcRenderer;
const BrowserWindow = remote.BrowserWindow;

var createMenu = function(){
    var template = [
        {
            label: i18n.prop("menu.file") ,
            submenu:[
                {
                    label: i18n.prop("menu.open-video"),
                    accelerator: 'CmdOrCtrl+O',
                    click: function(item, focusedWindow) {
                        var files = ipcRenderer.sendSync('sync-open-file', null); 
                        if(files[0]){
                            const file_info = ipcRenderer.sendSync("sync-file-info",files[0])
                            if(file_info.extname.toUpperCase()==".MP4"){
                                controller.addVideoToList(file_info);
                            }
                        }else{
                            console.log("not file")
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: i18n.prop("menu.exit"),
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                }
            ]
        },
      {
        label:  i18n.prop("menu.play-control"),
        submenu: [
          {
            label:  i18n.prop("menu.toggle-play"),
            accelerator: 'CmdOrCtrl+P',
            click: function(item, focusedWindow) {
                controller.togglePlay();
            }
           },
          {
            label:  i18n.prop("menu.prev-video"),
            accelerator: 'CmdOrCtrl+L',
            click: function(item, focusedWindow) {
                    controller.playPrevVideo();
            }
          },
          {
            label:  i18n.prop("menu.next-video"),
            aaccelerator: 'CmdOrCtrl+N',
            click: function(item, focusedWindow) {
               controller.playNextVideo();
            }
          },
        ]
      },
      {
        label:  i18n.prop("menu.edit"),
        submenu: [
          {
            label: i18n.prop("menu.undo"),
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
          },
          {
            label:  i18n.prop("menu.redo"),
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            label: i18n.prop("menu.cut"),
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
          },
          {
            label:  i18n.prop("menu.copy"),
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
          },
          {
            label: i18n.prop("menu.paste"),
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
          },
          {
            label:  i18n.prop("menu.selectall"),
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
          },
        ]
      },
      {
        label: i18n.prop("menu.view"),
        submenu: [
          {
            label: i18n.prop("menu.reload"),
            accelerator: 'CmdOrCtrl+R',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.reload();
            }
          },
          {
            type: 'separator'
          },
          {
            label: i18n.prop("menu.switch-language"),
            click: function(){
                ipcRenderer.sendSync("sync-open-lang");
            }
          },
          {
            type: 'separator'
          },
          {
            label: i18n.prop("menu.toggle-fullscreen"),
            accelerator: (function() {
              if (process.platform == 'darwin')
                return 'Ctrl+Command+F';
              else
                return 'F11';
            })(),
            click: function(item, focusedWindow) {
                  console.log(item);
                  if (focusedWindow)
                        controller.setFullScreen(focusedWindow.isFullScreen());
                        focusedWindow.setMenuBarVisibility(focusedWindow.isFullScreen());
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                  }
          },
          {
            label: i18n.prop("menu.toggle-devtools"),
            accelerator: (function() {
              if (process.platform == 'darwin')
                return 'Alt+Command+I';
              else
                return 'Ctrl+Shift+I';
            })(),
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.toggleDevTools();
            }
          },
          {
            type: 'separator'
          },
          {
            label:  i18n.prop("menu.toggle-playlist"),
            accelerator: (function() {
              if (process.platform == 'darwin')
                return 'Alt+Command+H';
              else
                return 'Ctrl+Shift+H';
            })(),
            click: function(item, focusedWindow) {
                controller.togglePlayList();
            }
          },          
          {
            label:   i18n.prop("menu.toggle-flatscreen"),
            accelerator: (function() {
              if (process.platform == 'darwin')
                return 'Alt+Command+J';
              else
                return 'Ctrl+Shift+J';
            })(),
            click: function(item, focusedWindow) {
                controller.toggleFlatScreen();
            }
          },
        ]
      },
      {
        label:  i18n.prop("menu.window"),
        role: 'window',
        submenu: [
          {
            label:   i18n.prop("menu.minimize"),
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          {
            label:  i18n.prop("menu.close"),
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          },
        ]
      },
      {
        label: i18n.prop("menu.help"),
        role: 'help',
        submenu: [
          {
            label: i18n.prop("menu.about-electron"),
            click: function() { require('electron').shell.openExternal('http://electron.atom.io') }
          },
          {
            label: i18n.prop("menu.about-product"),
            click: function(){
                ipcRenderer.sendSync("sync-open-about");
            }
          },
        ]
      },
    ];
    if (process.platform == 'darwin') {
      var name = 'E360Player';
      template.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            role: 'about'
          },
          {
            type: 'separator'
          },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide ' + name,
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() { 
                ipcRenderer.send('async-app-quit', null); 
            }
          },
        ]
      });
      // Window menu.
      template[3].submenu.push(
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      );
    }
    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    window.ondragover = function(e){
        e.preventDefault();
    }
    window.ondrop = function(e){
        e.preventDefault();
        var files = e.dataTransfer.files;
        if(files && files.length>0){
            for(var i=0;i<files.length;i++){
                    const file_info = ipcRenderer.sendSync("sync-file-info",files[i].path)
                    if(file_info.extname.toUpperCase()==".MP4"){
                        controller.addVideoToList(file_info);
                    }
            }
        }
    }
}