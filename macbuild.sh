#!/bin/bash -v
cp macpackage.json package.json
npm install
rm -rf out/make/*
npm run make
