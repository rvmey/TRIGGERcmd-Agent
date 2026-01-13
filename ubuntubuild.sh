export PATH="./node_modules/.bin:$PATH"

apt update -y
apt install jq fakeroot dpkg rpm git -y

# Linux deb and rpm
cp ubuntupackage.json package.json
npm install

# ^ npm install runs without NODE_ENV=production, so it installs all dependencies including devDependencies (which contain @electron-forge/cli and the makers)
export NODE_ENV=production

rm -rf out/make/*
npm run make

# # Raspberry Pi:
# npm i -g node-deb
# cp rpipackage.json package.json
# node-deb --install-strategy npm-install -- src/