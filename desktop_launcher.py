"""
Enterprise Multi-Agent Document Intelligence & Redaction Engine
Native Windows Desktop Application Launcher (Edge WebView2 / pywebview)
"""

import os
import sys
import time
import secrets
import threading
import urllib.request
import subprocess
from pathlib import Path

# Set up paths
WORKSPACE_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = WORKSPACE_ROOT / "backend"
FRONTEND_DIST = WORKSPACE_ROOT / "frontend" / "dist"

# Add backend to Python path
sys.path.insert(0, str(BACKEND_DIR))

# Generate 256-bit cryptographically secure enclave session token
ENCLAVE_TOKEN = secrets.token_hex(32)
os.environ["DOCUMENT_ENGINE_SECRET_TOKEN"] = ENCLAVE_TOKEN
os.environ["PYTHONUNBUFFERED"] = "1"

PORT = int(os.environ.get("PORT", 8000))
HOST = "127.0.0.1"
BASE_URL = f"http://{HOST}:{PORT}"

backend_server = None
stop_event = threading.Event()


def start_uvicorn_backend():
    """Runs FastAPI backend in a background worker thread."""
    global backend_server
    import uvicorn
    from app.main import app

    config = uvicorn.Config(
        app=app,
        host=HOST,
        port=PORT,
        log_level="warning",
        access_log=False
    )
    backend_server = uvicorn.Server(config)
    backend_server.run()


def wait_for_backend(timeout: float = 20.0):
    """Waits until the backend health endpoint responds with 200 OK."""
    start_time = time.time()
    url = f"{BASE_URL}/api/health"
    req = urllib.request.Request(url, headers={"x-session-token": ENCLAVE_TOKEN})

    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(req, timeout=1.0) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def shutdown_backend():
    """Triggers graceful backend shutdown."""
    if backend_server:
        backend_server.should_exit = True
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/shutdown",
            headers={"x-session-token": ENCLAVE_TOKEN},
            data=b"",
            method="POST"
        )
        urllib.request.urlopen(req, timeout=1.0)
    except Exception:
        pass


def launch_native_window():
    """Launches native Windows desktop window via Microsoft Edge WebView2 (pywebview)."""
    try:
        import webview
    except ImportError:
        print("[*] Installing pywebview for native Microsoft Edge WebView2 desktop window...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pywebview"], check=False)
        try:
            import webview
        except ImportError:
            print("[!] pywebview installation not completed; launching isolated application window mode...")
            launch_app_window_fallback()
            return

    # Check if frontend dist exists
    app_url = f"{BASE_URL}/?session_token={ENCLAVE_TOKEN}"
    icon_path = str(WORKSPACE_ROOT / "frontend" / "public" / "icon.ico")
    if not os.path.exists(icon_path):
        icon_path = None

    print(f"[Enclave Desktop] Launching Native Windows Window (Edge WebView2)...")
    window = webview.create_window(
        title="Enterprise Multi-Agent Document Intelligence (Air-Gapped Enclave)",
        url=app_url,
        width=1480,
        height=920,
        min_size=(1080, 700),
        background_color="#070b14",
        text_select=True,
        zoomable=True
    )

    # When window closes, shutdown backend
    window.events.closed += shutdown_backend

    # Start desktop webview (forces Edge Chromium engine on Windows, disables caching)
    webview.start(
        gui="edgechromium" if sys.platform == "win32" else None,
        private_mode=True,
        debug=False
    )


def launch_app_window_fallback():
    """Fallback launcher using native Windows Edge/Chrome --app mode if pywebview is unavailable."""
    app_url = f"{BASE_URL}/?session_token={ENCLAVE_TOKEN}"

    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]

    edge_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            edge_exe = p
            break

    if edge_exe:
        print(f"[Enclave Desktop] Spawning dedicated Microsoft Edge Enclave Window...")
        proc = subprocess.Popen([
            edge_exe,
            f"--app={app_url}",
            "--new-window",
            "--inprivate",
            "--window-size=1480,920"
        ])
        proc.wait()
    else:
        import webbrowser
        webbrowser.open(app_url)


def main():
    print("=" * 75)
    print("  ENTERPRISE MULTI-AGENT DOCUMENT INTELLIGENCE & REDACTION ENGINE")
    print("         Native Windows Desktop Application Enclave Launcher      ")
    print("=" * 75)
    print(f"[*] Ephemeral Enclave Token: {ENCLAVE_TOKEN[:8]}... (Mutually Authenticated)")

    # 1. Start backend server in daemon thread
    server_thread = threading.Thread(target=start_uvicorn_backend, daemon=True)
    server_thread.start()

    # 2. Wait for healthy response
    print("[*] Initializing local air-gapped agent pipeline...")
    if not wait_for_backend(20.0):
        print("[!] Backend failed to report healthy in 20s. Exiting.")
        sys.exit(1)

    print(f"[OK] Backend active on {BASE_URL}")

    # 3. Launch desktop window
    try:
        launch_native_window()
    finally:
        shutdown_backend()
        print("[*] Enclave session closed cleanly.")


if __name__ == "__main__":
    main()
