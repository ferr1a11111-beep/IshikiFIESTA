import { useEffect, useRef, useCallback } from 'react';

export default function useIdleTimer(timeoutSeconds, onIdle) {
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (timeoutSeconds > 0) {
      timerRef.current = setTimeout(onIdle, timeoutSeconds * 1000);
    }
  }, [timeoutSeconds, onIdle]);

  useEffect(() => {
    reset();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);

  return { reset };
}
