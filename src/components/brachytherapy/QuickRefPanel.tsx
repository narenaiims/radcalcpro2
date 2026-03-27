import React from 'react';
import { Section } from '../../types/brachytherapy';

interface QuickRefPanelProps {
  siteData: Section[];
  color: string;
  card2Color: string;
  dimColor: string;
}

const QuickRefPanel: React.FC<QuickRefPanelProps> = ({ siteData, color, card2Color, dimColor }) => {
  const lastSec = siteData[siteData.length - 1];
  const qna = lastSec?.subs?.find(s => s.title.toLowerCase().includes("numbers") || s.title.toLowerCase().includes("viva"));
  
  if (!qna) return (
    <div style={{ textAlign:"center", padding:"24px", color:dimColor, fontSize:"12px" }}>
      No quick reference data available for this site.
    </div>
  );

  const lines = qna.body.split('\n').filter(l => l.trim().length > 0);

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.includes(':')) {
          const [label, val] = line.split(':');
          return (
            <div key={i} style={{
              padding:"12px", borderRadius:"12px",
              backgroundColor:card2Color, borderLeft:`3px solid ${color}`,
            }}>
              <div style={{ fontSize:"10px", color:dimColor, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>
                {label.trim().replace(/^[•\d.]+\s*/, '')}
              </div>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#FFF", fontFamily:"'Outfit',sans-serif" }}>
                {val.trim()}
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{ fontSize:"12px", color:"#FFF", padding:"8px 12px", borderRadius:"8px", backgroundColor:`${color}11`, border:`1px dashed ${color}33` }}>
            {line.trim().replace(/^[•\d.]+\s*/, '')}
          </div>
        );
      })}
    </div>
  );
};

export default QuickRefPanel;
