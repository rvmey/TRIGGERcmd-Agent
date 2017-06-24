#!/bin/sh
THISDIR="$(dirname $0)"
case "$1" in
  "--add")
    file="/etc/systemd/system/triggercmdagent.service"
    if [ -f $file ] ; then
      rm $file
    fi
    cp ${THISDIR}/triggercmdagent.service.top ~/.TRIGGERcmdData/triggercmdagent.service
    echo "ExecStart=/usr/bin/env node ${THISDIR}/daemon.js --run $2" >> ~/.TRIGGERcmdData/triggercmdagent.service
    cat ${THISDIR}/triggercmdagent.service.bottom >> ~/.TRIGGERcmdData/triggercmdagent.service
    cp ~/.TRIGGERcmdData/triggercmdagent.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl start triggercmdagent
    ;;
  "--remove")
    systemctl stop triggercmdagent
    file="/etc/systemd/system/triggercmdagent.service"
    if [ -f $file ] ; then
      rm $file
    fi
    systemctl daemon-reload
    ;;
  *)
    echo "Use --add or --remove to add or remove the triggercmdagent daemon."
    echo " --add requires the folder path to daemon.js as well."
    echo " Example:  /bin/sh ./daemon.sh /usr/share/triggercmdagent/resources/app/src"
    exit 1
    ;;
esac
