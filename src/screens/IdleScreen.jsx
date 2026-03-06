import React, { useState, useEffect } from 'react';

export default function IdleScreen({ config, onStart, goToGallery }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="screen" onClick={onStart} onTouchStart={onStart}>
      <div className="screen-bg">
        {config.idleWallpaper ? (
          <img
            src={`file://${config.idleWallpaper.replace(/\\/g, '/')}`}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.4) blur(2px)',
            }}
          />
        ) : (
          <>
            <div className="idle-bg-blob" />
            <div className="idle-bg-blob" />
            <div className="idle-bg-blob" />
          </>
        )}
      </div>

      <div className="screen-content" style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease-out',
        textShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        {/* Event name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4.5rem',
          fontWeight: 700,
          marginBottom: '8px',
          animation: 'slideDown 0.8s ease-out',
          textShadow: '0 4px 30px rgba(247,151,30,0.4)',
        }}>
          <span className="text-gradient">{config.eventName}</span>
        </h1>

        {/* Logo / Title */}
        <div style={{
          fontSize: '1.5rem',
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-display)',
          marginBottom: '60px',
          animation: 'slideDown 0.8s ease-out 0.2s both',
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}>
          IshikiFIESTA
        </div>

        {/* Camera emoji as visual */}
        <div style={{
          fontSize: '7rem',
          marginBottom: '48px',
          animation: 'float 3s ease-in-out infinite',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }}>
          📸
        </div>

        {/* Tap to start message */}
        <div style={{
          fontSize: '2rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color: '#fff',
          animation: 'pulse 2s ease-in-out infinite',
          textShadow: '0 2px 16px rgba(0,0,0,0.6)',
        }}>
          Toca la pantalla para comenzar
        </div>

        <div style={{
          fontSize: '1.1rem',
          color: 'rgba(255,255,255,0.5)',
          marginTop: '16px',
          animation: 'fadeIn 1s ease-out 0.5s both',
        }}>
          Sacate fotos, aplica efectos y lleva el recuerdo
        </div>

        {/* Gallery link */}
        {config.enableGallery && (
          <button
            onClick={(e) => { e.stopPropagation(); goToGallery(); }}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              marginTop: '40px',
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(255,255,255,0.8)',
              padding: '14px 36px',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 600,
              cursor: 'pointer',
              animation: 'fadeIn 1s ease-out 0.8s both',
              transition: 'var(--transition)',
              pointerEvents: 'all',
            }}
          >
            🖼️ Galería de Fotos
          </button>
        )}
      </div>
    </div>
  );
}
