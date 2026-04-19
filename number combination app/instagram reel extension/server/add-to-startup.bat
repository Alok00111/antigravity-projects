@echo off
:: This script adds the server to Windows startup
:: Run this once as Administrator

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SERVER_PATH=%~dp0start-server.bat"
set "SHORTCUT=%STARTUP_FOLDER%\Instagram Reel Server.lnk"

:: Create VBS script to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%SHORTCUT%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%SERVER_PATH%" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%~dp0" >> CreateShortcut.vbs
echo oLink.WindowStyle = 7 >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

cscript CreateShortcut.vbs
del CreateShortcut.vbs

echo.
echo ========================================
echo   Server added to Windows Startup!
echo ========================================
echo.
echo The server will now start automatically when Windows boots.
echo Shortcut created at: %SHORTCUT%
echo.
pause
