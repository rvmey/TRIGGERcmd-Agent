cp ubuntupackage.json package.json
apk add git dpkg fakeroot rpm
npm install
rm -rf out/make/*
# npm run make

# Raspberry Pi:
apt update -y
apt install jq -y
npm i -g node-deb
node-deb -- rpipackage.json src/ node_modules LICENSE