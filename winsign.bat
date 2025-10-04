cd out\make\squirrel.windows\x64
for %%f in (*.exe) do (
    ren "%%f" "TRIGGERcmdAgentSetup.exe"
)

@REM "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /sha1 b0708fb9253fc08989517657a6c6dbb53eb43be0 /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /n "VanderMey Consulting LLC" "C:\triggercmdDev\github\TRIGGERcmd-Agent\out\make\squirrel.windows\x64\TRIGGERcmdAgent-1.0.%1 Setup.exe"
@REM "D:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /sha1 b0708fb9253fc08989517657a6c6dbb53eb43be0 /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /n "VanderMey Consulting LLC" ".\TRIGGERcmdAgentSetup.exe"
"C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe" sign /sha1 4514d960dbb0b24571b642c38cfa439b67e7c738 /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /n "VanderMey Consulting LLC" ".\TRIGGERcmdAgentSetup.exe"

start .
