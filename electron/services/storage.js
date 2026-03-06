const fs = require('fs');
const path = require('path');

class StorageService {
  constructor(galleryDir) {
    this.galleryDir = galleryDir;
  }

  _eventDir(eventName) {
    const safe = (eventName || 'default').replace(/[^a-zA-Z0-9_\- áéíóúñÁÉÍÓÚÑ]/g, '_');
    const dir = path.join(this.galleryDir, safe);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async savePhoto(imageDataUrl, eventName = 'default', mode = 'photo') {
    const dir = this._eventDir(eventName);
    const timestamp = Date.now();
    const ext = mode === 'gif' ? 'gif' : 'png';
    const filename = `${mode}_${timestamp}.${ext}`;
    const filepath = path.join(dir, filename);

    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));

    return {
      success: true,
      filename,
      filepath,
      url: `/gallery/${encodeURIComponent(path.basename(dir))}/${filename}`,
    };
  }

  async getPhotos(eventName = 'default') {
    const dir = this._eventDir(eventName);
    try {
      const files = fs.readdirSync(dir)
        .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
        .sort((a, b) => {
          const ta = fs.statSync(path.join(dir, a)).mtimeMs;
          const tb = fs.statSync(path.join(dir, b)).mtimeMs;
          return tb - ta; // newest first
        });
      return files.map(f => ({
        filename: f,
        url: `/gallery/${encodeURIComponent(path.basename(dir))}/${f}`,
        path: path.join(dir, f),
        mode: f.split('_')[0],
        timestamp: fs.statSync(path.join(dir, f)).mtimeMs,
      }));
    } catch (e) {
      return [];
    }
  }

  async getPhotoPath(filename) {
    // Search in all event directories
    const dirs = fs.readdirSync(this.galleryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const dir of dirs) {
      const fp = path.join(this.galleryDir, dir, filename);
      if (fs.existsSync(fp)) return fp;
    }
    return null;
  }

  async deletePhoto(filename) {
    const fp = await this.getPhotoPath(filename);
    if (fp) {
      fs.unlinkSync(fp);
      return { success: true };
    }
    return { success: false, message: 'Archivo no encontrado' };
  }

  async getStats(eventName = 'default') {
    const photos = await this.getPhotos(eventName);
    const modes = {};
    photos.forEach(p => {
      modes[p.mode] = (modes[p.mode] || 0) + 1;
    });
    return {
      total: photos.length,
      modes,
      firstPhoto: photos.length > 0 ? photos[photos.length - 1].timestamp : null,
      lastPhoto: photos.length > 0 ? photos[0].timestamp : null,
    };
  }
}

module.exports = StorageService;
