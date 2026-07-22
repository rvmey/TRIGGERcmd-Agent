# Agent UI: Alexa Wake-on-LAN Enable/Disable Toggle

## Context

TriggerCMD's server now supports Alexa "turn on my computer" via Wake-on-LAN. The server side is done (in `triggercmdserver`): `Computer.enableWakeOnLan` and `Computer.macAddresses` drive whether the computer's Alexa device advertises `Alexa.PowerController` + `Alexa.WakeOnLANController`. See `triggercmdserver`'s `doc/ai/COMPUTER_ALEXA_WAKEONLAN.md` for the full feature design — the piece relevant here is just the contract this agent must talk to.

**What's missing**: the agent has no way for a user to turn this on, and no way to detect/report the computer's MAC address(es). This plan adds both, following the exact pattern already used for this repo's Home Assistant integration (`src/homeassistant.html` / `src/homeassistant.js` / the `openhaconfig()` + `load-ha-config` + `homeAssistantSave` wiring in `src/main.js`).

## Server API contract (already implemented server-side, do not change)

`POST https://www.triggercmd.com/api/computer/updateWakeOnLan`

- Auth: `Authorization: Bearer <token>` header (same token already used for every other agent→server call, e.g. `createComputer`, `fetchexamples` in `src/agent.js`)
- Body (`application/x-www-form-urlencoded`, matching this repo's existing `request`/`options.form` convention):
  - `computer_id` — the agent's saved computer ID
  - `enableWakeOnLan` — `"true"` or `"false"` (truthy/falsy string is fine; server does `req.param("enableWakeOnLan") ? true : false`)
  - `macAddresses` — a **JSON-stringified array** of MAC address strings, e.g. `'["aa:bb:cc:dd:ee:ff","11:22:33:44:55:66"]'`. Only meaningful when `enableWakeOnLan` is true; send `"[]"` (or omit) when disabled — the server zeroes it out server-side regardless when disabled.
- Response: `200 {data, message}` on success.

This is the *only* place `Computer.enableWakeOnLan`/`Computer.macAddresses` get written — the website's `/user/computer/edit` page only displays what the agent reports, read-only.

## Design

Three-layer shape, exactly mirroring the Home Assistant integration:

```
src/wakeonlan.html/.js  (renderer: checkbox UI)
        |  ipcRenderer.invoke('wakeOnLanSave', formData)
        v
src/main.js             (main process: IPC handlers, tray menu item, local JSON config)
        |  agent.updateWakeOnLan()
        v
src/agent.js             (reads local config + os.networkInterfaces(), POSTs to the server)
```

### 1. New file: `src/wakeonlan.html`

Mirrors `src/homeassistant.html` exactly (same doctype/stylesheets/script-require pattern), just with one checkbox instead of URL/token/enabled fields, plus a read-only list of the MAC address(es) that will be reported — so the user can see what they're opting into before checking the box.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="./foundation.css">
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
<form>
    <div class="row">
        <div class="medium-12 columns">
            <h4>Alexa Wake-on-LAN</h4>
        </div>
    </div>

    <div class="row">
        <div class="medium-12 columns">
            <p>Detected network adapter MAC address(es), reported to TRIGGERcmd if enabled below:</p>
            <p id="mac_addresses"><em>Detecting...</em></p>
        </div>
    </div>

    <div class="row">
        <div class="medium-12 columns">
            <label>
                Enable Alexa Wake-on-LAN for this computer
                <input type="checkbox" name="wol_enabled" id="wol_enabled" class="form-control"/>
            </label>
        </div>
    </div>

    <div class="row">
        <div class="medium-12 columns">
            <button class="large expanded button" type="submit">Save</button>
        </div>
    </div>
</form>
</body>
<script>
    // You can also require other files to run in this process
    require('./wakeonlan.js')
</script>
</html>
```

### 2. New file: `src/wakeonlan.js`

Mirrors `src/homeassistant.js` exactly (same `ipcRenderer.invoke` load/save pattern), plus rendering the MAC address list the main process sends back from `load-wol-config`.

```js
const { ipcRenderer } = require('electron');

// Load JSON data when the window is loaded
window.onload = async () => {
    console.log("loading form data")
    const formData = await ipcRenderer.invoke('load-wol-config');
    document.getElementById('wol_enabled').checked = formData.WOL_ENABLED || false;
    document.getElementById('mac_addresses').textContent =
        (formData.macAddresses && formData.macAddresses.length)
            ? formData.macAddresses.join(', ')
            : 'None detected';
    console.log("form data: " + JSON.stringify(formData))
};

// Handle form submission
document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from refreshing the page

    const formData = {
        wol_enabled: document.getElementById('wol_enabled').checked,
    };

    const response = await ipcRenderer.invoke('wakeOnLanSave', formData);
    // alert(response); // Notify the user that the data has been saved
});
```

### 3. `src/main.js` changes

**Add near the top**, alongside the existing `const fs = require('fs')` / `const path = require('path')` (already present for the HA config handlers) — no new imports needed; `os` is not required here since MAC detection happens in `agent.js`, not `main.js` (see §4).

**Add a new window-opener function**, right next to `openhaconfig()`:

```js
function openwolconfig() {
  wolWindow = new BrowserWindow({ title: i18n.t('Alexa Wake-on-LAN'),
    width: 700,
    height: 400,
    icon: __dirname + '/icon.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  myAppMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(myAppMenu);

  remoteMain.enable(wolWindow.webContents);

  wolWindow.loadURL(`file://${__dirname}/wakeonlan.html`);

  wolWindow.on('closed', () => {
      wolWindow = null;
  });
}
```

Declare `wolWindow` alongside the existing `haWindow`/`homeKitWindow` module-level `let`/`var` declarations.

**Add a tray menu item**, in all three platform context-menu sections (Windows/macOS/Linux — the same `{ label: 'Home Assistant Config', click: function() { ... openhaconfig(); } }` block appears three times; add this next to each one):

```js
{
  label: 'Alexa Wake-on-LAN Config',
  click: function() {
    console.log('Opening Alexa Wake-on-LAN Config');
    openwolconfig();
  }
},
```

**Add two IPC handlers**, next to the existing `load-ha-config`/`homeAssistantSave` handlers:

```js
ipcMain.handle('load-wol-config', async () => {
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE,
    '.TRIGGERcmdData/wake_on_lan_config.json')

  var config = { WOL_ENABLED: false };
  try {
    config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error('Error reading Wake-on-LAN configuration file:', error);
  }

  config.macAddresses = agent.getMacAddresses();
  return config;
});

ipcMain.handle('wakeOnLanSave', async (event, formData) => {
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE,
    '.TRIGGERcmdData/wake_on_lan_config.json')

  try {
    const updatedConfig = {
      WOL_ENABLED: formData.wol_enabled,
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    console.log('Wake-on-LAN configuration saved:', updatedConfig);

    agent.updateWakeOnLan();

  } catch (error) {
    console.error('Error saving Wake-on-LAN configuration:', error);
  }

  wolWindow.hide();
});
```

Note `agent.getMacAddresses()` is a small new helper (§4) so the renderer can preview the detected MAC addresses even before the user has ever enabled/saved anything — this is a display-only convenience, separate from `agent.updateWakeOnLan()` which is what actually reports to the server.

### 4. `src/agent.js` changes

This has already been drafted and verified (syntax-checked) as a reference implementation in `triggercmdserver`'s `doc/agent.js` — port it into this repo's `src/agent.js` verbatim, then also add the small `getMacAddresses()` helper main.js needs for the live preview (not present in the `doc/agent.js` reference copy since that copy predates this plan; add it there too when porting back).

**Export block** (alongside `restartHomeAssistant`, `restartHomeKit`):
```js
updateWakeOnLan: function () {
  updateWakeOnLan();
},
getMacAddresses: function () {
  return getMacAddresses();
},
```

**New functions**, near `restartHomeAssistant`/`restartHomeKit`:
```js
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
```

**Call `updateWakeOnLan()` at startup**, alongside the existing `updateCmds(...)` calls in `background()` and `foreground()`, so the server stays in sync even if the user never reopens the toggle window (e.g. after a reinstall, or if MAC addresses changed since the last report — laptop switched networks, docked/undocked, etc.).

`os`, `fs`, `path`, `request`, `headers`, `options`, `urlprefix`, `tokenFromFile`, `computeridFromFile`, and `datapath` are all already available as module-level requires/vars in `src/agent.js` — no new imports needed.

## Files to touch

| File | Change |
|---|---|
| `src/wakeonlan.html` | New — renderer markup (checkbox + MAC address preview) |
| `src/wakeonlan.js` | New — renderer logic (load/save via IPC) |
| `src/main.js` | New `wolWindow` var, `openwolconfig()`, tray menu item (×3 platform sections), `load-wol-config`/`wakeOnLanSave` IPC handlers |
| `src/agent.js` | New `getMacAddresses()`, `updateWakeOnLan()`, exports for both, startup calls in `background()`/`foreground()` |

## Verification

1. Launch the agent, right-click the tray icon, confirm a new "Alexa Wake-on-LAN Config" item opens a window showing detected MAC address(es) and an unchecked box.
2. Check the box, save; confirm the window closes and (with logging/a network inspector) a `POST /api/computer/updateWakeOnLan` fires with `enableWakeOnLan=true` and a non-empty `macAddresses` array.
3. Restart the agent without touching the toggle; confirm it still reports the same state at startup (reading `wake_on_lan_config.json`).
4. On the TriggerCMD website's `/user/computer/edit` page for that computer, confirm the read-only status now shows "Enabled" with the reported MAC address(es).
5. Uncheck the box, save; confirm the server call now sends `enableWakeOnLan=false` and an empty `macAddresses` array, and the website reflects "Disabled".
