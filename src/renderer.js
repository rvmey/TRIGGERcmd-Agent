// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote, shell } = require('electron');
// const { dialog } = remote;
const setApplicationMenu = require('./menu');

const form = document.querySelector('form');
var submitted = false

const inputs = {
    token: form.querySelector('input[name="token"]'),
    computername: form.querySelector('input[name="computername"]'),
};

const buttons = {
    submit: form.querySelector('button[type="submit"]'),
};

ipcRenderer.on('did-finish-load', () => {
    setApplicationMenu();
});

ipcRenderer.on('processing-did-succeed', (event, html) => {
    shell.openExternal(`file://${html}`);
});

ipcRenderer.on('processing-did-fail', (event, error) => {
    console.error(error);
    alert('Failed :\'(');
});

form.addEventListener('submit', (event) => {
    if (submitted == false) {
        submitted = true;
        event.preventDefault();
        ipcRenderer.send('did-submit-form', {
            token: inputs.token.value,
            computername: inputs.computername.value,
        });
    }
}); 
