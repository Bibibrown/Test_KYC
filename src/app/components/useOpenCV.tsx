// hooks/useOpenCV.ts
import { useEffect, useState } from 'react';

export default function useOpenCV() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = '/opencv/opencv.js';
      script.async = true;
      script.onload = () => {
        console.log('OpenCV.js Loaded');
        setLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  return loaded;
}
