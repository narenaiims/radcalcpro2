import React from 'react';
import { motion } from 'motion/react';

interface RadialGaugeProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
  showPercentage?: boolean;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max,
  size = 60,
  strokeWidth = 6,
  label,
  unit,
  showPercentage = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = Math.min(Math.max(value, 0), max * 1.5); // Allow overflow up to 150%
  const percentage = max > 0 ? (safeValue / max) * 100 : 0;
  const displayPercentage = max > 0 ? (value / max) * 100 : 0;
  
  // Cap the visual fill at 100% of the circle, but color indicates overflow
  const fillPercentage = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (fillPercentage / 100) * circumference;

  let color = '#10b981'; // emerald-500
  if (percentage >= 100) {
    color = '#ef4444'; // red-500
  } else if (percentage >= 90) {
    color = '#f59e0b'; // amber-500
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showPercentage ? (
          <span className="text-[10px] font-bold" style={{ color }}>
            {displayPercentage.toFixed(0)}%
          </span>
        ) : (
          <>
            <span className="text-[10px] font-black leading-none" style={{ color }}>
              {value.toFixed(1)}
            </span>
            {unit && <span className="text-[7px] text-slate-500 uppercase leading-none mt-0.5">{unit}</span>}
          </>
        )}
      </div>
      {label && (
        <div className="absolute -bottom-4 whitespace-nowrap text-[8px] text-slate-400 font-bold uppercase tracking-wider">
          {label}
        </div>
      )}
    </div>
  );
};
