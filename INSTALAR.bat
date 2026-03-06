@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title IshikiFIESTA - Instalador
color 0B

echo.
echo  ========================================================
echo.
echo        IshikiFIESTA v3.0 - INSTALADOR
echo        Photo Booth Profesional
echo.
echo  ========================================================
echo.

:: Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  [!] Se requieren permisos de Administrador.
    echo  [!] Click derecho en INSTALAR.bat - Ejecutar como administrador
    echo.
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\IshikiFIESTA"
set "SOURCE_DIR=%~dp0"
set "DATA_DIR=C:\IshikiFIESTA\IshikiFIESTA_Data"

:: Check what source we have: App folder (USB) or portable exe (download)
set "MODE=none"
if exist "%SOURCE_DIR%App\IshikiFIESTA.exe" set "MODE=folder"
if exist "%SOURCE_DIR%IshikiFIESTA.exe" if "%MODE%"=="none" set "MODE=exe"

if "%MODE%"=="none" (
    echo  [ERROR] No se encontro IshikiFIESTA.exe
    echo.
    echo  Asegurate de tener en la misma carpeta:
    echo    INSTALAR.bat
    echo    IshikiFIESTA.exe
    echo.
    echo  Descarga desde:
    echo  github.com/ferr1a11111-beep/IshikiFIESTA/releases
    echo.
    pause
    exit /b 1
)

if "%MODE%"=="folder" (
    echo  Modo: Instalacion desde carpeta App
    echo  Origen:  %SOURCE_DIR%App
) else (
    echo  Modo: Instalacion desde ejecutable portable
    echo  Origen:  %SOURCE_DIR%IshikiFIESTA.exe
)
echo  Destino: %INSTALL_DIR%
echo.

:: Check if already installed
if not exist "%INSTALL_DIR%\IshikiFIESTA.exe" goto :DO_INSTALL

echo  [!] IshikiFIESTA ya esta instalado en %INSTALL_DIR%
echo.
set /p "OVERWRITE=  Deseas reinstalar? (S/N): "
if /i not "!OVERWRITE!"=="S" (
    echo  Instalacion cancelada.
    pause
    exit /b 0
)
echo.
echo  [*] Reinstalando (se preservan datos del evento)...

:DO_INSTALL

:: ========================================
:: STEP 1: Copy application files
:: ========================================
echo.
echo  [1/4] Copiando archivos de la aplicacion...

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

if "%MODE%"=="folder" (
    echo        Copiando carpeta App... puede tardar unos minutos...
    xcopy "%SOURCE_DIR%App\*" "%INSTALL_DIR%\" /E /Y /Q >nul 2>&1
    if %errorLevel% neq 0 (
        echo  [ERROR] Fallo al copiar archivos. Verifica espacio en disco.
        pause
        exit /b 1
    )
) else (
    echo        Copiando ejecutable portable...
    copy /Y "%SOURCE_DIR%IshikiFIESTA.exe" "%INSTALL_DIR%\IshikiFIESTA.exe" >nul 2>&1
    if %errorLevel% neq 0 (
        echo  [ERROR] Fallo al copiar. Verifica espacio en disco.
        pause
        exit /b 1
    )
)

:: Copy GUIA-RAPIDA if exists
if exist "%SOURCE_DIR%GUIA-RAPIDA.txt" (
    copy /Y "%SOURCE_DIR%GUIA-RAPIDA.txt" "%INSTALL_DIR%\GUIA-RAPIDA.txt" >nul 2>&1
)

echo  [OK] Archivos copiados a %INSTALL_DIR%

:: ========================================
:: STEP 2: Create data directories
:: ========================================
echo  [2/4] Creando directorios de datos...

if not exist "%DATA_DIR%\gallery" mkdir "%DATA_DIR%\gallery"
if not exist "%DATA_DIR%\config" mkdir "%DATA_DIR%\config"

echo  [OK] Directorios creados en %DATA_DIR%

:: ========================================
:: STEP 3: Create Desktop shortcuts
:: ========================================
echo  [3/4] Creando accesos directos en el escritorio...

:: App shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\IshikiFIESTA.lnk'); $sc.TargetPath = 'C:\IshikiFIESTA\IshikiFIESTA.exe'; $sc.WorkingDirectory = 'C:\IshikiFIESTA'; $sc.Description = 'IshikiFIESTA - Photo Booth'; $sc.Save()"

:: Gallery folder shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\IshikiFIESTA - Fotos.lnk'); $sc.TargetPath = 'C:\IshikiFIESTA\IshikiFIESTA_Data\gallery'; $sc.IconLocation = 'imageres.dll,3'; $sc.Description = 'Carpeta de fotos IshikiFIESTA'; $sc.Save()"

echo  [OK] Accesos directos creados (App + Carpeta de Fotos)

:: ========================================
:: STEP 4: Auto-start with Windows
:: ========================================
echo  [4/4] Configuracion de inicio automatico...
echo.
set /p "AUTOSTART=  Deseas que inicie automaticamente con Windows? (S/N): "
if /i not "!AUTOSTART!"=="S" goto :SKIP_AUTOSTART

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Startup') + '\IshikiFIESTA.lnk'); $sc.TargetPath = 'C:\IshikiFIESTA\IshikiFIESTA.exe'; $sc.WorkingDirectory = 'C:\IshikiFIESTA'; $sc.Description = 'IshikiFIESTA Auto Start'; $sc.Save()"

echo  [OK] IshikiFIESTA se iniciara con Windows.
goto :INSTALL_DONE

:SKIP_AUTOSTART
echo  [OK] Inicio automatico desactivado.

:INSTALL_DONE

:: ========================================
:: DONE
:: ========================================
echo.
echo  ========================================================
echo.
echo   INSTALACION COMPLETADA!
echo.
echo   App:     C:\IshikiFIESTA\IshikiFIESTA.exe
echo   Fotos:   C:\IshikiFIESTA\IshikiFIESTA_Data\gallery
echo   Config:  C:\IshikiFIESTA\IshikiFIESTA_Data\config
echo.
echo   Accesos en Escritorio:
echo   - IshikiFIESTA (ejecutar la app)
echo   - IshikiFIESTA - Fotos (ver fotos del evento)
echo.
echo  ========================================================
echo.
echo  CONFIGURACION DEL EVENTO:
echo  - Abrir IshikiFIESTA
echo  - Tocar 5 veces rapido la esquina SUPERIOR DERECHA
echo  - Se abre el Panel de Administracion
echo  - Configurar: nombre del evento, impresoras, funciones
echo.

set /p "LAUNCH=  Deseas iniciar IshikiFIESTA ahora? (S/N): "
if /i "!LAUNCH!"=="S" (
    echo  [*] Iniciando IshikiFIESTA...
    start "" "C:\IshikiFIESTA\IshikiFIESTA.exe"
)

echo.
echo  Listo!
echo.
pause
exit /b 0
