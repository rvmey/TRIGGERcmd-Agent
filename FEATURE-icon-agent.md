# Feature: Command Icon Field — Agent Implementation

## Overview

Add an `icon` field to each command so users can assign a custom emoji icon. The icon is stored in the local `commands.json` file and synced to the TRIGGERcmd server. It is displayed in the command list inside the agent GUI.

---

## Background

Commands are stored locally in `~/.TRIGGERcmdData/commands.json`. Each command object has fields like:

```json
{
  "trigger": "Basement Roku Play",
  "command": "roku.bat",
  "ground": "false",
  "voice": "",
  "voiceReply": "",
  "allowParams": "false",
  "quoteParams": "false",
  "mcpToolDescription": "Plays Roku in the basement"
}
```

We are adding an `icon` field — a single emoji character chosen by the user (e.g. `"📺"`).

---

## Required Changes

### 1. `process/js/AddAppointment.js` — Add icon field to the Add Command form

#### 1a. Add state and handler

In the `constructor`, add initial state for `icon` and bind the handler:
```js
this.handleIconChange = this.handleIconChange.bind(this);
// inside this.state or wherever initial values are tracked:
// icon: ''
```

Add the handler method:
```js
handleIconChange(e) {
  this.props.onIconChange(e.target.value);
}
```

#### 1b. Add the field to `render()`

After the existing `mcpToolDescription` form group, add:

```jsx
<div className="form-group">
  <label className="col-sm-3 control-label" htmlFor="iconField">Icon</label>
  <div className="col-sm-9">
    <input
      type="text"
      className="form-control"
      id="iconField"
      ref={(ref) => this.inputIcon = ref}
      placeholder="Paste an emoji (e.g. 📺)"
      onChange={this.handleIconChange}
      maxLength={10}
    />
    <small className="text-muted">Optional. Paste a single emoji to identify this command in Mission Control.</small>
  </div>
</div>
```

#### 1c. Include `icon` when calling `handleAdd` / `addApt`

In the `handleAdd` method, include the icon field when constructing the new command object passed to `this.props.addApt`:

```js
icon: this.inputIcon ? this.inputIcon.value : ''
```

---

### 2. `process/js/EditAppointment.js` — Add icon field to the Edit Command form

#### 2a. Bind handler in constructor:
```js
this.handleIconChange = this.handleIconChange.bind(this);
```

#### 2b. Add the handler method:
```js
handleIconChange(e) {
  this.props.onIconChange(e.target.value);
}
```

#### 2c. Add the field to `render()`

After the `mcpToolDescription` form group, add:

```jsx
<div className="form-group">
  <label className="col-sm-3 control-label" htmlFor="iconField">Icon</label>
  <div className="col-sm-9">
    <input
      type="text"
      className="form-control"
      id="iconField"
      ref={(ref) => this.inputIcon = ref}
      placeholder="Paste an emoji (e.g. 📺)"
      onChange={this.handleIconChange}
      value={this.props.editIcon || ''}
      maxLength={10}
    />
    <small className="text-muted">Optional. Paste a single emoji to identify this command in Mission Control.</small>
  </div>
</div>
```

#### 2d. Include `icon` in `handleEdit`

In the method that builds the edited item and calls `this.props.changeItem(...)`, include:
```js
icon: this.inputIcon ? this.inputIcon.value : ''
```

---

### 3. `process/js/render.js` (MainInterface) — Wire up icon state and handlers

#### 3a. Add `editIcon` to state:

```js
editIcon: '',
```

#### 3b. Add `onIconChange` handler:

```js
onIconChange(value) {
  this.setState({ editIcon: value });
}
```

Bind it in the constructor:
```js
this.onIconChange = this.onIconChange.bind(this);
```

#### 3c. Pass `editIcon` and `onIconChange` to `EditAppointment` in `render()`:

```jsx
<EditAppointment
  ...existing props...
  editIcon={this.state.editIcon}
  onIconChange={this.onIconChange}
/>
```

#### 3d. Pass `onIconChange` to `AddAppointment` in `render()`:

```jsx
<AddAppointment
  ...existing props...
  onIconChange={this.onIconChange}
/>
```

#### 3e. Populate `editIcon` when opening edit mode

In `toggleEditDisplay(item)` (or wherever edit state is populated), add:
```js
editIcon: item.icon || '',
```

#### 3f. Include `icon` in `addItem` and `changeItem`

In `addItem(tempItem)`, when writing to `commands.json`, ensure `tempItem.icon` is preserved (it will be present if AddAppointment passes it).

In `changeItem(item)`, ensure `item.icon` is preserved when updating the local array and writing to `commands.json`.

---

### 4. `process/js/AptList.js` — Display the icon in the command list

In the `render()` method, display the icon next to the trigger name. If no icon is set, display nothing (the Mission Control app handles fallback icons independently):

```jsx
<div className="pet-head">
  <span className="pet-name">
    {this.props.singleItem.icon ? `${this.props.singleItem.icon} ` : ''}
    {this.props.singleItem.trigger}
  </span>
  ...
</div>
```

---

### 5. `src/agent.js` — Include `icon` when syncing to the server

#### 5a. Update `addCmd` function signature:

```js
function addCmd(trigger, voice, voiceReply, allowParams, mcpToolDescription, icon, token, userid, computerid) {
```

#### 5b. Include `icon` in the POST body:

```js
options.form = {
  'name': trigger,
  'computer': computerid,
  'voice': voice,
  'voiceReply': voiceReply,
  'allowParams': allowParams,
  'mcpToolDescription': mcpToolDescription,
  'icon': icon || ''
};
```

#### 5c. Update all call sites of `addCmd`

Search the file for every call to `addCmd(...)` and add the `icon` argument in the correct position. The icon value should come from the command object loaded from `commands.json`: `cmd.icon || ''`.

---

### 6. Local `commands.json` — No schema migration needed

The `commands.json` file is plain JSON. Existing commands without an `icon` key will simply have `undefined` / missing icon, which the app treats as `""`. No migration script is required — the field is optional.

---

## Testing

1. **Add a command** with an emoji icon (e.g. `🎮`). Confirm it appears in the command list in the agent GUI next to the trigger name.
2. **Edit that command**. Confirm the icon field is pre-populated with `🎮`.
3. **Change the icon** and save. Confirm the list updates.
4. **Check `commands.json`** — confirm the `icon` field is present in the saved object.
5. **Sync to server** — if the agent pushes commands to the server, confirm the `icon` field is sent in the POST body and the server stores it.
7. **Existing commands** (no icon set) should show no icon in the agent list, and the hash-generated fallback in Mission Control.

---

## Notes

- Keep the field name exactly `icon` — this matches what the server returns and what Mission Control reads as `cmd.icon`.
- The value should be stored as-is (do not HTML-encode the emoji).
