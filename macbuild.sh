cp macpackage.json package.json
apk add git dpkg fakeroot rpm
npm install
rm -rf out/make/*
npm run make