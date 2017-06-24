process.chdir(__dirname);

var util = require('util');
var fs = require('fs');
var path = require('path');

var agent = require('./agent');

var tokenfile;
var tokenFromFile;
var computeridfile;
var computeridFromFile;
var datafile;
var datapath;

agent.initFiles(null, function (tfile, cidfile, dfile, dpath) {
  tokenfile = tfile;
  computeridfile = cidfile;
  datafile = dfile;
  datapath = dpath;
  tokenFromFile = readMyFile(tokenfile);
  computeridFromFile = readMyFile(computeridfile);
});

var log_file = fs.createWriteStream(datapath + '/debug.log', {flags : 'w'});
log_file.on('error', function(err) {
  console.log("ERROR:" + err);
});

var log_stdout = process.stdout;
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var pap = require("posix-argv-parser");
var args = pap.create();
var v = pap.validators;

args.createOption(["-t", "--trigger", "--command"], {
    description: "Trigger name on the remote computer",
  hasValue: true
});

args.createOption(["-c", "--computer"], {
  description: "Remote computer name on TRIGGERcmd site",
  hasValue: true
});

args.createOption(["--help", "-h"], { description: "Show this text" });

args.parse(process.argv.slice(2), function (errors, options) {
    if (errors) { return console.log(errors[0]); }
 
    if (options["-h"].isSet) {
        args.options.forEach(function (opt) {
          console.log(opt.signature + ": " + opt.description);
        });
    } else {
      if (options["--trigger"].isSet && options["--computer"].isSet) {
        // options["--trigger"].value
        var computername = options["--computer"].value;
        var triggername = options["--trigger"].value;
        console.log('computer: ' + computername + '  trigger: ' + triggername);
        agent.triggerCmd(tokenFromFile,computername,triggername, function (message) {
          console.log(message);          
        });
      } else {  // not trying to run a remote command so run the agent.
        args.options.forEach(function (opt) {
            console.log(opt.signature + ": " + opt.description);
        });
      }
    }
});

function readMyFile(file) {
  try {
    return fs.readFileSync(file).toString();
  }
  catch (e) {
    return null;
  }
}
