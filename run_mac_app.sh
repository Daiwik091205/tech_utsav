#!/bin/bash
# ==============================================================================
# Enterprise Multi-Agent Document Intelligence & Redaction Engine
# macOS Air-Gapped Desktop Application Enclave Launcher
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "==============================================================================="
echo "      ENTERPRISE MULTI-AGENT DOCUMENT INTELLIGENCE & REDACTION ENGINE          "
echo "                macOS Air-Gapped Desktop Application Enclave                   "
echo "==============================================================================="
echo ""

# 1. Detect Python 3.10+
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ [ERROR] Python is not installed or not in system PATH."
    echo "Please install Python 3.10+ via Homebrew ('brew install python') or from python.org."
    exit 1
fi

echo "✅ [OK] Python runtime detected: $($PYTHON_CMD --version)"

# 2. Setup or verify virtual environment in backend/.venv
if [ ! -d "backend/.venv" ]; then
    echo "📦 [*] Initializing isolated virtual environment in backend/.venv..."
    $PYTHON_CMD -m venv backend/.venv
fi

VENV_PYTHON="backend/.venv/bin/python"

# Verify dependencies
echo "🔍 [*] Verifying backend Python dependencies..."
if ! $VENV_PYTHON -c "import fastapi, pymupdf, presidio_analyzer, cv2, PIL" >/dev/null 2>&1; then
    echo "⬇️  [*] Installing backend dependencies from backend/requirements.txt..."
    $VENV_PYTHON -m pip install --upgrade pip
    $VENV_PYTHON -m pip install -r backend/requirements.txt
fi
echo "✅ [OK] Backend Python environment verified."

# 3. Verify Node.js & npm
if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  [NOTICE] Node.js is not found in PATH."
    echo "🚀 Launching Native Python WebView Desktop Enclave fallback..."
    $VENV_PYTHON desktop_launcher.py
    exit 0
fi

echo "✅ [OK] Node.js runtime detected: $(node --version)"

# 4. Verify frontend build
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 [*] Installing frontend npm dependencies..."
    npm install
fi

if [ ! -f "dist/index.html" ]; then
    echo "⚡ [*] Compiling production frontend bundle..."
    npm run build
fi

echo ""
echo "==============================================================================="
echo " 🔒 [ENCLAVE] Launching Air-Gapped macOS Desktop Application...               "
echo "           - Process Isolation: ACTIVE (Sandboxed Chromium)                   "
echo "           - Localhost Enclave: 127.0.0.1:8000                                "
echo "           - Hardware Redaction: PyMuPDF True Pixel Burn-in                   "
echo "           - Optical Forensics: OpenCV Contour & Vision OCR                   "
echo "==============================================================================="
echo ""

npx electron electron/main.cjs
cd "$DIR"

echo "🔒 [ENCLAVE] Desktop application session terminated cleanly."
exit 0
