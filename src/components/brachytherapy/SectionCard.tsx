import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import SubAccordion from './SubAccordion';

interface SectionCardProps {
  section: any;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  idx: number;
  cardColor: string;
  card2Color: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
  dimColor: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ 
  section, color, isOpen, onToggle, idx, 
  cardColor, card2Color, borderColor, textColor, subTextColor, dimColor 
}) => {
  return (
    <div style={{
      marginBottom:"12px", borderRadius:"16px",
      backgroundColor:cardColor, border:`1px solid ${isOpen ? color : borderColor}`,
      overflow:"hidden", transition:"all 0.3s",
      boxShadow: isOpen ? `0 4px 24px ${color}15` : "none",
    }}>
      <button 
        onClick={onToggle}
        style={{
          width:"100%", display:"flex", alignItems:"center", gap:"14px",
          padding:"14px 16px", background:"none", border:"none",
          textAlign:"left", cursor:"pointer",
        }}
      >
        <div style={{
          width:"36px", height:"36px", borderRadius:"10px",
          backgroundColor: isOpen ? color : card2Color,
          color: isOpen ? "#000" : subTextColor,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px", transition:"all 0.3s",
        }}>
          {section.icon}
        </div>
        <div style={{ flex:1 }}>
          <h3 style={{
            fontSize:"14px", fontWeight:700, color: isOpen ? "#FFF" : textColor,
            fontFamily:"'Outfit',sans-serif", transition:"color 0.3s",
          }}>
            {section.title}
          </h3>
          {!isOpen && (
            <p style={{ fontSize:"11px", color:dimColor, marginTop:"2px", fontFamily:"'JetBrains Mono',monospace" }}>
              {section.subs.length} topics
            </p>
          )}
        </div>
        <div style={{
          width:"28px", height:"28px", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          backgroundColor: isOpen ? `${color}22` : "transparent",
          color: isOpen ? color : dimColor,
          transform: isOpen ? "rotate(180deg)" : "none",
          transition:"all 0.3s",
        }}>
          <ChevronDown size={16} />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div style={{ borderTop:`1px solid ${borderColor}` }}>
              {section.subs.map((sub: any) => (
                <SubAccordion 
                  key={sub.id} 
                  sub={sub} 
                  color={color} 
                  dimColor={dimColor} 
                  subColor={subTextColor} 
                  borderColor={borderColor} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionCard;
