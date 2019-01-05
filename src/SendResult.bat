if "%~1"=="" goto noparams
goto yesparams

:noparams
echo "You need to specify the command result as a quoted sentence like this:"
echo SendResults.sh "This is the result of my command."
goto end

:yesparams
set /p TCMD_TOKEN=<%USERPROFILE%\.TRIGGERcmdData\token.tkn
curl -X POST https://www.triggercmd.com/api/command/result -H "Authorization: Bearer %TCMD_TOKEN%" -H "content-type: multipart/form-data" -F computer_id=%TCMD_COMPUTER_ID% -F command_id=%TCMD_COMMAND_ID% -F result=%1 >> %USERPROFILE%\.TRIGGERcmdData\results.log

:end