macIcon="src/icon.icns";
winIcon="src/ms-icon-310x310.ico";
linuxIcon='icons/icon512.png';
if (process.platform === 'darwin') {
  icon=macIcon;
} else {
  icon=winIcon;
}

module.exports = {
  packagerConfig: {
    asar: false,
    icon: icon,
    win32metadata: {
      "ProductName": "TRIGGERcmd Agent",
      "FileDescription": "TRIGGERcmd Agent",
      "InternalName": "TRIGGERcmd Agent",
      "CompanyName": "TRIGGERcmd",
      "OriginalFilename": "TRIGGERcmdAgent.exe"
    },
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
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
        setupIcon: winIcon
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'TRIGGERcmd',
        background: './icons/bg.png',
        icon: macIcon,
        format: 'UDZO',
        debug: true
      },
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: linuxIcon
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: linuxIcon
        }
      },
    },
  ],
  plugins: [
  ],
};
