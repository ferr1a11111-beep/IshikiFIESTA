import React, { useState, useEffect } from 'react';

export default function PreviewScreen({
  config, image, mode, savedInfo, onSavedInfo,
  onNewPhoto, onRetake, goToGallery, goToIdle,
}) {
  const [qrData, setQrData] = useState(null);
  const [printStatus, setPrintStatus] = useState('');
  const [thermalStatus, setThermalStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [phrase, setPhrase] = useState(null);

  // Auto-save photo on mount
  useEffect(() => {
    if (savedInfo || saving) return;
    const save = async () => {
      setSaving(true);
      try {
        if (window.api) {
          const result = await window.api.savePhoto({
            imageData: image,
            eventName: config.eventName,
            mode,
          });
          onSavedInfo(result);

          // Generate QR if enabled
          if (config.enableQRShare) {
            const qr = await window.api.getQRData(result.filename);
            setQrData(qr);
          }
        } else {
          // Dev mode - simulate save
          onSavedInfo({ filename: `test_${Date.now()}.png`, success: true });
        }
      } catch (e) {
        console.error('Save error:', e);
      }
      setSaving(false);
    };
    save();
  }, [image, config, mode, savedInfo, saving, onSavedInfo]);

  const handlePrint = async () => {
    if (!window.api) {
      setPrintStatus('Impresion no disponible en modo desarrollo');
      setTimeout(() => setPrintStatus(''), 3000);
      return;
    }
    setPrintStatus('Enviando a imprimir...');
    try {
      const result = await window.api.printPhoto({
        imageData: image,
        printerName: config.photoPrinterName || '',
      });
      setPrintStatus(result.success ? 'Foto enviada a imprimir!' : `Error: ${result.message}`);
    } catch (e) {
      setPrintStatus('Error al imprimir');
    }
    setTimeout(() => setPrintStatus(''), 4000);
  };

  const handleThermalPrint = async () => {
    if (!window.api) {
      setThermalStatus('No disponible en modo desarrollo');
      setTimeout(() => setThermalStatus(''), 3000);
      return;
    }

    try {
      const randomPhrase = await window.api.getRandomPhrase();
      setPhrase(randomPhrase.phrase);
      setThermalStatus('Imprimiendo frase...');

      const result = await window.api.printPhrase({
        eventName: config.eventName,
        phrase: randomPhrase.phrase,
        printerName: config.thermalPrinterName || '',
      });
      setThermalStatus(result.success ? 'Frase impresa!' : `Error: ${result.message}`);
    } catch (e) {
      setThermalStatus('Error al imprimir frase');
    }
    setTimeout(() => setThermalStatus(''), 4000);
  };

  return (
    <div className="preview-container">
      {/* Image */}
      <div className="preview-image-area">
        <div style={{ animation: 'scaleIn 0.4s ease-out' }}>
          <img src={image} alt="Tu foto" />
          {saving && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--glass)',
              padding: '8px 20px',
              borderRadius: '50px',
              fontSize: '0.9rem',
              backdropFilter: 'blur(8px)',
            }}>
              Guardando...
            </div>
          )}
        </div>
      </div>

      {/* Actions sidebar */}
      <div className="preview-actions">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          <span className="text-gradient">Genial!</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tu foto quedo increible. Que queres hacer?
        </p>

        {/* Print photo */}
        {config.enablePhotoPrint && (
          <button
            className="preview-action-btn touch-btn-primary"
            onClick={handlePrint}
            disabled={!!printStatus}
          >
            <span className="preview-action-icon">🖨️</span>
            <div>
              <div>{printStatus || 'Imprimir Foto'}</div>
              {!printStatus && (
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>
                  Impresora a color
                </div>
              )}
            </div>
          </button>
        )}

        {/* Thermal print */}
        {config.enableThermalPrint && (
          <button
            className="preview-action-btn"
            onClick={handleThermalPrint}
            disabled={!!thermalStatus}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
            }}
          >
            <span className="preview-action-icon">🎫</span>
            <div>
              <div>{thermalStatus || 'Frase Divertida'}</div>
              {phrase && !thermalStatus && (
                <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.8, marginTop: '4px' }}>
                  "{phrase}"
                </div>
              )}
              {!thermalStatus && !phrase && (
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>
                  Imprime una frase random
                </div>
              )}
            </div>
          </button>
        )}

        {/* QR Share */}
        {config.enableQRShare && qrData && (
          <div className="qr-container" style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
            <img src={qrData.qrDataUrl} alt="QR" className="qr-image" />
            <div className="qr-label">
              Escanea para descargar al celular
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="touch-btn touch-btn-primary w-full" onClick={onNewPhoto}>
            📸 Nueva Foto
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="touch-btn touch-btn-glass touch-btn-sm" onClick={onRetake} style={{ flex: 1 }}>
              🔄 Repetir
            </button>
            {config.enableGallery && (
              <button className="touch-btn touch-btn-glass touch-btn-sm" onClick={goToGallery} style={{ flex: 1 }}>
                🖼️ Galeria
              </button>
            )}
          </div>
          <button className="touch-btn touch-btn-ghost touch-btn-sm w-full" onClick={goToIdle}>
            🏠 Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
