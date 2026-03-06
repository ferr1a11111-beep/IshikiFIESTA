import React, { useState, useEffect } from 'react';

export default function GalleryScreen({ config, onBack }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [printStatus, setPrintStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (window.api) {
          const list = await window.api.getPhotos(config.eventName);
          setPhotos(list);
        } else {
          setPhotos([]);
        }
      } catch (e) {
        console.error('Gallery load error:', e);
      }
      setLoading(false);
    };
    load();
  }, [config.eventName]);

  const openPhoto = async (photo) => {
    setSelectedPhoto(photo);
    setQrData(null);
    if (window.api && config.enableQRShare) {
      try {
        const qr = await window.api.getQRData(photo.filename);
        setQrData(qr);
      } catch (e) {}
    }
  };

  const handlePrint = async () => {
    if (!selectedPhoto || !window.api) return;
    setPrintStatus('Enviando...');
    try {
      // Read the file as data URL for printing
      const photoPath = selectedPhoto.path;
      // We need the image data - read from the gallery URL
      const result = await window.api.printPhoto({
        imageData: selectedPhoto.url, // This won't work directly, need path
        printerName: config.photoPrinterName || '',
      });
      setPrintStatus(result.success ? 'Enviada!' : 'Error');
    } catch (e) {
      setPrintStatus('Error');
    }
    setTimeout(() => setPrintStatus(''), 3000);
  };

  return (
    <div className="gallery-container">
      {/* Header */}
      <div className="gallery-header">
        <h2 className="gallery-title">
          <span className="text-gradient">Galeria</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '12px' }}>
            {photos.length} fotos
          </span>
        </h2>
        <button className="touch-btn touch-btn-glass touch-btn-sm" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="gallery-empty">
          <div className="loading-spinner" />
          <p>Cargando fotos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">📷</div>
          <p>Aun no hay fotos en este evento</p>
          <p style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>
            Sacate la primera!
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <div
              key={photo.filename}
              className="gallery-item"
              onClick={() => openPhoto(photo)}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <img
                src={window.api ? `file://${photo.path}` : photo.url}
                alt={photo.filename}
                loading="lazy"
              />
              {/* Mode badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'var(--glass)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
              }}>
                {photo.mode === 'gif' ? '🎬' : photo.mode === 'strip' ? '🎞️' : photo.mode === 'boomerang' ? '🔄' : '📷'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div className="gallery-modal" onClick={() => setSelectedPhoto(null)}>
          <img
            src={window.api ? `file://${selectedPhoto.path}` : selectedPhoto.url}
            alt={selectedPhoto.filename}
            onClick={(e) => e.stopPropagation()}
          />

          {/* QR */}
          {qrData && (
            <div
              style={{
                position: 'absolute',
                right: '32px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="qr-container">
                <img src={qrData.qrDataUrl} alt="QR" className="qr-image" />
                <div className="qr-label">Escanea para descargar</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="gallery-modal-actions" onClick={(e) => e.stopPropagation()}>
            {config.enablePhotoPrint && (
              <button className="touch-btn touch-btn-primary" onClick={handlePrint}>
                {printStatus || '🖨️ Imprimir'}
              </button>
            )}
            <button className="touch-btn touch-btn-glass" onClick={() => setSelectedPhoto(null)}>
              ✕ Cerrar
            </button>
          </div>

          {/* Close button */}
          <button
            className="touch-btn touch-btn-glass touch-btn-icon gallery-modal-close"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
