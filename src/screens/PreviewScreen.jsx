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
      setPrintStatus('No disponible en dev');
      setTimeout(() => setPrintStatus(''), 3000);
      return;
    }
    setPrintStatus('Enviando...');
    try {
      const result = await window.api.printPhoto({
        imageData: image,
        printerName: config.photoPrinterName || '',
      });
      setPrintStatus(result.success ? 'Enviada!' : `Error: ${result.message}`);
    } catch (e) {
      setPrintStatus('Error al imprimir');
    }
    setTimeout(() => setPrintStatus(''), 4000);
  };

  const handleThermalPrint = async () => {
    if (!window.api) {
      setThermalStatus('No disponible en dev');
      setTimeout(() => setThermalStatus(''), 3000);
      return;
    }

    try {
      const randomPhrase = await window.api.getRandomPhrase();
      setPhrase(randomPhrase.phrase);
      setThermalStatus('Imprimiendo...');

      const result = await window.api.printPhrase({
        eventName: config.eventName,
        phrase: randomPhrase.phrase,
        printerName: config.thermalPrinterName || '',
      });
      setThermalStatus(result.success ? 'Impresa!' : `Error: ${result.message}`);
    } catch (e) {
      setThermalStatus('Error al imprimir');
    }
    setTimeout(() => setThermalStatus(''), 4000);
  };

  return (
    <div className="preview-container">
      {/* Header */}
      <div className="preview-header">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
        }}>
          <span className="text-gradient">Genial!</span>
        </h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Tu foto quedo increible
        </span>
      </div>

      {/* Image - full width centered */}
      <div className="preview-image-area">
        <div style={{ position: 'relative', animation: 'scaleIn 0.4s ease-out' }}>
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

      {/* QR code if enabled */}
      {config.enableQRShare && qrData && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 32px 8px',
          animation: 'slideUp 0.4s ease-out 0.2s both',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 16px',
            border: '1px solid var(--glass-border)',
          }}>
            <img src={qrData.qrDataUrl} alt="QR" style={{
              width: '64px', height: '64px',
              borderRadius: '6px', background: '#fff', padding: '3px',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Escanea para descargar
            </span>
          </div>
        </div>
      )}

      {/* Phrase display */}
      {phrase && !thermalStatus && (
        <div style={{
          textAlign: 'center',
          padding: '0 32px 8px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          "{phrase}"
        </div>
      )}

      {/* Bottom actions - horizontal strip */}
      <div className="preview-actions">
        {/* Print photo */}
        {config.enablePhotoPrint && (
          <button
            className="preview-action-btn touch-btn-primary"
            onClick={handlePrint}
            disabled={!!printStatus}
          >
            🖨️ {printStatus || 'Imprimir Foto'}
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
            🎫 {thermalStatus || 'Frase Divertida'}
          </button>
        )}

        <button className="preview-action-btn touch-btn-primary" onClick={onNewPhoto}>
          📸 Nueva Foto
        </button>
        <button className="preview-action-btn touch-btn-glass" onClick={onRetake}>
          🔄 Repetir
        </button>
        {config.enableGallery && (
          <button className="preview-action-btn touch-btn-glass" onClick={goToGallery}>
            🖼️ Galería
          </button>
        )}
        <button className="preview-action-btn touch-btn-ghost" onClick={goToIdle}>
          🏠 Inicio
        </button>
      </div>
    </div>
  );
}
