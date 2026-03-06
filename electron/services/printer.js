const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class PrinterService {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'ishiki-fiesta-print');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    this.queue = [];
    this.printing = false;
  }

  async printPhoto(imageDataUrl, printerName = '') {
    // Convert base64 data URL to buffer
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const tempFile = path.join(this.tempDir, `photo_${Date.now()}.png`);
    fs.writeFileSync(tempFile, buffer);

    try {
      await this._printWindows(tempFile, printerName);
      return { success: true, message: 'Foto enviada a imprimir' };
    } catch (error) {
      console.error('Print error:', error);
      return { success: false, message: error.message };
    } finally {
      setTimeout(() => {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }, 15000);
    }
  }

  _printWindows(filePath, printerName) {
    return new Promise((resolve, reject) => {
      let cmd;
      if (printerName) {
        cmd = `rundll32 shimgvw.dll,ImageView_PrintTo "${filePath}" "${printerName}"`;
      } else {
        // Use PowerShell to print to default printer
        const psScript = `
          Add-Type -AssemblyName System.Drawing
          $img = [System.Drawing.Image]::FromFile('${filePath.replace(/'/g, "''")}')
          $doc = New-Object System.Drawing.Printing.PrintDocument
          $doc.PrintPage.Add({
            param($sender, $e)
            $destRect = $e.MarginBounds
            $srcRect = New-Object System.Drawing.Rectangle(0, 0, $img.Width, $img.Height)
            $e.Graphics.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
          })
          $doc.Print()
          $img.Dispose()
        `.replace(/\n/g, ' ');
        cmd = `powershell -Command "${psScript}"`;
      }

      exec(cmd, { timeout: 30000 }, (error) => {
        if (error) {
          // Fallback: Start-Process -Verb Print
          const fallback = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
          exec(fallback, { timeout: 30000 }, (err2) => {
            if (err2) reject(new Error('No se pudo imprimir la foto'));
            else resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  async listPrinters() {
    return new Promise((resolve) => {
      const cmd = 'powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, Type | ConvertTo-Json"';
      exec(cmd, (err, stdout) => {
        if (err) {
          // Fallback to wmic
          exec('wmic printer get Name,Default /format:csv', (err2, stdout2) => {
            if (err2) return resolve([]);
            const lines = stdout2.split('\n').filter(l => l.trim() && !l.startsWith('Node'));
            const printers = lines.map(l => {
              const parts = l.split(',');
              return { name: (parts[2] || '').trim(), isDefault: (parts[1] || '').trim() === 'TRUE' };
            }).filter(p => p.name);
            resolve(printers);
          });
          return;
        }
        try {
          const data = JSON.parse(stdout);
          const list = Array.isArray(data) ? data : [data];
          resolve(list.map(p => ({
            name: p.Name,
            status: p.PrinterStatus === 0 ? 'ready' : 'busy',
            type: p.Type
          })));
        } catch (e) {
          resolve([]);
        }
      });
    });
  }
}

module.exports = PrinterService;
