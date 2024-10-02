@echo off
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo NODE JS no está instalado. Descárgalo en: https://nodejs.org/
    pause
    exit /b
)

echo Inicializando proyecto con npm init...
npm init -y

echo Instalando discord.js...
npm install discord.js

echo Instalando dependencias...
npm install

echo Todo listo.
pause
