const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const ipcRenderer = electron.ipcRenderer;

var createMenu = function(){
    var template = [
        {
            label:"文件" ,
            submenu:[
                {
                    label:"打开视频",
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
                    label: '退出',
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                }
            ]
        },
      {
        label: '播放控制',
        submenu: [
          {
            label: '暂停/播放',
            accelerator: 'CmdOrCtrl+P',
            click: function(item, focusedWindow) {
                controller.togglePlay();
            }
           },
          {
            label: '上一视频',
            accelerator: 'CmdOrCtrl+L',
            click: function(item, focusedWindow) {
                    controller.playPrevVideo();
            }
          },
          {
            label: '下一视频',
            aaccelerator: 'CmdOrCtrl+N',
            click: function(item, focusedWindow) {
               controller.playNextVideo();
            }
          },
        ]
      },
      {
        label: '编辑',
        submenu: [
          {
            label: '撤销',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
          },
          {
            label: '重做',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            label: '剪切',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
          },
          {
            label: '复制',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
          },
          {
            label: '粘贴',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
          },
          {
            label: '全选',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
          },
        ]
      },
      {
        label: '视图',
        submenu: [
          {
            label: '刷新',
            accelerator: 'CmdOrCtrl+R',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.reload();
            }
          },
          {
            label: '切换全屏',
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
            label: '切换开发工具',
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
            label: '切换播放列表',
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
            label: '切换平面模式',
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
        label: '窗体',
        role: 'window',
        submenu: [
          {
            label: '最小化',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          {
            label: '关闭',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          },
        ]
      },
      {
        label: '帮助',
        role: 'help',
        submenu: [
          {
            label: '了解Electron',
            click: function() { require('electron').shell.openExternal('http://electron.atom.io') }
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

