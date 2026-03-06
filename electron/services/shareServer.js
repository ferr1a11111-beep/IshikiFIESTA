const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

class ShareServer {
  constructor(galleryDir, port = 8080) {
    this.galleryDir = galleryDir;
    this.port = port;
    this.server = null;
    this.app = express();
    this._setupRoutes();
  }

  _getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  _setupRoutes() {
    // Serve gallery files
    this.app.use('/gallery', express.static(this.galleryDir));

    // Download page for a specific photo
    this.app.get('/photo/:event/:filename', (req, res) => {
      const { event, filename } = req.params;
      const filePath = path.join(this.galleryDir, decodeURIComponent(event), filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Foto no encontrada');
      }

      const photoUrl = `/gallery/${encodeURIComponent(event)}/${filename}`;
      res.send(this._downloadPage(photoUrl, filename));
    });

    // Simple gallery page
    this.app.get('/', (req, res) => {
      res.send(this._galleryPage());
    });
  }

  _downloadPage(photoUrl, filename) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IshikiFIESTA - Tu Foto</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #fff; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center;
    padding: 20px;
  }
  h1 { font-size: 1.5rem; margin: 20px 0; text-align: center; }
  h1 span { background: linear-gradient(90deg, #f7971e, #ffd200);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  img {
    max-width: 90%; max-height: 60vh; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5); margin: 20px 0;
  }
  a.btn {
    display: inline-block; padding: 16px 40px; font-size: 1.2rem;
    background: linear-gradient(135deg, #f7971e, #ffd200);
    color: #000; text-decoration: none; border-radius: 50px;
    font-weight: bold; margin-top: 20px;
    box-shadow: 0 4px 15px rgba(247,151,30,0.4);
  }
</style>
</head>
<body>
  <h1><span>IshikiFIESTA</span></h1>
  <img src="${photoUrl}" alt="Tu foto">
  <a class="btn" href="${photoUrl}" download="${filename}">Descargar Foto</a>
</body>
</html>`;
  }

  _galleryPage() {
    let photos = [];
    try {
      const dirs = fs.readdirSync(this.galleryDir, { withFileTypes: true })
        .filter(d => d.isDirectory());
      for (const dir of dirs) {
        const files = fs.readdirSync(path.join(this.galleryDir, dir.name))
          .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
        files.forEach(f => {
          photos.push({
            url: `/gallery/${encodeURIComponent(dir.name)}/${f}`,
            name: f,
            event: dir.name,
          });
        });
      }
    } catch (e) {}

    const grid = photos.map(p =>
      `<a href="/photo/${encodeURIComponent(p.event)}/${p.name}">
        <img src="${p.url}" loading="lazy" alt="${p.name}">
      </a>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IshikiFIESTA - Galeria</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #fff; min-height: 100vh; padding: 20px;
  }
  h1 { text-align: center; margin: 20px 0; font-size: 1.8rem; }
  h1 span { background: linear-gradient(90deg, #f7971e, #ffd200);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px; padding: 10px;
  }
  .grid a { display: block; }
  .grid img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 8px; transition: transform 0.2s;
  }
  .grid img:hover { transform: scale(1.05); }
  .empty { text-align: center; margin-top: 40px; opacity: 0.6; font-size: 1.2rem; }
</style>
</head>
<body>
  <h1><span>IshikiFIESTA</span> - Galeria</h1>
  ${photos.length > 0 ? `<div class="grid">${grid}</div>` : '<p class="empty">Aun no hay fotos. Sacate una!</p>'}
</body>
</html>`;
  }

  async getQRData(photoFilename) {
    const ip = this._getLocalIP();
    // Find which event directory the photo belongs to
    let eventDir = 'default';
    try {
      const dirs = fs.readdirSync(this.galleryDir, { withFileTypes: true })
        .filter(d => d.isDirectory());
      for (const dir of dirs) {
        const files = fs.readdirSync(path.join(this.galleryDir, dir.name));
        if (files.includes(photoFilename)) {
          eventDir = dir.name;
          break;
        }
      }
    } catch (e) {}

    const url = `http://${ip}:${this.port}/photo/${encodeURIComponent(eventDir)}/${photoFilename}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return { url, qrDataUrl, ip, port: this.port };
  }

  getServerInfo() {
    const ip = this._getLocalIP();
    return {
      ip,
      port: this.port,
      url: `http://${ip}:${this.port}`,
      running: this.server !== null,
    };
  }

  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`Share server running on http://${this._getLocalIP()}:${this.port}`);
        resolve();
      });
      this.server.on('error', (err) => {
        console.error('Share server error:', err);
        // Try next port
        this.port++;
        this.start().then(resolve);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = ShareServer;
