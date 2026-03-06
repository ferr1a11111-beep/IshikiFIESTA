import React, { useState, useEffect, useCallback, useRef } from 'react';
import IdleScreen from './screens/IdleScreen';
import ModeSelect from './screens/ModeSelect';
import CameraScreen from './screens/CameraScreen';
import EditorScreen from './screens/EditorScreen';
import PreviewScreen from './screens/PreviewScreen';
import GalleryScreen from './screens/GalleryScreen';
import AdminScreen from './screens/AdminScreen';

const SCREENS = {
  IDLE: 'idle',
  MODE_SELECT: 'mode_select',
  CAMERA: 'camera',
  EDITOR: 'editor',
  PREVIEW: 'preview',
  GALLERY: 'gallery',
  ADMIN: 'admin',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.IDLE);
  const [config, setConfig] = useState(null);
  const [captureMode, setCaptureMode] = useState('photo'); // photo, strip, gif, boomerang
  const [capturedImage, setCapturedImage] = useState(null); // data URL
  const [capturedFrames, setCapturedFrames] = useState([]); // for strip/gif/boomerang
  const [editedImage, setEditedImage] = useState(null);
  const [savedPhotoInfo, setSavedPhotoInfo] = useState(null);
  const idleTimerRef = useRef(null);
  const adminTapRef = useRef({ count: 0, timer: null });

  // Load config on mount
  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const cfg = await window.api.loadConfig();
        setConfig(cfg);
      } else {
        // Dev fallback when no Electron
        setConfig({
          eventName: 'Mi Fiesta',
          language: 'es',
          enablePhotoPrint: true,
          enableThermalPrint: true,
          enableQRShare: true,
          enableGIF: true,
          enableBoomerang: true,
          enableStrip: true,
          enableStickers: true,
          enableFrames: true,
          enableFilters: true,
          enableSounds: true,
          enableGallery: true,
          idleTimeout: 30,
          countdownSeconds: 3,
          stripPhotos: 3,
          gifFrames: 8,
          boomerangFrames: 6,
          thermalPrinterName: '',
          photoPrinterName: '',
          theme: 'fiesta',
          customPhrases: [],
          idleWallpaper: '',
        });
      }
    };
    load();
  }, []);

  // Idle timeout - return to idle screen after inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (screen !== SCREENS.IDLE && screen !== SCREENS.ADMIN && config) {
      idleTimerRef.current = setTimeout(() => {
        setScreen(SCREENS.IDLE);
        setCapturedImage(null);
        setCapturedFrames([]);
        setEditedImage(null);
        setSavedPhotoInfo(null);
      }, (config.idleTimeout || 30) * 1000);
    }
  }, [screen, config]);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [resetIdleTimer]);

  // Global touch handler for idle timer reset + admin access
  const handleGlobalTouch = useCallback((e) => {
    resetIdleTimer();

    // Admin access: 5 taps on top-right corner
    const touch = e.touches ? e.touches[0] : e;
    const x = touch.clientX || touch.pageX;
    const y = touch.clientY || touch.pageY;
    if (x > window.innerWidth - 100 && y < 100) {
      adminTapRef.current.count++;
      clearTimeout(adminTapRef.current.timer);
      adminTapRef.current.timer = setTimeout(() => { adminTapRef.current.count = 0; }, 2000);
      if (adminTapRef.current.count >= 5) {
        adminTapRef.current.count = 0;
        setScreen(SCREENS.ADMIN);
      }
    }
  }, [resetIdleTimer]);

  useEffect(() => {
    window.addEventListener('touchstart', handleGlobalTouch, { passive: true });
    window.addEventListener('click', handleGlobalTouch);
    return () => {
      window.removeEventListener('touchstart', handleGlobalTouch);
      window.removeEventListener('click', handleGlobalTouch);
    };
  }, [handleGlobalTouch]);

  // Navigation handlers
  const goToIdle = () => {
    setScreen(SCREENS.IDLE);
    setCapturedImage(null);
    setCapturedFrames([]);
    setEditedImage(null);
    setSavedPhotoInfo(null);
  };

  const goToModeSelect = () => setScreen(SCREENS.MODE_SELECT);

  const goToCamera = (mode) => {
    setCaptureMode(mode);
    setScreen(SCREENS.CAMERA);
  };

  const goToEditor = (image, frames = []) => {
    setCapturedImage(image);
    setCapturedFrames(frames);
    setScreen(SCREENS.EDITOR);
  };

  const goToPreview = (edited) => {
    setEditedImage(edited);
    setScreen(SCREENS.PREVIEW);
  };

  const goToGallery = () => setScreen(SCREENS.GALLERY);

  const handleConfigSave = async (newConfig) => {
    setConfig(newConfig);
    if (window.api) await window.api.saveConfig(newConfig);
  };

  if (!config) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando IshikiFIESTA...</p>
      </div>
    );
  }

  const screenProps = { config, goToIdle, goToModeSelect, goToGallery };

  return (
    <div className="app" data-theme={config.theme}>
      {screen === SCREENS.IDLE && (
        <IdleScreen {...screenProps} onStart={goToModeSelect} />
      )}
      {screen === SCREENS.MODE_SELECT && (
        <ModeSelect {...screenProps} onSelectMode={goToCamera} />
      )}
      {screen === SCREENS.CAMERA && (
        <CameraScreen
          {...screenProps}
          mode={captureMode}
          onCapture={goToEditor}
          onBack={goToModeSelect}
        />
      )}
      {screen === SCREENS.EDITOR && (
        <EditorScreen
          {...screenProps}
          image={capturedImage}
          frames={capturedFrames}
          mode={captureMode}
          onDone={goToPreview}
          onRetake={() => goToCamera(captureMode)}
        />
      )}
      {screen === SCREENS.PREVIEW && (
        <PreviewScreen
          {...screenProps}
          image={editedImage}
          mode={captureMode}
          savedInfo={savedPhotoInfo}
          onSavedInfo={setSavedPhotoInfo}
          onNewPhoto={goToModeSelect}
          onRetake={() => goToCamera(captureMode)}
        />
      )}
      {screen === SCREENS.GALLERY && (
        <GalleryScreen {...screenProps} onBack={goToIdle} />
      )}
      {screen === SCREENS.ADMIN && (
        <AdminScreen
          {...screenProps}
          onSave={handleConfigSave}
          onClose={goToIdle}
        />
      )}
    </div>
  );
}
