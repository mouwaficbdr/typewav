'use client';

import { useEffect, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*';

export function ScrambleText({
  text,
  delay = 0,
  duration = 1000
}: {
  text: string;
  delay?: number;
  duration?: number;
}) {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    timeout = setTimeout(() => {
      let frame = 0;
      const totalFrames = duration / 30;
      
      interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        
        if (progress >= 1) {
          setDisplayText(text);
          setIsDone(true);
          clearInterval(interval);
          return;
        }

        const scrambleLength = Math.floor(text.length * progress);
        const scrambled = text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < scrambleLength) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
          
        setDisplayText(scrambled);
      }, 30);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, duration]);

  return (
    <span style={{ opacity: isDone ? 1 : 0.8 }}>
      {displayText || text.replace(/./g, ' ')}
    </span>
  );
}
