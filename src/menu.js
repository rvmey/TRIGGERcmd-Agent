const { shell } = require('electron');
const remote = require('@electron/remote');
const { Menu } = remote;

module.exports = () => {
    var template = [
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
        {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:", role: 'undo' },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:", role: 'redo' },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:", role: 'cut' },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:", role: 'copy' },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:", role: 'paste' },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:", role: 'selectall' }
        ]
        }
    ];




    if (process.platform === 'darwin') {
        const name = remote.app.getName();
        template.unshift({
            label: name,
            submenu: [
                {
                    role: 'about',
                },
                {
                    type: 'separator',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'hide',
                },
                {
                    role: 'hideothers',
                },
                {
                    role: 'unhide',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'quit',
                },
            ],
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};
