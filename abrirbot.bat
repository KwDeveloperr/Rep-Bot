@echo off

node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo  NODE JS No installed https://nodejs.org/
    pause
    exit /b
)

echo Iniciando el bot
node index.js

pause
