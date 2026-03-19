import React from 'react';
import { Activity, Wind, Heart, Zap, Layers, Eye, Volume2, Shield, Circle } from 'lucide-react';

interface NamedEffectIconProps {
  organ: string;
  size?: number;
}

export const NamedEffectIcon: React.FC<NamedEffectIconProps> = ({ organ, size = 20 }) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Brain': <Activity size={size} />,
    'CNS': <Activity size={size} />,
    'Lung': <Wind size={size} />,
    'Heart': <Heart size={size} />,
    'Spinal cord': <Zap size={size} />,
    'Skin': <Layers size={size} />,
    'Bowel': <Activity size={size} />,
    'Eye': <Eye size={size} />,
    'Lens': <Eye size={size} />,
    'Ear': <Volume2 size={size} />,
    'Liver': <Activity size={size} />,
    'Kidney': <Activity size={size} />,
    'Bone': <Shield size={size} />,
  };

  return <div className="text-blue-400">{iconMap[organ] || <Circle size={size} />}</div>;
};
