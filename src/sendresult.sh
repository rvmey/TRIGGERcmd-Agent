#!/bin/sh
if [ $# -eq 0 ] ; then
    echo 'You need to specify the command result as a quoted sentence like this:'
    echo 'sh ~/.TRIGGERcmdData/sendresult.sh "This is the result of my command."'
    exit 1
fi

TCMD_TOKEN=$(cat ~/.TRIGGERcmdData/token.tkn)

curl -X POST https://www.triggercmd.com/api/command/result -H "Authorization: Bearer ${TCMD_TOKEN}" -H "content-type: multipart/form-data" -F computer_id=${TCMD_COMPUTER_ID} -F command_id=${TCMD_COMMAND_ID} -F result=$1 >> ~/.TRIGGERcmdData/results.log
