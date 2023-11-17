module.exports = {
  packagerConfig: {
    asar: false,
    icon: "src/ms-icon-310x310.ico",
    win32metadata: {
      "ProductName": "TRIGGERcmd Agent",
      "FileDescription": "TRIGGERcmd Agent",
      "InternalName": "TRIGGERcmd Agent",
      "CompanyName": "TRIGGERcmd",
      "OriginalFilename": "TRIGGERcmdAgent.exe"
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        iconUrl: 'http://www.triggercmd.com/iconico.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: 'src/ms-icon-310x310.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
  ],
};
