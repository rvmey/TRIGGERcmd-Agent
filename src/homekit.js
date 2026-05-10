const { ipcRenderer } = require('electron');

window.onload = async () => {
  const formData = await ipcRenderer.invoke('load-homekit-config');
  document.getElementById('hk_bridge_name').value = formData.HK_BRIDGE_NAME || '';
  document.getElementById('hk_pin').value = formData.HK_PIN || '';
  document.getElementById('hk_username').value = formData.HK_USERNAME || '';
  document.getElementById('hk_enabled').checked = formData.HK_ENABLED || false;
  document.getElementById('hk_debug_logging').checked = formData.HK_DEBUG_LOGGING || false;
};

document.querySelector('form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = {
    hk_bridge_name: document.getElementById('hk_bridge_name').value,
    hk_pin: document.getElementById('hk_pin').value,
    hk_username: document.getElementById('hk_username').value,
    hk_enabled: document.getElementById('hk_enabled').checked,
    hk_debug_logging: document.getElementById('hk_debug_logging').checked,
  };

  await ipcRenderer.invoke('homeKitSave', formData);
});
