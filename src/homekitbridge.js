'use strict';
// HomeKit bridge manager – spawns homekitprocess.js in a plain Node.js child
// so that hap-nodejs runs outside Electron's restricted crypto environment.

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');
const crypto = require('crypto');
const os = require('os');

function createDefaultHomeKitBridgeName() {
  const computerNameFile = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.TRIGGERcmdData/computername.cfg'
  );

  let computerName = '';
  try {
    computerName = (fs.readFileSync(computerNameFile, 'utf8') || '').trim();
  } catch (e) {
    computerName = '';
  }

  if (!computerName) {
    computerName = os.hostname();
  }

  return 'TRIGGERcmd ' + computerName;
}

function createRandomHomeKitUsername() {
  return Array.from(crypto.randomBytes(6)).map((byte) => {
    return byte.toString(16).padStart(2, '0').toUpperCase();
  }).join(':');
}

function createRandomHomeKitPin() {
  const digits = String(crypto.randomInt(0, 100000000)).padStart(8, '0');
  return digits.slice(0, 3) + '-' + digits.slice(3, 5) + '-' + digits.slice(5, 8);
}

function createDefaultHomeKitConfig() {
  return {
    HK_ENABLED: false,
    HK_BRIDGE_NAME: createDefaultHomeKitBridgeName(),
    HK_PIN: createRandomHomeKitPin(),
    HK_USERNAME: createRandomHomeKitUsername(),
    HK_DEBUG_LOGGING: false,
  };
}

function normalizeHomeKitConfig(config) {
  const normalizedConfig = Object.assign(createDefaultHomeKitConfig(), config || {});

  if (!normalizedConfig.HK_BRIDGE_NAME || normalizedConfig.HK_BRIDGE_NAME === 'TRIGGERcmd HomeKit Bridge') {
    normalizedConfig.HK_BRIDGE_NAME = createDefaultHomeKitBridgeName();
  }

  delete normalizedConfig.HK_PORT;
  return normalizedConfig;
}

class HomeKitBridge {
  constructor(
    ground = 'foreground',
    datafile = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/commands.json'),
    configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData/homekit_config.json')
  ) {
    this.ground     = ground;
    this.datafile   = datafile;
    this.configPath = configPath;
    this.enabled    = false;
    this.child      = null;

    this.loadConfig();
  }

  loadConfig() {
    const datapath  = path.join(process.env.HOME || process.env.USERPROFILE, '.TRIGGERcmdData');
    const dest      = path.resolve(this.configPath);

    if (!fs.existsSync(datapath)) {
      fs.mkdirSync(datapath);
    }

    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, JSON.stringify(createDefaultHomeKitConfig(), null, 2), 'utf8');
    }

    try {
      const config = normalizeHomeKitConfig(JSON.parse(fs.readFileSync(this.configPath, 'utf8')));
      fs.writeFileSync(dest, JSON.stringify(config, null, 2), 'utf8');
      this.enabled = config.HK_ENABLED;
    } catch (e) {
      console.error('HomeKit: Failed to read config:', e.message);
      this.enabled = false;
    }
  }

  start() {
    if (this.enabled == false || this.enabled == 'false') {
      console.log('HomeKit bridge is disabled.');
      return;
    }

    if (this.child) {
      console.warn('HomeKit bridge already running.');
      return;
    }

    const scriptPath = path.resolve(__dirname, 'homekitprocess.js');
    if (!fs.existsSync(scriptPath)) {
      console.error('HomeKit: homekitprocess.js not found at ' + scriptPath);
      return;
    }

    // Use process.execPath with ELECTRON_RUN_AS_NODE=1 so the bundled Electron binary
    // runs as plain Node.js — no dependency on system Node.js being installed or on PATH.
    // The crypto monkey-patch in homekitprocess.js handles chacha20-poly1305 for BoringSSL.
    const nodeExe = process.execPath;

    // Pass DEBUG env based on config; default silent unless HK_DEBUG_LOGGING is enabled.
    let debugValue = '';
    try {
      const cfgForDebug = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      if (cfgForDebug.HK_DEBUG_LOGGING) {
        debugValue = 'HAP-NodeJS*';
      }
    } catch (e) { /* keep silent */ }
    const childEnv = Object.assign({}, process.env, {
      DEBUG: debugValue,
      ELECTRON_RUN_AS_NODE: '1',
    });

    this.child = cp.spawn(
      nodeExe,
      [scriptPath, this.configPath, this.datafile, this.ground],
      { stdio: ['pipe', 'pipe', 'pipe'], cwd: __dirname, env: childEnv }
    );

    this.child.stdout.on('data', (data) => {
      String(data).split('\n').filter(l => l.trim()).forEach(l => console.log(l));
    });

    this.child.stderr.on('data', (data) => {
      String(data).split('\n').filter(l => l.trim()).forEach(l => console.log('HomeKit stderr: ' + l));
    });

    this.child.on('close', (code) => {
      console.log('HomeKit process exited with code ' + code);
      this.child = null;
    });

    this.child.on('error', (err) => {
      console.log('HomeKit process error: ' + err.message);
      this.child = null;
    });
  }

  stop() {
    this.enabled = false;
    if (this.child) {
      try {
        this.child.stdin.write(JSON.stringify({ type: 'stop' }) + '\n');
      } catch (e) { /* stdin may already be closed */ }
      // Give child 700ms to exit gracefully, then force-kill
      const child = this.child;
      this.child = null;
      setTimeout(() => { try { child.kill(); } catch (e) {} }, 700);
    }
    console.log('HomeKit bridge stopped.');
  }

  restart() {
    this.stop();
    setTimeout(() => {
      this.loadConfig();
      this.start();
    }, 1000);
  }
}

module.exports = HomeKitBridge;