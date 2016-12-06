@echo off
set LOG=%~dp0log.txt

time /t >> %LOG%

"%~dp0node.exe" "%~dp0docky_host.js" %* 2>> %LOG%

echo %errorlevel% >> %LOG%