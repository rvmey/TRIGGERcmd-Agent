cp linuxpackage.json package.json
npm install
rm -rf out/make/*
electron-forge --verbose make
