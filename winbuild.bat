echo Run 'gulp' to update the GUI editor before running this.

sc stop triggercmdagent.exe
sc delete triggercmdagent.exe
timeout /t 5
rd /s /q C:\triggercmdDev\github\TRIGGERcmd-Agent\src\daemon
copy /y c:\triggercmdDev\CodeSigningCert.pfx .
copy /y c:\triggercmdDev\bkup\passthrough.js C:\triggercmdDev\github\TRIGGERcmd-Agent\node_modules\electron-compilers\lib
cd C:\triggercmdDev\github\TRIGGERcmd-Agent
copy winpackage.json package.json
del src\*.cfg
del src\*.tkn
del src\*.log
electron-forge make
