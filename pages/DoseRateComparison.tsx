import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from "../components/KeyFactsSidebar";

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  ldr:  { primary: "#22D3EE", glow: "rgba(34,211,238,0.25)",  bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.3)"  },
  hdr:  { primary: "#FF6B35", glow: "rgba(255,107,53,0.25)",  bg: "rgba(255,107,53,0.08)",  border: "rgba(255,107,53,0.3)"  },
  pdr:  { primary: "#A3E635", glow: "rgba(163,230,53,0.25)",  bg: "rgba(163,230,53,0.08)",  border: "rgba(163,230,53,0.3)"  },
};

// ─── MASTER DATA ──────────────────────────────────────────────────────────────
const MODALITIES: Record<string, any> = {
  ldr: {
    id: "ldr",
    name: "LDR",
    full: "Low Dose Rate",
    tagline: "Continuous · Protracted · Biological Gold Standard",
    icon: "◎",
    doseRate: "0.4 – 2 Gy/h",
    doseRateRaw: "0.4–2",
    totalTime: "20–144 hours continuous",
    sources: ["Cs-137 (obsolete)", "Ir-192 wires", "I-125 seeds", "Pd-103 seeds", "Au-198 grains"],
    mechanism: "Continuous low-dose irradiation exploits the difference in sublethal damage repair between tumour and normal tissue. The prolonged exposure allows preferential reoxygenation and redistribution of tumour cells into sensitive cell-cycle phases while normal tissues repair.",
    biology: {
      repairTime: "Continuous — full repair of SLD in normal tissues",
      reoxygenation: "Excellent — chronic hypoxia addressed over hours",
      redistribution: "Good — cells cycle through sensitive phases",
      repopulation: "Minimal advantage (short overall time)",
      alphaBetaEffect: "Maximised sparing of late-responding tissues (low α/β)",
    },
    bedFormula: "BED = D × [1 + D/(N × (α/β + g × μ))]",
    bedNote: "Requires Lea-Catcheside factor g; accounts for dose rate and repair kinetics (μ = repair rate constant)",
    clinicalSites: [
      { site: "Prostate", regimen: "I-125: 145 Gy (monotherapy) or 110 Gy (boost)", evidence: "≥15-year data; low/intermediate risk standard" },
      { site: "Prostate", regimen: "Pd-103: 125 Gy (monotherapy)", evidence: "Higher dose rate, faster decay; intermediate risk" },
      { site: "Cervix (historical)", regimen: "Cs-137 intracavitary; replaced by HDR", evidence: "Legacy — GEC-ESTRO now recommends HDR" },
      { site: "Breast (interstitial)", regimen: "Ir-192 wires; accelerated partial breast", evidence: "Multi-catheter APBI; ELIOT/GEC-ESTRO data" },
      { site: "Tongue / Oral", regimen: "Ir-192 loop; 60–70 Gy over 5–7 days", evidence: "Head & neck brachytherapy; high local control" },
    ],
    advantages: [
      "Superior radiobiology — maximum OAR sparing via continuous repair",
      "Excellent local control data spanning decades for prostate (I-125)",
      "Permanent implant (prostate seeds): single procedure, patient convenience",
      "No source exchange required for permanent implants",
      "Intrinsic dose-rate effect exploits low α/β of late-responding tissue",
    ],
    disadvantages: [
      "Inpatient isolation required for temporary implants (radiation protection)",
      "Prolonged source dwell — technically demanding catheter placement",
      "Radiation exposure risk to staff and visitors",
      "Seed migration risk for permanent prostate brachytherapy",
      "Equipment for Cs-137 no longer manufactured; I-125 handling regulations",
      "Limited to specialised centres",
    ],
    radiationProtection: "Inpatient isolation in lead-shielded room. Visitor time <30 min/day. Staff wear TLDs. Permanent seed patients: avoid close contact with pregnant women/children for 2 months.",
    colour: "#22D3EE",
  },
  hdr: {
    id: "hdr",
    name: "HDR",
    full: "High Dose Rate",
    tagline: "Pulsed · Precise · Outpatient-Friendly",
    icon: "◉",
    doseRate: ">12 Gy/h (typically 100–300 Gy/h)",
    doseRateRaw: ">12",
    totalTime: "Minutes per fraction; multiple sessions",
    sources: ["Ir-192 (3 mm stepping source)", "Co-60 (longer half-life alternative)"],
    mechanism: "Single high-activity source steps through catheters creating highly conformal dose distributions. Each fraction delivered in minutes. Biological effect relies on standard fractionation radiobiology — sublethal repair between fractions must be adequate (>6h interfraction interval).",
    biology: {
      repairTime: "Between fractions (≥6h); full repair between sessions",
      reoxygenation: "Per fraction — relies on interfraction interval",
      redistribution: "Per fraction — limited within single session",
      repopulation: "Depends on overall treatment time",
      alphaBetaEffect: "Fractionation schedule must compensate for lost dose-rate advantage",
    },
    bedFormula: "BED = n × d × [1 + d/(α/β)]",
    bedNote: "Standard LQ model applies. n = fractions, d = dose/fraction. No Lea-Catcheside factor needed (instantaneous delivery per fraction).",
    clinicalSites: [
      { site: "Cervix / Uterus", regimen: "5.5–7 Gy × 4–5 fractions (combined with EBRT 45 Gy)", evidence: "GEC-ESTRO MRI-guided standard; EMBRACE data" },
      { site: "Prostate (boost)", regimen: "9.5–15 Gy × 2 fractions (boost after EBRT 46 Gy)", evidence: "ASCENDE-RT: superior BCR-free survival vs EBRT alone" },
      { site: "Prostate (monotherapy)", regimen: "13.5 Gy × 2 fx or 9.5 Gy × 4 fx", evidence: "ISIO/GEC-ESTRO phase II data — emerging standard" },
      { site: "Breast (APBI)", regimen: "3.4 Gy × 10 fx BD or 4 Gy × 8 fx", evidence: "GEC-ESTRO/NSABP B39; non-inferior to WBI in selected" },
      { site: "Oesophagus", regimen: "4 Gy × 3–5 fractions palliative", evidence: "Effective dysphagia palliation; SIREC data" },
      { site: "Bronchus (endobronchial)", regimen: "7.5 Gy × 3 fractions", evidence: "Haemoptysis, obstruction palliation; ABS guidelines" },
      { site: "Skin (surface mould)", regimen: "3–4 Gy × 10 fractions", evidence: "Non-melanoma skin cancer, keloids" },
    ],
    advantages: [
      "Outpatient treatment — no inpatient isolation required",
      "Highly conformal with computer-optimised dwell times",
      "Flexible fractionation — multiple biological schedules possible",
      "MRI-guided adaptive planning feasible (cervix GEC-ESTRO)",
      "No radiation exposure to staff/visitors outside treatment room",
      "Applicable across many sites — cervix, prostate, breast, lung, oesophagus",
      "Shorter overall treatment time vs LDR temporary implants",
    ],
    disadvantages: [
      "Multiple anaesthetics/sedations required (catheter repositioning between fractions)",
      "Catheter displacement risk between fractions",
      "Less biological advantage vs LDR for OAR sparing",
      "High source activity requires expensive remote afterloader and bunker",
      "Strict QA requirements — source position verification mandatory each fraction",
      "Ir-192 source must be replaced every 3–4 months",
    ],
    radiationProtection: "Remote afterloader in shielded room (bunker). No staff/visitor exposure during treatment. Source requires secure storage. Emergency source retraction mandatory. Radiation survey after each treatment.",
    colour: "#FF6B35",
  },
  pdr: {
    id: "pdr",
    name: "PDR",
    full: "Pulsed Dose Rate",
    tagline: "Simulated LDR Biology · HDR Technology",
    icon: "◌",
    doseRate: "0.5–1 Gy/pulse; ~10–12 pulses/day",
    doseRateRaw: "0.5–1/pulse",
    totalTime: "1–6 days; pulses q1–2h",
    sources: ["Ir-192 (stepping source — same as HDR unit)"],
    mechanism: "Mimics LDR radiobiology using an HDR afterloader delivering pulses hourly (typically 10–12 min every 1–2 hours). The inter-pulse interval allows sublethal repair similar to continuous LDR while using same physical equipment as HDR. Dose optimisation applied to each pulse.",
    biology: {
      repairTime: "Inter-pulse interval (typically 1h) — partial repair approximates LDR",
      reoxygenation: "Good — continuous implant allows chronic reoxygenation",
      redistribution: "Good — cells cycle through sensitive phases over days",
      repopulation: "Minimal (similar total time to LDR)",
      alphaBetaEffect: "Approaches LDR sparing — depends on pulse parameters (interval, dose/pulse)",
    },
    bedFormula: "BED_PDR ≈ BED_LDR when: pulse interval ≤1h, dose/pulse ≤0.5 Gy",
    bedNote: "PDR BED increases with longer pulse interval or higher dose/pulse. Use Bourhis/Brenner PDR BED model for exact calculation. Biological equivalence to LDR not guaranteed at all pulse parameters.",
    clinicalSites: [
      { site: "Cervix / Gynaecological", regimen: "0.6 Gy/h equivalent; pulses q1h × 2–4 days", evidence: "GEC-ESTRO accepted; equivalent local control to LDR" },
      { site: "Head & Neck (interstitial)", regimen: "0.5 Gy/pulse q1h; total 50–70 Gy equivalent", evidence: "Floor of mouth, tongue, lip; high local control" },
      { site: "Breast (interstitial)", regimen: "PDR APBI; equivalent to LDR schedules", evidence: "Multi-catheter; GEC-ESTRO phase II data" },
      { site: "Anorectal", regimen: "PDR boost; limited evidence", evidence: "Selected centres; combined with EBRT" },
    ],
    advantages: [
      "Biological advantages of LDR with HDR stepping-source technology",
      "Same hardware as HDR afterloader — no additional equipment purchase",
      "Real-time dose optimisation possible per pulse (unlike fixed LDR wires)",
      "Improved dose conformity vs classical LDR (Ir-192 wires)",
      "Staff radiation safety: only exposed during catheter insertion/removal",
      "Allows daily clinical review and plan adaptation",
      "Particularly beneficial when HDR fractionated delivery is logistically difficult",
    ],
    disadvantages: [
      "Inpatient admission required for full duration (days)",
      "Requires dedicated PDR afterloader or HDR unit with PDR capability",
      "Complex scheduling — interruptions (patient care, procedures) disrupt pulse timing",
      "BED equivalence to LDR only approximated — dose/pulse and interval must be controlled",
      "Less widely available than HDR",
      "Patient comfort issues: prolonged catheter retention with movement restriction",
      "Pulse interruptions (nurse calls, vitals) can alter biological effectiveness",
    ],
    radiationProtection: "Shielded room; automated source retraction for staff entry. Radiation badge monitoring for nursing staff. Timed re-entry protocol after each pulse. Emergency retraction to safe position.",
    colour: "#A3E635",
  },
};

// ─── COMPARISON DATA ──────────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { label: "Dose Rate",          key: "doseRate",     ldr: "0.4–2 Gy/h",          hdr: ">12 Gy/h (100–300 Gy/h)",  pdr: "0.5–1 Gy/pulse q1–2h" },
  { label: "Source",             key: "source",       ldr: "I-125, Pd-103, Ir-192 wires", hdr: "Ir-192 (3mm), Co-60",  pdr: "Ir-192 (same as HDR)" },
  { label: "Treatment Time",     key: "time",         ldr: "20–144h continuous",   hdr: "Minutes/fraction",          pdr: "1–6 days (pulses)" },
  { label: "Patient Setting",    key: "setting",      ldr: "Inpatient (temp) / Day (perm)", hdr: "Outpatient",         pdr: "Inpatient" },
  { label: "Fractions",          key: "fractions",    ldr: "Continuous (1 'fraction')", hdr: "2–10 fractions",       pdr: "~10–60 pulses" },
  { label: "BED Model",          key: "bed",          ldr: "LQ + Lea-Catcheside g", hdr: "Standard LQ",              pdr: "Modified LQ (Brenner/Bourhis)" },
  { label: "OAR Sparing",        key: "oar",          ldr: "★★★★★ Maximum",         hdr: "★★★ Good (fractionated)", pdr: "★★★★ Near-LDR" },
  { label: "Dose Conformity",    key: "conformity",   ldr: "★★★ Good",              hdr: "★★★★★ Excellent (IPSA)", pdr: "★★★★ Very Good" },
  { label: "Staff Exposure",     key: "staffExp",     ldr: "HIGH (temp); Low (perm)", hdr: "NONE (remote)",          pdr: "LOW (entry protocols)" },
  { label: "Anaesthesia",        key: "anaes",        ldr: "Single (temp) / None (perm)", hdr: "Per fraction (sedation)", pdr: "Single (catheter insertion)" },
  { label: "Equipment Cost",     key: "cost",         ldr: "Seed implanters; LDR afterloader", hdr: "Remote afterloader + bunker", pdr: "HDR unit + PDR software" },
  { label: "Optimisation",       key: "opt",          ldr: "Manual / IPSA (seeds)", hdr: "IPSA / HIPO real-time",   pdr: "Per-pulse IPSA" },
  { label: "MRI-Guided",         key: "mri",          ldr: "Limited",               hdr: "Yes (cervix GEC-ESTRO)",  pdr: "Possible" },
  { label: "Half-life (source)", key: "halflife",     ldr: "I-125: 59d / Pd-103: 17d", hdr: "Ir-192: 74d / Co-60: 5.3y", pdr: "Ir-192: 74d" },
];

// ─── PHYSICS SECTION DATA ────────────────────────────────────────────────────
const PHYSICS = [
  {
    title: "Dose Rate Effect",
    icon: "⚡",
    content: "At lower dose rates, normal tissues (especially late-responding, low α/β) have more time to repair sublethal damage (SLD) between ionisation events. Tumours, especially hypoxic regions, repair less efficiently — creating a therapeutic window. This is the fundamental radiobiological advantage of LDR over HDR delivered as monotherapy."
  },
  {
    title: "Lea-Catcheside Factor (g)",
    icon: "∫",
    content: "The Lea-Catcheside factor g accounts for incomplete repair during continuous irradiation. g = [2/(μT)] × [1 – (1–e^{–μT})/(μT)] where μ = ln2/t½(repair) and T = irradiation time. For LDR: g < 1, reducing BED relative to acute delivery. For HDR: g ≈ 1 (instantaneous). PDR: g is intermediate based on pulse parameters."
  },
  {
    title: "BED Equivalence: LDR ↔ HDR",
    icon: "≡",
    content: "To convert LDR total dose D_LDR to equivalent HDR fractionation: n_HDR × d_HDR × [1 + d_HDR/(α/β)] = D_LDR × [1 + (D_LDR × g)/(T × (α/β))]. For prostate (α/β = 1.5 Gy): 145 Gy LDR (I-125) ≈ 9.5–10 Gy × 2 fractions HDR. For cervix (α/β = 10 Gy tumour): 35 Gy LDR ≈ 6–7 Gy × 4–5 fractions HDR."
  },
  {
    title: "PDR Biological Equivalence",
    icon: "≈",
    content: "PDR approximates LDR when: (1) pulse interval ≤1h, and (2) dose/pulse ≤0.5 Gy. The Brenner & Hall model shows PDR BED = LDR BED when these conditions are met. Increasing pulse interval beyond 1h or dose/pulse above 1 Gy progressively moves PDR biology toward HDR. Pulse parameters must be explicitly justified and documented."
  },
  {
    title: "α/β Ratios in Brachytherapy",
    icon: "αβ",
    content: "Prostate cancer: α/β ≈ 1.5 Gy (low — highly sensitive to dose per fraction → HDR boost highly effective). Cervix cancer: α/β ≈ 10 Gy tumour, 3 Gy (rectum/bladder OARs). Breast cancer: α/β ≈ 4 Gy. Brain: α/β ≈ 2 Gy. The lower the α/β, the greater the advantage of hypofractionation (HDR) and LDR continuous irradiation."
  },
  {
    title: "TRAK & Source Strength",
    icon: "◎",
    content: "Total Reference Air Kerma (TRAK) defines source strength. LDR: measured in μGy·m²/h (I-125 ~6.7 × 10⁻⁸ Gy·m² per seed). HDR Ir-192: ~40,000 μGy·m²/h (40,000× higher activity). TRAK used for radiation protection calculations, room shielding design, and staff dose estimation in all modalities."
  },
];

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedBar({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 200);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: "#94A3B8" }}>{label}</span>
        <span style={{ fontSize: "11px", color, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`, borderRadius: "3px",
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}66`
        }} />
      </div>
    </div>
  );
}

// ─── MODAL CARD ───────────────────────────────────────────────────────────────
function ModalityCard({ m, isActive, onClick }: { m: any; isActive: boolean; onClick: () => void }) {
  const col = (C as any)[m.id];
  return (
    <button onClick={onClick} style={{
      flex: "1 1 0", minWidth: "80px",
      padding: "16px 10px",
      backgroundColor: isActive ? col.bg : "rgba(255,255,255,0.03)",
      border: `2px solid ${isActive ? col.primary : "rgba(255,255,255,0.07)"}`,
      borderRadius: "16px", cursor: "pointer", textAlign: "center",
      transition: "all 0.3s ease",
      boxShadow: isActive ? `0 0 28px ${col.glow}` : "none"
    }}>
      <div style={{
        fontSize: "28px", fontFamily: "'Space Mono', monospace",
        color: isActive ? col.primary : "#334155",
        marginBottom: "6px",
        textShadow: isActive ? `0 0 20px ${col.primary}` : "none",
        transition: "all 0.3s"
      }}>{m.icon}</div>
      <div style={{
        fontSize: "16px", fontWeight: 900, color: isActive ? col.primary : "#64748B",
        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em"
      }}>{m.name}</div>
      <div style={{ fontSize: "9px", color: isActive ? col.primary + "BB" : "#334155", marginTop: "2px",
        fontFamily: "'Space Mono', monospace" }}>
        {m.doseRateRaw} Gy/h
      </div>
    </button>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ m }: { m: any }) {
  const col = (C as any)[m.id];
  const [subTab, setSubTab] = useState("overview");

  const tabs = [
    { id: "overview",  label: "Overview"   },
    { id: "clinical",  label: "Clinical"   },
    { id: "procon",    label: "Pro / Con"  },
    { id: "physics",   label: "Physics"    },
    { id: "rp",        label: "Rad Protection" },
  ];

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.02)",
      borderRadius: "20px",
      border: `1px solid ${col.border}`,
      overflow: "hidden",
      animation: "slideIn 0.35s ease"
    }}>
      {/* Panel header */}
      <div style={{
        padding: "20px 20px 16px",
        background: `linear-gradient(135deg, ${col.bg}, transparent)`,
        borderBottom: `1px solid ${col.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            backgroundColor: col.bg, border: `2px solid ${col.primary}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", color: col.primary,
            boxShadow: `0 0 24px ${col.glow}`,
            fontFamily: "'Space Mono', monospace"
          }}>{m.icon}</div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{
                fontSize: "28px", fontWeight: 900, color: col.primary,
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em",
                textShadow: `0 0 30px ${col.glow}`
              }}>{m.name}</span>
              <span style={{ fontSize: "13px", color: "#64748B" }}>{m.full}</span>
            </div>
            <div style={{
              fontSize: "11px", color: col.primary + "AA",
              fontFamily: "'Space Mono', monospace"
            }}>{m.tagline}</div>
          </div>
        </div>
        {/* Dose rate chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          marginTop: "14px", padding: "8px 16px", borderRadius: "30px",
          backgroundColor: col.bg, border: `1px solid ${col.border}`
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: col.primary,
            boxShadow: `0 0 8px ${col.primary}`,
            animation: "pulse 2s infinite"
          }} />
          <span style={{
            fontSize: "13px", fontWeight: 700, color: col.primary,
            fontFamily: "'Space Mono', monospace"
          }}>{m.doseRate}</span>
          <span style={{ fontSize: "10px", color: "#64748B" }}>dose rate</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: "flex", overflowX: "auto", gap: "0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        scrollbarWidth: "none"
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            flexShrink: 0, padding: "11px 16px",
            background: "none", border: "none",
            borderBottom: subTab === t.id ? `2px solid ${col.primary}` : "2px solid transparent",
            color: subTab === t.id ? col.primary : "#475569",
            fontSize: "11px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "0.04em"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div style={{ padding: "20px" }}>

        {/* OVERVIEW */}
        {subTab === "overview" && (
          <div>
            <p style={{
              fontSize: "13px", color: "#94A3B8", lineHeight: 1.8,
              marginBottom: "20px", borderLeft: `3px solid ${col.primary}`,
              paddingLeft: "14px"
            }}>{m.mechanism}</p>

            {/* Biology grid */}
            <div style={{
              fontSize: "10px", fontWeight: 700, color: col.primary,
              letterSpacing: "0.12em", marginBottom: "12px",
              fontFamily: "'Space Mono', monospace"
            }}>RADIOBIOLOGY PROFILE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {Object.entries(m.biology).map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", gap: "12px", alignItems: "flex-start",
                  padding: "10px 12px", borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.03)"
                }}>
                  <span style={{
                    flexShrink: 0, fontSize: "9px", fontWeight: 700,
                    color: col.primary, fontFamily: "'Space Mono', monospace",
                    textTransform: "uppercase", width: "100px", paddingTop: "1px",
                    letterSpacing: "0.06em"
                  }}>
                    {k.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.5 }}>{v as string}</span>
                </div>
              ))}
            </div>

            {/* BED formula */}
            <div style={{
              padding: "14px 16px", borderRadius: "12px",
              backgroundColor: col.bg, border: `1px solid ${col.border}`
            }}>
              <div style={{
                fontSize: "10px", color: col.primary, fontWeight: 700,
                letterSpacing: "0.1em", marginBottom: "8px",
                fontFamily: "'Space Mono', monospace"
              }}>BED FORMULA</div>
              <div style={{
                fontSize: "13px", color: "#E2E8F0",
                fontFamily: "'Space Mono', monospace", marginBottom: "6px",
                overflowX: "auto", whiteSpace: "nowrap"
              }}>{m.bedFormula}</div>
              <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.6 }}>{m.bedNote}</div>
            </div>

            {/* Sources */}
            <div style={{ marginTop: "16px" }}>
              <div style={{
                fontSize: "10px", color: col.primary, fontWeight: 700,
                letterSpacing: "0.12em", marginBottom: "10px",
                fontFamily: "'Space Mono', monospace"
              }}>RADIOACTIVE SOURCES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(m.sources as string[]).map(s => (
                  <span key={s} style={{
                    padding: "5px 12px", borderRadius: "20px",
                    backgroundColor: col.bg, border: `1px solid ${col.border}`,
                    fontSize: "11px", color: col.primary,
                    fontFamily: "'Space Mono', monospace"
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLINICAL */}
        {subTab === "clinical" && (
          <div>
            <div style={{
              fontSize: "10px", color: col.primary, fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: "14px",
              fontFamily: "'Space Mono', monospace"
            }}>CLINICAL APPLICATIONS & REGIMENS</div>
            {(m.clinicalSites as any[]).map((cs, i) => (
              <div key={i} style={{
                marginBottom: "10px", padding: "14px 16px",
                borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
                borderLeft: `3px solid ${col.primary}`
              }}>
                <div style={{
                  fontSize: "12px", fontWeight: 700, color: col.primary,
                  marginBottom: "4px", fontFamily: "'Space Mono', monospace"
                }}>{cs.site}</div>
                <div style={{
                  fontSize: "12px", color: "#E2E8F0", marginBottom: "4px",
                  fontFamily: "'Space Mono', monospace", fontWeight: 700
                }}>{cs.regimen}</div>
                <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.6 }}>{cs.evidence}</div>
              </div>
            ))}
          </div>
        )}

        {/* PRO / CON */}
        {subTab === "procon" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={{
                fontSize: "10px", color: "#22C55E", fontWeight: 700,
                letterSpacing: "0.1em", marginBottom: "10px",
                fontFamily: "'Space Mono', monospace"
              }}>✓ ADVANTAGES</div>
              {(m.advantages as string[]).map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start"
                }}>
                  <span style={{ color: "#22C55E", fontSize: "12px", flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.5 }}>{a}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{
                fontSize: "10px", color: "#EF4444", fontWeight: 700,
                letterSpacing: "0.1em", marginBottom: "10px",
                fontFamily: "'Space Mono', monospace"
              }}>✗ DISADVANTAGES</div>
              {(m.disadvantages as string[]).map((d, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start"
                }}>
                  <span style={{ color: "#EF4444", fontSize: "12px", flexShrink: 0 }}>−</span>
                  <span style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHYSICS */}
        {subTab === "physics" && (
          <div>
            <div style={{
              fontSize: "10px", color: col.primary, fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: "14px",
              fontFamily: "'Space Mono', monospace"
            }}>RADIOPHYSICS PRINCIPLES</div>
            {PHYSICS.map((p, i) => (
              <div key={i} style={{
                marginBottom: "12px", padding: "14px 16px",
                borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{
                    fontSize: "18px", color: col.primary,
                    fontFamily: "'Space Mono', monospace"
                  }}>{p.icon}</span>
                  <span style={{
                    fontSize: "12px", fontWeight: 700, color: "#E2E8F0",
                    fontFamily: "'Space Mono', monospace"
                  }}>{p.title}</span>
                </div>
                <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.7 }}>{p.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* RAD PROTECTION */}
        {subTab === "rp" && (
          <div>
            <div style={{
              fontSize: "10px", color: col.primary, fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: "14px",
              fontFamily: "'Space Mono', monospace"
            }}>RADIATION PROTECTION PROTOCOLS</div>
            <div style={{
              padding: "16px", borderRadius: "14px",
              backgroundColor: col.bg, border: `1px solid ${col.border}`,
              marginBottom: "16px"
            }}>
              <p style={{ fontSize: "13px", color: "#E2E8F0", lineHeight: 1.8 }}>
                {m.radiationProtection}
              </p>
            </div>
            {/* Staff dose viz */}
            <div style={{
              padding: "14px 16px", borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.03)"
            }}>
              <div style={{
                fontSize: "10px", color: col.primary, fontWeight: 700,
                letterSpacing: "0.1em", marginBottom: "14px",
                fontFamily: "'Space Mono', monospace"
              }}>RELATIVE STAFF DOSE RISK</div>
              <AnimatedBar value={m.id === "ldr" ? 75 : m.id === "hdr" ? 2 : 20}
                max={100} color={col.primary} label="Staff Exposure Risk" unit="%" />
              <AnimatedBar value={m.id === "ldr" ? 30 : m.id === "hdr" ? 5 : 15}
                max={100} color={col.primary} label="Visitor Restriction Level" unit="%" />
              <AnimatedBar value={m.id === "ldr" ? 60 : m.id === "hdr" ? 95 : 45}
                max={100} color={col.primary} label="Remote Afterloader Safety" unit="%" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPARISON TABLE ─────────────────────────────────────────────────────────
function ComparisonTable() {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
        <thead>
          <tr>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px",
              color: "#475569", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em",
              fontWeight: 700 }}>PARAMETER</th>
            {["ldr","hdr","pdr"].map(id => (
              <th key={id} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: "14px", color: (C as any)[id].primary,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em"
              }}>{id.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={row.key}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: "background 0.15s" }}
            >
              <td style={{
                padding: "10px 14px",
                backgroundColor: hovered === i ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                borderRadius: "8px 0 0 8px",
                fontSize: "11px", color: "#94A3B8",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 600, whiteSpace: "nowrap"
              }}>{row.label}</td>
              {["ldr","hdr","pdr"].map(id => (
                <td key={id} style={{
                  padding: "10px 14px",
                  backgroundColor: hovered === i ? (C as any)[id].bg : "rgba(255,255,255,0.02)",
                  fontSize: "11px", color: "#CBD5E1", lineHeight: 1.5,
                  borderRight: `1px solid ${hovered === i ? (C as any)[id].border : "transparent"}`,
                  transition: "all 0.15s"
                }}>{(row as any)[id]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── BED CALCULATOR ───────────────────────────────────────────────────────────
function BEDCalculator() {
  const [mode, setMode] = useState("hdr");
  const [nFx, setNFx] = useState(4);
  const [dFx, setDFx] = useState(7);
  const [ab, setAb] = useState(10);
  const [ldrDose, setLdrDose] = useState(35);
  const [ldrRate, setLdrRate] = useState(0.6);
  const [muHalf, setMuHalf] = useState(1.5);

  // HDR BED
  const hdrBED = nFx * dFx * (1 + dFx / ab);
  const hdrEQD2 = hdrBED / (1 + 2 / ab);

  // LDR BED (simplified — Lea-Catcheside g)
  const T = ldrDose / ldrRate; // hours
  const mu = Math.log(2) / muHalf;
  const g = (2 / (mu * T)) * (1 - (1 - Math.exp(-mu * T)) / (mu * T));
  const ldrBED = ldrDose * (1 + (g * ldrDose) / (ab * T / 1)); // simplified
  const ldrEQD2 = ldrBED / (1 + 2 / ab);

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.02)",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "20px"
    }}>
      <div style={{
        fontSize: "11px", color: "#22D3EE", fontWeight: 700,
        letterSpacing: "0.12em", marginBottom: "16px",
        fontFamily: "'Space Mono', monospace"
      }}>⚗ QUICK BED CALCULATOR</div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px",
        backgroundColor: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px" }}>
        {[{id:"hdr",label:"HDR BED"},{id:"ldr",label:"LDR BED"}].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: "9px",
            backgroundColor: mode === m.id ? (C as any)[m.id].primary : "transparent",
            border: "none", borderRadius: "8px",
            color: mode === m.id ? "#0A0F1A" : "#64748B",
            fontSize: "11px", fontWeight: 800, cursor: "pointer",
            fontFamily: "'Space Mono', monospace", transition: "all 0.2s"
          }}>{m.label}</button>
        ))}
      </div>

      {mode === "hdr" ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Fractions (n)", val: nFx, set: setNFx, min: 1, max: 20, step: 1 },
              { label: "Dose/fx (Gy)", val: dFx, set: setDFx, min: 1, max: 20, step: 0.5 },
              { label: "α/β (Gy)", val: ab, set: setAb, min: 1, max: 15, step: 0.5 },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: "9px", color: "#475569", fontFamily: "'Space Mono', monospace",
                  display: "block", marginBottom: "4px" }}>{f.label}</label>
                <input type="number" value={f.val} min={f.min} max={f.max} step={f.step}
                  onChange={e => f.set(Number(e.target.value))}
                  style={{
                    width: "100%", padding: "8px 10px",
                    backgroundColor: "rgba(255,107,53,0.1)",
                    border: "1px solid rgba(255,107,53,0.3)",
                    borderRadius: "8px", color: "#FF6B35",
                    fontSize: "13px", fontFamily: "'Space Mono', monospace",
                    outline: "none"
                  }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "BED (Gy)", val: hdrBED.toFixed(1), color: "#FF6B35" },
              { label: "EQD2 (Gy)", val: hdrEQD2.toFixed(1), color: "#FBBF24" },
            ].map(r => (
              <div key={r.label} style={{
                padding: "14px", borderRadius: "12px",
                backgroundColor: r.color + "15",
                border: `1px solid ${r.color}44`, textAlign: "center"
              }}>
                <div style={{ fontSize: "9px", color: r.color, fontFamily: "'Space Mono', monospace",
                  marginBottom: "4px" }}>{r.label}</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: r.color,
                  fontFamily: "'Bebas Neue', sans-serif" }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            {[
              { label: "Total dose (Gy)", val: ldrDose, set: setLdrDose, min: 10, max: 200, step: 5 },
              { label: "Dose rate (Gy/h)", val: ldrRate, set: setLdrRate, min: 0.1, max: 2, step: 0.1 },
              { label: "α/β (Gy)", val: ab, set: setAb, min: 1, max: 15, step: 0.5 },
              { label: "μ½ repair (h)", val: muHalf, set: setMuHalf, min: 0.5, max: 3, step: 0.5 },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: "9px", color: "#475569", fontFamily: "'Space Mono', monospace",
                  display: "block", marginBottom: "4px" }}>{f.label}</label>
                <input type="number" value={f.val} min={f.min} max={f.max} step={f.step}
                  onChange={e => f.set(Number(e.target.value))}
                  style={{
                    width: "100%", padding: "8px 10px",
                    backgroundColor: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.3)",
                    borderRadius: "8px", color: "#22D3EE",
                    fontSize: "13px", fontFamily: "'Space Mono', monospace",
                    outline: "none"
                  }} />
              </div>
            ))}
          </div>
          <div style={{
            fontSize: "10px", color: "#475569", marginBottom: "12px",
            fontFamily: "'Space Mono', monospace"
          }}>
            Irradiation time: {(ldrDose / ldrRate).toFixed(1)}h · Lea-Catcheside g: {g.toFixed(3)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "BED (Gy)", val: ldrBED.toFixed(1), color: "#22D3EE" },
              { label: "EQD2 (Gy)", val: ldrEQD2.toFixed(1), color: "#67E8F9" },
            ].map(r => (
              <div key={r.label} style={{
                padding: "14px", borderRadius: "12px",
                backgroundColor: r.color + "15",
                border: `1px solid ${r.color}44`, textAlign: "center"
              }}>
                <div style={{ fontSize: "9px", color: r.color, fontFamily: "'Space Mono', monospace",
                  marginBottom: "4px" }}>{r.label}</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: r.color,
                  fontFamily: "'Bebas Neue', sans-serif" }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR DATA ─────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'Dose Rates',
    emoji: '⏱️',
    accent: '#22D3EE',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.4)',
    rows: [
      { k: 'LDR', v: '0.4 – 2 Gy/h', mono: true },
      { k: 'MDR', v: '2 – 12 Gy/h', mono: true },
      { k: 'HDR', v: '> 12 Gy/h', mono: true },
      { k: 'PDR', v: 'Pulsed (e.g. 1 Gy/h)', mono: true },
    ]
  },
  {
    title: 'Isotopes',
    emoji: '☢️',
    accent: '#FF6B35',
    bg: 'rgba(255,107,53,0.08)',
    border: 'rgba(255,107,53,0.4)',
    rows: [
      { k: 'Ir-192', v: '73.8 days (HDR/PDR)', mono: true },
      { k: 'I-125', v: '59.4 days (LDR)', mono: true },
      { k: 'Pd-103', v: '17.0 days (LDR)', mono: true },
      { k: 'Co-60', v: '5.26 years (HDR)', mono: true },
    ]
  },
  {
    title: 'Key Formulas',
    emoji: '📐',
    accent: '#A3E635',
    bg: 'rgba(163,230,53,0.08)',
    border: 'rgba(163,230,53,0.4)',
    rows: [
      { k: 'HDR BED', v: 'nd(1 + d/(α/β))', mono: true },
      { k: 'LDR BED', v: 'D(1 + D/(N(α/β + gμ)))', mono: true },
    ]
  }
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DoseRateComparison() {
  const [activeModality, setActiveModality] = useState("hdr");
  const [mainTab, setMainTab] = useState("detail");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mod = MODALITIES[activeModality];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 20%, #0D1B2A 0%, #060B12 60%)",
      fontFamily: "'DM Sans', sans-serif", color: "#F1F5F9"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 3px; height: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; } @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.9)} } @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} } @keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: "sticky", top: "44px", zIndex: 40,
        background: "rgba(6,11,18,0.95)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "linear-gradient(135deg, #22D3EE, #FF6B35, #A3E635)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "0 0 20px rgba(34,211,238,0.3)"
            }}>☢</div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: "17px", fontWeight: 900, color: "#F8FAFC",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em", lineHeight: 1
              }}>LDR · HDR · PDR BRACHYTHERAPY</h1>
              <div style={{
                fontSize: "10px", color: "#475569", marginTop: "2px",
                fontFamily: "'Space Mono', monospace"
              }}>Dose Rate Comparison · Radiobiology · BED Calculator · Radiation Protection</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "16px" }}>

        {/* ── MODALITY SELECTOR ── */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          {Object.values(MODALITIES).map(m => (
            <ModalityCard
              key={m.id} m={m}
              isActive={activeModality === m.id}
              onClick={() => setActiveModality(m.id)}
            />
          ))}
        </div>

        {/* ── MAIN TABS ── */}
        <div style={{
          display: "flex", gap: "4px", marginBottom: "16px",
          backgroundColor: "rgba(255,255,255,0.03)",
          padding: "4px", borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          {[
            { id: "detail", label: "Modality Detail" },
            { id: "compare", label: "Side-by-Side" },
            { id: "calc", label: "BED Calc" },
          ].map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              flex: 1, padding: "10px 8px",
              backgroundColor: mainTab === t.id ? (C as any)[activeModality].primary : "transparent",
              border: "none", borderRadius: "10px",
              color: mainTab === t.id ? "#0A0F1A" : "#64748B",
              fontSize: "11px", fontWeight: 800, cursor: "pointer",
              fontFamily: "'Space Mono', monospace",
              transition: "all 0.25s ease",
              boxShadow: mainTab === t.id ? `0 0 16px ${(C as any)[activeModality].glow}` : "none"
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        {mainTab === "detail" && <DetailPanel key={activeModality} m={mod} />}
        {mainTab === "compare" && (
          <div style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "20px",
            animation: "slideIn 0.3s ease"
          }}>
            <div style={{
              fontSize: "11px", color: "#94A3B8", fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: "16px",
              fontFamily: "'Space Mono', monospace"
            }}>FULL PARAMETER COMPARISON</div>
            <ComparisonTable />
          </div>
        )}
        {mainTab === "calc" && <BEDCalculator />}

        <KeyFactsSidebar data={SIDEBAR_DATA} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} />

        {/* ── DISCLAIMER ── */}
        <div style={{
          marginTop: "20px", padding: "14px 16px", borderRadius: "14px",
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div style={{
            fontSize: "10px", color: "#475569", fontWeight: 700,
            letterSpacing: "0.1em", marginBottom: "6px",
            fontFamily: "'Space Mono', monospace"
          }}>⚠ DISCLAIMER</div>
          <div style={{ fontSize: "11px", color: "#374151", lineHeight: 1.7 }}>
            BED calculations are approximate reference values. Clinical dose prescriptions must follow institutional protocols, GEC-ESTRO/ABS guidelines, and full treatment planning system verification. Radiation protection protocols must comply with national regulatory requirements and local physics department rules.
          </div>
        </div>
        <div style={{ height: "32px" }} />
      </div>
    </div>
  );
}
