export NODE_ENV=production
export PATH="./node_modules/.bin:$PATH"

apt update -y
apt install jq fakeroot dpkg rpm git -y

# Linux deb and rpm
cp ubuntupackage.json package.json
npm install
npm install -g @electron-forge/cli @electron-forge/maker-deb @electron-forge/maker-rpm @electron-forge/maker-squirrel @electron-forge/maker-zip @electron-forge/maker-dmg
rm -rf out/make/*
npm run make

# # Raspberry Pi:
# npm i -g node-deb
# cp rpipackage.json package.json
# node-deb --install-strategy npm-install -- src/