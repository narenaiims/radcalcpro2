import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronRight, BookOpen, Activity, Image as ImageIcon, FileText, XCircle } from "lucide-react";

// Data Imports
import { prostateData } from "../src/data/brachytherapy/prostate";
import { vaultData } from "../src/data/brachytherapy/vault";
import { skinData } from "../src/data/brachytherapy/skin";
import { cervixData } from "../src/data/brachytherapy/cervix";
import { breastData } from "../src/data/brachytherapy/breast";
import { esophagusData } from "../src/data/brachytherapy/esophagus";
import { bronchusData } from "../src/data/brachytherapy/bronchus";
import { analData } from "../src/data/brachytherapy/anal";
import { rectumData } from "../src/data/brachytherapy/rectum";

// Component Imports
import SectionCard from "../src/components/brachytherapy/SectionCard";
import QuickRefPanel from "../src/components/brachytherapy/QuickRefPanel";
import DiagramPanel from "../src/components/brachytherapy/DiagramPanel";

// ══════════════════════════════════════════════════════════════════════════════
// COLOUR SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
const C = {
  bg:      "#05080F",
  card:    "#0A1020",
  card2:   "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.07)",
  text:    "#E2E8F0",
  sub:     "#94A3B8",
  dim:     "#475569",
  muted:   "#334155",
  // site accents
  cyan:    "#22D3EE",
  cyanBg:  "rgba(34,211,238,0.09)",
  cyanBd:  "rgba(34,211,238,0.28)",
  pink:    "#F472B6",
  pinkBg:  "rgba(244,114,182,0.09)",
  pinkBd:  "rgba(244,114,182,0.28)",
  amber:   "#FBBF24",
  amberBg: "rgba(251,191,36,0.09)",
  amberBd: "rgba(251,191,36,0.28)",
  emerald: "#10B981",
  emeraldBg:"rgba(16,185,129,0.09)",
  emeraldBd:"rgba(16,185,129,0.28)",
  indigo:  "#6366F1",
  indigoBg: "rgba(99,102,241,0.09)",
  indigoBd: "rgba(99,102,241,0.28)",
  orange:  "#F97316",
  orangeBg: "rgba(249,115,22,0.09)",
  orangeBd: "rgba(249,115,22,0.28)",
};

// ══════════════════════════════════════════════════════════════════════════════
// SITE CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════
const SITES: Record<string, any> = {
  prostate: { label: "Prostate", icon: "💎", primary: C.cyan,    bg: C.cyanBg,    border: C.cyanBd },
  vault:    { label: "Vault",    icon: "🎀", primary: C.pink,    bg: C.pinkBg,    border: C.pinkBd },
  skin:     { label: "Skin",     icon: "🧴", primary: C.amber,   bg: C.amberBg,   border: C.amberBd },
  cervix:   { label: "Cervix",   icon: "🌺", primary: C.emerald, bg: C.emeraldBg, border: C.emeraldBd },
  breast:   { label: "Breast",   icon: "🌸", primary: C.indigo,  bg: C.indigoBg,  border: C.indigoBd },
  esophagus:{ label: "Esophagus",icon: "🥖", primary: C.orange,  bg: C.orangeBg,  border: C.orangeBd },
  bronchus: { label: "Bronchus", icon: "🫁", primary: "#86EFAC", bg: "rgba(134,239,172,0.09)", border: "rgba(134,239,172,0.28)" },
  anal:     { label: "Anal",     icon: "⭕", primary: "#F472B6", bg: "rgba(244,114,182,0.09)", border: "rgba(244,114,182,0.28)" },
  rectum:   { label: "Rectum",   icon: "🔭", primary: "#60A5FA", bg: "rgba(96,165,250,0.09)", border: "rgba(96,165,250,0.28)" },
};

const KB: Record<string, any[]> = {
  prostate: prostateData,
  vault:    vaultData,
  skin:     skinData,
  cervix:   cervixData,
  breast:   breastData,
  esophagus:esophagusData,
  bronchus: bronchusData,
  anal:     analData,
  rectum:   rectumData,
};

export default function BrachytherapyReference() {
  const [activeSite, setActiveSite] = useState("prostate");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"content" | "diagram">("content");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const site = SITES[activeSite];
  const data = KB[activeSite];

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter((sec: any) => 
      sec.title.toLowerCase().includes(s) || 
      sec.subs.some((sub: any) => sub.title.toLowerCase().includes(s) || sub.body.toLowerCase().includes(s))
    );
  }, [data, search]);

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: C.bg, color: C.text,
      fontFamily: "'Inter', sans-serif", padding: "20px 16px 100px",
    }}>
      {/* ── HEADER ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Activity size={24} color={site.primary} />
            <h1 style={{
              fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em",
              fontFamily: "'Outfit', sans-serif",
            }}>Brachytherapy Reference</h1>
          </div>
          <p style={{ fontSize: "13px", color: C.sub, fontWeight: 500 }}>
            Clinical protocols, dosimetry & anatomy guides
          </p>
        </header>

        {/* ── SITE SELECTOR ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px",
          marginBottom: "20px",
        }}>
          {Object.entries(SITES).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setActiveSite(id); setOpenSection(null); }}
              style={{
                padding: "12px 8px", borderRadius: "14px", border: "1px solid",
                borderColor: activeSite === id ? cfg.primary : C.border,
                backgroundColor: activeSite === id ? cfg.bg : C.card,
                color: activeSite === id ? cfg.primary : C.sub,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "20px" }}>{cfg.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* ── SEARCH & TABS ── */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={16} color={C.dim} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder={`Search ${site.label} topics...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 14px 14px 40px", borderRadius: "14px",
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              color: "#FFF", fontSize: "14px", outline: "none",
            }}
          />
        </div>

        <div style={{
          display: "flex", gap: "4px", padding: "4px", borderRadius: "12px",
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          marginBottom: "20px",
        }}>
          {[
            { id: "content", label: "Content", icon: FileText },
            { id: "diagram", label: "Diagrams", icon: ImageIcon },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                flex: 1, padding: "10px", borderRadius: "9px", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backgroundColor: tab === t.id ? site.primary : "transparent",
                color: tab === t.id ? "#000" : C.sub,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <t.icon size={16} />
              <span style={{ fontSize: "12px", fontWeight: 700 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CONTENT TAB ── */}
        {tab === "content" && (
          <div className="fade-in">
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 24px", color:C.dim, fontSize:"13px" }}>
                <div style={{ fontSize:"32px", marginBottom:"12px" }}>🔎</div>
                No topics found for "{search}"
              </div>
            ) : (
              filtered.map((sec: any, idx: number) => (
                <SectionCard
                  key={sec.id}
                  section={sec}
                  color={site.primary}
                  isOpen={openSection === sec.id}
                  onToggle={() => setOpenSection(p => p===sec.id ? null : sec.id)}
                  idx={idx}
                  cardColor={C.card}
                  card2Color={C.card2}
                  borderColor={C.border}
                  textColor={C.text}
                  subTextColor={C.sub}
                  dimColor={C.dim}
                />
              ))
            )}
          </div>
        )}

        {/* ── DIAGRAM TAB ── */}
        {tab === "diagram" && (
          <div className="fade-in">
            <div style={{
              backgroundColor:C.card, borderRadius:"18px",
              border:`1px solid ${site.border}`, padding:"20px",
              marginBottom:"14px",
            }}>
              <div style={{
                fontSize:"10px", color:site.primary, fontWeight:700,
                letterSpacing:"0.12em", fontFamily:"'JetBrains Mono',monospace",
                marginBottom:"14px",
              }}>{site.icon} APPLICATOR / GEOMETRY DIAGRAM</div>
              <DiagramPanel siteId={activeSite} primaryColor={site.primary} dimColor={C.dim} />
            </div>

            {/* Key anatomy legend */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px",
              marginBottom:"14px",
            }}>
              {activeSite==="prostate" && [
                [C.cyan,    "I-125 Seeds",      "Permanent implant — entire gland"],
                ["#86EFAC", "Urethra",          "Protected: D10 <150% Rx dose"],
                ["#A78BFA", "TRUS Probe",       "Real-time guidance during implant"],
                ["#F87171", "Anterior Rectum",  "Key OAR: V100 <1 cc"],
                ["#FBBF24", "V100 Isodose",     "Volume receiving 100% Rx dose"],
                [C.cyan+"99","Template Grid",   "5 mm hole spacing, transperineal"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
              {activeSite==="vault" && [
                [C.pink,    "HDR Cylinder",    "Largest fitting (2–4 cm diameter)"],
                [C.pink+"99","Dwell Positions","Source steps along central channel"],
                ["#86EFAC", "Rx Depth",        "Vaginal surface (cylinder radius)"],
                ["#60A5FA", "Bladder",         "D2cc < 90 Gy EQD2₃"],
                ["#F87171", "Rectum",          "D2cc < 75 Gy EQD2₃"],
                ["#FBBF24", "Tx Length",       "Upper 3–5 cm of vagina"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
              {activeSite==="skin" && [
                [C.amber,   "Applicator Face",  "Held directly on skin (5mm SSD)"],
                ["#86EFAC", "3mm Rx Line",      "Standard BCC prescription depth"],
                ["#A78BFA", "5mm Rx Line",      "SCC / thicker lesion depth"],
                ["#F87171", "Cartilage Layer",  "α/β ≈ 2 Gy: max 3.5 Gy/fraction"],
                ["#60A5FA", "Bolus",            "Required for concave surfaces"],
                [C.amber+"99","Dose Fall-off",  "Rapid 1/r² — protects deep structures"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
              {activeSite==="cervix" && [
                [C.emerald,  "Central Tandem",  "Intrauterine: 2–6 cm active"],
                ["#FBBF24", "Ovoids / Ring",    "Forniceal: pear-shaped dose"],
                ["#A78BFA", "Point A",          "2cm lat, 2cm sup to os"],
                ["#60A5FA", "Bladder",          "D2cc < 80 Gy EQD2₃"],
                ["#F87171", "Rectum",           "D2cc < 65 Gy EQD2₃"],
                [C.emerald+"99","HR-CTV",       "Target: D90 ≥ 85 Gy EQD2"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
              {activeSite==="breast" && [
                [C.indigo,   "Lumpectomy Bed",  "Target for APBI boost"],
                [C.indigo+"99","Catheters",     "Interstitial multi-catheter"],
                ["#86EFAC", "Skin Surface",     "OAR: D1cc < 32 Gy"],
                ["#F87171", "Chest Wall",       "OAR: D1cc < 40 Gy"],
                ["#FBBF24", "Rx Isodose",       "V100 coverage of cavity+margin"],
                ["#60A5FA", "BID Gap",          "Min 6h between fractions"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
              {(activeSite==="esophagus" || activeSite==="bronchus" || activeSite==="anal" || activeSite==="rectum") && [
                [site.primary, "Active Source",  "Ir-192 stepping source"],
                [site.primary+"99","Dwell Steps", "Typically 5mm spacing"],
                ["#86EFAC", "1 cm Rx Point",    "Standard prescription distance"],
                ["#F87171", "Mucosal Wall",     "Risk of fistula / necrosis"],
                ["#A78BFA", "Aorta / Vessels",  "Critical OAR in central tumors"],
                ["#60A5FA", "Centering",        "Bougie ensures lumen centering"],
              ].map(([c,l,d],i)=>(
                <div key={i} style={{ padding:"9px 12px", borderRadius:"10px", backgroundColor:C.card2, borderLeft:`3px solid ${c}` }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:c, fontFamily:"'Outfit',sans-serif", marginBottom:"2px" }}>{l}</div>
                  <div style={{ fontSize:"10px", color:C.dim }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QUICK REF SIDEBAR ── */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                style={{
                  position: "fixed", right: 0, top: 0, height: "100%", width: "320px",
                  backgroundColor: C.bg, borderLeft: `1px solid ${site.border}`,
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", zIndex: 110,
                  overflowY: "auto", display: "flex", flexDirection: "column"
                }}
              >
                <div style={{
                  padding: "16px", borderBottom: `1px solid ${site.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  position: "sticky", top: 0, backgroundColor: C.bg, zIndex: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpen size={18} color={site.primary} />
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#FFF", fontFamily: "'Outfit',sans-serif" }}>
                      Quick Reference
                    </h3>
                  </div>
                </div>

                <div style={{ padding: "16px", flex: 1 }}>
                  <div style={{
                    fontSize: "10px", color: site.primary, fontWeight: 700,
                    letterSpacing: "0.12em", fontFamily: "'JetBrains Mono',monospace",
                    marginBottom: "14px",
                  }}>⚡ {site.label.toUpperCase()}</div>
                  <QuickRefPanel siteData={data} color={site.primary} card2Color={C.card2} dimColor={C.dim} />
                </div>

                <motion.button 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    position: "absolute", right: "24px", bottom: "24px", zIndex: 120,
                    backgroundColor: site.primary, color: "#FFF", width: "48px", height: "48px",
                    borderRadius: "50%", border: "none", boxShadow: `0 8px 24px ${site.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  <XCircle size={20} color="#FFF" />
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!isSidebarOpen && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: "fixed", right: "24px", bottom: "24px", zIndex: 90,
              backgroundColor: site.primary, color: "#FFF", width: "48px", height: "48px",
              borderRadius: "50%", border: "none", boxShadow: `0 8px 24px ${site.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            title="Quick Ref"
          >
            <BookOpen size={20} color="#FFF" />
          </motion.button>
        )}

        {/* ── DISCLAIMER ── */}
        <div style={{
          marginTop:"20px", padding:"13px 16px", borderRadius:"13px",
          backgroundColor:`${site.primary}06`, border:`1px solid ${site.primary}22`,
        }}>
          <div style={{
            fontSize:"10px", color:site.primary, fontWeight:700,
            letterSpacing:"0.1em", marginBottom:"5px",
            fontFamily:"'JetBrains Mono',monospace",
          }}>⚠ CLINICAL DISCLAIMER</div>
          <div style={{ fontSize:"11px", color:C.dim, lineHeight:1.5 }}>
            This reference tool is for educational purposes only. Always verify doses, constraints, and protocols with local departmental guidelines and primary literature before clinical application.
          </div>
        </div>
      </div>
    </div>
  );
}
