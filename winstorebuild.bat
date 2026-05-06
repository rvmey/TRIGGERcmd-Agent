echo Run 'gulp' to update the GUI editor before running this.

set NODE_ENV=production
set TRIGGERCMD_BUILD_MSIX=1
set TRIGGERCMD_MSIX_WINDOWS_KIT_VERSION=10.0.26100.0
set "TRIGGERCMD_MSIX_WINDOWS_KIT_PATH=C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64"
set "TRIGGERCMD_MSIX_ASSETS_PATH=src\assets\msix"
set "TRIGGERCMD_MSIX_ICON_SOURCE=icons\icon512.png"

set "TRIGGERCMD_MSIX_PUBLISHER=CN=CD2194E5-5FB6-41DA-BDCE-33BCC7844394"
set "TRIGGERCMD_MSIX_PUBLISHER_DISPLAY_NAME=RVMey"
set "TRIGGERCMD_MSIX_PACKAGE_DISPLAY_NAME=TRIGGERcmd Agent"
set "TRIGGERCMD_MSIX_APP_DISPLAY_NAME=TRIGGERcmd Agent"
if "%TRIGGERCMD_MSIX_PUBLISHER%"=="" (
  echo Missing TRIGGERCMD_MSIX_PUBLISHER.
  exit /b 1
)

set "TRIGGERCMD_MSIX_IDENTITY=27652RVMey.TRIGGERcmdAgent"
if "%TRIGGERCMD_MSIX_IDENTITY%"=="" (
  echo Missing TRIGGERCMD_MSIX_IDENTITY.
  exit /b 1
)

if not exist "%TRIGGERCMD_MSIX_ICON_SOURCE%" (
  echo Missing TRIGGERCMD_MSIX_ICON_SOURCE: %TRIGGERCMD_MSIX_ICON_SOURCE%
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File src\assets\msix\generate-assets.ps1 -SourcePath "%TRIGGERCMD_MSIX_ICON_SOURCE%" -OutputPath "%TRIGGERCMD_MSIX_ASSETS_PATH%"
if errorlevel 1 exit /b 1

@REM sc stop triggercmdagent.exe
@REM sc delete triggercmdagent.exe
timeout /t 1 /nobreak >nul
if exist out\make rd /s /q out\make
if exist src\daemon rd /s /q src\daemon
@REM copy /y c:\triggercmdDev\bkup\passthrough.js C:\triggercmdDev\github\TRIGGERcmd-Agent\node_modules\electron-compilers\lib
copy winpackage.json package.json
if exist src\*.cfg del /q src\*.cfg
if exist src\*.tkn del /q src\*.tkn
if exist src\*.log del /q src\*.log
npx electron-forge make --targets @electron-forge/maker-msix