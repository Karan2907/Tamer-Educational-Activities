@echo off
cd /d "%~dp0"

echo =========================================
echo  Tamer Educational Activities
echo  Starting Local Server...
echo =========================================
echo.

REM Run PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-local-server.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to start server.
    echo Please check the instructions in HOW_TO_RUN.html
    pause
)
