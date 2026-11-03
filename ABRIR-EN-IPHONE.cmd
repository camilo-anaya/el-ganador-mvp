@echo off
setlocal
cd /d "%~dp0"
echo Preparando acceso privado de El Ganador para iPhone...
node "%~dp0VISTA-IPHONE.cjs"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar la vista. El mensaje anterior indica el motivo.
  pause
)
