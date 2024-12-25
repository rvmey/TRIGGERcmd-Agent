cp ubuntupackage.json package.json
apk add git dpkg fakeroot rpm
npm install
rm -rf out/make/*
npm run make
npm i -g node-deb
node-deb -- package.json src/ node_modules LICENSE