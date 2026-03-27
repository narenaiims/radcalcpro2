import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import ContentBlock from './ContentBlock';

interface SubAccordionProps {
  sub: any;
  color: string;
  dimColor: string;
  subColor: string;
  borderColor: string;
}

const SubAccordion: React.FC<SubAccordionProps> = ({ sub, color, dimColor, subColor, borderColor }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom:`1px solid ${borderColor}` }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width:"100%", textAlign:"left", padding:"12px 16px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background: isOpen ? "rgba(255,255,255,0.02)" : "transparent",
          border:"none", cursor:"pointer", transition:"background 0.2s",
        }}
      >
        <span style={{
          fontSize:"13px", fontWeight:600,
          color: isOpen ? "#FFF" : subColor,
          fontFamily:"'DM Sans',sans-serif",
        }}>
          {sub.title}
        </span>
        <ChevronDown 
          size={14}
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transition:"transform 0.2s",
            color: isOpen ? color : dimColor,
          }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow:"hidden" }}
          >
            <div style={{
              padding:"0 16px 16px 36px",
              borderLeft:`2px solid ${color}44`,
              marginLeft:"16px", marginBottom:"8px",
            }}>
              <ContentBlock body={sub.body} color={color} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubAccordion;
