import React, { useState, useEffect, useRef, useCallback } from 'react';
import VirtualKeyboard from '../components/VirtualKeyboard';

function Toggle({ value, onChange }) {
  return (
    <div
      className={`toggle ${value ? 'active' : ''}`}
      onClick={() => onChange(!value)}
    />
  );
}

export default function AdminScreen({ config, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...config });
  const [printers, setPrinters] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [stats, setStats] = useState(null);
  const [newPhrase, setNewPhrase] = useState('');
  const [customPhrases, setCustomPhrases] = useState(config.customPhrases || []);
  const [serverInfo, setServerInfo] = useState(null);
  const [wallpaperPhotos, setWallpaperPhotos] = useState([]);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  // Virtual keyboard state
  const [kbVisible, setKbVisible] = useState(false);
  const [kbTarget, setKbTarget] = useState(null); // 'eventName' | 'newPhrase' | 'idleTimeout' | 'countdownSeconds'
  const eventNameRef = useRef(null);
  const newPhraseRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const inputRefs = {
    eventName: eventNameRef,
    newPhrase: newPhraseRef,
    idleTimeout: idleTimeoutRef,
    countdownSeconds: countdownRef,
  };

  useEffect(() => {
    const load = async () => {
      if (!window.api) return;
      try {
        const [printerList, eventStats, info, photos] = await Promise.all([
          window.api.listPrinters(),
          window.api.getStats(config.eventName),
          window.api.getServerInfo(),
          window.api.getPhotos(config.eventName),
        ]);
        setPrinters(printerList);
        setStats(eventStats);
        setServerInfo(info);
        setWallpaperPhotos(photos.filter(p => p.mode === 'photo' || p.mode === 'strip'));
      } catch (e) {
        console.error('Admin load error:', e);
      }

      // Enumerate cameras
      try {
        // Need temporary stream to get labels
        const tmpStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        tmpStream.getTracks().forEach(t => t.stop());
        const cams = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camara ${d.deviceId.substring(0, 6)}` }));
        setCameras(cams);
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    };
    load();
  }, [config.eventName]);

  const update = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const finalConfig = { ...draft, customPhrases };
    onSave(finalConfig);
    onClose();
  };

  const addPhrase = () => {
    if (newPhrase.trim()) {
      setCustomPhrases(prev => [...prev, newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const removePhrase = (index) => {
    setCustomPhrases(prev => prev.filter((_, i) => i !== index));
  };

  // Open virtual keyboard for a specific input
  const openKeyboard = (targetName) => {
    setKbTarget(targetName);
    setKbVisible(true);
  };

  const closeKeyboard = () => {
    setKbVisible(false);
    setKbTarget(null);
  };

  // Handle virtual keyboard input
  const handleKbInput = useCallback((value) => {
    if (!kbTarget) return;
    switch (kbTarget) {
      case 'eventName':
        update('eventName', value);
        break;
      case 'newPhrase':
        setNewPhrase(value);
        break;
      case 'idleTimeout':
        update('idleTimeout', parseInt(value) || 30);
        break;
      case 'countdownSeconds':
        update('countdownSeconds', parseInt(value) || 3);
        break;
    }
  }, [kbTarget]);

  const handleKbEnter = useCallback(() => {
    if (kbTarget === 'newPhrase') {
      addPhrase();
    }
    closeKeyboard();
  }, [kbTarget, newPhrase]);

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          ⚙️ <span className="text-gradient">Panel de Administracion</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="touch-btn touch-btn-primary touch-btn-sm" onClick={handleSave}>
            💾 Guardar
          </button>
          <button className="touch-btn touch-btn-glass touch-btn-sm" onClick={onClose}>
            ✕ Cerrar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="admin-body" style={{ paddingBottom: kbVisible ? '320px' : '20px' }}>
        {/* Event */}
        <div className="admin-section">
          <div className="admin-section-title">🎉 Evento</div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Nombre del evento</div>
              <div className="admin-field-desc">Se muestra en la pantalla idle y en las impresiones</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={eventNameRef}
                className="admin-input"
                value={draft.eventName}
                onChange={(e) => update('eventName', e.target.value)}
                placeholder="Ej: Cumple de Greta"
                onFocus={() => openKeyboard('eventName')}
                readOnly
              />
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                onClick={() => openKeyboard('eventName')}
                title="Abrir teclado"
                style={{ minWidth: '48px', minHeight: '48px', fontSize: '1.3rem' }}
              >
                ⌨️
              </button>
            </div>
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Idioma</div>
            </div>
            <select
              className="admin-input"
              value={draft.language}
              onChange={(e) => update('language', e.target.value)}
            >
              <option value="es">Espanol</option>
              <option value="en">English</option>
              <option value="pt">Portugues</option>
            </select>
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Timeout de inactividad (seg)</div>
              <div className="admin-field-desc">Segundos antes de volver a la pantalla idle</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={idleTimeoutRef}
                className="admin-input"
                type="text"
                inputMode="numeric"
                value={draft.idleTimeout}
                onChange={(e) => update('idleTimeout', parseInt(e.target.value) || 30)}
                style={{ width: '100px' }}
                onFocus={() => openKeyboard('idleTimeout')}
                readOnly
              />
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                onClick={() => openKeyboard('idleTimeout')}
                style={{ minWidth: '48px', minHeight: '48px', fontSize: '1.3rem' }}
              >
                ⌨️
              </button>
            </div>
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Cuenta regresiva (seg)</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={countdownRef}
                className="admin-input"
                type="text"
                inputMode="numeric"
                value={draft.countdownSeconds}
                onChange={(e) => update('countdownSeconds', parseInt(e.target.value) || 3)}
                style={{ width: '100px' }}
                onFocus={() => openKeyboard('countdownSeconds')}
                readOnly
              />
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                onClick={() => openKeyboard('countdownSeconds')}
                style={{ minWidth: '48px', minHeight: '48px', fontSize: '1.3rem' }}
              >
                ⌨️
              </button>
            </div>
          </div>
        </div>

        {/* Wallpaper */}
        <div className="admin-section">
          <div className="admin-section-title">🖼️ Fondo de Pantalla</div>
          <div className="admin-field">
            <div>
              <div className="admin-field-label">Foto de fondo</div>
              <div className="admin-field-desc">Usa una foto de la galeria como fondo de la pantalla de inicio</div>
            </div>
            {draft.idleWallpaper ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <img
                  src={`file://${draft.idleWallpaper.replace(/\\/g, '/')}`}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                  alt=""
                />
                <button
                  className="touch-btn touch-btn-ghost touch-btn-sm"
                  onClick={() => update('idleWallpaper', '')}
                  style={{ padding: '8px 12px', minHeight: 'auto' }}
                >
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gradientes animados</span>
            )}
          </div>
          <button
            className="touch-btn touch-btn-glass touch-btn-sm"
            style={{ marginTop: '12px', width: '100%' }}
            onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
          >
            📷 {showWallpaperPicker ? 'Cerrar galeria' : 'Seleccionar foto'}
          </button>
          {showWallpaperPicker && (
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '12px 0',
              WebkitOverflowScrolling: 'touch',
            }}>
              {wallpaperPhotos.length > 0 ? wallpaperPhotos.map(p => (
                <img
                  key={p.filename}
                  src={`file://${p.path.replace(/\\/g, '/')}`}
                  style={{
                    width: 100,
                    height: 75,
                    objectFit: 'cover',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: draft.idleWallpaper === p.path ? '3px solid var(--primary)' : '3px solid transparent',
                    flexShrink: 0,
                  }}
                  alt=""
                  onClick={() => { update('idleWallpaper', p.path); setShowWallpaperPicker(false); }}
                />
              )) : (
                <div style={{ color: 'var(--text-muted)', padding: '16px', fontSize: '0.9rem' }}>
                  No hay fotos aun. Saca fotos primero para usarlas de fondo.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="admin-section">
          <div className="admin-section-title">🎮 Funciones</div>

          {[
            ['enableStrip', 'Tira de fotos', 'Modo strip de multiples poses'],
            ['enableGIF', 'GIF animado', 'Captura de multiples frames'],
            ['enableBoomerang', 'Boomerang', 'Loop de ida y vuelta'],
            ['enableFilters', 'Filtros de foto', 'Efectos visuales (B&N, Sepia, etc)'],
            ['enableFrames', 'Marcos', 'Marcos decorativos con nombre del evento'],
            ['enableStickers', 'Stickers', 'Emojis y props virtuales'],
            ['enableGallery', 'Galeria', 'Ver todas las fotos del evento'],
            ['enableSounds', 'Sonidos', 'Efectos de sonido (countdown, shutter)'],
          ].map(([key, label, desc]) => (
            <div className="admin-field" key={key}>
              <div>
                <div className="admin-field-label">{label}</div>
                <div className="admin-field-desc">{desc}</div>
              </div>
              <Toggle value={draft[key]} onChange={(v) => update(key, v)} />
            </div>
          ))}
        </div>

        {/* Camera */}
        <div className="admin-section">
          <div className="admin-section-title">📷 Camara</div>
          <div className="admin-field">
            <div>
              <div className="admin-field-label">Seleccionar camara</div>
              <div className="admin-field-desc">
                Si las fotos salen en negro o infrarrojo, cambia a otra camara
              </div>
            </div>
            <select
              className="admin-input"
              value={draft.cameraDeviceId || ''}
              onChange={(e) => update('cameraDeviceId', e.target.value)}
            >
              <option value="">Automatica (evita IR)</option>
              {cameras.map(c => (
                <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
              ))}
            </select>
          </div>
          {cameras.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>
              Abriendo camara para detectar dispositivos...
            </div>
          )}
        </div>

        {/* Mode settings */}
        <div className="admin-section">
          <div className="admin-section-title">🔢 Cantidad de Capturas</div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Fotos en tira (Strip)</div>
              <div className="admin-field-desc">Cuantas fotos se toman en el modo Tira</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('stripPhotos', Math.max(2, (draft.stripPhotos || 3) - 1))}
              >−</button>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                {draft.stripPhotos || 3}
              </span>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('stripPhotos', Math.min(6, (draft.stripPhotos || 3) + 1))}
              >+</button>
            </div>
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Frames en GIF</div>
              <div className="admin-field-desc">Cuantos cuadros captura rapido el modo GIF</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('gifFrames', Math.max(4, (draft.gifFrames || 8) - 1))}
              >−</button>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                {draft.gifFrames || 8}
              </span>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('gifFrames', Math.min(12, (draft.gifFrames || 8) + 1))}
              >+</button>
            </div>
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Frames en Boomerang</div>
              <div className="admin-field-desc">Cuantos cuadros captura rapido el modo Loop</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('boomerangFrames', Math.max(4, (draft.boomerangFrames || 6) - 1))}
              >−</button>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                {draft.boomerangFrames || 6}
              </span>
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.4rem' }}
                onClick={() => update('boomerangFrames', Math.min(12, (draft.boomerangFrames || 6) + 1))}
              >+</button>
            </div>
          </div>
        </div>

        {/* Printing */}
        <div className="admin-section">
          <div className="admin-section-title">🖨️ Impresion</div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Imprimir fotos a color</div>
              <div className="admin-field-desc">Impresora predeterminada de Windows</div>
            </div>
            <Toggle value={draft.enablePhotoPrint} onChange={(v) => update('enablePhotoPrint', v)} />
          </div>

          {draft.enablePhotoPrint && printers.length > 0 && (
            <div className="admin-field">
              <div>
                <div className="admin-field-label">Impresora de fotos</div>
              </div>
              <select
                className="admin-input"
                value={draft.photoPrinterName}
                onChange={(e) => update('photoPrinterName', e.target.value)}
              >
                <option value="">Predeterminada</option>
                {printers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Frases divertidas (termica)</div>
              <div className="admin-field-desc">Imprime frases random en la impresora termica</div>
            </div>
            <Toggle value={draft.enableThermalPrint} onChange={(v) => update('enableThermalPrint', v)} />
          </div>

          {draft.enableThermalPrint && printers.length > 0 && (
            <div className="admin-field">
              <div>
                <div className="admin-field-label">Impresora termica</div>
              </div>
              <select
                className="admin-input"
                value={draft.thermalPrinterName}
                onChange={(e) => update('thermalPrinterName', e.target.value)}
              >
                <option value="">Predeterminada</option>
                {printers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* QR Sharing */}
        <div className="admin-section">
          <div className="admin-section-title">📱 Compartir por WiFi</div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">QR para descargar fotos</div>
              <div className="admin-field-desc">Los invitados escanean y bajan la foto al celu</div>
            </div>
            <Toggle value={draft.enableQRShare} onChange={(v) => update('enableQRShare', v)} />
          </div>

          {serverInfo && (
            <div style={{
              background: 'var(--glass)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
            }}>
              <div>Servidor: <strong style={{ color: 'var(--text)' }}>{serverInfo.url}</strong></div>
              <div>Estado: <span style={{ color: serverInfo.running ? 'var(--success)' : 'var(--danger)' }}>
                {serverInfo.running ? 'Activo' : 'Inactivo'}
              </span></div>
            </div>
          )}
        </div>

        {/* Custom Phrases */}
        {draft.enableThermalPrint && (
          <div className="admin-section">
            <div className="admin-section-title">💬 Frases Personalizadas</div>
            <div className="admin-field-desc" style={{ marginBottom: '12px' }}>
              Agrega tus propias frases ademas de las predeterminadas
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                ref={newPhraseRef}
                className="admin-input"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Escribi una frase..."
                style={{ flex: 1 }}
                onFocus={() => openKeyboard('newPhrase')}
                readOnly
              />
              <button
                className="touch-btn touch-btn-glass touch-btn-icon"
                onClick={() => openKeyboard('newPhrase')}
                style={{ minWidth: '48px', minHeight: '48px', fontSize: '1.3rem' }}
              >
                ⌨️
              </button>
              <button className="touch-btn touch-btn-primary touch-btn-sm" onClick={addPhrase}>
                + Agregar
              </button>
            </div>

            {customPhrases.map((p, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--glass)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '6px',
                fontSize: '0.9rem',
              }}>
                <span>{p}</span>
                <button
                  className="touch-btn touch-btn-ghost touch-btn-sm"
                  style={{ padding: '4px 8px', minHeight: 'auto' }}
                  onClick={() => removePhrase(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="admin-section">
            <div className="admin-section-title">📊 Estadisticas del Evento</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                background: 'var(--glass)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total fotos</div>
              </div>
              {Object.entries(stats.modes || {}).map(([mode, count]) => (
                <div key={mode} style={{
                  background: 'var(--glass)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{count}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {mode === 'photo' ? 'Fotos' : mode === 'strip' ? 'Strips' : mode === 'gif' ? 'GIFs' : mode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quit App */}
        <div className="admin-section">
          <div className="admin-section-title">🚪 Salir de la Aplicacion</div>
          <div className="admin-field-desc" style={{ marginBottom: '12px' }}>
            Cierra IshikiFIESTA completamente (sale del modo kiosko)
          </div>
          <button
            className="touch-btn touch-btn-sm"
            style={{
              width: '100%',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '1.1rem',
              padding: '16px',
            }}
            onClick={() => {
              if (window.api && window.api.quitApp) {
                window.api.quitApp();
              } else {
                window.close();
              }
            }}
          >
            ⏻ Cerrar IshikiFIESTA
          </button>
        </div>

        {/* Version */}
        <div style={{
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          padding: '20px 0',
        }}>
          IshikiFIESTA v3.0 — Photo Booth Profesional
        </div>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        targetRef={kbTarget ? inputRefs[kbTarget] : null}
        onInput={handleKbInput}
        onEnter={handleKbEnter}
        onClose={closeKeyboard}
        visible={kbVisible}
      />
    </div>
  );
}
