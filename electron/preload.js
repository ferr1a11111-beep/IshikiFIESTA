const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Config
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  // Storage
  savePhoto: (data) => ipcRenderer.invoke('storage:savePhoto', data),
  getPhotos: (eventName) => ipcRenderer.invoke('storage:getPhotos', eventName),
  getPhotoPath: (filename) => ipcRenderer.invoke('storage:getPhotoPath', filename),
  deletePhoto: (filename) => ipcRenderer.invoke('storage:deletePhoto', filename),
  getStats: (eventName) => ipcRenderer.invoke('storage:getStats', eventName),

  // Printing
  printPhoto: (data) => ipcRenderer.invoke('printer:printPhoto', data),
  listPrinters: () => ipcRenderer.invoke('printer:listPrinters'),

  // Thermal printer
  printPhrase: (data) => ipcRenderer.invoke('thermal:printPhrase', data),
  getRandomPhrase: () => ipcRenderer.invoke('thermal:getRandomPhrase'),
  getPhrases: () => ipcRenderer.invoke('thermal:getPhrases'),

  // Share
  getQRData: (photoFilename) => ipcRenderer.invoke('share:getQRData', photoFilename),
  getServerInfo: () => ipcRenderer.invoke('share:getServerInfo'),

  // App
  toggleFullscreen: () => ipcRenderer.invoke('app:toggleFullscreen'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  getAssetsPath: () => ipcRenderer.invoke('app:getAssetsPath'),
  getGalleryPath: () => ipcRenderer.invoke('app:getGalleryPath'),
});
