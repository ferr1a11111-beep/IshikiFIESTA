import { useState, useEffect, useRef, useCallback } from 'react';

// Keywords that identify IR/night vision cameras
const IR_KEYWORDS = ['ir ', 'ir_', 'ir-', 'infrared', 'night', 'windows hello', 'depth', 'tobii', '(ir)'];

function isIRCamera(label) {
  const name = (label || '').toLowerCase();
  return IR_KEYWORDS.some(kw => name.includes(kw));
}

export default function useCamera(config) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    try {
      setError(null);

      // If user has a saved camera preference, try that first
      const savedDeviceId = config?.cameraDeviceId;

      if (savedDeviceId) {
        try {
          console.log('[Camera] Trying saved camera:', savedDeviceId);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: savedDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setIsReady(true);
          }
          console.log('[Camera] Using saved camera:', stream.getVideoTracks()[0]?.label);
          return;
        } catch (e) {
          console.warn('[Camera] Saved camera not available, trying auto-detect:', e.message);
        }
      }

      // Step 1: Get ANY camera stream to trigger permission
      let stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      // Step 2: Enumerate all cameras (labels are available after permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      console.log('[Camera] All cameras:', cameras.map(c => `${c.label} (${c.deviceId.substring(0, 8)}...)`));

      if (cameras.length > 1) {
        const currentTrack = stream.getVideoTracks()[0];
        const currentLabel = currentTrack?.label || '';
        console.log('[Camera] Currently using:', currentLabel);

        // Strategy: Find the best camera
        // 1. Filter out IR cameras by keyword
        // 2. If we can identify non-IR cameras, use the first one
        // 3. If ALL cameras have ambiguous names, use the LAST one
        //    (IR cameras are typically listed first on Windows Hello systems)
        const nonIRCameras = cameras.filter(c => !isIRCamera(c.label));
        let targetCamera = null;

        if (nonIRCameras.length > 0 && nonIRCameras.length < cameras.length) {
          // We found some non-IR cameras and filtered some out
          targetCamera = nonIRCameras[0];
          console.log('[Camera] Selected non-IR camera:', targetCamera.label);
        } else if (nonIRCameras.length === cameras.length && cameras.length > 1) {
          // All cameras have ambiguous names (none matched IR keywords)
          // Use the LAST camera (IR typically listed first)
          targetCamera = cameras[cameras.length - 1];
          console.log('[Camera] No IR keyword match, using last camera:', targetCamera.label);
        }

        // Switch if we found a better camera than what we have
        if (targetCamera && targetCamera.deviceId !== currentTrack?.getSettings()?.deviceId) {
          stream.getTracks().forEach(t => t.stop());
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: targetCamera.deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
              audio: false,
            });
            console.log('[Camera] Switched to:', stream.getVideoTracks()[0]?.label);
          } catch (switchErr) {
            console.warn('[Camera] Switch failed, falling back:', switchErr.message);
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: false,
            });
          }
        }
      } else {
        console.log('[Camera] Only one camera available:', cameras[0]?.label || 'unnamed');
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
  }, [config?.cameraDeviceId]);

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
