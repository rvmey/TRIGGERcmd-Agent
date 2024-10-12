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

"C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /sha1 b0708fb9253fc08989517657a6c6dbb53eb43be0 /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /n "VanderMey Consulting LLC" "C:\triggercmdDev\github\TRIGGERcmd-Agent\out\make\squirrel.windows\x64\TRIGGERcmdAgent-1.0.%1 Setup.exe"
