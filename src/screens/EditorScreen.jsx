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
  { id: 'none', name: 'Sin marco', type: 'none' },
  { id: 'classic_white', name: 'Clasico Blanco', type: 'solid', color: '#ffffff', textColor: '#333' },
  { id: 'elegant_black', name: 'Negro Elegante', type: 'solid', color: '#1a1a1a', textColor: '#fff' },
  { id: 'gold_luxe', name: 'Oro Lujoso', type: 'gradient',
    colors: ['#b8860b', '#ffd700', '#daa520', '#ffd700', '#b8860b'], textColor: '#1a1a1a' },
  { id: 'rose_gold', name: 'Oro Rosa', type: 'gradient',
    colors: ['#b76e79', '#f0c0c0', '#e8a0a0', '#f0c0c0', '#b76e79'], textColor: '#fff' },
  { id: 'neon_party', name: 'Neon Fiesta', type: 'neon',
    color: '#ff00ff', glowColor: 'rgba(255,0,255,0.6)', textColor: '#fff' },
  { id: 'rainbow', name: 'Arcoiris', type: 'rainbow', textColor: '#fff' },
  { id: 'glitter_pink', name: 'Glitter Rosa', type: 'glitter',
    baseColor: '#ff69b4', sparkleColor: '#fff', textColor: '#fff' },
  { id: 'fiesta_confetti', name: 'Confetti', type: 'confetti',
    baseColor: '#2c003e', textColor: '#ffd700' },
  { id: 'vintage_film', name: 'Pelicula Retro', type: 'filmstrip',
    color: '#1a1a1a', textColor: '#fff' },
];

// Draw glamorous frame on canvas for final composition
function drawFrameOnCanvas(ctx, frameId, w, h, fw, eventName) {
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame || frame.type === 'none') return;

  switch (frame.type) {
    case 'solid':
      ctx.fillStyle = frame.color;
      ctx.fillRect(0, 0, w, h);
      break;

    case 'gradient': {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      frame.colors.forEach((c, i) => grad.addColorStop(i / (frame.colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Shimmer diagonal lines
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w + h; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(0, i);
        ctx.stroke();
      }
      break;
    }

    case 'neon': {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.shadowColor = frame.glowColor;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(fw * 0.3, fw * 0.3, w - fw * 0.6, h - fw * 0.6);
      ctx.shadowBlur = 10;
      ctx.strokeRect(fw * 0.3, fw * 0.3, w - fw * 0.6, h - fw * 0.6);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(fw - 2, fw - 2, w - fw * 2 + 4, h - fw * 2 + 4);
      break;
    }

    case 'rainbow': {
      const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'glitter': {
      ctx.fillStyle = frame.baseColor;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) {
        const px = ((42 * (i + 1) * 7919) % w);
        const py = ((42 * (i + 1) * 104729) % h);
        if (px > fw && px < w - fw && py > fw && py < h - fw) continue;
        const size = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) * 0.14})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'confetti': {
      ctx.fillStyle = frame.baseColor;
      ctx.fillRect(0, 0, w, h);
      const confettiColors = ['#ff6b6b', '#ffd700', '#00d4ff', '#39ff14', '#ff69b4', '#a855f7'];
      for (let i = 0; i < 100; i++) {
        const px = ((i * 7919 + 31) % w);
        const py = ((i * 104729 + 31) % h);
        if (px > fw && px < w - fw && py > fw && py < h - fw) continue;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((i * 0.5) % (Math.PI * 2));
        ctx.fillStyle = confettiColors[i % confettiColors.length];
        ctx.fillRect(-4, -8, 8, 16);
        ctx.restore();
      }
      break;
    }

    case 'filmstrip': {
      ctx.fillStyle = frame.color;
      ctx.fillRect(0, 0, w, h);
      const holeSize = fw * 0.35;
      const spacing = holeSize * 2.5;
      ctx.fillStyle = '#333';
      for (let x = spacing; x < w - spacing; x += spacing) {
        ctx.beginPath();
        ctx.rect(x - holeSize / 2, fw * 0.15, holeSize, holeSize);
        ctx.fill();
        ctx.beginPath();
        ctx.rect(x - holeSize / 2, h - fw * 0.15 - holeSize, holeSize, holeSize);
        ctx.fill();
      }
      break;
    }
  }

  // Event name at bottom
  if (fw > 20) {
    ctx.save();
    ctx.fillStyle = frame.textColor || '#fff';
    ctx.font = `bold ${Math.round(fw * 0.55)}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(eventName, w / 2, h - fw * 0.3);
    ctx.restore();
  }
}

// CSS preview style for frame during editing
function getFramePreviewStyle(frameId) {
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame) return {};
  switch (frame.type) {
    case 'solid':
      return { border: `24px solid ${frame.color}` };
    case 'gradient':
      return {
        border: '24px solid transparent',
        backgroundImage: `linear-gradient(135deg, ${frame.colors.join(', ')})`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'border-box',
      };
    case 'neon':
      return {
        border: '24px solid #0a0a1a',
        boxShadow: `inset 0 0 15px ${frame.glowColor}, 0 0 15px ${frame.glowColor}`,
      };
    case 'rainbow':
      return {
        border: '24px solid transparent',
        backgroundImage: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'border-box',
      };
    case 'glitter':
      return {
        border: `24px solid ${frame.baseColor}`,
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2)',
      };
    case 'confetti':
      return { border: `24px solid ${frame.baseColor}` };
    case 'filmstrip':
      return { border: `24px solid ${frame.color}` };
    default:
      return {};
  }
}

// Thumbnail background for frame selector
function getFrameThumbStyle(frame) {
  switch (frame.type) {
    case 'none':
      return { background: 'var(--glass)' };
    case 'solid':
      return { background: frame.color };
    case 'gradient':
      return { background: `linear-gradient(135deg, ${frame.colors.join(', ')})` };
    case 'neon':
      return { background: '#0a0a1a', boxShadow: `inset 0 0 10px ${frame.glowColor}, 0 0 8px ${frame.glowColor}` };
    case 'rainbow':
      return { background: 'linear-gradient(90deg, #f00, #ff8800, #ff0, #0f0, #00f, #80f)' };
    case 'glitter':
      return { background: `linear-gradient(135deg, ${frame.baseColor}, #fff, ${frame.baseColor})` };
    case 'confetti':
      return { background: frame.baseColor };
    case 'filmstrip':
      return { background: frame.color };
    default:
      return { background: 'var(--glass)' };
  }
}

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
  const [selectedSticker, setSelectedSticker] = useState(null); // index or null

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
    if (selectedSticker === index) setSelectedSticker(null);
  };

  const resizeSticker = (index, delta) => {
    setPlacedStickers(prev => {
      const copy = [...prev];
      const newSize = Math.max(20, Math.min(200, copy[index].size + delta));
      copy[index] = { ...copy[index], size: newSize };
      return copy;
    });
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
      const frameWidth = selectedFrame !== 'none' ? 50 : 0;
      canvas.width = img.width + frameWidth * 2;
      canvas.height = img.height + frameWidth * 2;
      const ctx = canvas.getContext('2d');

      // Draw glamorous frame
      if (selectedFrame !== 'none') {
        drawFrameOnCanvas(ctx, selectedFrame, canvas.width, canvas.height, frameWidth, config.eventName);
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
      <div className="editor-preview" ref={previewRef} onClick={() => setSelectedSticker(null)}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Frame */}
          {selectedFrame !== 'none' && (
            <div style={{
              position: 'absolute',
              inset: '-24px',
              borderRadius: 'calc(var(--radius) + 4px)',
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'hidden',
              ...getFramePreviewStyle(selectedFrame),
            }}>
              {/* Event name on frame */}
              <div style={{
                position: 'absolute',
                bottom: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: frameObj?.textColor || '#fff',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
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
                outline: selectedSticker === i ? '2px dashed var(--primary)' : 'none',
                outlineOffset: '4px',
                borderRadius: '8px',
              }}
              onMouseDown={(e) => { e.stopPropagation(); handleStickerStart(e, i); setSelectedSticker(i); }}
              onTouchStart={(e) => { handleStickerStart(e, i); setSelectedSticker(i); }}
              onDoubleClick={() => removeSticker(i)}
            >
              {s.emoji}
              {/* Resize controls */}
              {selectedSticker === i && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-44px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, -15); }}
                  >
                    −
                  </button>
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, 15); }}
                  >
                    +
                  </button>
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(231,76,60,0.85)', border: 'none',
                      color: '#fff', fontSize: '1rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={(e) => { e.stopPropagation(); removeSticker(i); }}
                  >
                    ✕
                  </button>
                </div>
              )}
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
            ...(config.enableFrames !== false ? [{ id: 'frames', label: '🖼️ Marcos' }] : []),
            ...(config.enableStickers !== false ? [{ id: 'stickers', label: '⭐ Stickers' }] : []),
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
                      ...getFrameThumbStyle(f),
                      border: f.type === 'neon' ? `2px solid ${f.color}` : '2px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: f.type === 'none' ? '1.5rem' : '0.8rem',
                      color: f.textColor || '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {f.type === 'none' ? '✕' : 'Aa'}
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
                Toca para agregar. Arrastra para mover. Usa +/− para cambiar tamano. Doble tap para borrar.
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
