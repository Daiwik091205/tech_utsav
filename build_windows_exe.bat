@echo off
setlocal enabledelayedexpansion

title Build Enterprise Document Intelligence Windows Executables
color 0A

echo ===============================================================================
echo     BUILDING ENTERPRISE WINDOWS EXECUTABLES & NSIS INSTALLER (.EXE)            
echo ===============================================================================
echo.

:: Check Node.js & npm
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is required to build Windows executables.
    echo Please install Node.js (LTS) from https://nodejs.org/
    pause
    exit /b 1
)

:: Step 1: Install frontend dependencies if needed
cd frontend
if not exist "node_modules" (
    echo [*] Installing npm dependencies...
    call npm install
)

:: Step 2: Build frontend distribution
echo [*] Compiling production React Vite bundle...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

:: Step 3: Package Windows Executables using electron-builder
echo.
echo [*] Packaging standalone Windows Executable & NSIS Installer...
echo     Target 1: NSIS Windows Installer (.exe) with Desktop Shortcut
echo     Target 2: Portable Zero-Install Single Executable (.exe)
echo.

call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] electron-builder failed to package Windows executables.
    pause
    exit /b 1
)

cd ..

:: Step 4: Organize output into dist-windows/
if not exist "dist-windows" mkdir dist-windows
xcopy /Y /Q "frontend\release\*.exe" "dist-windows\" >nul 2>&1
xcopy /Y /Q "frontend\release\*.zip" "dist-windows\" >nul 2>&1
if exist "frontend\release\win-unpacked" (
    if not exist "dist-windows\Enterprise-Document-Intelligence-Windows-x64" mkdir "dist-windows\Enterprise-Document-Intelligence-Windows-x64"
    xcopy /Y /Q /E "frontend\release\win-unpacked\*" "dist-windows\Enterprise-Document-Intelligence-Windows-x64\" >nul 2>&1
)

echo.
echo ===============================================================================
echo [SUCCESS] Windows Executables Generated Successfully!
echo ===============================================================================
echo.
echo Built artifacts available in dist-windows/ and frontend\release\:
dir /B "dist-windows\*.exe"
echo.
echo 1. NSIS Installer: Double-click to install with start menu and desktop shortcuts.
echo 2. Portable EXE: Single standalone file that runs anywhere without installation.
echo.
pause
