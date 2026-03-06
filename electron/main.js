const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Services
const PrinterService = require('./services/printer');
const ThermalPrinterService = require('./services/thermalPrinter');
const StorageService = require('./services/storage');
const ShareServer = require('./services/shareServer');

let mainWindow;
let printerService;
let thermalPrinterService;
let storageService;
let shareServer;

const isDev = !app.isPackaged;
// In production, portable exe extracts to a temp dir. We use the exe's directory for user data.
const EXE_DIR = isDev ? path.join(__dirname, '..') : path.dirname(app.getPath('exe'));
const GALLERY_DIR = path.join(EXE_DIR, 'IshikiFIESTA_Data', 'gallery');
const CONFIG_DIR = path.join(EXE_DIR, 'IshikiFIESTA_Data', 'config');
const ASSETS_DIR = isDev
  ? path.join(__dirname, '..', 'assets')
  : path.join(process.resourcesPath, 'assets');
const DATA_DIR = isDev
  ? path.join(__dirname, 'data')
  : path.join(process.resourcesPath, 'data');

// Ensure directories exist
[GALLERY_DIR, CONFIG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Config management
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  const defaults = {
    eventName: 'Mi Fiesta',
    eventDate: new Date().toISOString().split('T')[0],
    language: 'es',
    enablePhotoPrint: true,
    enableThermalPrint: true,
    enableQRShare: true,
    enableGIF: true,
    enableBoomerang: true,
    enableStrip: true,
    enableStickers: true,
    enableFrames: true,
    enableFilters: true,
    enableSounds: true,
    enableGallery: true,
    idleTimeout: 30,
    countdownSeconds: 3,
    stripPhotos: 3,
    gifFrames: 8,
    boomerangFrames: 6,
    thermalPrinterName: '',
    photoPrinterName: '',
    theme: 'fiesta',
    customPhrases: [],
    idleWallpaper: '',
  };
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...defaults, ...saved };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return defaults;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: isDev ? 1920 : width,
    height: isDev ? 1080 : height,
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-react', 'index.html'));
  }

  // Prevent navigation away
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
}

function setupIPC() {
  // Config
  ipcMain.handle('config:load', () => loadConfig());
  ipcMain.handle('config:save', (_, config) => {
    saveConfig(config);
    return { success: true };
  });

  // Storage
  ipcMain.handle('storage:savePhoto', async (_, { imageData, eventName, mode }) => {
    return storageService.savePhoto(imageData, eventName, mode);
  });
  ipcMain.handle('storage:getPhotos', async (_, eventName) => {
    return storageService.getPhotos(eventName);
  });
  ipcMain.handle('storage:getPhotoPath', async (_, filename) => {
    return storageService.getPhotoPath(filename);
  });
  ipcMain.handle('storage:deletePhoto', async (_, filename) => {
    return storageService.deletePhoto(filename);
  });
  ipcMain.handle('storage:getStats', async (_, eventName) => {
    return storageService.getStats(eventName);
  });

  // Printing
  ipcMain.handle('printer:printPhoto', async (_, { imageData, printerName }) => {
    return printerService.printPhoto(imageData, printerName);
  });
  ipcMain.handle('printer:listPrinters', async () => {
    return printerService.listPrinters();
  });

  // Thermal printer
  ipcMain.handle('thermal:printPhrase', async (_, { eventName, phrase, printerName }) => {
    return thermalPrinterService.printPhrase(eventName, phrase, printerName);
  });
  ipcMain.handle('thermal:getRandomPhrase', async () => {
    return thermalPrinterService.getRandomPhrase();
  });
  ipcMain.handle('thermal:getPhrases', async () => {
    return thermalPrinterService.getAllPhrases();
  });

  // Share server
  ipcMain.handle('share:getQRData', async (_, photoFilename) => {
    return shareServer.getQRData(photoFilename);
  });
  ipcMain.handle('share:getServerInfo', async () => {
    return shareServer.getServerInfo();
  });

  // App control
  ipcMain.handle('app:toggleFullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  ipcMain.handle('app:quit', () => {
    if (shareServer) shareServer.stop();
    app.quit();
  });
  ipcMain.handle('app:getAssetsPath', () => ASSETS_DIR);
  ipcMain.handle('app:getGalleryPath', () => GALLERY_DIR);
}

app.whenReady().then(() => {
  // Initialize services
  storageService = new StorageService(GALLERY_DIR);
  printerService = new PrinterService();
  thermalPrinterService = new ThermalPrinterService(
    path.join(DATA_DIR, 'phrases.json')
  );
  shareServer = new ShareServer(GALLERY_DIR, 8080);
  shareServer.start();

  setupIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  if (shareServer) shareServer.stop();
  app.quit();
});
