#!/bin/bash -v

export NODE_ENV=production

# apple_creds.sh sets these environment variables first:
#      APPLE_ID
#      APPLE_PASSWORD   <- app specific password
#      APPLE_TEAM_ID
source ~/apple_creds.sh

cp macpackage.json package.json
npm install
rm -rf out/make/*

npx electron-forge make --arch=x64
mv out/make/TRIGGERcmd.dmg out/make/TRIGGERcmdAgent-x64.dmg
npx electron-forge make --arch=arm64
mv out/make/TRIGGERcmd.dmg out/make/TRIGGERcmdAgent-arm64.dmg
