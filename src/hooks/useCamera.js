import { useState, useEffect, useRef, useCallback } from 'react';

// Keywords that identify IR/night vision cameras (Windows Hello, depth sensors, etc.)
const IR_KEYWORDS = ['ir ', 'ir_', 'infrared', 'night', 'windows hello', 'depth', 'tobii'];

function isIRCamera(label) {
  const name = (label || '').toLowerCase();
  return IR_KEYWORDS.some(kw => name.includes(kw));
}

export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    try {
      setError(null);

      // Step 1: Get initial stream to trigger permission prompt
      let stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // Step 2: Check if we got an IR camera, and switch if needed
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        console.log('[Camera] Found cameras:', cameras.map(c => c.label || 'unnamed'));

        if (cameras.length > 1) {
          const currentTrack = stream.getVideoTracks()[0];
          const currentLabel = currentTrack.label || '';
          console.log('[Camera] Currently using:', currentLabel);

          if (isIRCamera(currentLabel)) {
            console.log('[Camera] IR camera detected! Switching to regular camera...');
            // Stop the IR camera
            stream.getTracks().forEach(t => t.stop());

            // Find a regular (non-IR) camera
            const regularCamera = cameras.find(c => !isIRCamera(c.label));

            if (regularCamera) {
              console.log('[Camera] Switching to:', regularCamera.label);
              stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: regularCamera.deviceId },
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                },
                audio: false,
              });
            } else {
              // All cameras seem to be IR - try again without filter
              console.log('[Camera] No regular camera found, using first available');
              stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                },
                audio: false,
              });
            }
          }
        }
      } catch (enumErr) {
        // enumerateDevices failed - just use whatever we got
        console.warn('[Camera] Could not enumerate devices:', enumErr);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      console.error('[Camera] Error:', err);
      setError('No se pudo acceder a la camara. Verifica los permisos.');
      setIsReady(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isReady) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror: flip horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/png');
  }, [isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, isReady, error, start, stop, captureFrame };
}
