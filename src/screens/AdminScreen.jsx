import React, { useState, useEffect } from 'react';

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
  const [stats, setStats] = useState(null);
  const [newPhrase, setNewPhrase] = useState('');
  const [customPhrases, setCustomPhrases] = useState(config.customPhrases || []);
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!window.api) return;
      try {
        const [printerList, eventStats, info] = await Promise.all([
          window.api.listPrinters(),
          window.api.getStats(config.eventName),
          window.api.getServerInfo(),
        ]);
        setPrinters(printerList);
        setStats(eventStats);
        setServerInfo(info);
      } catch (e) {
        console.error('Admin load error:', e);
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
      <div className="admin-body">
        {/* Event */}
        <div className="admin-section">
          <div className="admin-section-title">🎉 Evento</div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Nombre del evento</div>
              <div className="admin-field-desc">Se muestra en la pantalla idle y en las impresiones</div>
            </div>
            <input
              className="admin-input"
              value={draft.eventName}
              onChange={(e) => update('eventName', e.target.value)}
              placeholder="Ej: Cumple de Greta"
            />
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
            <input
              className="admin-input"
              type="number"
              min="10"
              max="120"
              value={draft.idleTimeout}
              onChange={(e) => update('idleTimeout', parseInt(e.target.value) || 30)}
              style={{ width: '100px' }}
            />
          </div>

          <div className="admin-field">
            <div>
              <div className="admin-field-label">Cuenta regresiva (seg)</div>
            </div>
            <input
              className="admin-input"
              type="number"
              min="1"
              max="10"
              value={draft.countdownSeconds}
              onChange={(e) => update('countdownSeconds', parseInt(e.target.value) || 3)}
              style={{ width: '100px' }}
            />
          </div>
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
                className="admin-input"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Escribi una frase..."
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && addPhrase()}
              />
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
    </div>
  );
}
