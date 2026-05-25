import { useState, useEffect, useRef } from 'react';

export const useCountUp = (endValue, duration = 1000) => {
  const [count, setCount] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    let startTimestamp = null;
    const start = prevValueRef.current;
    const end = parseFloat(endValue) || 0;

    if (start === end) {
      setCount(end);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      
      const val = start + easeProgress * (end - start);
      setCount(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = end;
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animFrame);
      prevValueRef.current = end;
    };
  }, [endValue, duration]);

  return count;
};

export default useCountUp;
