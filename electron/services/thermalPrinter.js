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

    // Build receipt lines - keep short for thermal printers (58mm = ~32 chars, 80mm = ~48 chars)
    const lines = [
      '========================',
      '  * * * * * * * * *',
      '',
      eventName.toUpperCase(),
      '',
      '  * * * * * * * * *',
      '========================',
      '',
      phrase,
      '',
      '------------------------',
      date + ' - ' + time,
      'IshikiFIESTA',
      '~ Momentos que importan ~',
      '========================',
      '',
      '',
    ];

    const receiptText = lines.join('\n');

    // Write to temp file
    const tempFile = path.join(this.tempDir, `receipt_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, receiptText, 'utf-8');

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
      const escapedPath = filePath.replace(/'/g, "''");
      const escapedPrinter = printerName ? printerName.replace(/'/g, "''") : '';

      // PowerShell script using PrintDocument with small font, word-wrap via RectangleF,
      // and minimal margins for thermal printers (58mm or 80mm)
      const psScript = `
Add-Type -AssemblyName System.Drawing
$lines = [System.IO.File]::ReadAllLines('${escapedPath}', [System.Text.Encoding]::UTF8)
$lineIndex = 0
$pd = New-Object System.Drawing.Printing.PrintDocument
${escapedPrinter ? `$pd.PrinterSettings.PrinterName = '${escapedPrinter}'` : ''}
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(2, 2, 5, 5)
$font = New-Object System.Drawing.Font('Consolas', 8, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::Black
$sf = New-Object System.Drawing.StringFormat
$sf.Trimming = [System.Drawing.StringTrimming]::Word
$pd.add_PrintPage({
  param($sender, $e)
  $y = [float]$e.MarginBounds.Top
  $maxW = [float]$e.MarginBounds.Width
  $maxBottom = [float]$e.MarginBounds.Bottom
  while ($script:lineIndex -lt $lines.Count) {
    $line = $lines[$script:lineIndex]
    if ([string]::IsNullOrEmpty($line)) { $line = ' ' }
    $rect = New-Object System.Drawing.RectangleF($e.MarginBounds.Left, $y, $maxW, 200)
    $sz = $e.Graphics.MeasureString($line, $font, [int]$maxW, $sf)
    if ($y + $sz.Height -gt $maxBottom) {
      $e.HasMorePages = $true
      return
    }
    $e.Graphics.DrawString($line, $font, $brush, $rect, $sf)
    $y += $sz.Height
    $script:lineIndex++
  }
  $e.HasMorePages = $false
})
$pd.Print()
$font.Dispose()
$sf.Dispose()
$pd.Dispose()
`;

      const tempPs = path.join(this.tempDir, `print_${Date.now()}.ps1`);
      fs.writeFileSync(tempPs, psScript, 'utf-8');

      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs}"`;
      exec(cmd, { timeout: 20000 }, (error) => {
        // Clean up ps1
        setTimeout(() => {
          try { fs.unlinkSync(tempPs); } catch (e) {}
        }, 3000);

        if (error) {
          console.error('PrintDocument failed, trying Out-Printer fallback:', error.message);
          // Fallback: Out-Printer (may have margin issues but at least prints)
          let fallbackCmd;
          if (escapedPrinter) {
            fallbackCmd = `powershell -NoProfile -Command "Get-Content '${escapedPath}' | Out-Printer -Name '${escapedPrinter}'"`;
          } else {
            fallbackCmd = `powershell -NoProfile -Command "Get-Content '${escapedPath}' | Out-Printer"`;
          }
          exec(fallbackCmd, { timeout: 15000 }, (err2) => {
            if (err2) {
              // Last resort: notepad /p
              exec(`notepad /p "${filePath}"`, { timeout: 15000 }, (err3) => {
                if (err3) reject(new Error('No se pudo imprimir la frase'));
                else resolve();
              });
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = ThermalPrinterService;
