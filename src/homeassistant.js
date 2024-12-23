const { ipcRenderer } = require('electron');

// Load JSON data when the window is loaded
window.onload = async () => {
    console.log("loading form data")
    const formData = await ipcRenderer.invoke('load-ha-config');
    document.getElementById('ha_url').value = formData.HA_URL || '';
    document.getElementById('ha_token').value = formData.HA_TOKEN || '';
    document.getElementById('ha_enabled').checked = formData.HA_ENABLED || false;
    console.log("form data: " + formData)
};

// Handle form submission
document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from refreshing the page

    const formData = {
        ha_url: document.getElementById('ha_url').value,
        ha_token: document.getElementById('ha_token').value,
        ha_enabled: document.getElementById('ha_enabled').checked,
    };

    const response = await ipcRenderer.invoke('homeAssistantSave', formData);
    // alert(response); // Notify the user that the data has been saved
});
