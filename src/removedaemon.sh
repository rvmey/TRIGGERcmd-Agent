#!/bin/sh

find /usr/share/triggercmdagent -type d -name "src" | grep /app/src | while read dname; do
  /bin/sh $dname/daemonmgr.sh --remove
done;
