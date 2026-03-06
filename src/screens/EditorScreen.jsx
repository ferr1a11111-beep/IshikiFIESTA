import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filters, filterList, applyFilterToImage, generateFilterThumbnail } from '../effects/filters';

const STICKERS = [
  { id: 'hat_party', emoji: '🎩' },
  { id: 'glasses', emoji: '🕶️' },
  { id: 'mustache', emoji: '🥸' },
  { id: 'crown', emoji: '👑' },
  { id: 'lips', emoji: '💋' },
  { id: 'star', emoji: '⭐' },
  { id: 'heart', emoji: '❤️' },
  { id: 'fire', emoji: '🔥' },
  { id: 'sparkle', emoji: '✨' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'party', emoji: '🎉' },
  { id: 'balloon', emoji: '🎈' },
  { id: 'music', emoji: '🎵' },
  { id: 'cool', emoji: '😎' },
  { id: 'kiss', emoji: '😘' },
  { id: 'laugh', emoji: '😂' },
  { id: 'devil', emoji: '😈' },
  { id: 'angel', emoji: '😇' },
  { id: 'ghost', emoji: '👻' },
  { id: 'alien', emoji: '👽' },
  { id: 'clown', emoji: '🤡' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'beer', emoji: '🍺' },
  { id: 'wine', emoji: '🍷' },
];

const FRAMES = [
  { id: 'none', name: 'Sin marco', color: 'transparent' },
  { id: 'white', name: 'Blanco clasico', color: '#ffffff' },
  { id: 'black', name: 'Negro elegante', color: '#1a1a1a' },
  { id: 'gold', name: 'Dorado', color: '#f7971e' },
  { id: 'pink', name: 'Rosa fiesta', color: '#ff6b9d' },
  { id: 'neon_blue', name: 'Neon azul', color: '#00d4ff' },
  { id: 'neon_green', name: 'Neon verde', color: '#39ff14' },
  { id: 'purple', name: 'Violeta', color: '#a855f7' },
];

export default function EditorScreen({ config, image, frames: capturedFrames, mode, onDone, onRetake }) {
  const [activeTab, setActiveTab] = useState('filters');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [placedStickers, setPlacedStickers] = useState([]);
  const [filterThumbs, setFilterThumbs] = useState({});
  const [filteredImage, setFilteredImage] = useState(image);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  // Drag state for stickers
  const [dragging, setDragging] = useState(null); // { index, startX, startY }

  // Generate filter thumbnails
  useEffect(() => {
    if (!image) return;
    const gen = async () => {
      const thumbs = {};
      for (const f of filterList) {
        thumbs[f.id] = await generateFilterThumbnail(image, f.id);
      }
      setFilterThumbs(thumbs);
    };
    gen();
  }, [image]);

  // Apply filter when selection changes
  useEffect(() => {
    if (!image) return;
    const apply = async () => {
      const result = await applyFilterToImage(image, selectedFilter);
      setFilteredImage(result);
    };
    apply();
  }, [image, selectedFilter]);

  // Add sticker at center
  const addSticker = (emoji) => {
    setPlacedStickers(prev => [...prev, {
      emoji,
      x: 50, // % position
      y: 50,
      size: 60, // px
      id: Date.now(),
    }]);
  };

  // Sticker touch/drag handlers
  const handleStickerStart = (e, index) => {
    e.stopPropagation();
    const touch = e.touches ? e.touches[0] : e;
    setDragging({
      index,
      offsetX: touch.clientX,
      offsetY: touch.clientY,
    });
  };

  const handleStickerMove = useCallback((e) => {
    if (dragging === null) return;
    const touch = e.touches ? e.touches[0] : e;
    const preview = previewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();

    setPlacedStickers(prev => {
      const copy = [...prev];
      const dx = touch.clientX - dragging.offsetX;
      const dy = touch.clientY - dragging.offsetY;
      copy[dragging.index] = {
        ...copy[dragging.index],
        x: copy[dragging.index].x + (dx / rect.width) * 100,
        y: copy[dragging.index].y + (dy / rect.height) * 100,
      };
      return copy;
    });
    setDragging(prev => ({ ...prev, offsetX: touch.clientX, offsetY: touch.clientY }));
  }, [dragging]);

  const handleStickerEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleStickerMove);
    window.addEventListener('mouseup', handleStickerEnd);
    window.addEventListener('touchmove', handleStickerMove, { passive: false });
    window.addEventListener('touchend', handleStickerEnd);
    return () => {
      window.removeEventListener('mousemove', handleStickerMove);
      window.removeEventListener('mouseup', handleStickerEnd);
      window.removeEventListener('touchmove', handleStickerMove);
      window.removeEventListener('touchend', handleStickerEnd);
    };
  }, [handleStickerMove, handleStickerEnd]);

  const removeSticker = (index) => {
    setPlacedStickers(prev => prev.filter((_, i) => i !== index));
  };

  // Compose final image with filter + frame + stickers
  const composeFinal = useCallback(async () => {
    setProcessing(true);
    try {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = filteredImage;
      });

      const canvas = document.createElement('canvas');
      const frameWidth = selectedFrame !== 'none' ? 40 : 0;
      canvas.width = img.width + frameWidth * 2;
      canvas.height = img.height + frameWidth * 2;
      const ctx = canvas.getContext('2d');

      // Draw frame background
      if (selectedFrame !== 'none') {
        const frame = FRAMES.find(f => f.id === selectedFrame);
        ctx.fillStyle = frame ? frame.color : '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Event branding at bottom of frame
        if (frameWidth > 20) {
          ctx.fillStyle = selectedFrame === 'white' ? '#333' : '#fff';
          ctx.font = `bold ${Math.round(frameWidth * 0.6)}px "Fredoka", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(
            config.eventName,
            canvas.width / 2,
            canvas.height - frameWidth * 0.3
          );
        }
      }

      // Draw filtered image
      ctx.drawImage(img, frameWidth, frameWidth);

      // Draw stickers
      for (const s of placedStickers) {
        const sx = frameWidth + (s.x / 100) * img.width;
        const sy = frameWidth + (s.y / 100) * img.height;
        ctx.font = `${s.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.emoji, sx, sy);
      }

      return canvas.toDataURL('image/png');
    } finally {
      setProcessing(false);
    }
  }, [filteredImage, selectedFrame, placedStickers, config.eventName]);

  const handleDone = async () => {
    const finalImage = await composeFinal();
    onDone(finalImage);
  };

  const frameObj = FRAMES.find(f => f.id === selectedFrame);

  return (
    <div className="editor-container">
      {/* Preview area */}
      <div className="editor-preview" ref={previewRef}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Frame */}
          {selectedFrame !== 'none' && (
            <div style={{
              position: 'absolute',
              inset: '-20px',
              border: `20px solid ${frameObj?.color || '#fff'}`,
              borderRadius: 'calc(var(--radius) + 4px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}>
              {/* Event name on frame */}
              <div style={{
                position: 'absolute',
                bottom: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: selectedFrame === 'white' ? '#333' : '#fff',
                whiteSpace: 'nowrap',
              }}>
                {config.eventName}
              </div>
            </div>
          )}

          {/* Photo */}
          <img
            src={filteredImage || image}
            alt="Preview"
            style={{
              maxWidth: mode === 'strip' ? '400px' : '700px',
              maxHeight: '75vh',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              display: 'block',
            }}
          />

          {/* Placed stickers */}
          {placedStickers.map((s, i) => (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${s.size}px`,
                cursor: 'grab',
                zIndex: 5,
                lineHeight: 1,
              }}
              onMouseDown={(e) => handleStickerStart(e, i)}
              onTouchStart={(e) => handleStickerStart(e, i)}
              onDoubleClick={() => removeSticker(i)}
            >
              {s.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="editor-sidebar">
        {/* Tabs */}
        <div className="editor-tabs">
          {[
            { id: 'filters', label: '🎨 Filtros' },
            { id: 'frames', label: '🖼️ Marcos' },
            ...(config.enableStickers ? [{ id: 'stickers', label: '⭐ Stickers' }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              className={`editor-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="editor-panel">
          {/* Filters */}
          {activeTab === 'filters' && (
            <div className="filter-grid">
              {filterList.map(f => (
                <div
                  key={f.id}
                  className={`filter-item ${selectedFilter === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(f.id)}
                >
                  {filterThumbs[f.id] ? (
                    <img src={filterThumbs[f.id]} className="filter-thumb" alt={f.name} />
                  ) : (
                    <div className="filter-thumb flex-center">{f.emoji}</div>
                  )}
                  <span className="filter-name">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Frames */}
          {activeTab === 'frames' && (
            <div className="filter-grid">
              {FRAMES.map(f => (
                <div
                  key={f.id}
                  className={`filter-item ${selectedFrame === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedFrame(f.id)}
                >
                  <div
                    className="filter-thumb"
                    style={{
                      background: f.id === 'none' ? 'var(--glass)' : f.color,
                      border: '2px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: f.id === 'none' ? '1.5rem' : '0.8rem',
                      color: ['white', 'gold', 'neon_green'].includes(f.id) ? '#333' : '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {f.id === 'none' ? '✕' : 'Aa'}
                  </div>
                  <span className="filter-name">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stickers */}
          {activeTab === 'stickers' && (
            <>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                textAlign: 'center',
              }}>
                Toca para agregar. Arrastra para mover. Doble tap para borrar.
              </p>
              <div className="sticker-grid">
                {STICKERS.map(s => (
                  <div
                    key={s.id}
                    className="sticker-item"
                    onClick={() => addSticker(s.emoji)}
                  >
                    {s.emoji}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="editor-actions">
          <button
            className="touch-btn touch-btn-ghost touch-btn-sm"
            onClick={onRetake}
            style={{ flex: 1 }}
          >
            🔄 Repetir
          </button>
          <button
            className="touch-btn touch-btn-primary touch-btn-sm"
            onClick={handleDone}
            disabled={processing}
            style={{ flex: 2 }}
          >
            {processing ? '⏳ Procesando...' : '✓ Listo'}
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
