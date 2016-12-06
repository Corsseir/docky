@echo off
call :isAdmin

if %errorlevel% == 0 (
    goto :run
) else (
    echo Error: Run as administrator.
    pause
)

exit /b

:isAdmin
fsutil dirty query %systemdrive% >nul
exit /b

:run

reg add HKLM\SOFTWARE\Mozilla\NativeMessagingHosts\docky_host /f /ve /t REG_SZ /d %~dp0docky_host.json
