import React from 'react';

const MODES = [
  {
    id: 'photo',
    icon: '📷',
    title: 'Foto',
    desc: 'Una foto clasica con filtros y marcos',
    color: '#f7971e',
  },
  {
    id: 'strip',
    icon: '🎞️',
    title: 'Tira de Fotos',
    desc: 'Varias poses, un recuerdo genial',
    color: '#ff6b6b',
  },
  {
    id: 'gif',
    icon: '🎬',
    title: 'GIF Animado',
    desc: 'Varios frames que se mueven',
    color: '#a855f7',
  },
  {
    id: 'boomerang',
    icon: '🔄',
    title: 'Boomerang',
    desc: 'Ida y vuelta en loop infinito',
    color: '#2ecc71',
  },
];

export default function ModeSelect({ config, onSelectMode, goToGallery, goToIdle }) {
  const availableModes = MODES.filter(m => {
    if (m.id === 'gif' && !config.enableGIF) return false;
    if (m.id === 'boomerang' && !config.enableBoomerang) return false;
    if (m.id === 'strip' && !config.enableStrip) return false;
    return true;
  });

  return (
    <div className="screen">
      <div className="screen-bg">
        <div className="idle-bg-blob" />
        <div className="idle-bg-blob" />
        <div className="idle-bg-blob" />
      </div>

      <div className="screen-content" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3rem',
          fontWeight: 700,
          marginBottom: '12px',
          animation: 'slideDown 0.5s ease-out',
          textShadow: '0 4px 24px rgba(247,151,30,0.4)',
        }}>
          <span className="text-gradient">Elegi tu modo</span>
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '1.2rem',
          marginBottom: '48px',
          animation: 'slideDown 0.5s ease-out 0.1s both',
        }}>
          Que tipo de recuerdo queres llevar?
        </p>

        {/* Mode cards */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          animation: 'slideUp 0.5s ease-out 0.2s both',
        }}>
          {availableModes.map((mode, i) => (
            <div
              key={mode.id}
              className="mode-card"
              onClick={() => onSelectMode(mode.id)}
              style={{
                animationDelay: `${0.1 * i}s`,
                borderColor: 'transparent',
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.borderColor = mode.color;
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div className="mode-card-icon">{mode.icon}</div>
              <div className="mode-card-title">{mode.title}</div>
              <div className="mode-card-desc">{mode.desc}</div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          display: 'flex',
          gap: '16px',
        }}>
          <button className="touch-btn touch-btn-ghost" onClick={goToIdle}>
            ← Volver
          </button>
          {config.enableGallery && (
            <button className="touch-btn touch-btn-glass" onClick={goToGallery}>
              🖼️ Galeria
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
