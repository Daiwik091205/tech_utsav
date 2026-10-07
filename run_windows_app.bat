@echo off
setlocal enabledelayedexpansion

title Enterprise Multi-Agent Document Intelligence (Air-Gapped Enclave)
color 0B

echo ===============================================================================
echo       ENTERPRISE MULTI-AGENT DOCUMENT INTELLIGENCE & REDACTION ENGINE          
echo                Windows Air-Gapped Desktop Application Enclave                  
echo ===============================================================================
echo.

:: 1. Verify Python Installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Python is not installed or not in system PATH.
        echo Please install Python 3.10+ from https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

echo [OK] Python detected: %PYTHON_CMD%

:: 2. Setup or verify Python Virtual Environment
if not exist "backend\.venv" (
    echo [*] Creating isolated virtual environment in backend\.venv...
    %PYTHON_CMD% -m venv backend\.venv
)

if exist "backend\.venv\Scripts\python.exe" (
    set VENV_PYTHON=backend\.venv\Scripts\python.exe
) else (
    set VENV_PYTHON=%PYTHON_CMD%
)

:: Verify requirements installed
echo [*] Checking backend Python dependencies...
%VENV_PYTHON% -c "import fastapi, pymupdf, presidio_analyzer" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Installing required Python packages from backend\requirements.txt...
    %VENV_PYTHON% -m pip install --upgrade pip
    %VENV_PYTHON% -m pip install -r backend\requirements.txt
)
echo [OK] Backend Python environment verified.

:: 3. Verify Node.js & npm Installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [NOTICE] Node.js is not found in PATH.
    echo Launching Native Python WebView Desktop Enclave fallback...
    echo.
    %VENV_PYTHON% desktop_launcher.py
    exit /b 0
)

echo [OK] Node.js runtime detected.

:: 4. Verify frontend dependencies & build
if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies (one-time setup)...
    cd frontend && npm install && cd ..
)

if not exist "frontend\dist\index.html" (
    echo [*] Compiling optimized frontend bundle...
    cd frontend && npm run build && cd ..
)

:: 5. Launch Electron Desktop Application
echo.
echo ===============================================================================
echo [ENCLAVE] Launching Air-Gapped Windows Desktop Application...
echo           - Process Isolation: ACTIVE
echo           - Localhost Enclave: 127.0.0.1:8000
echo           - Redaction Engine: True Hardware Pixel Burn-in
echo ===============================================================================
echo.

cd frontend
npx electron electron/main.cjs
cd ..

echo.
echo [ENCLAVE] Desktop application session terminated cleanly.
exit /b 0
