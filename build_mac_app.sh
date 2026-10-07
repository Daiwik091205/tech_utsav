#!/bin/bash
# ==============================================================================
# Enterprise Multi-Agent Document Intelligence & Redaction Engine
# macOS Application & DMG Installer Builder
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "==============================================================================="
echo "       BUILDING ENTERPRISE macOS DESKTOP APPLICATION & DMG INSTALLER           "
echo "==============================================================================="
echo ""

# 1. Verify Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ [ERROR] Node.js is required to package the macOS application."
    echo "Please install Node.js from https://nodejs.org/ or via Homebrew ('brew install node')."
    exit 1
fi

# 2. Build frontend and package macOS App
cd frontend
echo "📦 [*] Verifying frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "⚡ [*] Compiling production Vite bundle..."
npm run build

echo ""
echo "🍏 [*] Packaging standalone macOS Application (.app), DMG & ZIP..."
npx electron-builder --mac --arm64

cd "$DIR"

# 3. Organize output into dist-mac/
echo "📁 [*] Organizing output into dist-mac/..."
mkdir -p dist-mac
rm -rf dist-mac/*
cp -R frontend/release/*.dmg dist-mac/ 2>/dev/null || true
cp -R frontend/release/*.zip dist-mac/ 2>/dev/null || true
if [ -d "frontend/release/mac-arm64/Enterprise Document Intelligence.app" ]; then
    cp -R "frontend/release/mac-arm64/Enterprise Document Intelligence.app" dist-mac/
fi

echo ""
echo "==============================================================================="
echo "✅ [SUCCESS] macOS Desktop Application Built Successfully!                    "
echo "==============================================================================="
echo ""
echo "Built artifacts in dist-mac/:"
ls -lh dist-mac/
echo ""
echo "1. Native .app Bundle: dist-mac/Enterprise Document Intelligence.app"
echo "2. Apple DMG Installer: dist-mac/*.dmg (drag-and-drop to /Applications)"
echo "3. Compressed ZIP: dist-mac/*.zip (thumb-drive distribution)"
echo ""
exit 0
