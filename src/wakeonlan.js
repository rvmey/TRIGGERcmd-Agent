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
