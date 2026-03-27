import React from 'react';

interface DiagramPanelProps {
  siteId: string;
  primaryColor: string;
  dimColor: string;
}

const DiagramPanel: React.FC<DiagramPanelProps> = ({ siteId, primaryColor, dimColor }) => {
  if (siteId === "prostate") {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-auto">
        <rect x="50" y="50" width="300" height="200" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" />
        <path d="M120,100 Q200,60 280,100 Q320,180 200,240 Q80,180 120,100" fill="none" stroke={primaryColor} strokeWidth="3" strokeDasharray="8 4" />
        <circle cx="200" cy="150" r="15" fill="none" stroke="#86EFAC" strokeWidth="2" />
        <path d="M185,150 L215,150" stroke="#86EFAC" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="150" y="240" width="100" height="40" rx="5" fill="none" stroke="#A78BFA" strokeWidth="2" />
        {[
          [140,120], [170,110], [200,105], [230,110], [260,120],
          [135,150], [165,145], [235,145], [265,150],
          [150,180], [180,190], [220,190], [250,180]
        ].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#22D3EE" className="animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
        ))}
        <path d="M100,220 Q200,260 300,220" fill="none" stroke="#F87171" strokeWidth="2" />
      </svg>
    );
  }

  if (siteId === "vault") {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-auto">
        <path d="M150,50 L250,50 L260,250 Q200,280 140,250 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <rect x="185" y="60" width="30" height="180" rx="15" fill="none" stroke={primaryColor} strokeWidth="3" />
        {[80, 110, 140, 170, 200].map((y, i) => (
          <circle key={i} cx="200" cy={y} r="4" fill={primaryColor} className="animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
        ))}
        <path d="M140,60 L260,60" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M120,240 Q200,270 280,240" stroke="#F87171" strokeWidth="2" />
        <path d="M120,40 Q200,10 280,40" stroke="#60A5FA" strokeWidth="2" />
      </svg>
    );
  }

  if (siteId === "skin") {
    return (
      <svg viewBox="0 0 400 300" className="w-full h-auto">
        <rect x="50" y="200" width="300" height="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <path d="M150,50 L250,50 L260,195 L140,195 Z" fill="none" stroke={primaryColor} strokeWidth="3" />
        <line x1="140" y1="195" x2="260" y2="195" stroke={primaryColor} strokeWidth="4" />
        <line x1="100" y1="210" x2="300" y2="210" stroke="#86EFAC" strokeWidth="1" strokeDasharray="4 2" />
        <line x1="100" y1="225" x2="300" y2="225" stroke="#A78BFA" strokeWidth="1" strokeDasharray="4 2" />
        <path d="M100,250 Q200,260 300,250" stroke="#F87171" strokeWidth="3" strokeDasharray="8 4" />
        <circle cx="200" cy="195" r="60" fill={`radial-gradient(circle, ${primaryColor}33 0%, transparent 70%)`} />
        {[1,2,3,4,5].map(i => (
          <path key={i} d={`M${200-i*20},${195+i*10} Q200,${195+i*15} ${200+i*20},${195+i*10}`} fill="none" stroke={primaryColor} strokeOpacity={0.5/i} strokeWidth="1" />
        ))}
      </svg>
    );
  }

  return (
    <div style={{ height:"200px", display:"flex", alignItems:"center", justifyContent:"center", color:dimColor, fontSize:"12px", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:"12px" }}>
      Diagram not available for this site.
    </div>
  );
};

export default DiagramPanel;
