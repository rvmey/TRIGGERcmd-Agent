const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

const macIcon = 'src/icon.icns';
const winIcon = 'src/ms-icon-310x310.ico';
const linuxIcon = 'icons/icon512.png';
const icon = process.platform === 'darwin' ? macIcon : winIcon;
const shouldBuildMsix =
  process.platform === 'win32' && process.env.TRIGGERCMD_BUILD_MSIX === '1';

function createMsixMaker() {
  const publisher = process.env.TRIGGERCMD_MSIX_PUBLISHER;
  const packageIdentity = process.env.TRIGGERCMD_MSIX_IDENTITY;

  if (!publisher || !packageIdentity) {
    throw new Error(
      'TRIGGERCMD_BUILD_MSIX=1 requires TRIGGERCMD_MSIX_PUBLISHER and TRIGGERCMD_MSIX_IDENTITY.',
    );
  }

  const config = {
    sign: false,
    logLevel: process.env.TRIGGERCMD_MSIX_LOG_LEVEL || 'warn',
    manifestVariables: {
      publisher,
      packageIdentity,
      publisherDisplayName:
        process.env.TRIGGERCMD_MSIX_PUBLISHER_DISPLAY_NAME ||
        packageJson.author,
      packageDisplayName:
        process.env.TRIGGERCMD_MSIX_PACKAGE_DISPLAY_NAME ||
        packageJson.productName,
      packageDescription:
        process.env.TRIGGERCMD_MSIX_PACKAGE_DESCRIPTION ||
        packageJson.description,
      appDisplayName:
        process.env.TRIGGERCMD_MSIX_APP_DISPLAY_NAME ||
        packageJson.productName,
      appExecutable:
        process.env.TRIGGERCMD_MSIX_APP_EXECUTABLE || 'TRIGGERcmdAgent.exe',
      packageVersion:
        process.env.TRIGGERCMD_MSIX_VERSION || packageJson.version,
      packageBackgroundColor:
        process.env.TRIGGERCMD_MSIX_BACKGROUND || 'transparent',
      packageMinOSVersion:
        process.env.TRIGGERCMD_MSIX_MIN_OS_VERSION || '10.0.19041.0',
      packageMaxOSVersionTested:
        process.env.TRIGGERCMD_MSIX_MAX_OS_VERSION_TESTED ||
        process.env.TRIGGERCMD_MSIX_MIN_OS_VERSION ||
        '10.0.19041.0',
    },
  };

  if (process.env.TRIGGERCMD_MSIX_WINDOWS_KIT_VERSION) {
    config.windowsKitVersion = process.env.TRIGGERCMD_MSIX_WINDOWS_KIT_VERSION;
  }

  if (process.env.TRIGGERCMD_MSIX_WINDOWS_KIT_PATH) {
    config.windowsKitPath = process.env.TRIGGERCMD_MSIX_WINDOWS_KIT_PATH;
  }

  if (process.env.TRIGGERCMD_MSIX_FILENAME) {
    config.packageName = process.env.TRIGGERCMD_MSIX_FILENAME;
  }

  const rawAssetsPath =
    process.env.TRIGGERCMD_MSIX_ASSETS_PATH || 'src/assets/msix';
  config.packageAssets = path.isAbsolute(rawAssetsPath)
    ? rawAssetsPath
    : path.resolve(__dirname, rawAssetsPath);

  if (!fs.existsSync(config.packageAssets)) {
    throw new Error(
      `MSIX assets path does not exist: ${config.packageAssets}`,
    );
  }

  return {
    name: '@electron-forge/maker-msix',
    config,
    platforms: ['win32'],
  };
}

const makers = [
  {
    name: '@electron-forge/maker-squirrel',
    config: {
      // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
      iconUrl: 'http://www.triggercmd.com/iconico.ico',
      // The ICO file to use as the icon for the generated Setup.exe
      setupIcon: winIcon,
    },
    platforms: ['win32'],
  },
  {
    name: '@electron-forge/maker-zip',
    platforms: ['darwin'],
  },
  {
    name: '@electron-forge/maker-dmg',
    config: {
      name: 'TRIGGERcmd',
      background: './icons/bg.png',
      icon: macIcon,
      format: 'UDZO',
      debug: true,
    },
    platforms: ['darwin'],
  },
  {
    name: '@electron-forge/maker-deb',
    config: {
      options: {
        icon: linuxIcon,
      },
    },
    platforms: ['linux'],
  },
  {
    name: '@electron-forge/maker-rpm',
    config: {
      options: {
        icon: linuxIcon,
      },
    },
    platforms: ['linux'],
  },
];

if (shouldBuildMsix) {
  makers.push(createMsixMaker());
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
    osxSign: {
      ignore: "python3"
    },
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    },
    extendInfo: {
      LSUIElement: true
    }
  },
  rebuildConfig: {},
  makers,
  plugins: [
  ],
};
