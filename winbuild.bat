echo Run 'gulp' to update the GUI editor before running this.

@REM sc stop triggercmdagent.exe
@REM sc delete triggercmdagent.exe
timeout /t 5
rd /s /q src\daemon
@REM copy /y c:\triggercmdDev\bkup\passthrough.js C:\triggercmdDev\github\TRIGGERcmd-Agent\node_modules\electron-compilers\lib
copy winpackage.json package.json
del src\*.cfg
del src\*.tkn
del src\*.log
npm run make
