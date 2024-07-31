#!/bin/bash -v

# apple_creds.sh sets these environment variables first:
#      APPLE_ID
#      APPLE_PASSWORD   <- app specific password
#      APPLE_TEAM_ID
source ~/apple_creds.sh

cp macpackage.json package.json
npm install
rm -rf out/make/*
npm run make
