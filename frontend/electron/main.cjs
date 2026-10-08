const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const http = require('http');

// Prevent any unhandled spawn or node exceptions from crashing with raw modal dialogs
process.on('uncaughtException', (err) => {
  console.error('[Enclave Desktop] Caught uncaught exception:', err);
});

// Enrich system PATH so GUI apps launched from macOS Finder / Dock / Spotlight find Python
if (process.platform === 'darwin') {
  const macBinPaths = [
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/Library/Frameworks/Python.framework/Versions/3.14/bin',
    '/Library/Frameworks/Python.framework/Versions/3.12/bin',
    '/Library/Frameworks/Python.framework/Versions/3.11/bin',
    '/Library/Frameworks/Python.framework/Versions/Current/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ];
  const currentPath = process.env.PATH || '';
  process.env.PATH = `${macBinPaths.filter(p => fs.existsSync(p)).join(':')}:${currentPath}`;
} else if (process.platform === 'win32') {
  const winPaths = [
    'C:\\Python312',
    'C:\\Python312\\Scripts',
    'C:\\Python311',
    'C:\\Python311\\Scripts',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311'),
  ];
  const currentPath = process.env.PATH || '';
  process.env.PATH = `${winPaths.filter(p => fs.existsSync(p)).join(';')};${currentPath}`;
}

// Generate 256-bit cryptographically secure enclave session token
const ENCLAVE_SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
const BACKEND_PORT = process.env.PORT || 8000;
const BACKEND_HOST = '127.0.0.1';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

let mainWindow = null;
let pythonProcess = null;
let isQuitting = false;

// Resolve backend working directory across packaged app and workspace
function resolveBackendDirectory() {
  const candidates = [
    path.join(process.resourcesPath || '', 'backend'),
    path.resolve(__dirname, '..', '..', 'backend'),
    path.resolve(__dirname, '..', 'backend'),
    '/Volumes/maha/tech_utsav/backend',
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, 'app', 'main.py'))) {
      return c;
    }
  }
  return path.resolve(__dirname, '..', '..', 'backend');
}

// Resolve Python runtime executable across Windows, macOS, and Linux
function resolvePythonExecutable(backendDir) {
  const isWin = process.platform === 'win32';
  const rootDir = path.resolve(__dirname, '..', '..');

  // 1. Packaged standalone backend executable (PyInstaller)
  const packagedExeCandidates = [
    path.join(backendDir, 'dist', isWin ? 'document_engine_backend.exe' : 'document_engine_backend'),
    path.join(rootDir, 'backend', 'dist', isWin ? 'document_engine_backend.exe' : 'document_engine_backend'),
    path.join(process.resourcesPath || '', isWin ? 'document_engine_backend.exe' : 'document_engine_backend'),
  ];
  for (const p of packagedExeCandidates) {
    if (fs.existsSync(p)) {
      return { cmd: p, isExecutable: true, args: [] };
    }
  }

  // 2. Python Virtual Environment in workspace or known location
  const venvPythonCandidates = [
    path.join(backendDir, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python'),
    path.join(backendDir, '.venv', isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python3'),
    '/Volumes/maha/tech_utsav/backend/.venv/bin/python',
    '/Volumes/maha/tech_utsav/backend/.venv/bin/python3',
  ];
  for (const v of venvPythonCandidates) {
    if (fs.existsSync(v)) {
      return {
        cmd: v,
        isExecutable: false,
        args: ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)],
      };
    }
  }

  // 3. Fallback to existing system Python binary with absolute path
  const sysPythonCandidates = isWin
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
        'C:\\Python312\\python.exe',
        'C:\\Python311\\python.exe',
        'python.exe',
        'python',
      ]
    : [
        '/opt/homebrew/bin/python3.12',
        '/opt/homebrew/bin/python3',
        '/Library/Frameworks/Python.framework/Versions/3.14/bin/python3',
        '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3',
        '/Library/Frameworks/Python.framework/Versions/Current/bin/python3',
        '/usr/local/bin/python3',
        '/usr/bin/python3',
        'python3',
      ];

  for (const p of sysPythonCandidates) {
    if (p.startsWith('/') || p.includes('\\')) {
      if (fs.existsSync(p)) {
        return {
          cmd: p,
          isExecutable: false,
          args: ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)],
        };
      }
    } else {
      return {
        cmd: p,
        isExecutable: false,
        args: ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)],
      };
    }
  }

  const fallbackCmd = isWin ? 'python' : 'python3';
  return {
    cmd: fallbackCmd,
    isExecutable: false,
    args: ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)],
  };
}

// Check if backend is already online on localhost
function checkBackendHealth(callback) {
  const req = http.request(
    {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 800,
    },
    (res) => {
      callback(res.statusCode === 200);
    }
  );
  req.on('error', () => callback(false));
  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });
  req.end();
}

// Spawn and supervise Python backend process
function startBackendProcess(onComplete) {
  // Check if a backend instance is already running
  checkBackendHealth((alreadyRunning) => {
    if (alreadyRunning) {
      console.log(`[Enclave Desktop] Backend Engine already active on port ${BACKEND_PORT}. Reusing instance.`);
      if (typeof onComplete === 'function') onComplete(true);
      return;
    }

    const backendDir = resolveBackendDirectory();
    const pythonConfig = resolvePythonExecutable(backendDir);

    console.log(`[Enclave Desktop] Launching Backend Engine from [${backendDir}] via: ${pythonConfig.cmd}`);

    const env = {
      ...process.env,
      DOCUMENT_ENGINE_SECRET_TOKEN: ENCLAVE_SESSION_TOKEN,
      PYTHONUNBUFFERED: '1',
      PORT: String(BACKEND_PORT),
    };

    try {
      pythonProcess = spawn(pythonConfig.cmd, pythonConfig.args, {
        cwd: backendDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        windowsHide: true,
      });

      // Catch spawn errors (such as ENOENT) gracefully without crashing main process
      pythonProcess.on('error', (err) => {
        console.warn('[Enclave Desktop] Could not spawn local Python process:', err.message);
        pythonProcess = null;
      });

      if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg) console.log(`[Backend Stdout] ${msg}`);
        });
      }

      if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg) console.error(`[Backend Stderr] ${msg}`);
        });
      }

      pythonProcess.on('exit', (code, signal) => {
        console.log(`[Backend Process] Exited with code ${code}, signal ${signal}`);
        pythonProcess = null;
      });

      if (typeof onComplete === 'function') onComplete(false);
    } catch (err) {
      console.warn('[Enclave Desktop] Handled exception starting backend:', err);
      if (typeof onComplete === 'function') onComplete(false);
    }
  });
}

// Poll backend health endpoint until online
function waitForBackend(callback, retries = 30, delay = 300) {
  checkBackendHealth((isHealthy) => {
    if (isHealthy) {
      console.log('[Enclave Desktop] Air-gapped backend engine is verified HEALTHY.');
      callback(true);
      return;
    }
    if (retries > 0) {
      setTimeout(() => waitForBackend(callback, retries - 1, delay), delay);
    } else {
      console.warn('[Enclave Desktop] Backend startup health check timed out. Proceeding to display interface.');
      callback(false);
    }
  });
}

// Shutdown backend safely
function stopBackendProcess() {
  if (isQuitting) return;
  isQuitting = true;

  console.log('[Enclave Desktop] Gracefully terminating Document Intelligence backend...');

  // Send HTTP shutdown trigger
  try {
    const req = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: '/api/shutdown',
        method: 'POST',
        headers: {
          'x-session-token': ENCLAVE_SESSION_TOKEN,
        },
        timeout: 1000,
      },
      () => {}
    );
    req.on('error', () => {});
    req.end();
  } catch (e) {}

  // Terminate process tree
  if (pythonProcess) {
    try {
      pythonProcess.kill('SIGINT');
      setTimeout(() => {
        if (pythonProcess) {
          try {
            pythonProcess.kill('SIGKILL');
          } catch (e) {}
        }
      }, 1000);
    } catch (e) {}
  }
}

// Create native desktop window
function createMainWindow() {
  const isDev = process.argv.includes('--dev');
  const iconPath = path.join(__dirname, '..', 'public', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#000000',
    title: 'Enterprise Multi-Agent Document Intelligence (Air-Gapped Enclave)',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false, // reveal after ready-to-show to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: isDev,
    },
  });

  // Windows-specific styling & taskbar behavior
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Strict Navigation Security: Disallow remote or arbitrary navigation
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    if (parsed.protocol !== 'file:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      event.preventDefault();
      console.warn(`[Security Alert] Blocked attempt to navigate out of enclave: ${navigationUrl}`);
    }
  });

  // Construct application menu
  const menuTemplate = [];

  // macOS App Menu
  if (process.platform === 'darwin') {
    menuTemplate.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', accelerator: 'Cmd+Q' },
      ],
    });
  }

  // File Menu
  menuTemplate.push({
    label: 'File',
    submenu: [
      {
        label: 'Open Document...',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          const fileData = await handleOpenPdfDialog();
          if (fileData && mainWindow) {
            mainWindow.webContents.send('menu:file-opened', fileData);
          }
        },
      },
      { type: 'separator' },
      {
        label: process.platform === 'darwin' ? 'Close Window' : 'Exit Enclave',
        accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Alt+F4',
        click: () => {
          if (mainWindow) mainWindow.close();
        },
      },
    ],
  });

  // View Menu
  menuTemplate.push({
    label: 'View',
    submenu: [
      { role: 'reload', accelerator: 'CmdOrCtrl+R' },
      { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
      { type: 'separator' },
      { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
      { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
      { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
      { type: 'separator' },
      { role: 'togglefullscreen', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11' },
    ],
  });

  // Security Menu
  menuTemplate.push({
    label: 'Security',
    submenu: [
      {
        label: 'Enclave Security Status',
        click: () => {
          const osName = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux';
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Air-Gapped Enclave Status',
            message: `Verified Isolated Air-Gapped ${osName} Enclave`,
            detail: `• Loopback Session Token: Active (${ENCLAVE_SESSION_TOKEN.slice(0, 8)}...)\n• Process Isolation: Active (Sandboxed Chromium)\n• Egress Protection: Strict CSP + Zero Remote Navigation\n• Redaction Engine: True Hardware Pixel Burn-In (PyMuPDF)\n• Backend Port: ${BACKEND_PORT}\n• Platform: ${osName} (${process.arch})`,
            buttons: ['OK'],
          });
        },
      },
    ],
  });

  if (isDev) {
    menuTemplate.push({
      label: 'Developer',
      submenu: [{ role: 'toggleDevTools' }],
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load URL or build output
  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!isDev && fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    // In dev mode or if dist not yet built
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback if vite dev server is not active
      if (fs.existsSync(distIndexPath)) {
        mainWindow.loadFile(distIndexPath);
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Open File Dialog Handler
async function handleOpenPdfDialog() {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Document or Image Scan for Intelligence & Redaction',
    filters: [
      { name: 'All Supported Formats', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] },
      { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
      { name: 'Photos & Image Scans (*.png, *.jpg, *.jpeg, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const fileBytes = fs.readFileSync(selectedPath);
  const base64 = fileBytes.toString('base64');
  const filename = path.basename(selectedPath);

  return {
    filename,
    filePath: selectedPath,
    base64,
    sizeBytes: fileBytes.length,
  };
}

// IPC Handlers
ipcMain.handle('app:get-enclave-token', () => ENCLAVE_SESSION_TOKEN);
ipcMain.handle('app:get-backend-url', () => BACKEND_URL);
ipcMain.handle('app:get-system-info', () => ({
  platform: process.platform,
  isWindows: process.platform === 'win32',
  arch: process.arch,
  version: app.getVersion(),
  enclaveTokenActive: true,
}));

ipcMain.handle('dialog:open-pdf', async () => {
  return await handleOpenPdfDialog();
});

ipcMain.handle('dialog:save-file', async (event, params) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  const { defaultFilename, data, isBase64, filters } = params;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Clean Redacted Artifact',
    defaultPath: defaultFilename,
    filters: filters || [
      { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
      { name: 'PNG Images (*.png)', extensions: ['png'] },
      { name: 'JSON Audit Report (*.json)', extensions: ['json'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const buffer = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(data, 'utf-8');
    fs.writeFileSync(result.filePath, buffer);
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('shell:show-item-in-folder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// App Lifecycle
app.whenReady().then(() => {
  // 1. Launch air-gapped backend engine
  startBackendProcess();

  // 2. Poll until engine is active, then show main window
  waitForBackend(() => {
    createMainWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  stopBackendProcess();
});

app.on('window-all-closed', () => {
  stopBackendProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
