// const {app, Tray, Menu, BrowserWindow, ipcMain} = require('electron');

// var cp = require('child_process');
// var spawn = require('child_process').spawn;

// var service = require ("os-service");
var util = require('util');

var fs = require('fs');
var path = require('path');
var Service = require('node-windows').Service;
// var wincmd = require('node-windows');

// Create a new service object - global so I can use it to install/remove/stop/start
var serviceName = 'TRIGGERcmdAgent';
var progPath = path.resolve(__dirname, 'service.js');
// var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var homedir = process.argv[3];
var svc = new Service({
  name: serviceName,
  description: serviceName,
  script: progPath,
  wait: 2,
  grow: .5,
  env: {
    name: "HOME",
    value: homedir // service is now able to access the user who created its' home directory
  }
});

var log_file = fs.createWriteStream(__dirname + '/svcmgrdebug.log', {flags : 'w'});
var log_stdout = process.stdout;
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

if (process.argv[2] == "--install") {
  installService ();
}

if (process.argv[2] == "--remove") {
  removeService ();
}

function installService () {
  console.log('svcmgr Installing service.');

  // Listen for the "install" event, which indicates the
  // process is available as a service.

  svc.on('install',function(){
    // console.log('Test install');
    svc.start();
    // app.quit();
  });

  svc.install();
}

function startService () {
    svc.start();
    /*
    cp.exec('net start ' + serviceName, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('Service start error: ' + error);
        }
        console.log(stdout);
        console.log(stderr);
        // Validate stdout / stderr to see if service is already running
        // perhaps.
    });  */
}

function removeService () {
  console.log('svcmgr Uninstalling service.');
  // svc.name = 'triggercmdagent.exe';
  svc.stop();

  // Listen for the "uninstall" event so we know when it's done.
  svc.on('uninstall',function(){
    console.log('Uninstall complete.');
    // app.quit();
  });

  // Uninstall the service.
  svc.uninstall();

  /* service.remove (serviceName, function(error) {
    if (error)
        console.log(error);
  });  */
}

function stopService () {
  svc.stop();
  /*  cp.exec('net stop ' + serviceName, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('Service stop error: ' + error);
        }
        console.log(stdout);
        console.log(stderr);
        // Validate stdout / stderr to see if service is already running
        // perhaps.
    });  */
}
