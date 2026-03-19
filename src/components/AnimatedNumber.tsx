import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, decimals = 1, suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const startValue = useRef<number>(displayValue);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / 600, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(startValue.current + (value - startValue.current) * ease);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (isNaN(value) || value === undefined) return <span className={className}>—</span>;

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};

export default AnimatedNumber;
