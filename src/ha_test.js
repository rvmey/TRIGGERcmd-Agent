const HomeAssistantWebSocket = require('./ha');
var path = require('path');

computer_name = 'ds'
homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
if (!homedir) {homedir = process.env.HOME};
cmdfile = "commands.json"
datapath = path.resolve(homedir, ".TRIGGERcmdData");
datafile = path.resolve(datapath, cmdfile);

// Create an instance of the WebSocket class
const haWebSocket = new HomeAssistantWebSocket(computer_name, datafile);

// Start the WebSocket connection
haWebSocket.start();

// Check connection status
setTimeout(() => {
  console.log("WebSocket connected:", haWebSocket.isConnected);
}, 5000);

// // Stop the WebSocket connection after 60 seconds
// setTimeout(() => {
//   haWebSocket.stop();
//   console.log("WebSocket connected after stop:", haWebSocket.isConnected);
// }, 60000);
