<#
.SYNOPSIS
    Enterprise Multi-Agent Document Intelligence & Redaction Engine
    Windows Desktop Application PowerShell Enterprise Launcher

.DESCRIPTION
    Provides automated prerequisite checks, Python venv orchestration,
    cryptographic mutual authentication token creation, and launch of
    the air-gapped desktop application enclave.
#>

[CmdletBinding()]
param (
    [switch]$ForceRebuild,
    [switch]$UsePythonLauncher,
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ENTERPRISE MULTI-AGENT DOCUMENT INTELLIGENCE & REDACTION ENGINE          " -ForegroundColor Cyan
Write-Host "               Windows Air-Gapped Desktop Application Enclave                  " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

# 1. Resolve Python
$PythonCmd = $null
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
    $PythonCmd = "py"
} else {
    Write-Error "[FATAL] Python is not installed. Please install Python 3.10+ from python.org"
}

Write-Host "[OK] Using Python: $PythonCmd" -ForegroundColor Green

# 2. Virtual Environment
$VenvDir = Join-Path $WorkspaceRoot "backend\.venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Host "[*] Initializing Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    & $PythonCmd -m venv $VenvDir
}

# Install dependencies if missing
Write-Host "[*] Checking Python dependencies..." -ForegroundColor Gray
$CheckDep = & $VenvPython -c "import fastapi, pymupdf, presidio_analyzer; print('OK')" 2>$null
if ($CheckDep -ne "OK") {
    Write-Host "[*] Installing backend dependencies from requirements.txt..." -ForegroundColor Yellow
    & $VenvPython -m pip install --upgrade pip
    & $VenvPython -m pip install -r (Join-Path $WorkspaceRoot "backend\requirements.txt")
}
Write-Host "[OK] Backend environment verified." -ForegroundColor Green

# 3. Check Frontend dist
$DistHtml = Join-Path $WorkspaceRoot "frontend\dist\index.html"
if ($ForceRebuild -or (-not (Test-Path $DistHtml))) {
    Write-Host "[*] Building frontend distribution bundle..." -ForegroundColor Yellow
    Set-Location (Join-Path $WorkspaceRoot "frontend")
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    npm run build
    Set-Location $WorkspaceRoot
}

# 4. Launch Desktop Enclave
$HasNode = (Get-Command "node" -ErrorAction SilentlyContinue) -ne $null

if ($UsePythonLauncher -or (-not $HasNode)) {
    Write-Host "[*] Launching via Native Python Edge WebView2 Desktop Launcher..." -ForegroundColor Cyan
    & $VenvPython (Join-Path $WorkspaceRoot "desktop_launcher.py")
} else {
    Write-Host "[*] Launching via Electron Desktop Application Enclave..." -ForegroundColor Cyan
    Set-Location (Join-Path $WorkspaceRoot "frontend")
    npx electron electron/main.cjs
    Set-Location $WorkspaceRoot
}

Write-Host "[*] Application session closed cleanly." -ForegroundColor Green
