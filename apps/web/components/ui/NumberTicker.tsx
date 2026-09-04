'use client';

import { useEffect, useState } from 'react';
import { animate } from 'motion';

export function NumberTicker({
  value,
  duration = 1.5,
  delay = 0,
  formatter = (v: number) => Math.round(v).toString()
}: {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (v: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for a luxury snap
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value, duration, delay]);

  return <>{formatter(displayValue)}</>;
}
