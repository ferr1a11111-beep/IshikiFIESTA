@echo off
chcp 65001 >nul 2>&1
title IshikiFIESTA - Preparar USB
color 0E

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║   Preparar carpeta USB para instalacion          ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

set "PROJECT_DIR=%~dp0"
set "BUILD_DIR=%PROJECT_DIR%dist\win-unpacked"
set "USB_DIR=%PROJECT_DIR%USB-IshikiFIESTA"

:: Check build exists
if not exist "%BUILD_DIR%\IshikiFIESTA.exe" (
    echo  [ERROR] No se encontro el build en dist\win-unpacked\
    echo  Ejecuta primero: npm run build
    echo.
    pause
    exit /b 1
)

:: Clean previous USB folder
if exist "%USB_DIR%" (
    echo  [*] Eliminando carpeta USB anterior...
    rmdir /s /q "%USB_DIR%"
)

echo  [1/3] Creando estructura USB...
mkdir "%USB_DIR%"
mkdir "%USB_DIR%\App"

echo  [2/3] Copiando aplicacion (~260MB, puede tardar)...
xcopy "%BUILD_DIR%\*" "%USB_DIR%\App\" /E /Y /Q >nul

:: Ensure assets dirs exist in resources
mkdir "%USB_DIR%\App\resources\assets\sounds" 2>nul
mkdir "%USB_DIR%\App\resources\assets\frames" 2>nul
mkdir "%USB_DIR%\App\resources\assets\stickers" 2>nul
mkdir "%USB_DIR%\App\resources\assets\backgrounds" 2>nul

echo  [3/3] Copiando instalador...
copy "%PROJECT_DIR%INSTALAR.bat" "%USB_DIR%\INSTALAR.bat" >nul

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║   CARPETA USB LISTA!                             ║
echo  ║                                                  ║
echo  ║   Ubicacion: USB-IshikiFIESTA\                   ║
echo  ║                                                  ║
echo  ║   Estructura:                                    ║
echo  ║     USB-IshikiFIESTA\                            ║
echo  ║       INSTALAR.bat    (ejecutar en el totem)     ║
echo  ║       App\            (archivos de la app)       ║
echo  ║         IshikiFIESTA.exe                         ║
echo  ║         resources\                               ║
echo  ║                                                  ║
echo  ║   Copia TODO el contenido de USB-IshikiFIESTA    ║
echo  ║   a la raiz de tu pen drive.                     ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: Show size
for /f "tokens=3" %%A in ('dir "%USB_DIR%" /s /-c ^| findstr "archivos"') do set SIZE=%%A
echo  Tamano total: ~260 MB
echo.

set /p OPEN="  Deseas abrir la carpeta? (S/N): "
if /i "%OPEN%"=="S" (
    explorer "%USB_DIR%"
)

pause
