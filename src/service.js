process.chdir(__dirname);

// var fs = require('fs');
// var path = require('path');
var agent = require('./agent');

console.log('Running Windows service to run background tasks.')
agent.background();
