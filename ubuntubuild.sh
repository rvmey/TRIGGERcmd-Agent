apt update -y
apt install jq fakeroot dpkg -y

# Linux deb and rpm
cp ubuntupackage.json package.json
apk add git dpkg fakeroot rpm
npm install
rm -rf out/make/*
npm run make

# Raspberry Pi:
npm i -g node-deb
cp rpipackage.json package.json
node-deb --install-strategy npm-install -- src/