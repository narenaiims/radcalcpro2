import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from "../components/KeyFactsSidebar";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PEDIATRIC_DATA = {
  CNS: {
    label: "CNS / Brain",
    icon: "🧠",
    color: "#7C3AED",
    accent: "#A78BFA",
    organs: [
      {
        name: "Whole Brain",
        ageGroups: [
          { age: "< 3 yrs", constraint: "Avoid if possible; if necessary < 18 Gy", metric: "D_mean", risk: "Neurocognitive impairment", severity: "high" },
          { age: "3–6 yrs", constraint: "< 23.4 Gy (CSI); < 18 Gy preferred", metric: "D_mean", risk: "IQ loss ~2 pts/Gy", severity: "high" },
          { age: "> 6 yrs", constraint: "< 36 Gy (CSI); cognitive acceptable", metric: "D_mean", risk: "Memory, processing speed", severity: "medium" },
        ],
        note: "Cognitive effects inversely proportional to age. Hippocampal sparing mandatory."
      },
      {
        name: "Hippocampus",
        ageGroups: [
          { age: "All pediatric", constraint: "D_mean < 7.3 Gy (VMAT/proton preferred)", metric: "D_mean", risk: "Verbal memory loss", severity: "medium" },
          { age: "< 5 yrs", constraint: "D_mean < 5 Gy (strict)", metric: "D_mean", risk: "Severe memory deficit", severity: "high" },
        ],
        note: "RTOG 0933 hippocampal avoidance guidelines adapted for pediatrics."
      },
      {
        name: "Brainstem",
        ageGroups: [
          { age: "< 5 yrs", constraint: "D_max < 54 Gy; D_1cc < 50 Gy", metric: "D_max", risk: "Necrosis, neuropathy", severity: "high" },
          { age: "5–18 yrs", constraint: "D_max < 54 Gy; D_1cc < 52 Gy", metric: "D_max", risk: "Cranial nerve palsy", severity: "medium" },
        ],
        note: "Point max must be respected; small volumes can exceed with caution."
      },
      {
        name: "Optic Nerves & Chiasm",
        ageGroups: [
          { age: "All pediatric", constraint: "D_max < 54 Gy; D_0.1cc < 50 Gy", metric: "D_max", risk: "Optic neuropathy, blindness", severity: "high" },
          { age: "< 3 yrs", constraint: "D_max < 45 Gy (stricter)", metric: "D_max", risk: "Vision loss in critical dev. period", severity: "high" },
        ],
        note: "Risk increased with concurrent chemotherapy (vincristine, carboplatin)."
      },
      {
        name: "Cochlea / Inner Ear",
        ageGroups: [
          { age: "< 5 yrs", constraint: "D_mean < 30 Gy (SIOP); ideally < 25 Gy", metric: "D_mean", risk: "Grade 3+ sensorineural hearing loss", severity: "high" },
          { age: "5–18 yrs", constraint: "D_mean < 35 Gy", metric: "D_mean", risk: "High-frequency hearing loss", severity: "medium" },
        ],
        note: "Cochlear dose critical with concurrent cisplatin (synergistic ototoxicity). Assess with SIOP Ototoxicity Scale."
      },
      {
        name: "Pituitary / Hypothalamus",
        ageGroups: [
          { age: "< 10 yrs", constraint: "D_mean < 10 Gy preferred; < 30 Gy acceptable", metric: "D_mean", risk: "GH deficiency, precocious puberty", severity: "high" },
          { age: "> 10 yrs", constraint: "D_mean < 40 Gy", metric: "D_mean", risk: "Hormonal axis dysfunction", severity: "medium" },
        ],
        note: "GH axis most sensitive. Thyroid, ACTH, gonadotropin axes at higher doses."
      },
    ]
  },
  Thorax: {
    label: "Thorax",
    icon: "🫁",
    color: "#0891B2",
    accent: "#67E8F9",
    organs: [
      {
        name: "Lung (both)",
        ageGroups: [
          { age: "< 3 yrs", constraint: "V10 < 35%; MLD < 12 Gy", metric: "V10 / MLD", risk: "Pulmonary fibrosis, growth restriction", severity: "high" },
          { age: "3–10 yrs", constraint: "V20 < 30%; MLD < 14 Gy", metric: "V20 / MLD", risk: "Radiation pneumonitis", severity: "medium" },
          { age: "> 10 yrs", constraint: "V20 < 35%; MLD < 16 Gy", metric: "V20 / MLD", risk: "Pneumonitis", severity: "medium" },
        ],
        note: "Growing lungs highly sensitive. Pulmonary function testing recommended pre/post RT."
      },
      {
        name: "Heart",
        ageGroups: [
          { age: "All pediatric", constraint: "V25 < 10%; D_mean < 15 Gy", metric: "V25 / D_mean", risk: "Cardiomyopathy, pericarditis", severity: "high" },
          { age: "< 5 yrs", constraint: "D_mean < 10 Gy (critical)", metric: "D_mean", risk: "Late cardiac death (30-yr risk)", severity: "high" },
        ],
        note: "Anthracycline use compounds cardiac risk significantly. Echocardiogram surveillance mandatory."
      },
      {
        name: "Spinal Cord",
        ageGroups: [
          { age: "< 5 yrs", constraint: "D_max < 45 Gy; D_0.1cc < 42 Gy", metric: "D_max", risk: "Myelopathy, Lhermitte’s, growth", severity: "high" },
          { age: "5–18 yrs", constraint: "D_max < 50 Gy; D_0.1cc < 45 Gy", metric: "D_max", risk: "Radiation myelopathy", severity: "high" },
        ],
        note: "Vertebral body constraints equally important for scoliosis prevention."
      },
      {
        name: "Esophagus",
        ageGroups: [
          { age: "All pediatric", constraint: "D_mean < 27 Gy; D_max < 60 Gy", metric: "D_mean / D_max", risk: "Stricture, dysphagia", severity: "medium" },
          { age: "< 5 yrs", constraint: "D_mean < 20 Gy preferred", metric: "D_mean", risk: "Growth failure, stricture", severity: "high" },
        ],
        note: "Late stricture risk increased in young children with high max doses."
      },
    ]
  },
  Abdomen: {
    label: "Abdomen & Pelvis",
    icon: "🫘",
    color: "#059669",
    accent: "#6EE7B7",
    organs: [
      {
        name: "Kidney (each)",
        ageGroups: [
          { age: "All pediatric", constraint: "V18 < 30%; D_mean < 15 Gy per kidney", metric: "V18 / D_mean", risk: "Renal insufficiency", severity: "high" },
          { age: "Single kidney", constraint: "D_mean < 10 Gy; V12 < 25%", metric: "D_mean", risk: "Renal failure", severity: "high" },
        ],
        note: "GFR monitoring essential. Nephroblastoma (Wilms) — contralateral kidney constraint paramount."
      },
      {
        name: "Liver",
        ageGroups: [
          { age: "< 3 yrs", constraint: "D_mean < 20 Gy; V30 < 30%", metric: "D_mean / V30", risk: "RILD, growth failure", severity: "high" },
          { age: "3–18 yrs", constraint: "D_mean < 25 Gy; V30 < 40%", metric: "D_mean / V30", risk: "Radiation-induced liver disease", severity: "medium" },
        ],
        note: "Higher sensitivity in children vs adults. Portal hypertension risk."
      },
      {
        name: "Bowel (Small)",
        ageGroups: [
          { age: "All pediatric", constraint: "V45 < 195cc; D_max < 52 Gy", metric: "V45 / D_max", risk: "Obstruction, fistula, chronic enteritis", severity: "high" },
          { age: "< 5 yrs", constraint: "V35 < 150cc; D_max < 45 Gy", metric: "V35 / D_max", risk: "Growth, malabsorption", severity: "high" },
        ],
        note: "QUANTEC bowel constraints adapted — pediatric thresholds stricter."
      },
      {
        name: "Gonads – Ovaries",
        ageGroups: [
          { age: "Prepubertal", constraint: "< 2 Gy: mild; < 6 Gy: partial failure", metric: "D_mean", risk: "Premature ovarian failure", severity: "high" },
          { age: "Postpubertal", constraint: "< 4 Gy: regular cycles possible; > 10 Gy: permanent failure", metric: "D_mean", risk: "Infertility, early menopause", severity: "high" },
        ],
        note: "Oophoropexy should be considered pre-RT. Fertility preservation counselling mandatory."
      },
      {
        name: "Gonads – Testes",
        ageGroups: [
          { age: "All pediatric", constraint: "< 1–2 Gy: temporary azoospermia; < 0.1 Gy: preferred for fertility", metric: "D_mean", risk: "Azoospermia, Leydig cell dysfunction", severity: "high" },
          { age: "Prepubertal", constraint: "< 1 Gy for spermatogenesis preservation", metric: "D_mean", risk: "Infertility", severity: "high" },
        ],
        note: "Testicular shielding essential when possible. Gonadal dose audit mandatory."
      },
      {
        name: "Vertebral Bodies",
        ageGroups: [
          { age: "< 6 yrs", constraint: "Avoid asymmetric dosing; V20 entire VB < 50%", metric: "Asymmetry", risk: "Scoliosis, kyphosis, short stature", severity: "high" },
          { age: "6–18 yrs", constraint: "Minimize dose gradient across vertebral body", metric: "Dose gradient", risk: "Growth asymmetry, scoliosis", severity: "medium" },
        ],
        note: "Entire vertebral body (not just thecal sac) must be contoured and dose assessed symmetrically."
      },
      {
        name: "Iliac Crests / Growth Plates",
        ageGroups: [
          { age: "< 10 yrs", constraint: "D_mean < 20 Gy (growth plate)", metric: "D_mean", risk: "Limb length discrepancy", severity: "high" },
          { age: "> 10 yrs", constraint: "D_mean < 30 Gy", metric: "D_mean", risk: "Reduced bone density, fracture", severity: "medium" },
        ],
        note: "Orthopedic assessment pre and post-RT for extremity/pelvic fields."
      },
    ]
  },
  HeadNeck: {
    label: "Head & Neck",
    icon: "🦷",
    color: "#DC2626",
    accent: "#FCA5A5",
    organs: [
      {
        name: "Thyroid Gland",
        ageGroups: [
          { age: "All pediatric", constraint: "D_mean < 20 Gy to prevent hypothyroidism", metric: "D_mean", risk: "Hypothyroidism, thyroid cancer", severity: "high" },
          { age: "< 10 yrs", constraint: "D_mean < 15 Gy preferred; > 25 Gy: near-certain dysfunction", metric: "D_mean", risk: "Secondary thyroid malignancy", severity: "high" },
        ],
        note: "TSH surveillance q6–12 months lifelong. Risk of secondary thyroid cancer even at low doses."
      },
      {
        name: "Salivary Glands",
        ageGroups: [
          { age: "All pediatric", constraint: "Parotid D_mean < 26 Gy; Submandibular < 35 Gy", metric: "D_mean", risk: "Xerostomia, caries, dental decay", severity: "medium" },
          { age: "< 10 yrs", constraint: "D_mean < 20 Gy preferred (dental development)", metric: "D_mean", risk: "Permanent dentition damage", severity: "high" },
        ],
        note: "Dental development critically affected by fields including developing tooth buds < 9 yrs."
      },
      {
        name: "Mandible / Dental Buds",
        ageGroups: [
          { age: "< 9 yrs", constraint: "Minimize dose to dental buds; < 10 Gy preferred", metric: "D_mean to buds", risk: "Abnormal dentition, microdontia", severity: "high" },
          { age: "9–18 yrs", constraint: "D_max mandible < 70 Gy (ORN threshold)", metric: "D_max", risk: "Osteoradionecrosis, malocclusion", severity: "medium" },
        ],
        note: "Panoramic OPG before RT to document dental status. Fluoride trays mandatory post-RT."
      },
      {
        name: "Lens of Eye",
        ageGroups: [
          { age: "All pediatric", constraint: "D_max < 5 Gy (cataract threshold lower in children)", metric: "D_max", risk: "Cataract formation", severity: "medium" },
          { age: "< 3 yrs", constraint: "D_max < 2 Gy", metric: "D_max", risk: "Amblyopia, visual development", severity: "high" },
        ],
        note: "Eye shielding where feasible. Ophthalmology review at 1, 3, 5 years post-RT."
      },
    ]
  }
};

const SEVERITY_CONFIG = {
  high: { bg: "rgba(239,68,68,0.1)", border: "#EF4444", text: "#FCA5A5", badge: "STRICT" },
  medium: { bg: "rgba(245,158,11,0.1)", border: "#F59E0B", text: "#FCD34D", badge: "CAUTION" },
  low: { bg: "rgba(34,197,94,0.1)", border: "#22C55E", text: "#86EFAC", badge: "WATCH" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = (SEVERITY_CONFIG as any)[severity] || SEVERITY_CONFIG.medium;
  return (
    <span style={{
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
      padding: "2px 7px", borderRadius: "20px",
      backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, fontFamily: "'JetBrains Mono', monospace"
    }}>
      {cfg.badge}
    </span>
  );
}

function ConstraintRow({ row }: { row: any }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "110px 1fr auto",
      gap: "8px", alignItems: "start",
      padding: "10px 12px", borderRadius: "8px",
      backgroundColor: "rgba(255,255,255,0.03)",
      borderLeft: `3px solid ${(SEVERITY_CONFIG as any)[row.severity]?.border || "#6B7280"}`,
      marginBottom: "6px"
    }}>
      <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace", paddingTop: "2px" }}>
        {row.age}
      </div>
      <div>
        <div style={{ fontSize: "13px", color: "#F1F5F9", fontWeight: 600, marginBottom: "2px" }}>
          {row.constraint}
        </div>
        <div style={{ fontSize: "10px", color: "#64748B" }}>
          {row.metric} · {row.risk}
        </div>
      </div>
      <SeverityBadge severity={row.severity} />
    </div>
  );
}

function OrganCard({ organ, accent }: { organ: any, accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.04)",
      borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "10px", overflow: "hidden",
      transition: "border-color 0.2s ease"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${accent}55`}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "14px 16px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            backgroundColor: accent, boxShadow: `0 0 6px ${accent}`
          }} />
          <span style={{ color: "#E2E8F0", fontSize: "14px", fontWeight: 600 }}>{organ.name}</span>
          <span style={{ fontSize: "11px", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
            {organ.ageGroups.length} age groups
          </span>
        </div>
        <span style={{
          color: accent, fontSize: "16px", transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease", display: "inline-block"
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {organ.ageGroups.map((row: any, i: number) => <ConstraintRow key={i} row={row} />)}
          {organ.note && (
            <div style={{
              marginTop: "10px", padding: "10px 14px",
              backgroundColor: "rgba(148,163,184,0.06)",
              borderRadius: "8px", border: "1px solid rgba(148,163,184,0.12)"
            }}>
              <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700, letterSpacing: "0.08em" }}>
                📋 CLINICAL NOTE &nbsp;
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.6 }}>{organ.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SystemSection({ sysKey, system, isActive, onClick }: { sysKey: string, system: any, isActive: boolean, onClick: (key: string) => void }) {
  return (
    <div>
      <button
        onClick={() => onClick(sysKey)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", background: isActive
            ? `linear-gradient(135deg, ${system.color}22, ${system.color}11)`
            : "rgba(255,255,255,0.02)",
          borderRadius: "14px", border: `1px solid ${isActive ? system.color + "55" : "rgba(255,255,255,0.06)"}`,
          cursor: "pointer", textAlign: "left", marginBottom: "8px",
          transition: "all 0.25s ease"
        }}
      >
        <span style={{ fontSize: "24px" }}>{system.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: isActive ? system.accent : "#CBD5E1", fontSize: "14px", fontWeight: 700 }}>
            {system.label}
          </div>
          <div style={{ color: "#475569", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>
            {system.organs.length} organs · click to expand
          </div>
        </div>
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          backgroundColor: isActive ? system.color : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isActive ? "#fff" : "#475569", fontSize: "12px",
          transition: "all 0.25s ease"
        }}>
          {isActive ? "▴" : "▾"}
        </div>
      </button>

      {isActive && (
        <div style={{ paddingLeft: "8px", paddingBottom: "12px" }}>
          {system.organs.map((organ: any, i: number) => (
            <OrganCard key={i} organ={organ} accent={system.accent} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickRefCard({ title, items, color }: { title: string, items: string[], color: string }) {
  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px",
      border: `1px solid ${color}33`, padding: "16px", marginBottom: "12px"
    }}>
      <div style={{
        fontSize: "11px", fontWeight: 700, color: color,
        letterSpacing: "0.12em", marginBottom: "12px",
        fontFamily: "'JetBrains Mono', monospace"
      }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", gap: "10px", marginBottom: "8px",
          alignItems: "flex-start"
        }}>
          <span style={{ color: color, fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>◆</span>
          <span style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SIDEBAR DATA ─────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'CNS Constraints',
    emoji: '🧠',
    accent: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.4)',
    rows: [
      { k: 'Whole Brain (<3y)', v: '< 18 Gy', mono: true },
      { k: 'Hippocampus', v: 'Dmean < 7.3 Gy', mono: true },
      { k: 'Brainstem (<5y)', v: 'Dmax < 54 Gy', mono: true },
      { k: 'Cochlea (<5y)', v: 'Dmean < 30 Gy', mono: true },
    ]
  },
  {
    title: 'Thorax Constraints',
    emoji: '🫁',
    accent: '#0891B2',
    bg: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.4)',
    rows: [
      { k: 'Lung (<3y)', v: 'MLD < 12 Gy', mono: true },
      { k: 'Heart (<5y)', v: 'Dmean < 10 Gy', mono: true },
      { k: 'Spinal Cord (<5y)', v: 'Dmax < 45 Gy', mono: true },
    ]
  },
  {
    title: 'Abdomen Constraints',
    emoji: '🫀',
    accent: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.4)',
    rows: [
      { k: 'Kidney (Bilateral)', v: 'Dmean < 12 Gy', mono: true },
      { k: 'Liver (Whole)', v: 'Dmean < 15 Gy', mono: true },
      { k: 'Ovaries', v: 'Dmean < 2 Gy', mono: true },
    ]
  }
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PediatricConstraints() {
  const [activeSystem, setActiveSystem] = useState<string | null>("CNS");
  const [activeTab, setActiveTab] = useState("constraints");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSystemClick = (key: string) => setActiveSystem(prev => prev === key ? null : key);

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const term = searchTerm.toLowerCase();
    const results: any[] = [];
    Object.entries(PEDIATRIC_DATA).forEach(([sysKey, sys]) => {
      sys.organs.forEach(organ => {
        if (
          organ.name.toLowerCase().includes(term) ||
          organ.ageGroups.some(ag =>
            ag.constraint.toLowerCase().includes(term) ||
            ag.risk.toLowerCase().includes(term)
          )
        ) {
          results.push({ sysKey, sys, organ });
        }
      });
    });
    setSearchResults(results);
  }, [searchTerm]);

  const TABS = [
    { key: "constraints", label: "OAR Constraints", icon: "⚕" },
    { key: "principles", label: "Key Principles", icon: "📐" },
    { key: "references", label: "References", icon: "📚" },
  ];

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#080C14",
      fontFamily: "'DM Sans', sans-serif",
      background: "linear-gradient(160deg, #080C14 0%, #0D1526 50%, #080C14 100%)"
    }}>
      {/* Import fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,400&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0D1526; } ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; } @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.85); } } @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } .fade-in { animation: fadeInUp 0.35s ease forwards; }`}</style>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: "44px", zIndex: 40,
        backgroundColor: "rgba(8,12,20,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 16px"
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(135deg, #7C3AED, #0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "0 0 20px rgba(124,58,237,0.4)"
            }}>🧒</div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: "16px", fontWeight: 900, color: "#F1F5F9",
                letterSpacing: "-0.02em", lineHeight: 1.1,
                fontFamily: "'Space Grotesk', sans-serif"
              }}>Pediatric Dose Constraints</h1>
              <div style={{ fontSize: "10px", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Age-stratified OAR limits · Evidence-based · v2025
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                backgroundColor: "#22C55E",
                animation: "pulse-dot 2s ease infinite"
              }} />
              <span style={{ fontSize: "9px", color: "#22C55E", fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 16px 0" }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            fontSize: "14px", color: "#475569", pointerEvents: "none"
          }}>🔍</span>
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search organ, risk, age group…"
            style={{
              width: "100%", padding: "12px 14px 12px 40px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", color: "#E2E8F0",
              fontSize: "13px", outline: "none", fontFamily: "'DM Sans', sans-serif"
            }}
            onFocus={e => e.target.style.borderColor = "#7C3AED"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="fade-in" style={{ marginTop: "10px" }}>
            {searchResults.map((r, i) => (
              <div key={i} style={{
                padding: "12px 14px", borderRadius: "10px", marginBottom: "6px",
                backgroundColor: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.25)"
              }}>
                <div style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 700, marginBottom: "6px" }}>
                  {r.sys.icon} {r.sys.label} › {r.organ.name}
                </div>
                {r.organ.ageGroups.map((ag: any, j: number) => (
                  <div key={j} style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "3px" }}>
                    <span style={{ color: "#7C3AED" }}>{ag.age}</span>: {ag.constraint}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && (
          <div style={{
            marginTop: "10px", padding: "14px", textAlign: "center",
            color: "#475569", fontSize: "13px", borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.02)"
          }}>No constraints found for "{searchTerm}"</div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 16px 0" }}>
        <div style={{
          display: "flex", gap: "6px", backgroundColor: "rgba(255,255,255,0.03)",
          padding: "5px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)"
        }}>
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "9px 6px",
                backgroundColor: activeTab === tab.key ? "#7C3AED" : "transparent",
                border: "none", borderRadius: "10px", cursor: "pointer",
                color: activeTab === tab.key ? "#fff" : "#64748B",
                fontSize: "11px", fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
                boxShadow: activeTab === tab.key ? "0 2px 12px rgba(124,58,237,0.4)" : "none"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px" }}>

        {/* CONSTRAINTS TAB */}
        {activeTab === "constraints" && (
          <div className="fade-in">
            {/* Legend */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap"
            }}>
              {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "4px 10px", borderRadius: "20px",
                  backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`
                }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: cfg.border }} />
                  <span style={{ fontSize: "10px", color: cfg.text, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {cfg.badge}
                  </span>
                </div>
              ))}
              <div style={{
                padding: "4px 10px", borderRadius: "20px",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "10px", color: "#475569", fontFamily: "'JetBrains Mono', monospace"
              }}>Tap organ to expand ▾</div>
            </div>

            {Object.entries(PEDIATRIC_DATA).map(([key, system]) => (
              <SystemSection
                key={key} sysKey={key} system={system}
                isActive={activeSystem === key}
                onClick={handleSystemClick}
              />
            ))}
          </div>
        )}

        {/* PRINCIPLES TAB */}
        {activeTab === "principles" && (
          <div className="fade-in">
            <QuickRefCard
              color="#7C3AED"
              title="🔬 CORE RADIOBIOLOGICAL PRINCIPLES"
              items={[
                "Pediatric tissues have higher α/β ratios — more sensitive to radiation, particularly rapidly dividing tissues (bone marrow, gonads, CNS in neonates).",
                "Volume effect: children receive proportionally higher bath doses due to smaller body habitus — relative organ volume within field is higher.",
                "Long life expectancy means late effects (secondary malignancy, endocrine dysfunction, neurocognitive) must be weighted heavily.",
                "Dose tolerance is age-dependent — constraints for a 2-year-old differ substantially from a 16-year-old.",
                "Scatter dose to non-target regions (e.g., scatter to gonads in craniospinal RT) must be minimized and documented."
              ]}
            />
            <QuickRefCard
              color="#0891B2"
              title="⚠️ HIGH-RISK LATE EFFECTS TO MONITOR"
              items={[
                "Secondary malignancies: risk elevated 3–10× vs adult population; peak latency 10–20 years post-RT.",
                "Neurocognitive: IQ, memory, processing speed — worse in younger age and with WBI/CSI.",
                "Endocrine: GH deficiency (pituitary), hypothyroidism (thyroid field scatter), premature ovarian failure.",
                "Cardiovascular: cardiomyopathy, coronary artery disease (especially combined with anthracyclines — doxorubicin).",
                "Musculoskeletal: growth plate injury, limb length discrepancy, scoliosis, hypoplasia of soft tissue.",
                "Dental/Jaw: microdontia, caries, osteoradionecrosis, altered facial growth in young children."
              ]}
            />
            <QuickRefCard
              color="#059669"
              title="🎯 TREATMENT PLANNING STRATEGIES"
              items={[
                "IMRT/VMAT preferred to minimize dose to normal structures; Proton therapy increasingly first-line where available to eliminate exit dose.",
                "Always contour full vertebral body (not just cord) for scoliosis assessment; dose symmetry across VB is mandatory.",
                "Extend OAR contours to include growth plates and developing organs not relevant in adults (e.g., tooth buds, hypothalamus).",
                "In bilateral pelvic RT, oophoropexy and testicular shielding should be pre-planned with surgery team.",
                "Utilize Deep-Inspiration Breath Hold (DIBH) or respiratory gating for thoracic/abdominal targets to reduce heart and lung dose.",
                "4D-CT mandatory for mobile targets; account for tumor motion in ITV to avoid geographic miss requiring field extension into OARs."
              ]}
            />
            <QuickRefCard
              color="#DC2626"
              title="💊 CHEMOTHERAPY INTERACTIONS"
              items={[
                "Cisplatin + cochlear RT: synergistic ototoxicity — cisplatin lowers cochlear threshold, even moderate RT doses cause grade 3–4 loss.",
                "Anthracyclines (doxorubicin) + cardiac RT: cumulative cardiotoxicity; combined risk requires cardiologist co-management.",
                "Vincristine + spinal RT: additive peripheral neuropathy; dose constraint to cord and cauda equina tightened.",
                "Actinomycin-D: radiation recall and enhanced acute skin/GI toxicity; reduce concurrent RT doses.",
                "Bleomycin + lung RT: severe pneumonitis risk; V20 < 20% mandatory; avoid high FiO2 perioperatively."
              ]}
            />
          </div>
        )}

        {/* REFERENCES TAB */}
        {activeTab === "references" && (
          <div className="fade-in">
            {[
              {
                category: "Foundational Guidelines",
                color: "#7C3AED",
                refs: [
                  { title: "QUANTEC (2010)", desc: "Quantitative Analyses of Normal Tissue Effects in the Clinic — adapted pediatric thresholds." },
                  { title: "SIOP / COG Protocols", desc: "Society of Pediatric Oncology protocols for Wilms, medulloblastoma, Ewing sarcoma — embedded dose constraints." },
                  { title: "Children's Oncology Group (COG) Radiation Guidelines", desc: "Disease-specific pediatric RT guidelines with organ tolerance tables." },
                  { title: "PENTEC (2021)", desc: "Pediatric Normal Tissue Effects in the Clinic — landmark reference specifically for pediatric OAR constraints." },
                ]
              },
              {
                category: "Neurological / CNS",
                color: "#0891B2",
                refs: [
                  { title: "Merchant et al. (2009)", desc: "Hippocampal dose, mean brain dose, and intellectual outcomes in pediatric RT — IJROBP." },
                  { title: "RTOG 0933", desc: "Hippocampal-avoidance whole brain RT; thresholds adapted for pediatric hippocampus preservation." },
                  { title: "Mulhern et al. (2004)", desc: "Neurocognitive consequences of risk-adapted therapy for childhood medulloblastoma — JNCI." },
                ]
              },
              {
                category: "Hearing / Cochlea",
                color: "#059669",
                refs: [
                  { title: "SIOP Boston Ototoxicity Scale", desc: "Standard grading tool for cisplatin/RT induced pediatric hearing loss." },
                  { title: "Hua et al. (2008)", desc: "Cochlear dose constraints for childhood CNS tumors: 30 Gy threshold — Pediatric Blood Cancer." },
                ]
              },
              {
                category: "Fertility / Gonads",
                color: "#DC2626",
                refs: [
                  { title: "Wallace et al. (2005)", desc: "Ovarian failure following abdominal RT in pediatric patients — dose-response threshold evidence." },
                  { title: "Shalet (1993)", desc: "Testicular radiosensitivity and dose thresholds for spermatogenesis — Clin Endocrinol." },
                ]
              }
            ].map((cat, i) => (
              <div key={i} style={{
                marginBottom: "16px", borderRadius: "12px",
                border: `1px solid ${cat.color}33`,
                backgroundColor: "rgba(255,255,255,0.02)", overflow: "hidden"
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${cat.color}22`,
                  backgroundColor: `${cat.color}11`
                }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, color: cat.color,
                    letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace"
                  }}>{cat.category.toUpperCase()}</span>
                </div>
                {cat.refs.map((ref, j) => (
                  <div key={j} style={{
                    padding: "12px 16px",
                    borderBottom: j < cat.refs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#CBD5E1", marginBottom: "3px" }}>
                      {ref.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.6 }}>{ref.desc}</div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{
              padding: "16px", borderRadius: "12px",
              backgroundColor: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#F59E0B", marginBottom: "8px" }}>
                ⚠️ CLINICAL DISCLAIMER
              </div>
              <div style={{ fontSize: "11px", color: "#78716C", lineHeight: 1.7 }}>
                Constraints presented are evidence-based summaries. Clinical decisions must integrate individual patient factors, treatment intent (curative vs palliative), concurrent therapy, institutional protocol, and multidisciplinary input. Always refer to current COG/SIOP protocols for active treatment decisions. This tool is for educational and reference purposes.
              </div>
            </div>
          </div>
        )}
      </div>

      <KeyFactsSidebar data={SIDEBAR_DATA} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} />

      {/* ── Bottom safe area ── */}
      <div style={{ height: "32px" }} />
    </div>
  );
}
