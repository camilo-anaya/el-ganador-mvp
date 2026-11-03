@echo off
setlocal
cd /d "%~dp0"
title El Ganador - inicio verificado
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR-EL-GANADOR.ps1"
if errorlevel 1 (
  echo.
  echo El Ganador no se abrio con la version actual. Revisa el error de arriba.
  pause
)
