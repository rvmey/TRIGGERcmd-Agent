const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
var cp = require('child_process');
const request = require('request'); // Ensure you have installed the request module

function triggerToCmdObj(cmds, trigger) {
    for(var i = 0; i < cmds.length; i++)
    {
      if(cmds[i].trigger.toLowerCase().replace(/ /g,"_") == trigger)
      {
        return cmds[i];
      }
    }
}

function readMyFile(file) {
  try {
    return fs.readFileSync(file).toString();
  }
  catch (e) {
    return null;
  }
}

function getComputerNameById(data, id) {
  const record = data.records.find(record => record.id === id);
  return record ? record.name : null;
}

function fetchComputerData(computerId, token) {
  const url = `https://triggercmd.com/api/computer/list?computer_id=${computerId}&token=${token}`;

  return new Promise((resolve, reject) => {
    request(
      {
        url: url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (parseError) {
            reject(parseError);
          }
        } else {
          reject(new Error(`HTTP error! Status: ${response.statusCode}`));
        }
      }
    );
  });
}

class HomeAssistantWebSocket {
  constructor(
    ground = "foreground",
    datafile = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/commands.json'), 
    configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/home_assistant_config.json')
  ) {
    this.computer_name;
    this.datafile = datafile;
    this.configPath = configPath;
    this.url = null;
    this.token = null;
    this.enabled = false;
    this.socket = null;
    this.ground = ground;
    this.isConnected = false;
    this.baseReconnectDelay = 10; // Initial delay in milliseconds
    this.maxReconnectDelay = 30000; // Maximum delay in milliseconds
    this.maxReconnectAttempts = 100; // Maximum number of reconnection attempts
    this.reconnectAttempts = 0; // Counter for reconnection attempts

    this.loadConfig();
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      console.log(`Local Home Assistant Configuration file not found at ${this.configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    this.url = config.HA_URL;
    this.token = config.HA_TOKEN;
    this.enabled = config.HA_ENABLED;

    if (!config.HA_URL || !config.HA_TOKEN) {
      console.log("Local Home Assistant Configuration file must contain 'HA_URL' and 'HA_TOKEN'");
      this.enabled = false  
    }

    var computeridFromFile = readMyFile(path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/computerid.cfg'));
    var tokenFromFile = readMyFile(path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/token.tkn'));

    fetchComputerData(computeridFromFile, tokenFromFile)
    .then(data => {
      this.computer_name = getComputerNameById(data,computeridFromFile)
      console.log('Computer name for Local Home Assistant listener:', this.computer_name);
    })
    .catch(error => {
      console.error('Error fetching computer name:', error);
    });

  }

  start() {
    if (this.enabled == false || this.enabled == "false") {
      console.log("Local Home Assistant listener is disabled.");
      return;
    }

    if (this.isConnected) {
      console.warn("Local Home Assistant WebSocket is already connected.");
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("Connected to Local Home Assistant WebSocket API");
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts
      this.authenticate();
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "auth_ok") {
        console.log("Local Home Assistant Authentication successful!");
        this.subscribeToAllEvents();
      } else if (message.type === "event") {
        // console.log("Event received:", message.event);
        var data = message.event.data 
        var prefix = "switch." + this.computer_name.toLowerCase() + "_"
        if(data.domain == "switch" && data.service_data.entity_id.startsWith(prefix) ) {
            console.log("Home Assistant data:", data);
            var trigger = data.service_data.entity_id.substring(prefix.length);

            var commands = JSON.parse(fs.readFileSync(this.datafile));
            var cmdobj = triggerToCmdObj(commands,trigger);
            if (cmdobj.ground == this.ground) {
              var envVars = process.env;
              envVars.TCMD_HA=true;

              var params;
              if(data.service == "turn_on") {
                  params = "on"
              }
              if(data.service == "turn_off") {
                  params = "off"
              }

              if (cmdobj.allowParams && params) {
                  if (cmdobj.offCommand && (params.trim() == 'off')) {
                  var theCommand = cmdobj.offCommand;
                  } else if (cmdobj.offCommand && (params.trim() == 'on')) {
                  var theCommand = cmdobj.command;
                  } else {
                  var theCommand = cmdobj.command + ' ' + params;
                  }
              } else {
                  var theCommand = cmdobj.command;
              }
              console.log('Local Home Assistant Running trigger: ' + trigger + '  Command: ' + theCommand);
              var ChildProcess = cp.exec(theCommand, {env: envVars}, (error, stdout, stderr) => {
                  console.log('stdout:', stdout);
                  console.log('stderr:', stderr);

                  if (error) {
                      // Log any errors
                      console.error('error:', error.message);
                      console.error('error code:', error.code);
                      console.log("Command ran over Home Assistant with error code " + error.code);
                      // return;
                  } else {
                      console.log("Command triggered over local LAN from Home Assistant.");
                  }
              });
            }
        }


      } else if (message.type === "auth_invalid") {
        console.error("Local Home Assistant Authentication failed:", message.message);
        this.enabled = false;
        this.stop();
      }
    };

    this.socket.onerror = (error) => {
      // console.error("WebSocket error:", error);
      console.error("Local Home Assistant WebSocket error.");
    };

    this.socket.onclose = () => {
      console.log("Local Home Assistant WebSocket connection closed");
      this.isConnected = false;
      this.reconnect(); // Attempt to reconnect
    };
  }

  stop() {
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.isConnected = false;
      console.log("Local Home Assistant WebSocket connection stopped");
    } else {
      console.warn("Local Home Assistant WebSocket is not connected.");
    }
  }

  reconnect() {
    this.reconnectAttempts++;
    console.log(`Local Home Assistant attempting to reconnect... (${this.reconnectAttempts})`);

    const delay = Math.min(
      this.baseReconnectDelay * 2 ** this.reconnectAttempts,
      this.maxReconnectDelay
    );

    console.log(
      `Local Home Assistant Attempting to reconnect in ${delay / 1000} seconds... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.start();
    }, delay);
  }

  authenticate() {
    const authMessage = {
      type: "auth",
      access_token: this.token,
    };
    this.socket.send(JSON.stringify(authMessage));
  }

  subscribeToAllEvents() {
    const subscribeMessage = {
      id: 1,
      type: "subscribe_events",
      event_type: "call_service"
    };
    this.socket.send(JSON.stringify(subscribeMessage));
  }
}

module.exports = HomeAssistantWebSocket;
