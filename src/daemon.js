process.chdir(__dirname);

// var fs = require('fs');
// var path = require('path');
// var service = require('os-service');
var agent = require('./agent');

if (process.argv[2] == "--run") {
    console.log('Running Linux daemon to run background tasks.');
    console.log('Run installdaemon.sh to install the triggercmdagent daemon so it runs during boot');
    // Run service program code...
    agent.background(process.argv[3]);
} else {
    console.log('Use --run')
}
