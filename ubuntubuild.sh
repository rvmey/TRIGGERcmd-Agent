cp ubuntupackage.json package.json
apk add git
npm install
rm -rf out/make/*
npm run make
