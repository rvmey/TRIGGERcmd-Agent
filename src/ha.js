const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
var cp = require('child_process');

function triggerToCmdObj(cmds, trigger) {
    for(var i = 0; i < cmds.length; i++)
    {
      if(cmds[i].trigger.toLowerCase().replace(/ /g,"_") == trigger)
      {
        return cmds[i];
      }
    }
}

class HomeAssistantWebSocket {
  constructor(computer_name, datafile, configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/home_assistant_config.json')) {
    this.computer_name = computer_name;
    this.datafile = datafile;
    this.configPath = configPath;
    this.url = null;
    this.token = null;
    this.socket = null;
    this.isConnected = false;
    this.reconnectDelay = 50; // Delay before attempting reconnection (in milliseconds)
    this.reconnectAttempts = 0;

    this.loadConfig();
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file not found at ${this.configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    if (!config.HA_URL || !config.HA_TOKEN) {
      throw new Error("Configuration file must contain 'HA_URL' and 'HA_TOKEN'");
    }

    this.url = config.HA_URL;
    this.token = config.HA_TOKEN;
  }

  start() {
    if (this.isConnected) {
      console.warn("WebSocket is already connected.");
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("Connected to Home Assistant WebSocket API");
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts
      this.authenticate();
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "auth_ok") {
        console.log("Authentication successful!");
        this.subscribeToAllEvents();
      } else if (message.type === "event") {
        // console.log("Event received:", message.event);
        var data = message.event.data 
        var prefix = "switch." + this.computer_name + "_"
        if(data.domain == "switch" && data.service_data.entity_id.startsWith(prefix) ) {
            console.log("HA data:", data);
            var trigger = data.service_data.entity_id.substring(prefix.length);

            var commands = JSON.parse(fs.readFileSync(this.datafile));
            var cmdobj = triggerToCmdObj(commands,trigger);
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
            console.log('Running trigger: ' + trigger + '  Command: ' + theCommand);
            var ChildProcess = cp.exec(theCommand, {env: envVars}, (error, stdout, stderr) => {
                console.log('stdout:', stdout);
                console.log('stderr:', stderr);

                if (error) {
                    // Log any errors
                    console.error('error:', error.message);
                    console.error('error code:', error.code);
                    console.log("Command ran via Home Assistant with error code " + error.code);
                    // return;
                } else {
                    console.log("Command triggered via local LAN from Home Assistant.");
                }
            });
        }


      } else if (message.type === "auth_invalid") {
        console.error("Authentication failed:", message.message);
        this.stop();
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
      this.isConnected = false;
      this.reconnect(); // Attempt to reconnect
    };
  }

  stop() {
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.isConnected = false;
      console.log("WebSocket connection stopped");
    } else {
      console.warn("WebSocket is not connected.");
    }
  }

  reconnect() {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts})`);

    setTimeout(() => {
      this.start();
    }, this.reconnectDelay);
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
