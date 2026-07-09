cp blackpantherpackage.json package.json
npm install
rm -rf out/make/*
npm audit fix
npm install electron-forge
sed -i 's|%>Release: <%= revision %>%{?dist}|%>Release: <%= revision %>bP|' node_modules/electron-installer-redhat/resources/spec.ejs
export PATH=node_modules/.bin:$PATH
electron-forge --verbose make
RPM=$(find out/make -name "triggercmd*.rpm" -print -quit)
if [ -n "$RPM" ];then
    REL=$(echo $RPM | grep 'bP.x86')
    [ ! -n "$REL" ]&& mv $RPM $(echo $RPM | sed 's|\.x86|-1bP.x86|')
fi
