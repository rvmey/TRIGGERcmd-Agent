var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;
var ipc = electron.ipcMain;
var myAppMenu, menuTemplate;
var path = require('path');
var fs = require('fs');

function toggleWindow(whichWindow) {
  if (whichWindow.isVisible()) {
    whichWindow.hide();
  } else {
    whichWindow.show();
  }
}

app.on('ready', function() {
  // console.log('main.js');

  var appWindow, exampleWindow;
  appWindow = new BrowserWindow({    
    show: false,
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  }); //appWindow

  appWindow.loadURL('file://' + __dirname + '/index.html');

  appWindow.once('ready-to-show', function() {
    appWindow.show();
  }); //ready-to-show
 
  exampleWindow = new BrowserWindow({    
    show: false, 
    parent: appWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  }); //exampleWindow

  exampleWindow.loadURL('file://' + __dirname + '/examples.html');

  exampleWindow.on('close', function (event) {
    exampleWindow.hide();
    event.preventDefault(); // possibly related to the error
  })

  ipc.on('exampleAdded', function(event, arg){
    // console.log('exampleAdded received by main.js')
    event.returnValue='';
    appWindow.webContents.send('reloadCommands', 'Reloading commands');    
  }); //closeexampleWindow 

  ipc.on('openexampleWindow', function(event, arg){
    event.returnValue='';
    exampleWindow.show();
  }); //closeexampleWindow

  ipc.on('closeexampleWindow', function(event, arg){
    event.returnValue='';
    exampleWindow.hide();
  }); //closeexampleWindow

  menuTemplate = [
    {
      label: 'TRIGGERcmd',
      submenu: [
        {
          role: 'help',
          label: 'Website',
          click() { electron.shell.openExternal('http://www.triggercmd.com')}
        },        
      ]
    },{
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.reload()
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.webContents.toggleDevTools()
            }
          },
          {type: 'separator'},
          {role: 'resetzoom'},
          {role: 'zoomin'},
          {role: 'zoomout'},
          {type: 'separator'},
          {role: 'togglefullscreen'}
        ]
      },
  ];
  
  myAppMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(myAppMenu);
  
}); //app is ready
