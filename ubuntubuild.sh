export NODE_ENV=production

apt update -y
apt install jq fakeroot dpkg rpm git -y

# Linux deb and rpm
cp ubuntupackage.json package.json
# npm i -g @electron-forge/cli
# npm i -g @electron-forge/maker-squirrel
# npm i -g @electron-forge/maker-deb
# npm i -g @electron-forge/maker-rpm
# npm i -g @electron-forge/maker-zip
# npm i -g @electron-forge/maker-dmg
npm install
# npm i @electron-forge/cli
rm -rf out/make/*
npm run make

# # Raspberry Pi:
# npm i -g node-deb
# cp rpipackage.json package.json
# node-deb --install-strategy npm-install -- src/