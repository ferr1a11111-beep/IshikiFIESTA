import { useState, useEffect, useRef, useCallback } from 'react';

export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
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
