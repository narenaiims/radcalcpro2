import React from 'react';
import { Zap, Clock, AlertTriangle } from 'lucide-react';

interface DynamicEffectIconProps {
  timing: 'Acute' | 'Subacute' | 'Late';
  size?: number;
}

export const DynamicEffectIcon: React.FC<DynamicEffectIconProps> = ({ timing, size = 16 }) => {
  const config = {
    Acute: { bg: 'bg-red-500', icon: <Zap size={size} /> },
    Subacute: { bg: 'bg-amber-500', icon: <Clock size={size} /> },
    Late: { bg: 'bg-purple-500', icon: <AlertTriangle size={size} /> },
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${config[timing].bg}`}>
      {config[timing].icon} {timing}
    </span>
  );
};
