import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, XCircle } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// COLOUR SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
const COL = {
  rose:   "#F43F5E",
  roseDim:"rgba(244,63,94,0.12)",
  roseBd: "rgba(244,63,94,0.35)",
  gold:   "#FBBF24",
  goldDim:"rgba(251,191,36,0.10)",
  goldBd: "rgba(251,191,36,0.30)",
  teal:   "#2DD4BF",
  tealDim:"rgba(45,212,191,0.10)",
  tealBd: "rgba(45,212,191,0.30)",
  sky:    "#38BDF8",
  skyDim: "rgba(56,189,248,0.10)",
  skyBd:  "rgba(56,189,248,0.30)",
  violet: "#A78BFA",
  lime:   "#86EFAC",
  slate:  "#334155",
  muted:  "#64748B",
  dim:    "#475569",
  text:   "#E2E8F0",
  subtext:"#94A3B8",
  bg:     "#060A10",
  card:   "#0C1220",
  card2:  "rgba(255,255,255,0.03)",
};

// ══════════════════════════════════════════════════════════════════════════════
// MASTER KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════════

const SECTIONS = [

  // ─── 1. ANATOMY & APPLICATOR OVERVIEW ─────────────────────────────────────
  {
    id: "anatomy",
    icon: "🫀",
    title: "Anatomy & Applicator System",
    color: COL.rose,
    subsections: [
      {
        id: "anatomy-overview",
        title: "Relevant Anatomy for Cervix Brachytherapy",
        content: `The uterus is an anteverted, anteflexed muscular organ lying between the bladder (anteriorly) and rectum (posteriorly). The cervix is the lower cylindrical portion, approximately 3–4 cm long and 2.5 cm wide. The cervical canal (endocervical canal) runs from the external os to the internal os, connecting to the uterine cavity.

The vaginal fornices (anterior, posterior, and two lateral fornices) surround the cervix and are critically important anatomical spaces in brachytherapy — they are where the ovoids or ring sit, allowing dose delivery to the parametria.

The parametrium is the fibrous connective tissue extending laterally from the cervix, through which the uterine vessels run. Parametrial invasion (FIGO Stage IIB+) requires coverage by brachytherapy dose.

Key anatomical relationships:
• Bladder lies immediately anterior to the uterus — bladder trigone is at particular risk
• Rectum lies 2–4 cm posterior to the posterior vaginal fornix
• Sigmoid colon lies posterosuperiorly — important in high parametrial disease
• Ureters pass within 1.5 cm of the lateral cervix — parametrial dose must not inadvertently include ureteric segment`
      },
      {
        id: "applicator-types",
        title: "Types of Intracavitary Applicators",
        content: `Three fundamental applicator systems are used in cervix brachytherapy:

1. TANDEM AND OVOIDS (T&O) — Fletcher-Williamson / Fletcher-Suit-Delclos
   The classic system. A central tandem is inserted through the cervical os into the uterine cavity, flanked by two ovoids placed in the lateral vaginal fornices. This recreates the classical pear-shaped isodose distribution.
2. TANDEM AND RING (T&R) — Vienna Applicator (Varian) / Utrecht
   A ring replaces the two ovoids. The ring sits in the vaginal fornix circumferentially. Advantage: more reproducible geometry, easier MRI-based planning. The ring has a fixed geometric relationship with the tandem — important for reproducible dose planning. Used extensively in GEC-ESTRO MRI-guided protocols.
3. TANDEM ALONE / INTRAUTERINE TUBE ONLY
   Used when vaginal stenosis or tumour anatomy prevents ovoid/ring placement. Higher dose to Point A but poor lateral parametrial coverage.
4. INTERSTITIAL + INTRACAVITARY (Hybrid)
   Tandem + ring/ovoids PLUS perineal template needles (Utrecht, Venezia applicators). Used for bulky, asymmetric or laterally extending disease where intracavitary alone cannot cover the target (HR-CTV D90 ≥85 Gy EQD2).`
      }
    ]
  },

  // ─── 2. OVOIDS — DETAILED ──────────────────────────────────────────────────
  {
    id: "ovoids",
    icon: "⬭",
    title: "Ovoids — Selection, Rationale & Physics",
    color: COL.gold,
    subsections: [
      {
        id: "ovoid-sizes",
        title: "Ovoid Sizes Available",
        content: `Standard ovoid sizes: Small (2.0 cm diameter), Medium (2.5 cm), Large (3.0 cm).

Some systems also offer mini-ovoids (1.5 cm) for markedly stenotic vaginas.

The ovoid contains a single afterloading channel running through its centre, with the dwell positions concentrated at the geometric centre and slightly anterior of the midplane.`
      },
      {
        id: "why-largest-ovoid",
        title: "Why Choose the LARGEST Fitting Ovoid?",
        content: `This is one of the most important principles in cervix brachytherapy and a classic examination topic.

THE INVERSE SQUARE LAW PRINCIPLE:
Radiation dose falls off as 1/r². This means the dose at any given point depends critically on the distance from the source. The farther a sensitive structure (rectum, bladder) is from the ovoid source, the dramatically lower the dose received.

BY FITTING THE LARGEST OVOID THAT THE PATIENT’S VAGINA COMFORTABLY ACCOMMODATES:

1. MAXIMUM OAR DISPLACEMENT: Larger ovoids physically push the rectum posteriorly and the bladder anteriorly, increasing the distance from source to OAR. A 1 cm increase in source-to-rectum distance reduces rectal dose by approximately 50–75% (inverse square law).
2. REDUCED DOSE PER UNIT DISTANCE: The dose to the vaginal mucosa itself is reduced. With a smaller ovoid, the high-dose region is concentrated near the source within a smaller volume — the vaginal epithelium receives higher dose relative to a larger ovoid where the surface dose is spread over a larger area.
3. IMPROVED SOURCE GEOMETRY: Larger ovoids correctly position the source at the level of the cervical os and lateral fornix, achieving the optimal geometric relationship for Point A dosimetry.
4. PARAMETRIAL COVERAGE: A large ovoid, sitting fully in the lateral fornix, positions its source closer to the lateral parametrium — improving dose to Point A and the parametrial region.

CLINICAL RULE: Always try small, medium, then large in sequence. The largest ovoid that fits without causing undue discomfort, without the ovoid tipping (indicating it’s too large for the fornix depth), and without compromising tandem geometry should be selected.

CONTRAINDICATION TO LARGE OVOIDS: Narrow vagina (post-surgery, radiation fibrosis, atrophic vaginitis), severe anterior/posterior displacement of tandem geometry, tumour filling the fornices preventing ovoid seating.`
      }
    ]
  },
  // ─── 3. CENTRAL TANDEM ────────────────────────────────────────────────────
  {
    id: "tandem",
    icon: "↑",
    title: "Central Tandem — Selection & Insertion",
    color: COL.teal,
    subsections: [
      {
        id: "tandem-lengths",
        title: "Available Tandem Lengths",
        content: `Standard tandem lengths available: 2 cm, 4 cm, 6 cm (active length).

Total physical tandem lengths vary by manufacturer but typically range from 15–25 cm including the flange/handle portion. The key measurement is the ACTIVE LENGTH — the portion within the uterine cavity above the internal os.

Tandem curvature options: Straight (0°), 15°, 30°, 45° angled (to follow uterine flexion).`
      },
      {
        id: "tandem-length-selection",
        title: "How is Tandem Length Chosen?",
        content: `TANDEM LENGTH SELECTION IS BASED ON SOUNDING THE UTERINE CAVITY — a critical pre-insertion step.

UTERINE SOUNDING PROCEDURE:

1. After cervical dilation (Hegar dilators sequentially to size 6–8 French), a uterine sound is gently introduced through the internal os
2. The sound is advanced carefully until fundal resistance is felt
3. The depth is read from the calibration markings on the sound — this is the UTERINE CAVITY LENGTH (typically 6–9 cm in a non-pregnant uterus)
4. The tandem length chosen = (uterine cavity length) MINUS 0.5–1 cm safety margin to avoid uterine perforation

WHY SUBTRACT A MARGIN?
• The uterine fundus is only 5–8 mm thick — perforation risk is real
• Post-radiation atrophy may thin the fundus further in previously irradiated patients
• The tandem tip should sit within the uterine cavity, not touching the fundus under pressure

CLINICAL EXAMPLE:
Uterine sound depth = 7 cm → Choose 6 cm active tandem (7 cm − 1 cm margin)
Uterine sound depth = 5 cm → Choose 4 cm active tandem
Uterine sound depth = 4 cm → Choose 2–4 cm active tandem (stenotic/fibrotic cavity)

TANDEM ANGLE SELECTION:
• Normal anteverted, anteflexed uterus: 30–45° angled tandem matches the flexion angle
• Retroverted uterus: 0–15° or straight tandem
• Exam under anaesthesia + bimanual: assess uterine position before selecting angle
• Incorrect angle selection → perforation risk (anterior uterine wall in retroversion with 30° tandem)

IMAGING CONFIRMATION:
Modern practice: fluoroscopy or ultrasound guidance during insertion to confirm tandem position within the uterine cavity. Post-insertion orthogonal X-rays (AP + lateral) or CT/MRI confirm final tandem and ovoid position before treatment.`
      }
    ]
  },
  // ─── 4. DOSIMETRIC POINTS ──────────────────────────────────────────────────
  {
    id: "dosimetry",
    icon: "🎯",
    title: "Dosimetric Points & GEC-ESTRO Parameters",
    color: COL.sky,
    subsections: [
      {
        id: "traditional-points",
        title: "Traditional ICRU Points (A, B, P, OAR)",
        content: `ICRU 38 defined traditional points for dose reporting in cervix brachytherapy. While modern practice is MRI-guided (GEC-ESTRO), these points remain important for historical comparison, rapid planning, and some centres still using 2D/3D-X-ray planning.

1. POINT A:
   Defined as 2 cm superior to the cervical os and 2 cm lateral to the central tandem axis. Represents the dose to the paracervical triangle (where the uterine artery crosses the ureter).
   *CRITICAL LIMITATION:* Point A is a fixed geometric point; it does not account for tumour size, shape, or patient anatomy. It is a surrogate for dose, not a true measure of tumour coverage.

2. POINT B:
   Defined as 2 cm superior to the cervical os and 5 cm lateral to the central tandem axis. Represents the dose to the pelvic side wall.

3. POINT P (Pelvic Side Wall):
   Similar to Point B, often used interchangeably in clinical practice.

4. ORGAN AT RISK (OAR) POINTS:
   • BLADDER POINT: Defined on a lateral radiograph/CT. A Foley catheter balloon is filled with 7 ml of contrast. The point is at the posterior surface of the balloon, in the sagittal plane of the tandem.
   • RECTAL POINT: Defined on a lateral radiograph/CT. The point is at the anterior rectal wall, in the sagittal plane of the tandem, at the level of the ovoids/ring.`
      },
      {
        id: "gec-estro",
        title: "GEC-ESTRO MRI-Guided Parameters",
        content: `The GEC-ESTRO (Groupe Européen de Curiethérapie-European Society for Radiotherapy and Oncology) recommendations shifted the paradigm from Point A to IMAGE-GUIDED ADAPTIVE BRACHYTHERAPY (IGABT).

TARGET VOLUMES:
• GTV (Gross Tumour Volume): Visible disease on MRI.
• HR-CTV (High-Risk Clinical Target Volume): GTV + entire cervix + parametrial involvement. Must be covered by the prescription dose (D90 ≥ 85 Gy EQD2).
• IR-CTV (Intermediate-Risk CTV): HR-CTV + 1 cm margin (with anatomical constraints). Must be covered by D90 ≥ 60 Gy EQD2.

OAR CONSTRAINTS (D2cc - Dose to 2cc volume):
• Rectum D2cc < 65 Gy EQD2
• Sigmoid D2cc < 70 Gy EQD2
• Bladder D2cc < 80 Gy EQD2

EQD2 (Equivalent Dose in 2 Gy fractions) is used to combine EBRT and brachytherapy doses using the Linear-Quadratic model (α/β = 3 for late effects, α/β = 10 for tumour).`
      }
    ]
  },
  // ─── 5. VAGINAL PACKING ──────────────────────────────────────────────────
  {
    id: "packing",
    icon: "📦",
    title: "Vaginal Packing — Rationale & Technique",
    color: COL.violet,
    subsections: [
      {
        id: "packing-rationale",
        title: "Rationale for Vaginal Packing",
        content: `Vaginal packing is a critical, often overlooked, step in intracavitary brachytherapy.

1. OAR DISPLACEMENT: The primary goal is to push the rectum and bladder as far as possible from the radioactive sources (ovoids/ring).
2. APPLICATOR STABILISATION: Packing secures the tandem and ovoids in the desired position, preventing movement during the treatment fraction (which can last hours in LDR or minutes in HDR).
3. REPRODUCIBILITY: Consistent packing helps ensure the applicator geometry is reproducible between fractions.

MATERIALS:
• Gauze packing (often soaked in saline or antiseptic solution)
• Sometimes a vaginal balloon (e.g., Fletcher-Suit balloon) is used instead of or in addition to gauze.`
      }
    ]
  },
  // ─── 6. DOSE POINTS & CLINICAL CONNECTIONS ───────────────────────────────
  {
    id: "clinical-connections",
    icon: "🔗",
    title: "Dose Points & Clinical Connections",
    color: COL.lime,
    subsections: [
      {
        id: "point-a-optimization",
        title: "Point A Optimization",
        content: `Point A is a traditional reference point, not a target. However, in 2D planning, it is the primary prescription point.

Optimization involves adjusting dwell times in the tandem and ovoids to achieve the desired dose at Point A while minimising dose to OARs.

Key optimization strategies:
• Tandem dwell times: Typically 60-70% of total dose
• Ovoid dwell times: Typically 30-40% of total dose
• Adjusting the ratio can shift the isodose distribution to better cover the cervix or parametria depending on tumour extent.`
      }
    ]
  },
  // ─── 7. INSERTION PROCEDURE ──────────────────────────────────────────────
  {
    id: "procedure",
    icon: "🏥",
    title: "Insertion Procedure — Workflow",
    color: COL.rose,
    subsections: [
      {
        id: "procedure-steps",
        title: "Standard Insertion Workflow",
        content: `1. PRE-PROCEDURE: Patient assessment, informed consent, anaesthesia (GA/sedation/spinal), antibiotic prophylaxis.
2. POSITIONING: Lithotomy position.
3. EXAMINATION: Bimanual exam under anaesthesia (EUA) to assess tumour extent, parametrial involvement, uterine position.
4. DILATION: Sequential dilation of the cervical os (Hegar dilators).
5. SOUNDING: Uterine sounding to determine cavity length.
6. APPLICATOR INSERTION: Tandem insertion, followed by ovoid/ring placement in the fornices.
7. STABILISATION & PACKING: Secure applicator, vaginal packing.
8. IMAGING: Orthogonal X-rays, CT or MRI for planning.
9. TREATMENT: HDR/LDR delivery.
10. REMOVAL: Removal of applicator and packing.`
      }
    ]
  },
  // ─── 8. DOSE RATE & FRACTIONATION ─────────────────────────────────────────
  {
    id: "fractionation",
    icon: "⏱️",
    title: "Dose Rate & Fractionation",
    color: COL.gold,
    subsections: [
      {
        id: "ldr-hdr-pdr",
        title: "LDR vs. HDR vs. PDR",
        content: `• LDR (Low Dose Rate, 0.4–2 Gy/h): Traditional standard, long hospital stay (days), high radiation safety burden.
• HDR (High Dose Rate, >12 Gy/h): Modern standard, outpatient/short stay, multiple fractions (e.g., 5-7 Gy x 5 fractions), high flexibility.
• PDR (Pulsed Dose Rate): Mimics LDR by delivering small pulses of HDR radiation every hour, 24/7. Rarely used now.`
      }
    ]
  },
  // ─── 9. CLINICAL SCENARIOS ────────────────────────────────────────────────
  {
    id: "scenarios",
    icon: "🧠",
    title: "Clinical Scenarios & Decision Making",
    color: COL.teal,
    subsections: [
      {
        id: "bulky-disease",
        title: "Bulky Disease Management",
        content: `Bulky disease (e.g., >4 cm diameter) requires interstitial needles (hybrid applicator) to ensure adequate dose coverage (D90 ≥85 Gy EQD2) without exceeding OAR constraints.`
      }
    ]
  },
  // ─── 10. PHYSICS, QA & SAFETY ─────────────────────────────────────────────
  {
    id: "physics",
    icon: "⚛️",
    title: "Physics, QA & Radiation Safety",
    color: COL.sky,
    subsections: [
      {
        id: "qa-safety",
        title: "QA & Radiation Protection",
        content: `• QA: Source calibration, applicator integrity checks, treatment plan verification.
• Safety: Time, Distance, Shielding. ALARA (As Low As Reasonably Achievable).`
      }
    ]
  },
  // ─── 11. COMPLICATIONS ──────────────────────────────────────────────────
  {
    id: "complications",
    icon: "⚠️",
    title: "Complications — Acute & Late",
    color: COL.rose,
    subsections: [
      {
        id: "acute-late",
        title: "Acute and Late Complications",
        content: `• ACUTE (During/shortly after): Vaginal mucositis, cystitis, proctitis, fatigue.
• LATE (Months/years): Vaginal stenosis/atrophy, rectal ulceration/fistula, bladder ulceration/fistula, bowel obstruction, pelvic insufficiency fractures.`
      }
    ]
  },
  // ─── 12. VIVA & EXAM QUESTIONS ──────────────────────────────────────────
  {
    id: "viva",
    icon: "🗣️",
    title: "Viva & Exam Rapid-Fire Questions",
    color: COL.gold,
    subsections: [
      {
        id: "questions",
        title: "Common Exam Questions",
        content: `• Why fit the largest ovoid? (Inverse square law, OAR displacement)
• How do you manage uterine perforation? (Withdraw, observe, delay)
• What is Point A? (Fixed point, surrogate for dose)
• What is HR-CTV? (GTV + cervix + parametria, IGABT target)
• What is EQD2? (Equivalent dose in 2 Gy fractions)`
      }
    ]
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// SVG ANATOMY DIAGRAM (inline, schematic)
// ══════════════════════════════════════════════════════════════════════════════
function AnatomyDiagram() {
  return (
    <svg viewBox="0 0 340 320" style={{ width:"100%", maxWidth:"340px", margin:"0 auto", display:"block" }}>
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0C1A2E" />
          <stop offset="100%" stopColor="#060A10" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
        </marker>
      </defs>
      <rect width="340" height="320" fill="url(#bgGrad)" rx="16"/>

      {/* UTERUS body */}
      <ellipse cx="170" cy="120" rx="52" ry="65" fill="none" stroke={COL.rose} strokeWidth="2.5" opacity="0.85"/>
      <ellipse cx="170" cy="120" rx="52" ry="65" fill={COL.roseDim}/>

      {/* CERVIX */}
      <rect x="155" y="178" width="30" height="30" rx="4" fill={COL.roseDim} stroke={COL.rose} strokeWidth="2" opacity="0.85"/>

      {/* TANDEM */}
      <line x1="170" y1="60" x2="170" y2="225" stroke={COL.teal} strokeWidth="3.5" strokeLinecap="round" filter="url(#glow)"/>
      <circle cx="170" cy="62" r="5" fill={COL.teal} filter="url(#glow)"/>
      <text x="183" y="75" fill={COL.teal} fontSize="10" fontFamily="monospace">Tandem</text>

      {/* OVOIDS */}
      <ellipse cx="133" cy="205" rx="18" ry="12" fill={COL.goldDim} stroke={COL.gold} strokeWidth="2" filter="url(#glow)"/>
      <ellipse cx="207" cy="205" rx="18" ry="12" fill={COL.goldDim} stroke={COL.gold} strokeWidth="2" filter="url(#glow)"/>
      <text x="90" y="222" fill={COL.gold} fontSize="9" fontFamily="monospace">L Ovoid</text>
      <text x="198" y="222" fill={COL.gold} fontSize="9" fontFamily="monospace">R Ovoid</text>

      {/* POINT A — LEFT */}
      <circle cx="118" cy="178" r="6" fill="none" stroke={COL.violet} strokeWidth="2" strokeDasharray="3,2"/>
      <circle cx="118" cy="178" r="2.5" fill={COL.violet} filter="url(#glow)"/>
      <line x1="112" y1="178" x2="80" y2="162" stroke={COL.violet} strokeWidth="1" strokeDasharray="3,2"/>
      <text x="16" y="160" fill={COL.violet} fontSize="9" fontFamily="monospace">Pt A (L)</text>
      <text x="16" y="172" fill={COL.dim} fontSize="8" fontFamily="monospace">2cm lat, 2cm sup</text>

      {/* POINT A — RIGHT */}
      <circle cx="222" cy="178" r="6" fill="none" stroke={COL.violet} strokeWidth="2" strokeDasharray="3,2"/>
      <circle cx="222" cy="178" r="2.5" fill={COL.violet} filter="url(#glow)"/>
      <line x1="228" y1="178" x2="258" y2="162" stroke={COL.violet} strokeWidth="1" strokeDasharray="3,2"/>
      <text x="260" y="160" fill={COL.violet} fontSize="9" fontFamily="monospace">Pt A (R)</text>

      {/* POINT B */}
      <circle cx="80" cy="178" r="4" fill="none" stroke={COL.sky} strokeWidth="1.5" strokeDasharray="3,2"/>
      <circle cx="80" cy="178" r="2" fill={COL.sky}/>
      <text x="16" y="190" fill={COL.sky} fontSize="9" fontFamily="monospace">Pt B</text>
      <text x="16" y="200" fill={COL.dim} fontSize="8" fontFamily="monospace">5cm from midline</text>

      {/* BLADDER */}
      <ellipse cx="170" cy="242" rx="38" ry="20" fill="rgba(56,189,248,0.07)" stroke={COL.sky} strokeWidth="1.5" strokeDasharray="4,3"/>
      <text x="143" y="246" fill={COL.sky} fontSize="9" fontFamily="monospace">Bladder</text>

      {/* RECTUM */}
      <rect x="148" y="262" width="44" height="28" rx="8" fill="rgba(239,68,68,0.07)" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,3"/>
      <text x="153" y="280" fill="#EF4444" fontSize="9" fontFamily="monospace">Rectum</text>

      {/* PACKING arrows */}
      <path d="M 170 235 L 170 255" stroke="#EF4444" strokeWidth="1.5" markerEnd="url(#arrow)" strokeDasharray="3,2"/>
      <text x="175" y="249" fill="#EF4444" fontSize="8" fontFamily="monospace">Pack↓</text>

      {/* VAGINAL CANAL */}
      <path d="M 155 208 L 148 255 M 185 208 L 192 255" stroke={COL.muted} strokeWidth="1" strokeDasharray="3,3"/>

      {/* 2cm measurements */}
      <line x1="170" y1="178" x2="222" y2="178" stroke="rgba(167,139,250,0.4)" strokeWidth="1" strokeDasharray="2,2"/>
      <text x="187" y="174" fill="rgba(167,139,250,0.7)" fontSize="8" fontFamily="monospace">2cm</text>

      <line x1="222" y1="178" x2="222" y2="205" stroke="rgba(167,139,250,0.4)" strokeWidth="1" strokeDasharray="2,2"/>
      <text x="226" y="195" fill="rgba(167,139,250,0.7)" fontSize="8" fontFamily="monospace">2cm</text>

      {/* TITLE */}
      <text x="170" y="16" textAnchor="middle" fill={COL.subtext} fontSize="11" fontFamily="monospace" fontWeight="bold">
        Applicator Geometry
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT RENDERER
// ══════════════════════════════════════════════════════════════════════════════
function ContentBlock({ text, color }: { text: string, color: string }) {
  // Parse paragraphs, bullets, bold
  const lines = text.split("\n");
  return (
    <div style={{ fontSize:"12.5px", color: COL.subtext, lineHeight: 1.85 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:"8px" }} />;
        // Section headers (ALL CAPS lines)
        if (/^[A-Z]+:$/.test(line.trim()) || /^[A-Z]{2,}.*:$/.test(line.trim())) {
          return (
            <div key={i} style={{
              fontSize:"10px", fontWeight:700, color, letterSpacing:"0.1em",
              fontFamily:"monospace", marginTop:"14px", marginBottom:"6px"
            }}>{line}</div>
          );
        }
        // Bullet points
        if (line.trim().startsWith("•")) {
          return (
            <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"4px", paddingLeft:"4px" }}>
              <span style={{ color, flexShrink:0, marginTop:"2px" }}>▸</span>
              <span>{line.trim().slice(1).trim()}</span>
            </div>
          );
        }
        // Numbered steps
        if (/^STEP \d+/.test(line.trim()) || /^[0-9]+.\s/.test(line.trim())) {
          const num = line.trim().match(/^(\d+|STEP \d+)/)?.[0];
          const rest = line.trim().replace(/^(\d+.|STEP \d+)\s*—?\s*/, "");
          return (
            <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"6px", marginTop:"4px" }}>
              <span style={{
                flexShrink:0, minWidth:"28px", height:"22px",
                backgroundColor: color+"22", border:`1px solid ${color}55`,
                borderRadius:"6px", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:"10px", fontWeight:700,
                color, fontFamily:"monospace", paddingTop:"1px"
              }}>{num?.replace("STEP ","S")}</span>
              <span style={{ paddingTop:"2px" }}>{rest}</span>
            </div>
          );
        }
        // Checkbox lines
        if (line.trim().startsWith("□")) {
          return (
            <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"3px", paddingLeft:"4px" }}>
              <span style={{ color: COL.lime, flexShrink:0 }}>□</span>
              <span>{line.trim().slice(1).trim()}</span>
            </div>
          );
        }
        // Q&A
        if (line.trim().startsWith("Q:")) {
          return (
            <div key={i} style={{
              marginTop:"14px", padding:"10px 14px", borderRadius:"10px",
              backgroundColor: color+"0F", borderLeft:`3px solid ${color}`,
              fontSize:"12px", color: COL.text, fontWeight:600
            }}>
              <span style={{ color, fontFamily:"monospace", fontSize:"10px", fontWeight:700 }}>Q </span>
              {line.trim().slice(2).trim()}
            </div>
          );
        }
        if (line.trim().startsWith("A:")) {
          return (
            <div key={i} style={{
              padding:"8px 14px", borderRadius:"0 0 10px 10px",
              backgroundColor:"rgba(255,255,255,0.02)",
              marginBottom:"8px", fontSize:"12px", color: COL.subtext
            }}>
              <span style={{ color: COL.lime, fontFamily:"monospace", fontSize:"10px", fontWeight:700 }}>A </span>
              {line.trim().slice(2).trim()}
            </div>
          );
        }
        // Bold inline (word: or phrase between **)
        return <div key={i} style={{ marginBottom:"3px" }}>{line}</div>;
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION CARD
// ══════════════════════════════════════════════════════════════════════════════
function SectionCard({ section, isOpen, onToggle }: { section: any, isOpen: boolean, onToggle: () => void }) {
  const [openSub, setOpenSub] = useState<string | null>(null);
  return (
    <div style={{
      borderRadius:"18px", overflow:"hidden",
      border:`1px solid ${isOpen ? section.color+"55" : "rgba(255,255,255,0.07)"}`,
      backgroundColor: COL.card,
      marginBottom:"10px",
      boxShadow: isOpen ? `0 0 32px ${section.color}18` : "none",
      transition:"all 0.3s ease"
    }}>
      {/* Section header */}
      <button onClick={onToggle} style={{
        width:"100%", display:"flex", alignItems:"center", gap:"14px",
        padding:"18px 20px", background:"none", border:"none",
        cursor:"pointer", textAlign:"left"
      }}>
        <div style={{
          width:"44px", height:"44px", borderRadius:"12px", flexShrink:0,
          backgroundColor: section.color+"18",
          border:`1.5px solid ${section.color}44`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"20px",
          boxShadow: isOpen ? `0 0 16px ${section.color}44` : "none",
          transition:"box-shadow 0.3s"
        }}>{section.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{
            fontSize:"14px", fontWeight:800, color: isOpen ? section.color : COL.text,
            fontFamily:"'Outfit', sans-serif", transition:"color 0.2s"
          }}>{section.title}</div>
          <div style={{
            fontSize:"10px", color: COL.dim, marginTop:"2px",
            fontFamily:"monospace"
          }}>{section.subsections.length} topics · tap to expand</div>
        </div>
        <div style={{
          width:"26px", height:"26px", borderRadius:"50%",
          backgroundColor: isOpen ? section.color+"22" : "rgba(255,255,255,0.04)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color: isOpen ? section.color : COL.dim,
          fontSize:"14px",
          transform: isOpen ? "rotate(180deg)" : "rotate(0)",
          transition:"all 0.25s ease"
        }}>▾</div>
      </button>

      {/* Subsections */}
      {isOpen && (
        <div style={{ padding:"0 16px 16px" }}>
          {section.subsections.map((sub: any) => (
            <div key={sub.id} style={{
              marginBottom:"8px", borderRadius:"13px", overflow:"hidden",
              border:`1px solid ${openSub===sub.id ? section.color+"44" : "rgba(255,255,255,0.05)"}`,
              backgroundColor: openSub===sub.id ? section.color+"06" : "rgba(255,255,255,0.02)",
              transition:"all 0.2s"
            }}>
              <button
                onClick={() => setOpenSub(p => p===sub.id ? null : sub.id)}
                style={{
                  width:"100%", display:"flex", alignItems:"center",
                  justifyContent:"space-between", gap:"10px",
                  padding:"12px 16px", background:"none", border:"none",
                  cursor:"pointer", textAlign:"left"
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{
                    width:"6px", height:"6px", borderRadius:"50%",
                    backgroundColor: openSub===sub.id ? section.color : COL.slate,
                    boxShadow: openSub===sub.id ? `0 0 6px ${section.color}` : "none",
                    transition:"all 0.2s", flexShrink:0
                  }}/>
                  <span style={{
                    fontSize:"13px", fontWeight:700,
                    color: openSub===sub.id ? section.color : COL.text,
                    fontFamily:"'Outfit', sans-serif", transition:"color 0.2s"
                  }}>{sub.title}</span>
                </div>
                <span style={{
                  color: openSub===sub.id ? section.color : COL.dim,
                  transform: openSub===sub.id ? "rotate(180deg)" : "rotate(0)",
                  transition:"transform 0.2s", fontSize:"12px", flexShrink:0
                }}>▾</span>
              </button>
              {openSub===sub.id && (
                <div style={{
                  padding:"4px 16px 16px",
                  borderTop:`1px solid ${section.color}22`
                }}>
                  <ContentBlock text={sub.content} color={section.color} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QUICK REFERENCE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function QuickRef() {
  const items = [
    { label:"Point A", value:"2cm sup + 2cm lat", color: COL.violet },
    { label:"Point B", value:"2cm sup + 5cm lat", color: COL.sky },
    { label:"HR-CTV D90 target", value:"≥ 85 Gy EQD2", color: COL.rose },
    { label:"Rectum D2cc", value:"< 75 Gy EQD2", color:"#EF4444" },
    { label:"Bladder D2cc", value:"< 90 Gy EQD2", color: COL.sky },
    { label:"Sigmoid D2cc", value:"< 75 Gy EQD2", color: COL.gold },
    { label:"HDR (4fx)", value:"7 Gy × 4 fractions", color: COL.teal },
    { label:"HDR (5fx)", value:"6 Gy × 5 fractions", color: COL.teal },
    { label:"LDR rate", value:"0.5–0.7 Gy/h", color:"#22D3EE" },
    { label:"OTT limit", value:"≤ 56 days (8 weeks)", color: COL.gold },
    { label:"Ovoid principle", value:"Largest fitting", color: COL.gold },
    { label:"Tandem length", value:"Sound − 0.5–1 cm", color: COL.teal },
    { label:"Pack order", value:"Posterior → Lateral → Ant", color: COL.sky },
    { label:"Foley balloon", value:"7 mL contrast", color: COL.sky },
    { label:"EBRT dose", value:"45–50.4 Gy / 25 fx", color: COL.subtext },
  ];
  return (
    <div style={{
      backgroundColor: COL.card,
      borderRadius:"18px",
      border:"1px solid rgba(255,255,255,0.08)",
      padding:"18px", marginBottom:"14px"
    }}>
      <div style={{
        fontSize:"10px", fontWeight:700, color: COL.rose,
        letterSpacing:"0.12em", fontFamily:"monospace", marginBottom:"14px"
      }}>⚡ QUICK REFERENCE</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {items.map((item,i) => (
          <div key={i} style={{
            padding:"8px 10px", borderRadius:"8px",
            backgroundColor:"rgba(255,255,255,0.025)",
            borderLeft:`2.5px solid ${item.color}`
          }}>
            <div style={{
              fontSize:"9px", color: COL.dim, fontFamily:"monospace",
              marginBottom:"2px", letterSpacing:"0.05em"
            }}>{item.label}</div>
            <div style={{
              fontSize:"11px", fontWeight:700, color: item.color,
              fontFamily:"monospace"
            }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function CervixBrachytherapy() {
  const [openSection, setOpenSection] = useState<string | null>("anatomy");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("content");
  const [filteredSections, setFilteredSections] = useState(SECTIONS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setFilteredSections(SECTIONS); return; }
    const s = search.toLowerCase();
    const result = SECTIONS.map(sec => ({
      ...sec,
      subsections: sec.subsections.filter(sub =>
        sub.title.toLowerCase().includes(s) ||
        sub.content.toLowerCase().includes(s)
      )
    })).filter(sec => sec.subsections.length > 0);
    setFilteredSections(result);
  }, [search]);

  return (
    <div style={{
      minHeight:"100vh",
      background:"radial-gradient(ellipse at 30% 0%, #0E1628 0%, #060A10 65%)",
      fontFamily:"'DM Sans', sans-serif",
      color: COL.text
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); ::-webkit-scrollbar { width:3px; height:3px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#1E3A5F; border-radius:4px; } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } @keyframes pulseGlow { 0%,100%{opacity:1} 50%{opacity:0.5} } .fade-up { animation: fadeUp 0.4s ease both; } .chip-scroll { -ms-overflow-style:none; scrollbar-width:none; } .chip-scroll::-webkit-scrollbar { display:none; }`}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(6,10,16,0.96)", backdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ maxWidth:"720px", margin:"0 auto", padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{
              width:"42px", height:"42px", borderRadius:"12px", flexShrink:0,
              background:`linear-gradient(135deg, ${COL.rose} 0%, #C026D3 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"22px",
              boxShadow:`0 0 24px ${COL.rose}55`
            }}>🎗</div>
            <div style={{ flex:1 }}>
              <h1 style={{
                fontSize:"16px", fontWeight:900, color:"#FFF",
                fontFamily:"'Outfit', sans-serif",
                letterSpacing:"-0.02em", lineHeight:1
              }}>Cervix Brachytherapy</h1>
              <div style={{
                fontSize:"10px", color: COL.dim, marginTop:"2px",
                fontFamily:"monospace"
              }}>Tandem · Ovoids · Points · Packing · GEC-ESTRO · HDR/LDR</div>
            </div>
            <div style={{
              padding:"3px 10px", borderRadius:"20px",
              backgroundColor: COL.roseDim,
              border:`1px solid ${COL.roseBd}`,
              fontSize:"9px", color: COL.rose,
              fontFamily:"monospace", fontWeight:700
            }}>CLINICAL REF</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"14px 16px" }}>

        {/* ── SEARCH ── */}
        <div style={{ position:"relative", marginBottom:"14px" }}>
          <span style={{
            position:"absolute", left:"14px", top:"50%",
            transform:"translateY(-50%)", fontSize:"14px",
            color: COL.dim, pointerEvents:"none"
          }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search: point A, packing, ovoid, tandem, dose…"
            style={{
              width:"100%", padding:"12px 14px 12px 42px",
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.09)",
              borderRadius:"12px", color: COL.text,
              fontSize:"13px", outline:"none",
              fontFamily:"'DM Sans', sans-serif"
            }}
            onFocus={e => e.target.style.borderColor = COL.rose}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position:"absolute", right:"12px", top:"50%",
              transform:"translateY(-50%)", background:"none", border:"none",
              color: COL.muted, cursor:"pointer", fontSize:"16px"
            }}>×</button>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display:"flex", gap:"4px", marginBottom:"16px",
          backgroundColor:"rgba(255,255,255,0.03)",
          padding:"4px", borderRadius:"14px",
          border:"1px solid rgba(255,255,255,0.06)"
        }}>
          {[
            { id:"content",  label:"📚 Reference" },
            { id:"diagram",  label:"🫀 Anatomy" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"10px 6px",
              backgroundColor: tab===t.id ? COL.rose : "transparent",
              border:"none", borderRadius:"10px",
              color: tab===t.id ? "#fff" : COL.muted,
              fontSize:"11px", fontWeight:800, cursor:"pointer",
              fontFamily:"'Outfit', sans-serif",
              transition:"all 0.2s ease",
              boxShadow: tab===t.id ? `0 0 16px ${COL.rose}55` : "none"
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── CONTENT TAB ── */}
        {tab === "content" && (
          <div className="fade-up">
            {search && (
              <div style={{
                fontSize:"11px", color: COL.dim, marginBottom:"12px",
                fontFamily:"monospace"
              }}>
                {filteredSections.reduce((a,s) => a + s.subsections.length, 0)} results for "{search}"
              </div>
            )}
            {filteredSections.length === 0 ? (
              <div style={{
                textAlign:"center", padding:"48px 24px",
                color: COL.dim, fontSize:"13px"
              }}>
                <div style={{ fontSize:"32px", marginBottom:"12px" }}>🔎</div>
                No topics found for "{search}"
              </div>
            ) : (
              filteredSections.map(section => (
                <SectionCard
                  key={section.id}
                  section={section}
                  isOpen={openSection === section.id}
                  onToggle={() => setOpenSection(p => p===section.id ? null : section.id)}
                />
              ))
            )}
          </div>
        )}

        {/* ── DIAGRAM TAB ── */}
        {tab === "diagram" && (
          <div className="fade-up">
            <div style={{
              backgroundColor: COL.card, borderRadius:"18px",
              border:`1px solid ${COL.roseBd}`,
              padding:"20px", marginBottom:"14px"
            }}>
              <div style={{
                fontSize:"10px", color: COL.rose, fontWeight:700,
                letterSpacing:"0.12em", fontFamily:"monospace", marginBottom:"14px"
              }}>APPLICATOR GEOMETRY — SCHEMATIC</div>
              <AnatomyDiagram />
            </div>
            {/* Legend */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"
            }}>
              {[
                { color: COL.teal,   label:"Central Tandem", desc:"Inserted via cervical os into uterine cavity" },
                { color: COL.gold,   label:"Ovoids (×2)", desc:"Seated in lateral vaginal fornices" },
                { color: COL.violet, label:"Point A", desc:"2cm sup + 2cm lat — parametrial target" },
                { color: COL.sky,    label:"Point B / Bladder", desc:"5cm lateral / anterior OAR" },
                { color:"#EF4444",   label:"Rectum", desc:"Primary OAR — displaced by packing" },
                { color: COL.rose,   label:"Uterus/Cervix", desc:"Primary target volume" },
              ].map((l,i) => (
                <div key={i} style={{
                  padding:"10px 12px", borderRadius:"10px",
                  backgroundColor:"rgba(255,255,255,0.03)",
                  borderLeft:`3px solid ${l.color}`
                }}>
                  <div style={{
                    fontSize:"11px", fontWeight:700, color: l.color,
                    fontFamily:"monospace", marginBottom:"2px"
                  }}>{l.label}</div>
                  <div style={{ fontSize:"10px", color: COL.dim }}>{l.desc}</div>
                </div>
              ))}
            </div>

            {/* Packing sequence visual */}
            <div style={{
              marginTop:"14px", backgroundColor: COL.card,
              borderRadius:"18px", border:`1px solid ${COL.skyBd || COL.tealBd}`,
              padding:"18px"
            }}>
              <div style={{
                fontSize:"10px", color: COL.sky, fontWeight:700,
                letterSpacing:"0.12em", fontFamily:"monospace", marginBottom:"14px"
              }}>PACKING SEQUENCE — STEP ORDER</div>
              {[
                { step:1, label:"Posterior Pack", color:"#EF4444", why:"Maximise source-to-rectum distance — most critical" },
                { step:2, label:"Right Lateral",  color: COL.gold,  why:"Secure right ovoid in right fornix" },
                { step:3, label:"Left Lateral",   color: COL.gold,  why:"Secure left ovoid in left fornix" },
                { step:4, label:"Anterior",       color: COL.sky,   why:"Bladder displacement (if space permits)" },
                { step:5, label:"Vault Superior", color: COL.teal,  why:"Prevent superior ovoid migration" },
                { step:6, label:"Introitus",      color: COL.violet, why:"Anchor pack — prevent inferior displacement" },
              ].map(s => (
                <div key={s.step} style={{
                  display:"flex", alignItems:"center", gap:"12px",
                  marginBottom:"8px", padding:"10px 12px",
                  borderRadius:"10px",
                  backgroundColor: s.color+"0A",
                  border:`1px solid ${s.color}22`
                }}>
                  <div style={{
                    width:"28px", height:"28px", borderRadius:"50%", flexShrink:0,
                    backgroundColor: s.color+"22",
                    border:`1.5px solid ${s.color}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"12px", fontWeight:900, color: s.color,
                    fontFamily:"monospace"
                  }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize:"12px", fontWeight:700, color: s.color,
                      fontFamily:"'Outfit', sans-serif" }}>{s.label}</div>
                    <div style={{ fontSize:"10px", color: COL.dim }}>{s.why}</div>
                  </div>
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
                  backgroundColor: COL.bg, borderLeft: `1px solid ${COL.roseBd}`,
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", zIndex: 110,
                  overflowY: "auto", display: "flex", flexDirection: "column"
                }}
              >
                <div style={{
                  padding: "16px", borderBottom: `1px solid ${COL.roseBd}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  position: "sticky", top: 0, backgroundColor: COL.bg, zIndex: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpen size={18} color={COL.rose} />
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#FFF", fontFamily: "'Outfit',sans-serif" }}>
                      Quick Reference
                    </h3>
                  </div>
                </div>

                <div style={{ padding: "16px", flex: 1 }}>
                  <QuickRef />
                  {/* OAR constraints table */}
                  <div style={{
                    backgroundColor: COL.card, borderRadius:"18px",
                    border:"1px solid rgba(255,255,255,0.08)", padding:"18px",
                    marginBottom:"14px"
                  }}>
                    <div style={{
                      fontSize:"10px", color: COL.teal, fontWeight:700,
                      letterSpacing:"0.12em", fontFamily:"monospace", marginBottom:"14px"
                    }}>GEC-ESTRO DOSE CONSTRAINTS SUMMARY</div>
                    <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 4px" }}>
                      <thead>
                        <tr>
                          {["OAR","Metric","Limit (EQD2)","α/β"].map(h => (
                            <th key={h} style={{
                              fontSize:"9px", color: COL.dim, textAlign:"left",
                              padding:"4px 8px", fontFamily:"monospace",
                              letterSpacing:"0.08em"
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Rectum",   "D2cc", "< 75 Gy", "3 Gy"],
                          ["Sigmoid",  "D2cc", "< 75 Gy", "3 Gy"],
                          ["Bladder",  "D2cc", "< 90 Gy", "3 Gy"],
                          ["Vagina",   "D2cc", "< 130 Gy","3 Gy"],
                          ["HR-CTV",   "D90",  "≥ 85 Gy", "10 Gy"],
                          ["HR-CTV",   "D100", "Document","10 Gy"],
                          ["IR-CTV",   "D98",  "≥ 60 Gy", "10 Gy"],
                        ].map((row,i) => (
                          <tr key={i}>
                            {row.map((cell,j) => (
                              <td key={j} style={{
                                padding:"8px 8px",
                                backgroundColor: i%2===0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                                fontSize:"11px",
                                color: j===0 ? COL.rose : j===2 ? COL.teal : COL.subtext,
                                fontFamily: j>0 ? "monospace" : "'DM Sans', sans-serif",
                                fontWeight: j===2 ? 700 : 400,
                                borderRadius: j===0 ? "6px 0 0 6px" : j===3 ? "0 6px 6px 0" : "0"
                              }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Tandem selection guide */}
                  <div style={{
                    backgroundColor: COL.card, borderRadius:"18px",
                    border:`1px solid ${COL.tealBd}`, padding:"18px"
                  }}>
                    <div style={{
                      fontSize:"10px", color: COL.teal, fontWeight:700,
                      letterSpacing:"0.12em", fontFamily:"monospace", marginBottom:"14px"
                    }}>TANDEM LENGTH SELECTION GUIDE</div>
                    {[
                      { sound:"≥ 8 cm",   tandem:"6 cm active",    note:"Long uterine cavity — use with care" },
                      { sound:"6–8 cm",   tandem:"6 cm active",    note:"Standard; most common" },
                      { sound:"5–6 cm",   tandem:"4 cm active",    note:"Average/small uterus" },
                      { sound:"4–5 cm",   tandem:"2–4 cm active",  note:"Small/fibrotic cavity" },
                      { sound:"< 4 cm",   tandem:"2 cm / tandem alone", note:"Post-EBRT fibrosis — consider interstitial" },
                    ].map((r,i) => (
                      <div key={i} style={{
                        display:"grid", gridTemplateColumns:"1fr 1fr 1.5fr", gap:"8px",
                        padding:"8px 10px", borderRadius:"8px",
                        backgroundColor: i%2===0 ? "rgba(255,255,255,0.025)" : "transparent",
                        marginBottom:"3px"
                      }}>
                        <span style={{ fontSize:"11px", color: COL.gold, fontFamily:"monospace" }}>Sound: {r.sound}</span>
                        <span style={{ fontSize:"11px", color: COL.teal, fontFamily:"monospace" }}>{r.tandem}</span>
                        <span style={{ fontSize:"10px", color: COL.dim }}>{r.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    position: "absolute", right: "24px", bottom: "24px", zIndex: 120,
                    backgroundColor: COL.rose, color: "#FFF", width: "48px", height: "48px",
                    borderRadius: "50%", border: "none", boxShadow: "0 8px 24px rgba(244,63,94,0.4)",
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
              backgroundColor: COL.rose, color: "#FFF", width: "48px", height: "48px",
              borderRadius: "50%", border: "none", boxShadow: "0 8px 24px rgba(244,63,94,0.4)",
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

        <div style={{
          marginTop:"20px", padding:"14px 16px", borderRadius:"14px",
          backgroundColor:"rgba(244,63,94,0.05)",
          border:"1px solid rgba(244,63,94,0.18)"
        }}>
          <div style={{
            fontSize:"10px", color: COL.rose, fontWeight:700,
            letterSpacing:"0.1em", marginBottom:"6px", fontFamily:"monospace"
          }}>⚠ DISCLAIMER</div>
          <div style={{ fontSize:"11px", color:"#4B5563", lineHeight:1.7 }}>
            All content is for educational and clinical reference purposes. Dose prescriptions must follow GEC-ESTRO, ABS and institutional protocols. All brachytherapy procedures require full patient consent, qualified clinical team, physicist QA verification and regulatory compliance. This tool does not replace clinical training, departmental protocols or individual patient assessment.
          </div>
        </div>
        <div style={{ height:"32px" }} />
      </div>
    </div>
  );
}
