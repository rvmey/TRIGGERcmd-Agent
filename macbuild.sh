cp macpackage.json package.json
npm install
rm -rf out/make/*
npm install -g electron-forge
electron-forge --verbose make
unzip -q out/make/TRIGGERcmdAgent*.zip -d ./out/make
rm -rf out/make/TRIGGERcmdAgent.app/Contents/Resources/app/node_modules/fsevents/build/Release/.deps/private/var/folders/x_/0d9jrssn7s5glyjmpkhtszpm0000gp/T/electron-packager/darwin-x64/TRIGGERcmdAgent-darwin-x64/Electron.app
echo Signing TRIGGERcmdAgent.app
electron-osx-sign ./out/make/TRIGGERcmdAgent.app
codesign -dv out/make/TRIGGERcmdAgent.app
cd out/make
create-dmg TRIGGERcmdAgent.app
cd ../..
