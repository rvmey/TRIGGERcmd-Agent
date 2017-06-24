const { remote, shell } = require('electron');
const { Menu } = remote;

module.exports = () => {
    const template = [
        {
            role: 'help',
            submenu: [
                {
                    label: 'About',
                    click() {
                        shell.openExternal('http://www.triggercmd.com');
                    },
                },
            ],
        },
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
