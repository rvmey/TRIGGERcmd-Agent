var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;
var myAppMenu, menuTemplate;

function toggleWindow(whichWindow) {
  if (whichWindow.isVisible()) {
    whichWindow.hide();
  } else {
    whichWindow.show();
  }
}

app.on('ready', function() {
  var appWindow, infoWindow;
  appWindow = new BrowserWindow({
    show: false
  }); //appWindow

  appWindow.loadURL('file://' + __dirname + '/index.html');

  appWindow.once('ready-to-show', function() {
    appWindow.show();
  }); //ready-to-show

  menuTemplate = [
    {
      label: 'TRIGGERcmd',
      submenu: [
        {
          label: 'Add Command',
          accelerator: process.platform === 'darwin' ? 'Command+N':'Ctrl+N',
          click(item,focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.send('addAppointment');
          }
        },{
          role: 'help',
          label: 'Website',
          click() { electron.shell.openExternal('http://www.triggercmd.com')}
        },
        {role: 'close'},
        {role: 'quit'}
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
