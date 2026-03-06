const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ThermalPrinterService {
  constructor(phrasesPath) {
    this.phrasesPath = phrasesPath;
    this.phrases = this._loadPhrases();
    this.tempDir = path.join(os.tmpdir(), 'ishiki-fiesta-thermal');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  _loadPhrases() {
    try {
      if (fs.existsSync(this.phrasesPath)) {
        return JSON.parse(fs.readFileSync(this.phrasesPath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading phrases:', e);
    }
    return { phrases: [] };
  }

  getRandomPhrase() {
    const all = this.phrases.phrases || [];
    if (all.length === 0) return { phrase: 'A bailar se ha dicho!', category: 'general' };
    const idx = Math.floor(Math.random() * all.length);
    return all[idx];
  }

  getAllPhrases() {
    return this.phrases.phrases || [];
  }

  async printPhrase(eventName, phrase, printerName = '') {
    const date = new Date().toLocaleDateString('es-AR');
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    // Build the receipt text
    const width = 32; // chars for 58mm, use 42 for 80mm
    const line = '='.repeat(width);
    const dotLine = '-'.repeat(width);

    const center = (text) => {
      const pad = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const receipt = [
      line,
      center('* * * * * * * *'),
      center(eventName.toUpperCase()),
      center('* * * * * * * *'),
      line,
      '',
      center(phrase),
      '',
      dotLine,
      center(date + ' - ' + time),
      center('IshikiFIESTA'),
      center('~ Momentos que importan ~'),
      line,
      '',
      '',
    ].join('\n');

    // Write to temp file and send to thermal printer
    const tempFile = path.join(this.tempDir, `receipt_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, receipt, 'utf-8');

    try {
      await this._printText(tempFile, printerName);
      return { success: true, message: 'Frase impresa', phrase };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setTimeout(() => {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }, 5000);
    }
  }

  _printText(filePath, printerName) {
    return new Promise((resolve, reject) => {
      let cmd;
      if (printerName) {
        cmd = `powershell -Command "Get-Content '${filePath}' | Out-Printer -Name '${printerName}'"`;
      } else {
        cmd = `powershell -Command "Get-Content '${filePath}' | Out-Printer"`;
      }
      exec(cmd, { timeout: 15000 }, (error) => {
        if (error) {
          // Fallback: notepad /p
          exec(`notepad /p "${filePath}"`, { timeout: 15000 }, (err2) => {
            if (err2) reject(new Error('No se pudo imprimir la frase'));
            else resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = ThermalPrinterService;
