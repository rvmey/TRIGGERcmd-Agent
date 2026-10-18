const WebSocket = require('ws');
globalThis.WebSocket = WebSocket;

process.chdir(__dirname);

var ground;

module.exports = {
  background: function (servicehomedir) {
    background(servicehomedir);
  },
  foreground: function (token,userid,computerid) {
    foreground(token,userid,computerid);
  },
  getToken: function (email,password,callback) {
    getToken(email,password,callback);
  },
  cmdFileUpdated: function () {
    cmdFileUpdated();
  },
  computerExists: function (token,computerid,callback) {
    computerExists(token,computerid,callback);
  },
  createComputer: function (token,userid,computername,callback) {
    createComputer(token,userid,computername,callback);
  },
  initFiles: function (path, callback) {
    initFiles(path, callback);
  },
  tokenLogin: function (token,callback) {
    tokenLogin(token,callback);
  },
  triggerCmd: function (token,computername,triggername,callback) {
    triggerCmd(token,computername,triggername,callback);
  },
  fetchexamples: function () {
    fetchexamples();
  },
  restartHomeAssistant: function () {
    restartHomeAssistant();
  },
  startHomeAssistant: function (ground) {
    startHomeAssistant(ground);
  },
  restartHomeKit: function () {
    restartHomeKit();
  },
  startHomeKit: function (ground) {
    startHomeKit(ground);
  },
  updateWakeOnLan: function () {
    updateWakeOnLan();
  },
  getMacAddresses: function () {
    return getMacAddresses();
  }
};

var socketIOClient = require('socket.io-client');
var sailsIOClient = require('sails.io.js');
var cp = require('child_process');
var request = require('request');
var fs = require('fs');
var path = require('path');
// var argv = require('minimist')(process.argv.slice(2));
var prompt = require('prompt');
var os = require('os');
const HomeAssistantWebSocket = require('./ha');
const HomeKitBridge = require('./homekitbridge');

// Set the headers
var headers = {
    'User-Agent':       'TRIGGERcmd/0.1.0',
    'Content-Type':     'application/x-www-form-urlencoded'
}

var daemoninstall;
var installuserhomedir;

var onlineexamplefile;
var examplefile;
var homedir;
var datapath;
var cmdfile;
var datafile;
exports.datafile = datafile;
var tokenfile;
exports.tokenfile = tokenfile;
var useridfile;
var computeridfile;
exports.computeridfile = computeridfile;
var tokenFromFile;
var computeridFromFile;
var useridFromFile;
var loggedNoInternet=false;
var haWebSocket;
var homeKitBridge;

function startHomeAssistant(ground) {
  // Start Home Assistant listener if it's enabled.
  const HomeAssistantWebSocket = require('./ha');
  haWebSocket = new HomeAssistantWebSocket(ground);
  haWebSocket.start();
}

function startHomeKit(ground) {
  homeKitBridge = new HomeKitBridge(ground, datafile);
  homeKitBridge.start();
}

function initFiles(backgrounddpath, callback) {
  // var installpath = path.resolve(process.env.LOCALAPPDATA, 'TRIGGERcmdAgent');
  homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
  if (!homedir) {homedir = process.env.HOME};
  if (backgrounddpath) {
    datapath = backgrounddpath;
  } else {
    datapath = path.resolve(homedir, ".TRIGGERcmdData");
  }
  if (!fs.existsSync(datapath)){
      fs.mkdirSync(datapath);
  }

  examplefile = 'linuxcommands.json';
  if (process.platform === 'win32') {
    examplefile = 'wincommands.json';
  }
  if (process.platform === 'linux') {
    examplefile = 'linuxcommands.json';
    try {
      var osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      if (osRelease.toLowerCase().includes('raspbian')) {
        examplefile = 'rpicommands.json';
      }
    } catch (e) {
      // /etc/os-release not readable, keep linuxcommands.json
    }
  }
  if (process.platform === 'darwin') {
    examplefile = 'maccommands.json';
  }
  cmdfile = "commands.json"
  datafile = path.resolve(datapath, cmdfile);
  if (!fs.existsSync(datafile)) {
    fs.createReadStream(examplefile).pipe(fs.createWriteStream(datafile));
  }

  // haconfig = "home_assistant_config.json"
  // hadatafile = path.resolve(datapath, haconfig);
  // if (!fs.existsSync(hadatafile)) {
  //   fs.createReadStream(haconfig).pipe(fs.createWriteStream(hadatafile));
  // }

  // Copy a script to the data folder to help users send the results of their commands.
  var resultscript = 'sendresult.sh';
  if (process.platform === 'win32') {
    resultscript = 'SendResult.bat';
  }  
  var resultscripttarget = path.resolve(datapath, resultscript);
  if (!fs.existsSync(resultscripttarget)) {
    fs.createReadStream(resultscript).pipe(fs.createWriteStream(resultscripttarget));
  }

  onlineexamplefile = path.resolve(datapath, 'onlineexamples.json');
  tokenfile = path.resolve(datapath, 'token.tkn');
  useridfile = path.resolve(datapath, 'userid.cfg');
  computeridfile = path.resolve(datapath, 'computerid.cfg');
  tokenFromFile = readMyFile(tokenfile);
  computeridFromFile = readMyFile(computeridfile);
  useridFromFile = readMyFile(useridfile);
  callback(tokenfile, computeridfile, datafile, datapath);
}

// var urlprefix = 'https://599ce3f1.ngrok.io'
// var urlprefix = 'http://localhost:1337'
var urlprefix = 'https://www.triggercmd.com'

// console.log('Connecting to ' + urlprefix);
var options = {
    headers: headers,
    jar: true
}

var cafile = path.resolve(__dirname, 'gd_bundle-g2-g1.crt');

if (process.platform=="linux") {
    options.ca = fs.readFileSync(cafile);
}

if (process.argv[2] == "--daemoninstall") {
  consoleagent(true);
}

if (process.argv[2] == "--console") {
  if (process.platform === 'linux') {
    console.log('Run installdaemon.sh to install the triggercmdagent daemon so it runs during boot');
  }
  consoleagent(false);
}

function consoleagent(daemoninstall) {
  console.log('Daemon install: ' + daemoninstall);
  initFiles(false, function (tfile, cidfile, dfile, dpath) {
    if (!tokenFromFile) {
      console.log('No token exists.  Login to request one.');
      consoleLogin(daemoninstall);
    } else {
      console.log('Logging in with saved token.');
      // console.log(tokenFromFile);
      computerExists(tokenFromFile,computeridFromFile,function(exists){
        if (exists) {
          if (!daemoninstall) {
            foreground(tokenFromFile,useridFromFile,computeridFromFile);
          }
        } else {
          consoleLogin(daemoninstall);
        }
      });
    }
  });
}

function consoleLogin(daemoninstall) {
  var schema = {
    properties: {
      token: {
        required: true
      }
    }
  };

  prompt.start();
  prompt.get(schema, function (err, result) {
    var token = result.token;
    token = token.trim();
    tokenLogin(token, function (token) {
      createComputer(token,useridFromFile,null, function (computerid) {
        if ((!daemoninstall) && (computerid != 'MustSubscribe')) {
          foreground(token,useridFromFile,computerid);
        }
      });
    });
  });
}

function fetchexamples() {
  console.log('Downloading example commands')
  var onlineexamples = [];
  // Configure the request
  headers.Authorization = 'Bearer ' + tokenFromFile;
  options.headers = headers;
  options.url = urlprefix + '/api/example/list';
  options.method = 'GET';

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      onlineexamples = JSON.parse(body);
      // console.log(onlineexamples);
      fs.writeFile(onlineexamplefile, JSON.stringify(onlineexamples.records, undefined, 1), 'utf8', function(err) {
        if (err) {
          console.log(err);
        }
      });//writeFile
    } else {
      console.log(error);
    }
  })
}

function computerExists(token,computerid,cb) {
  if(computerid == "") {
    console.log("No computer ID.");
    computeridFromFile = null;
    cb(false);
  } else {
    // http://localhost:1337/api/computer/list?computer_id=587a2f04c8f501607e8f9164
    // Configure the request
    if(!loggedNoInternet) {
      console.log('Checking if the ' + computerid + ' computer exists.');
    }
    headers.Authorization = 'Bearer ' + token;
    options.headers = headers;
    options.url = urlprefix + '/api/computer/list?computer_id=' + computerid;
    options.method = 'GET';

    // Start the request
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // console.log(JSON.parse(body).records);
        // console.log(JSON.parse(body).records.length);
        if (JSON.parse(body).records.length > 0) {
            console.log('This computer exists in your account.');
            cb(true);
        } else {
            console.log('This computer was deleted from your account.  Login to recreate it.');
            computeridFromFile = null;
            cb(false);
        }
      } else {
        if(!loggedNoInternet) {
          console.log('Error while checking whether computer exists in your account.');
          console.log(error);
          console.log('No Internet.  Trying again every 10 seconds.')
          loggedNoInternet = true;
        }
        if(error && error.syscall == 'getaddrinfo') {
          setTimeout(function() {
            computerExists(token,computerid,cb);
          }, 10000)
        }
      }
    })
  }
}

function background(datapath) {
  ground = 'background';

  initFiles(datapath, function (tfile, cidfile, dfile, dpath) {
    console.log('Tokenfile: ' + tfile);
    console.log('ComputerIDfile: ' + cidfile);
  });

  if (tokenFromFile) {
    console.log('Logging in with saved token to run background tasks.');
    updateCmds(tokenFromFile,useridFromFile,computeridFromFile,true);
    updateWakeOnLan();
  } else {
    console.log('No token.  Exiting background service.');
  }

  startHomeAssistant(ground);
  startHomeKit(ground);
}

function foreground(token,userid,computerid) {
  ground = 'foreground';

  initFiles(false, function (tfile, cidfile, dfile, dpath) {
    console.log('Tokenfile: ' + tfile);
    console.log('ComputerIDfile: ' + cidfile);
    console.log('Logging in with saved token to run foreground tasks.');
    updateCmds(token,userid,computerid,true);
    updateWakeOnLan();
  });

  startHomeAssistant(ground);
  startHomeKit(ground);
}

function tokenLogin(token,callback) {
  // Configure the request
  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/command/list';
  options.method = 'GET';

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // onlinecmds = JSON.parse(body);
      // console.log(onlinecmds);
      // const userid = JSON.parse(body).user.id;
      // writeNewUserIDToFile(userid);
      writeNewTokenToFile(token);
      callback(token);
    } else {
      console.log('Token login failed.');
    }
  })
}

function getToken(email,password,callback) {
  // Configure the request
  var options = {
      url: urlprefix + '/api/auth/authenticate',
      method: 'POST',
      headers: headers,
      jar: true,
      form: {'email': email, 'password': password}
  }

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const token = JSON.parse(body).token;
      const userid = JSON.parse(body).user.id;
      writeNewUserIDToFile(userid);
      writeNewTokenToFile(token);
      callback(token);
    } else {
      console.log('Login failed.');
    }
  })
}

function createComputer(token,userid,computer_name,callback) {
  // console.log('ran createComputer');
  // Configure the request
  var computername = computer_name || os.hostname();

  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/computer/save';
  options.method = 'POST';
  options.form = {'name': computername};

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var computerid = JSON.parse(body).data.id;
      writeNewComputerIDToFile(token,userid,computerid);
      if (typeof callback === "function") {
        callback(computerid);
      }
    } else {
      if (response.statusCode == 403) {
        console.log('You must subscribe before adding another computer.');
        callback('MustSubscribe');
      } else {
        console.log('Login failed while trying to create a computer.');
      }
    }
  })
}

function triggerCmd(token,computername,triggername,callback) {
  //  http://localhost:1337/api/run/triggerSave?computername=DS&triggername=Calculator
  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/run/triggerSave';
  options.method = 'POST';
  options.form = {'computername': computername, 'triggername': triggername};

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var message = JSON.parse(body).message;
      if (typeof callback === "function") {
        callback(message);
      }
    } else {
      console.log('Failed while trying to run remote command.');
    }
  })
}

function syncLoop(iterations, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
        next:function(){
            if(done){
                if(shouldExit && exit){
                    return exit(); // Exit if we're done
                }
            }
            // If we're not finished
            if(index < iterations){
                index++; // Increment our index
                process(loop); // Run our process, pass in the loop
            // Otherwise we're done
            } else {
                done = true; // Make sure we say we're done
                if(exit) exit(); // Call the callback on exit
            }
        },
        iteration:function(){
            return index - 1; // Return the loop number we're on
        },
        break:function(end){
            done = true; // End the loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
}

// Russ added this to fix a bug where the commands.json would get emptied sometimes.
function writeFileTransactional (path, content, cb) {
  // var temporaryPath = `${path}.newagt`;
  var temporaryPath = path + ".newagt";
  fs.writeFile(temporaryPath, content, function (err) {
      if (err) {
          return cb(err);
      }

      fs.rename(temporaryPath, path, cb);
  });
};

// Only one command sync runs at a time.  Overlapping syncs could each see a command missing online
// and both add it, leaving duplicates.  A commands.json change during a sync queues one more sync.
var syncRunning = false;
var syncQueued = null;
var currentSyncId = 0;
var syncWatchdog = null;

function startSync() {
  syncRunning = true;
  currentSyncId++;
  var syncId = currentSyncId;
  // Don't let a request that never returns block command syncs forever.
  syncWatchdog = setTimeout(function () {
    console.log('Command sync did not finish within 5 minutes.  Allowing new syncs.');
    finishSync(syncId);
  }, 300000);
  return syncId;
}

function finishSync(syncId) {
  if (syncId !== currentSyncId || !syncRunning) {
    return; // a stale completion from a sync the watchdog already gave up on
  }
  clearTimeout(syncWatchdog);
  syncRunning = false;
  if (syncQueued) {
    var q = syncQueued;
    syncQueued = null;
    updateCmds(q.token, q.userid, q.computerid, false);
  }
}

function cmdMatches(onlinecmd, localcmd) {
  var localallowParams = false;

  var _arr = [1, "1", true, "true"];
  for (var _i = 0; _i < _arr.length; _i++) {
    var value = _arr[_i];
    if (localcmd.allowParams == value) {
      localallowParams = true;
    }
  }

  return onlinecmd.name == localcmd.trigger &&
      onlinecmd.voice == localcmd.voice &&
      onlinecmd.voiceReply == localcmd.voiceReply &&
      onlinecmd.mcpToolDescription == localcmd.mcpToolDescription &&
      Boolean(onlinecmd.allowParams) == localallowParams &&
      (onlinecmd.icon || '') == (localcmd.icon || '');
}

// Decide which online commands to delete and which local commands to add.
// A name is left alone when its online records match its local commands one-to-one.  Otherwise every
// online record with that name is deleted and the local commands re-added.  The server deletes by
// name, so deleting them all is the only way to get rid of a duplicate copy.
// The foreground and background agents both sync, so a name that exists locally is only handled by the
// agent whose ground matches the local command.  Names no longer in the local file are deleted by either.
function planSync(onlinerecords, localcmds) {
  var onlineByName = Object.create(null);
  onlinerecords.forEach(function (rec) {
    (onlineByName[rec.name] = onlineByName[rec.name] || []).push(rec);
  });
  var localByName = Object.create(null);
  localcmds.forEach(function (cmd) {
    (localByName[cmd.trigger] = localByName[cmd.trigger] || []).push(cmd);
  });

  var plan = { removals: [], adds: [] };
  var names = Object.keys(onlineByName).concat(Object.keys(localByName).filter(function (name) {
    return !(name in onlineByName);
  }));

  names.forEach(function (name) {
    var online = onlineByName[name] || [];
    var local = localByName[name] || [];

    if (local.length && local[0].ground != ground) {
      return; // the other agent owns this command
    }

    var inSync = online.length == local.length;
    var used = [];
    for (var l = 0; inSync && l < local.length; l++) {
      var found = false;
      for (var o = 0; o < online.length; o++) {
        if (used.indexOf(o) == -1 && cmdMatches(online[o], local[l])) {
          used.push(o);
          found = true;
          break;
        }
      }
      inSync = found;
    }
    if (inSync) {
      return;
    }

    if (online.length > 1) {
      console.log('Command ' + name + ' has ' + online.length + ' copies online.  Replacing them.');
    }
    online.forEach(function () {
      plan.removals.push(name);
    });
    plan.adds = plan.adds.concat(local);
  });

  return plan;
}

function runRemovals(removals, token, userid, computerid, done) {
  var i = 0;
  (function next() {
    if (i >= removals.length) {
      return done();
    }
    removeCmd(removals[i++], token, userid, computerid, next);
  })();
}

function updateCmds(token,userid,computerid,startsocket) {
  if (syncRunning && !startsocket) {
    syncQueued = {token: token, userid: userid, computerid: computerid};
    console.log('Command sync already running.  Will sync again when it finishes.');
    return;
  }
  if(computerid == "") {
    console.log("No computer ID.  Skipping command updates and exiting.");
  } else {
    // console.log(token + ' u ' + userid + ' c ' + computerid);
    var localcmds;
    var readsuccess = true;
    var backupdatafile = datafile + '.backup';
    var content = fs.readFileSync(datafile);

    try {
        localcmds = JSON.parse(content);
    } catch(e) {
        readsuccess = false;
        writeFileTransactional(datafile, fs.readFileSync(backupdatafile), function(err) {
          if (err) {
            console.log("Restore backup failed: " + err);
          } else {
            console.log("Restore backup completed.");
          }                    
        });

        // fs.createReadStream(backupdatafile).pipe(fs.createWriteStream(datafile));  // restore the last known good file
        console.log(e); // error in the above string
        console.log('Restoring the last known good commands.json file');
    } finally {    
      if (localcmds) {
        if (readsuccess) {                
          writeFileTransactional(backupdatafile, fs.readFileSync(datafile), function(err) {
            if (err) {
              console.log("Write backup failed: " + err);
            } else {
              console.log("Write backup completed.");
            }                    
          });

          // fs.createReadStream(datafile).pipe(fs.createWriteStream(backupdatafile));  // we have a good file, back it up.
        }
        // console.log(localcmds);
        var onlinecmds = [];
        // getOnlineCmds(token,userid,computerid) {
        // Configure the request
        headers.Authorization = 'Bearer ' + token;
        options.headers = headers;
        // includeDuplicates makes the server return every copy of a command instead of one per name, so
        // planSync can see duplicates and remove them.  Older servers ignore it.
        options.url = urlprefix + '/api/command/list?computer_id=' + computerid + '&includeDuplicates=1';
        options.method = 'GET';

        var syncId = startSync();

        // Start the request
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            onlinecmds = JSON.parse(body);
            var plan = planSync(onlinecmds.records, localcmds);

            // All removals must land before any adds.  The server deletes by name, so a delete that
            // arrives after the add for the same name could remove the new record instead of the old one.
            // Removals run one at a time so repeated deletes of the same name don't race each other.
            runRemovals(plan.removals, token, userid, computerid, function () {
              console.log('Command removals complete');

              // Adds are spaced 10ms apart.  Firing them all at once was too fast.
              var pendingAdds = plan.adds.length;
              if (!pendingAdds) {
                return finishSync(syncId);
              }
              syncLoop(plan.adds.length, function(loop){
                setTimeout(function(){
                  var cmd = plan.adds[loop.iteration()];
                  addCmd(cmd.trigger,cmd.voice,cmd.voiceReply,cmd.allowParams,cmd.mcpToolDescription,cmd.icon||'',token,userid,computerid, function () {
                    if (--pendingAdds === 0) {
                      finishSync(syncId);
                    }
                  });
                  loop.next();
                }, 10);
              }, function(){
                  console.log('Initiated command adds');
              });
            });

          } else {
            console.log('Login failed trying to update command triggers.');
            console.log(error);
            console.log(response);
            finishSync(syncId);
          }
        })
        if(startsocket) {
          watchForCmdUpdates(token,userid,computerid);
          startSocket(token,computerid);
        }
      }
    }
  }

}

function removeCmd(trigger,token,userid,computerid,done) {
  // Configure the request

  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/command/delete2';
  options.method = 'POST';
  options.form = {'name': trigger, 'computer': computerid};

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // var computerid = JSON.parse(body).data.id;
      console.log('Deleted ' + trigger);
    } else {
      console.log('Failed while trying delete a trigger.');
    }
    if (done) done();
  })
}

function addCmd(trigger,voice,voiceReply,allowParams,mcpToolDescription,icon,token,userid,computerid,done) {
  // Configure the request

  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/command/save';
  options.method = 'POST';
  options.form = {'name': trigger, 'computer': computerid, 'voice': voice, 'voiceReply': voiceReply, 'allowParams': allowParams, 'mcpToolDescription': mcpToolDescription, 'icon': icon || '' };

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // var computerid = JSON.parse(body).data.id;
      console.log('Added ' + trigger);
    } else {
      console.log('Failed while trying add a trigger.');
    }
    if (done) done();
  })
}

function triggerToCmdObj(cmds, trigger) {
  for(var i = 0; i < cmds.length; i++)
  {
    if(cmds[i].trigger == trigger)
    {
      return cmds[i];
    }
  }
}

function startSocket(token,computerid) {
  var io = sailsIOClient(socketIOClient);
  io.sails.reconnection = true;
  io.sails.url = urlprefix;
  // io.sails.query = 'token=' + token;

  io.sails.transports=['websocket'];

  io.sails.headers = {
    "Authorization": 'Bearer ' + token,
  };

  io.socket.on('message', function(event){
        var trigger = event.trigger;
        var cmdid = event.id;
        var params = event.params;
        var sender = event.sender;
        var envVars = process.env;
        
        console.log("triggercmd.com data:");
        console.log(event);
        var commands = JSON.parse(fs.readFileSync(datafile));
        var cmdobj = triggerToCmdObj(commands,trigger);
        if (cmdobj && cmdobj.ground == ground) {
          // Check if actually connected to HA (not just the flag, but actual socket state)
          const WebSocket = require('ws');
          const actuallyConnected = haWebSocket && haWebSocket.isConnected && haWebSocket.socket && haWebSocket.socket.readyState === WebSocket.OPEN;
          
          if(actuallyConnected && sender == "Home Assistant") {
            console.log("Ignored duplicate trigger", trigger, "sent from Home Assistant via triggercmd.com because this agent is connected to Home Assistant directly.");
          } else {
            envVars.TCMD_COMPUTER_ID=computerid;
            envVars.TCMD_COMMAND_ID=cmdid;
  
            if (cmdobj.allowParams && params) {
              if (cmdobj.offCommand && (params.trim().toLowerCase() == 'off')) {
                var theCommand = cmdobj.offCommand;
              } else if (cmdobj.offCommand && (params.trim().toLowerCase() == 'on')) {
                var theCommand = cmdobj.command;
              } else {
                // Check if params should be quoted
                var shouldQuote = (cmdobj.quoteParams === true || cmdobj.quoteParams === 'true');
                var paramValue = shouldQuote ? '"' + params + '"' : params;
                var theCommand = cmdobj.command + ' ' + paramValue;
              }
            } else {
              var theCommand = cmdobj.command;
            }
  
            console.log('Running trigger: ' + trigger + '  Command: ' + theCommand);
            
            // Report that command started immediately
            reportBack(token,computerid,cmdid,"Command ran");
            
            var ChildProcess = cp.exec(theCommand, {env: envVars}, (error, stdout, stderr) => {
                console.log('stdout:', stdout);
                console.log('stderr:', stderr);
  
                // Report error code asynchronously after command completes
                if (error) {
                  // Log any errors
                  console.error('error:', error.message);
                  console.error('error code:', error.code);
                  var resultMessage = "Command exited with error code " + error.code;
                  reportBack(token,computerid,cmdid,resultMessage);
                }
            });
          }

        }
  })

  io.socket.get('/api/computer/subscribeToFunRoom?roomName=' + computerid,{Authorization : 'Bearer ' + token},function(data){
         // io.socket.get('/run?status=NotTriggered',{Authorization : 'Bearer ' + token},function(data){
         // io.socket.get('/agent',{access_token : token},function(data){
         console.log(data);
  })

  io.socket.on('connect', function(){
        io.socket.get('/api/computer/subscribeToFunRoom?roomName=' + computerid,{Authorization : 'Bearer ' + token},function(data){
          console.log(data);
        })
        // Always reconnect Home Assistant when triggercmd.com reconnects
        // If triggercmd had to reconnect, there was a network disruption and HA connection is likely stale
        if (haWebSocket) {
          if (haWebSocket.enabled) {
            console.log('Reconnected to triggercmd.com - reconnecting to Home Assistant...');
            haWebSocket.reconnectNow();
          } else {
            console.log('Reconnected to triggercmd.com - Home Assistant is disabled');
          }
        } else {
          console.log('Reconnected to triggercmd.com - haWebSocket not initialized');
        }
  });
}


function reportBack(token,computerid,cmdid,status) {

  headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  options.url = urlprefix + '/api/run/save';
  options.method = 'POST';
  options.form = {'status': status, 'computer': computerid, 'command': cmdid };

  // Start the request
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var runid = JSON.parse(body).data.id;
      console.log('Reported: Command Ran');
    } else {
      console.log(error);

      console.log('Failed to report back that the trigger was received.');
    }
  })
}

function cmdFileUpdated() {
  // setTimeout(function () {
    updateCmds(tokenFromFile,useridFromFile,computeridFromFile,false);
  // }, 500);
}

/*  Replaced to handle smart quote on macs
function watchForCmdUpdates(token,userid,computerid) {
  var chokidar = require('chokidar');

  // One-liner for current directory, ignores .dotfiles
  chokidar.watch(datafile, {ignoreInitial: true}).on('change', function(event, path) {
    console.log(event, path);
    updateCmds(token,userid,computerid,false);
  });
} */

function watchForCmdUpdates(token,userid,computerid) {
  var chokidar = require('chokidar');
  var watcher = chokidar.watch(datafile, {ignoreInitial: true}).on('change', function(event, path) {    
      watcher.close();      
      var timewait=0;
      if (ground == 'background') { timewait = 1000}
      setTimeout(function () {            
        updateCmds(token,userid,computerid,false);
        watchForCmdUpdates(token,userid,computerid);
      }, timewait);               
  });
}


function writeNewTokenToFile(token) {
  fs.writeFile(tokenfile, token, function(err) {
      if(err) {
          return console.log(err);
      }
      // if (typeof callback === "function") {
      //  callback();
      // }
      console.log("Token saved for next time.");
  });
}

function writeNewUserIDToFile(userid) {
  fs.writeFile(useridfile, userid, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log('User ID ' + userid + ' saved for next time.');
  });
}

function writeNewComputerIDToFile(token,userid,computerid) {
  fs.writeFile(computeridfile, computerid, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log('Computer ID ' + computerid + ' saved for next time.');
      computeridFromFile = computerid;
  });
}

function onErr(err) {
  console.log(err);
  return 1;
}

function readMyFile(file) {
  try {
    return fs.readFileSync(file).toString();
  }
  catch (e) {
    return null;
  }
}

function restartHomeAssistant() {
  if (haWebSocket) {
    haWebSocket.stop();
  }
  haWebSocket = new HomeAssistantWebSocket(ground);
  haWebSocket.start();
}

function restartHomeKit() {
  if (homeKitBridge) {
    homeKitBridge.stop();
  }
  homeKitBridge = new HomeKitBridge(ground, datafile);
  homeKitBridge.start();
}

function getMacAddresses() {
  var macAddresses = [];
  var interfaces = os.networkInterfaces();
  for (var name in interfaces) {
    interfaces[name].forEach(function (iface) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00' && macAddresses.indexOf(iface.mac) === -1) {
        macAddresses.push(iface.mac);
      }
    });
  }
  return macAddresses;
}

// Reports whether the user enabled Alexa Wake-on-LAN from this agent's tray menu, plus this
// computer's local network adapter MAC address(es) if so. Called at agent startup and again
// whenever the user saves the Wake-on-LAN settings window (see wakeOnLanSave in main.js).
function updateWakeOnLan() {
  if (!tokenFromFile || !computeridFromFile) {
    console.log('updateWakeOnLan: no saved token or computer ID yet, skipping.');
    return;
  }

  var wolConfigFile = path.resolve(datapath, 'wake_on_lan_config.json');
  var wolEnabled = false;
  try {
    var wolConfig = JSON.parse(fs.readFileSync(wolConfigFile, 'utf8'));
    wolEnabled = !!wolConfig.WOL_ENABLED;
  } catch (e) {
    // No config yet -- the user has never opened the Wake-on-LAN settings window.
    wolEnabled = false;
  }

  var macAddresses = wolEnabled ? getMacAddresses() : [];

  headers.Authorization = 'Bearer ' + tokenFromFile;
  options.headers = headers;
  options.url = urlprefix + '/api/computer/updateWakeOnLan';
  options.method = 'POST';
  options.form = {
    'computer_id': computeridFromFile,
    'enableWakeOnLan': wolEnabled,
    'macAddresses': JSON.stringify(macAddresses)
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('updateWakeOnLan: reported enableWakeOnLan=' + wolEnabled + ' with ' + macAddresses.length + ' MAC address(es).');
    } else {
      console.log('updateWakeOnLan: failed to report Wake-on-LAN status.');
      console.log(error);
    }
  });
}