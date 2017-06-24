
// var utils = require('windows-registry').utils;
// utils.associateExeForFile('myTestHandler', 'A test handler for unit tests', 'C:\\path\\to\\icon', 'C:\\Program Files\\nodejs\\node.exe %1', '.zzz');
var fs = require('fs');
var regedit = require('regedit');
var util = require('util');

process.chdir(__dirname);

var log_file = fs.createWriteStream('./debug.log', {flags : 'w'});
log_file.on('error', function(err) {
  console.log("ERROR:" + err);
});

var log_stdout = process.stdout;
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};


var mydir = process.argv[3];
// console.log('Directory: ' + mydir);

if (process.argv[2] == "--add") {
  addToPath (mydir);
}

if (process.argv[2] == "--remove") {
  removeFromPath (mydir);
}

function addToPath (mydir) {
  regedit.list(['HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment'])
  .on('data', function(entry) {
    if (entry.data.values.Path.value.includes(mydir)){
      console.log(mydir + ' is already in the PATH.')
    } else {
      console.log('Adding ' + mydir + ' to PATH.');
      regedit.putValue({
          'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment': {
              'Path': {
                  value: entry.data.values.Path.value + ';' + mydir,
                  type: 'REG_SZ'
              },        
          },        
      }, function(err) {
          // undefined
      })
    }
  })
  .on('finish', function () {
    console.log('PATH update operation finished')
  })
}

function removeFromPath (mydir) {
  regedit.list(['HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment'])
  .on('data', function(entry) {
    if (entry.data.values.Path.value.includes(mydir)){
      console.log('Removing ' + mydir + ' from the PATH.');
      var currentpath = entry.data.values.Path.value;
      // console.log('Current path: ' + currentpath);
      var i = currentpath.indexOf(mydir)
      var l = mydir.length;
      var newpath = (currentpath.substring(0,i-1) + currentpath.substring(i+l));
      // console.log('New path: ' + newpath);
      regedit.putValue({
          'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment': {
              'Path': {
                  value: newpath,
                  type: 'REG_SZ'
              },        
          },        
      }, function(err) {
          // console.log(err);
      })
    } else {
      console.log(mydir + ' is not in the PATH.');
    }
  })
  .on('finish', function () {
    console.log('PATH update operation finished')
  })
}
