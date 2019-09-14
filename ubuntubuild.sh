cp ubuntupackage.json package.json
npm install
rm -rf out/make/*
npm install -g electron-forge
electron-forge --verbose make
