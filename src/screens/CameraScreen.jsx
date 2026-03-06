import React, { useEffect, useState, useCallback } from 'react';
import useCamera from '../hooks/useCamera';
import useCountdown from '../hooks/useCountdown';
import CountdownOverlay from '../components/CountdownOverlay';

const MODE_LABELS = {
  photo: '📷 Foto',
  strip: '🎞️ Tira de Fotos',
  gif: '🎬 GIF Animado',
  boomerang: '🔄 Boomerang',
};

export default function CameraScreen({ config, mode, onCapture, onBack }) {
  const { videoRef, isReady, error, start, stop, captureFrame } = useCamera();
  const { count, isCounting, isFlashing, startCountdown, cancel } = useCountdown(config.countdownSeconds || 3);
  const [stripFrames, setStripFrames] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [multiProgress, setMultiProgress] = useState('');

  useEffect(() => {
    start();
    return () => { stop(); cancel(); };
  }, [start, stop, cancel]);

  const handleSingleCapture = useCallback(async () => {
    if (capturing || isCounting) return;
    setCapturing(true);
    await startCountdown();
    const frame = captureFrame();
    if (frame) {
      stop();
      onCapture(frame, []);
    }
    setCapturing(false);
  }, [capturing, isCounting, startCountdown, captureFrame, stop, onCapture]);

  const handleStripCapture = useCallback(async () => {
    if (capturing || isCounting) return;
    setCapturing(true);
    const totalPhotos = config.stripPhotos || 3;
    const frames = [];

    for (let i = 0; i < totalPhotos; i++) {
      setMultiProgress(`Foto ${i + 1} de ${totalPhotos}`);
      await startCountdown();
      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
        setStripFrames([...frames]);
      }
      // Brief pause between shots
      if (i < totalPhotos - 1) {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    stop();
    setMultiProgress('');
    onCapture(frames[0], frames);
    setCapturing(false);
  }, [capturing, isCounting, config.stripPhotos, startCountdown, captureFrame, stop, onCapture]);

  const handleMultiFrameCapture = useCallback(async () => {
    if (capturing || isCounting) return;
    setCapturing(true);
    const isBoomerang = mode === 'boomerang';
    const totalFrames = isBoomerang ? (config.boomerangFrames || 6) : (config.gifFrames || 8);
    const frames = [];

    setMultiProgress('Preparate...');
    await startCountdown();

    // Rapid capture
    for (let i = 0; i < totalFrames; i++) {
      setMultiProgress(`Capturando ${i + 1}/${totalFrames}`);
      const frame = captureFrame();
      if (frame) frames.push(frame);
      await new Promise(r => setTimeout(r, 150)); // ~6fps
    }

    stop();
    setMultiProgress('');
    onCapture(frames[0], frames);
    setCapturing(false);
  }, [capturing, isCounting, mode, config, startCountdown, captureFrame, stop, onCapture]);

  const handleCapture = useCallback(() => {
    if (mode === 'photo') handleSingleCapture();
    else if (mode === 'strip') handleStripCapture();
    else handleMultiFrameCapture();
  }, [mode, handleSingleCapture, handleStripCapture, handleMultiFrameCapture]);

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        autoPlay
      />

      {/* Mode label */}
      <div className="camera-mode-label">
        {MODE_LABELS[mode] || mode}
        {multiProgress && ` — ${multiProgress}`}
      </div>

      {/* Back button */}
      <button
        className="touch-btn touch-btn-glass touch-btn-sm camera-back-btn"
        onClick={() => { stop(); cancel(); onBack(); }}
      >
        ← Volver
      </button>

      {/* Strip thumbnails */}
      {mode === 'strip' && (
        <div className="camera-strip-counter">
          {Array.from({ length: config.stripPhotos || 3 }).map((_, i) => (
            <div key={i}>
              {stripFrames[i] ? (
                <img src={stripFrames[i]} className="camera-strip-thumb" alt="" />
              ) : (
                <div className="camera-strip-thumb-empty">
                  {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Countdown */}
      <CountdownOverlay count={count} isFlashing={isFlashing} />

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)',
          gap: '24px',
          zIndex: 30,
        }}>
          <div style={{ fontSize: '4rem' }}>📷</div>
          <p style={{ fontSize: '1.3rem', maxWidth: '400px', textAlign: 'center' }}>{error}</p>
          <button className="touch-btn touch-btn-primary" onClick={start}>
            Reintentar
          </button>
          <button className="touch-btn touch-btn-ghost" onClick={onBack}>
            ← Volver
          </button>
        </div>
      )}

      {/* Capture button */}
      {isReady && !isCounting && !capturing && (
        <div className="camera-overlay">
          <button
            className="camera-capture-btn"
            onClick={handleCapture}
            aria-label="Capturar"
          />
        </div>
      )}
    </div>
  );
}
