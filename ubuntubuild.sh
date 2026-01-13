export NODE_ENV=production
export PATH="./node_modules/.bin:$PATH"

apt update -y
apt install jq fakeroot dpkg rpm git -y

# Linux deb and rpm
cp ubuntupackage.json package.json
npm install
rm -rf out/make/*
npm run make

# # Raspberry Pi:
# npm i -g node-deb
# cp rpipackage.json package.json
# node-deb --install-strategy npm-install -- src/