import { useState, useRef, useCallback } from 'react';

export default function useCountdown(initialSeconds = 3) {
  const [count, setCount] = useState(null); // null = not counting
  const [isFlashing, setIsFlashing] = useState(false);
  const intervalRef = useRef(null);
  const resolveRef = useRef(null);

  const startCountdown = useCallback((seconds = initialSeconds) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setCount(seconds);
      setIsFlashing(false);

      let current = seconds;
      intervalRef.current = setInterval(() => {
        current--;
        if (current <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setCount(null);
          setIsFlashing(true);
          // Flash duration
          setTimeout(() => {
            setIsFlashing(false);
            resolve();
          }, 300);
        } else {
          setCount(current);
        }
      }, 1000);
    });
  }, [initialSeconds]);

  const cancel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCount(null);
    setIsFlashing(false);
  }, []);

  const isCounting = count !== null;

  return { count, isCounting, isFlashing, startCountdown, cancel };
}
