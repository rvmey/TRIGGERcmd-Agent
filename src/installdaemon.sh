#!/bin/sh

if ! (command -v node > /dev/null) ; then {
  if command -v apt-get > /dev/null; then
    apt-get install -y nodejs
  fi
  if command -v yum > /dev/null; then
    yum -y install nodejs
  fi
  if command -v zypper > /dev/null; then
    zypper install nodejs4
  fi
  if command -v pacman > /dev/null; then
    pacman -S nodejs
  fi
}
fi 

find /usr/*/triggercmdagent -type d -name "src" | grep /app/src | while read dname; do
  /usr/bin/env node $dname/agent.js --daemoninstall
  /bin/sh $dname/daemonmgr.sh --add $HOME/.TRIGGERcmdData
done;

systemctl enable triggercmdagent
systemctl status triggercmdagent
