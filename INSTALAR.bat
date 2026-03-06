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
set "SOURCE_DIR=%~dp0App"
set "DATA_DIR=C:\IshikiFIESTA\IshikiFIESTA_Data"

:: Verify source exists
if not exist "%SOURCE_DIR%\IshikiFIESTA.exe" (
    echo  [ERROR] No se encontro la carpeta "App" con IshikiFIESTA.exe
    echo.
    echo  La estructura del pen debe ser:
    echo    INSTALAR.bat
    echo    App\IshikiFIESTA.exe
    echo    App\resources\
    echo.
    pause
    exit /b 1
)

echo  Origen:  %SOURCE_DIR%
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
echo        Esto puede tardar unos minutos...

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

xcopy "%SOURCE_DIR%\*" "%INSTALL_DIR%\" /E /Y /Q >nul 2>&1
if %errorLevel% neq 0 (
    echo  [ERROR] Fallo al copiar archivos. Verifica espacio en disco.
    pause
    exit /b 1
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
:: STEP 3: Create Desktop shortcut
:: ========================================
echo  [3/4] Creando acceso directo en el escritorio...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\IshikiFIESTA.lnk'); $sc.TargetPath = 'C:\IshikiFIESTA\IshikiFIESTA.exe'; $sc.WorkingDirectory = 'C:\IshikiFIESTA'; $sc.Description = 'IshikiFIESTA - Photo Booth'; $sc.Save()"

:: Verify shortcut was created
powershell -NoProfile -Command "if (Test-Path ([Environment]::GetFolderPath('Desktop') + '\IshikiFIESTA.lnk')) { exit 0 } else { exit 1 }"
if %errorLevel% equ 0 (
    echo  [OK] Acceso directo creado en el escritorio.
) else (
    echo  [!] No se pudo crear acceso directo. Crealo manualmente.
)

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
echo   Ubicacion: C:\IshikiFIESTA
echo   Datos:     C:\IshikiFIESTA\IshikiFIESTA_Data
echo   Acceso:    Escritorio - IshikiFIESTA
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
echo  Listo! Ya podes retirar el pen drive.
echo.
pause
exit /b 0
