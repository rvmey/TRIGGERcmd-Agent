cp ubuntupackage.json package.json
apk add git dpkg fakeroot rpm
npm install
rm -rf out/make/*
# npm run make

# Raspberry Pi:
apt update -y
apt install jq -y
npm i -g node-deb
cp rpipackage.json package.json
node-deb -- package.json src/ node_modules LICENSE