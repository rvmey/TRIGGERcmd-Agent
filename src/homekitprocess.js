'use strict';
// Standalone HomeKit HAP bridge – runs in plain Node.js (not Electron).
// Args: <configPath> <datafilePath> <ground>
// Communication: JSON lines on stdin (control) / stdout (log)

process.chdir(__dirname);

const configPath  = process.argv[2];
const datafilePath = process.argv[3];
const ground      = process.argv[4] || 'foreground';

if (!configPath || !datafilePath) {
  process.stderr.write('Usage: node homekitprocess.js <configPath> <dataFilePath> <ground>\n');
  process.exit(1);
}

const fs       = require('fs');
const path     = require('path');
const cp       = require('child_process');

// When running under ELECTRON_RUN_AS_NODE=1, Electron's patched module loader
// doesn't resolve node_modules via parent-directory traversal the same way
// plain Node.js does. Use absolute paths for all external modules to bypass this.
const nodeModules = path.resolve(__dirname, '..', 'node_modules');

// Monkey-patch crypto before loading hap-nodejs so that chacha20-poly1305 works
// in Electron's BoringSSL environment (which doesn't support it natively).
// Based on: https://github.com/homebridge/HAP-NodeJS/pull/1024#issuecomment-2016022072
const crypto = require('crypto');
if (!crypto.getCiphers().includes('chacha20-poly1305')) {
  const chacha = require(path.join(nodeModules, 'chacha'));
  const _getCiphers = crypto.getCiphers.bind(crypto);
  const _createCipheriv = crypto.createCipheriv.bind(crypto);
  const _createDecipheriv = crypto.createDecipheriv.bind(crypto);

  crypto.getCiphers = () => [..._getCiphers(), 'chacha20-poly1305'];

  crypto.createCipheriv = (algorithm, key, iv, options) => {
    if (algorithm === 'chacha20-poly1305') return chacha.createCipher(key, iv);
    return _createCipheriv(algorithm, key, iv, options);
  };

  crypto.createDecipheriv = (algorithm, key, iv, options) => {
    if (algorithm === 'chacha20-poly1305') return chacha.createDecipher(key, iv);
    return _createDecipheriv(algorithm, key, iv, options);
  };
}

const chokidar = require(path.join(nodeModules, 'chokidar'));
const hap      = require(path.join(nodeModules, 'hap-nodejs'));

const tcmdDataPath = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData');
const hapCachePath = path.join(tcmdDataPath, 'cache');

fs.mkdirSync(hapCachePath, { recursive: true });
hap.HAPStorage.setCustomStoragePath(hapCachePath);

const { Bridge, Accessory, Service, Characteristic, uuid, Categories } = hap;

function log(msg) {
  process.stdout.write('[HomeKit] ' + msg + '\n');
}

function readCommands() {
  try {
    const commands = JSON.parse(fs.readFileSync(datafilePath, 'utf8'));
    return Array.isArray(commands) ? commands : [];
  } catch (e) {
    log('Unable to read commands.json: ' + e.message);
    return [];
  }
}

function getComputerName() {
  const computerNameFile = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.TRIGGERcmdData/computername.cfg'
  );
  try {
    return (fs.readFileSync(computerNameFile, 'utf8') || '').trim() || 'TRIGGERcmd';
  } catch (e) {
    return 'TRIGGERcmd';
  }
}

function getDefaultBridgeName() {
  return 'TRIGGERcmd ' + getComputerName();
}

function executeCommand(cmdobj, isOn, parameterOverride) {
  if (!cmdobj || !cmdobj.command) return;

  const envVars = Object.assign({}, process.env, { TCMD_HK: 'true' });

  var theCommand;
  if (!isOn && cmdobj.offCommand) {
    theCommand = cmdobj.offCommand;
  } else if (parameterOverride !== undefined && parameterOverride !== null && cmdobj.allowParams) {
    theCommand = cmdobj.command + ' ' + parameterOverride;
  } else if (cmdobj.allowParams) {
    theCommand = cmdobj.command + ' ' + (isOn ? 'on' : 'off');
  } else {
    theCommand = cmdobj.command;
  }

  log('Running trigger: ' + cmdobj.trigger + '  Command: ' + theCommand);
  cp.exec(theCommand, { env: envVars }, function (error, stdout, stderr) {
    if (stdout) log('stdout: ' + stdout.trim());
    if (stderr) log('stderr: ' + stderr.trim());
    if (error)  log('error: ' + error.message + ' code: ' + error.code);
  });
}

function getDefaultState() {
  return { on: false, brightness: 100 };
}

function buildAccessory(cmdobj, computerName) {
  const accessoryName = computerName.trim() + ' ' + (cmdobj.trigger || 'Command').trim();
  const accessoryUuid = uuid.generate('triggercmd-homekit:' + accessoryName);
  const accessory = new Accessory(accessoryName, accessoryUuid);
  let pendingOnTimer = null;
  let suppressOnUntil = 0;

  accessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'TRIGGERcmd')
    .setCharacteristic(Characteristic.Model, 'TRIGGERcmd Virtual Command Light')
    .setCharacteristic(Characteristic.SerialNumber, accessoryUuid.slice(0, 12));

  const lightService = accessory.addService(Service.Lightbulb, accessoryName, 'lightbulb');
  const defaultState = getDefaultState();

  function resetState() {
    lightService.getCharacteristic(Characteristic.On).updateValue(defaultState.on);
    lightService.getCharacteristic(Characteristic.Brightness).updateValue(defaultState.brightness);
  }

  function clearPendingOnTimer() {
    if (pendingOnTimer) {
      clearTimeout(pendingOnTimer);
      pendingOnTimer = null;
    }
  }

  function suppressOnFor(ms) {
    suppressOnUntil = Date.now() + ms;
  }

  function isOnSuppressed() {
    return Date.now() < suppressOnUntil;
  }

  lightService
    .getCharacteristic(Characteristic.On)
    .onGet(() => defaultState.on)
    .onSet(function (value) {
      if (cmdobj.ground == ground) {
        const isOn = Boolean(value);
        if (!isOn) {
          clearPendingOnTimer();
          executeCommand(cmdobj, false);
        } else if (cmdobj.allowParams) {
          if (isOnSuppressed()) {
            clearPendingOnTimer();
          } else {
          clearPendingOnTimer();
          pendingOnTimer = setTimeout(function () {
            pendingOnTimer = null;
            executeCommand(cmdobj, true);
          }, 800);
          }
        } else {
          executeCommand(cmdobj, true);
        }
      }
      resetState();
    });

  lightService
    .getCharacteristic(Characteristic.Brightness)
    .onGet(() => defaultState.brightness)
    .onSet(function (value) {
      if (cmdobj.ground == ground && cmdobj.allowParams) {
        clearPendingOnTimer();
        suppressOnFor(1500);
        executeCommand(cmdobj, true, Number(value));
      }
      resetState();
    });

  resetState();
  return accessory;
}

// ----- Bridge setup --------------------------------------------------------

var config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  process.stderr.write('HomeKit: Failed to read config: ' + e.message + '\n');
  process.exit(1);
}

const bridgeUsername = config.HK_USERNAME;
const bridge = new Bridge(
  config.HK_BRIDGE_NAME || getDefaultBridgeName(),
  uuid.generate('triggercmd-homekit-bridge:' + bridgeUsername)
);

const bulbs = new Map();

function rebuildAccessories() {
  const computerName = getComputerName();
  const existing = Array.from(bulbs.values());
  if (existing.length > 0) {
    bridge.removeBridgedAccessories(existing);
  }
  bulbs.clear();

  const commands = readCommands();
  commands.forEach(function (cmd) {
    if (!cmd || !cmd.trigger || !cmd.command) return;
    const accessory = buildAccessory(cmd, computerName);
    bridge.addBridgedAccessory(accessory);
    bulbs.set(cmd.trigger, accessory);
  });

  log('Published ' + bulbs.size + ' command(s) as HomeKit bulbs');
}

rebuildAccessories();

bridge.publish({
  username: config.HK_USERNAME,
  pincode:  config.HK_PIN,
  port:     47129,
  category: Categories.BRIDGE,
});

log('HomeKit bridge started. Pair with PIN: ' + config.HK_PIN);

// ----- Watch commands.json -------------------------------------------------

const watcher = chokidar.watch(datafilePath, { ignoreInitial: true });
watcher.on('change', function () {
  log('commands.json changed – rebuilding accessories...');
  rebuildAccessories();
});

// ----- stdin control protocol ----------------------------------------------

process.stdin.resume();
process.stdin.setEncoding('utf8');
var inputBuffer = '';
process.stdin.on('data', function (chunk) {
  inputBuffer += chunk;
  var newline;
  while ((newline = inputBuffer.indexOf('\n')) !== -1) {
    var line = inputBuffer.slice(0, newline).trim();
    inputBuffer = inputBuffer.slice(newline + 1);
    if (!line) continue;
    try {
      var msg = JSON.parse(line);
      if (msg.type === 'stop') {
        shutdown('parent stop command');
      } else if (msg.type === 'reload') {
        log('Reload requested');
        rebuildAccessories();
      }
    } catch (e) { /* ignore malformed input */ }
  }
});

function shutdown(reason) {
  log('Shutting down (' + reason + ')');
  watcher.close().catch(function () {});
  bridge.unpublish();
  setTimeout(function () { process.exit(0); }, 500);
}

process.on('SIGINT',  function () { shutdown('SIGINT'); });
process.on('SIGTERM', function () { shutdown('SIGTERM'); });
