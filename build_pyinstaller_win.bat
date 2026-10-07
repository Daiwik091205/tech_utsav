@echo off
setlocal enabledelayedexpansion

title Build Standalone Python Windows Desktop Executable
color 0B

echo ===============================================================================
echo     BUILDING STANDALONE PYTHON DESKTOP EXECUTABLE (.EXE) VIA PYINSTALLER       
echo ===============================================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Python is not installed.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

:: 2. Check Virtual Environment
if exist "backend\.venv\Scripts\python.exe" (
    set VENV_PYTHON=backend\.venv\Scripts\python.exe
) else (
    set VENV_PYTHON=%PYTHON_CMD%
)

:: 3. Ensure PyInstaller and pywebview are installed
echo [*] Checking PyInstaller and pywebview...
%VENV_PYTHON% -m pip install pyinstaller pywebview

:: 4. Ensure frontend is compiled
if not exist "frontend\dist\index.html" (
    echo [*] Building frontend bundle...
    cd frontend && npm run build && cd ..
)

:: 5. Compile desktop_launcher.py into single .exe
echo [*] Compiling desktop_launcher.py into standalone Windows executable...
%VENV_PYTHON% -m PyInstaller ^
    --name="EnterpriseDocumentIntelligence" ^
    --onedir ^
    --windowed ^
    --icon="frontend\public\icon.ico" ^
    --add-data="frontend\dist;frontend\dist" ^
    --add-data="frontend\public;frontend\public" ^
    --add-data="backend\samples;backend\samples" ^
    --add-data="backend\app;app" ^
    --hidden-import="uvicorn" ^
    --hidden-import="fastapi" ^
    --hidden-import="pymupdf" ^
    --hidden-import="presidio_analyzer" ^
    --hidden-import="spacy" ^
    --hidden-import="webview" ^
    --noconfirm ^
    desktop_launcher.py

echo.
echo ===============================================================================
echo [SUCCESS] Standalone Executable created in: dist\EnterpriseDocumentIntelligence\
echo ===============================================================================
echo Double-click dist\EnterpriseDocumentIntelligence\EnterpriseDocumentIntelligence.exe
pause
