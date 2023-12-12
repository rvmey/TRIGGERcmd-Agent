cp macpackage.json package.json
npm install
rm -rf out/make/*
npm run make
unzip -q out/make/zip/darwin/x64/*.zip -d ./out/make
echo Signing TRIGGERcmdAgent.app
electron-osx-sign ./out/make/TRIGGERcmdAgent.app
codesign -dv out/make/TRIGGERcmdAgent.app
cd out/make
create-dmg TRIGGERcmdAgent.app
cd ../..
