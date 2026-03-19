import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, ChevronRight, Info, AlertTriangle, CheckCircle, XCircle, BookOpen, Activity, Image as ImageIcon, FileText } from "lucide-react";

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
  // shared
  lime:    "#86EFAC",
  violet:  "#A78BFA",
  red:     "#F87171",
};

const SITES = {
  prostate: { id:"prostate", label:"Prostate BT",          icon:"⚛",  primary:C.cyan,  bg:C.cyanBg,  border:C.cyanBd  },
  vault:    { id:"vault",    label:"Endometrial / Vault BT",icon:"🌸",  primary:C.pink,  bg:C.pinkBg,  border:C.pinkBd  },
  skin:     { id:"skin",     label:"Skin / Surface BT",    icon:"🧴",  primary:C.amber, bg:C.amberBg, border:C.amberBd },
};

// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════════
const KB = {
  prostate: [
    {
      id:"p1", icon:"🎯", title:"Patient Selection & Risk Stratification",
      subs:[
        { id:"p1a", title:"Candidate Selection — Who Qualifies?",
          body:`RISK GROUP STRATIFICATION (NCCN / D’Amico)

• Low risk: PSA <10, Gleason ≤6 (Grade Group 1), T1c–T2a → LDR monotherapy or HDR monotherapy; best candidates
• Favourable intermediate risk: PSA 10–20 OR Gleason 7 (3+4), T2b → LDR ± short-term ADT, or HDR monotherapy
• Unfavourable intermediate: Gleason 7 (4+3) or multiple IR features → HDR boost after EBRT, or LDR + ADT
• High risk: PSA >20 OR Gleason 8–10 OR T3 → HDR boost mandatory; LDR monotherapy NOT appropriate

ABSOLUTE CONTRAINDICATIONS TO LDR:
• TURP within 6 months (disrupted urethral anatomy → unpredictable dosimetry; cold spot at TURP defect)
• Prostate volume >60 cc not adequately downsized with ADT
• Severe pubic arch interference (PAI) — assessed at volume study TRUS
• Active inflammatory bowel disease with rectal involvement
• Uncorrectable bleeding diathesis
• Prior pelvic RT (relative — HDR may still be feasible with careful planning)

RELATIVE CONTRAINDICATIONS:
• Baseline LUTS severe (IPSS >20) — high acute urinary retention risk post-implant
• Median lobe hypertrophy (difficult seed placement; retention risk)
• Previous TURP (relative — seeds cannot be placed in TURP cavity; retention risk)
• Hip prosthesis — artefact on TRUS imaging; consider MRI-guided planning

PROSTATE VOLUME ASSESSMENT:
• Ideal LDR volume: ≤50 cc
• 50–60 cc: ADT downsizing (LHRH agonist 3–6 months) before implant
• >60 cc after ADT: consider HDR (no volume restriction), EBRT, or HIFU

PUBIC ARCH INTERFERENCE (PAI):
Assessed at volume study TRUS by overlaying the pubic arch on the prostate image. If posterior prostate is obscured by arch shadow, needle access is compromised. Remedies: lateral decubitus positioning, extended lithotomy, use of angled template, or convert to HDR approach.` }, { id:"p1b", title:"LDR vs HDR vs EBRT — Decision Matrix", body:`MODALITY DECISION GUIDE

LOW RISK:
→ LDR monotherapy: I-125 145 Gy or Pd-103 125 Gy. 15-year bDFS 85–95%. Single outpatient procedure.
→ HDR monotherapy: 13.5 Gy × 2 or 19 Gy × 2 (emerging strong data). No seed migration.
→ SBRT (LINAC): 36.25 Gy/5# (PACE-B non-inferior). No needles/anaesthetic.
→ EBRT 78 Gy: acceptable if BT not feasible.

FAVOURABLE INTERMEDIATE:
→ LDR ± ADT 3–6 months: bDFS equivalent to high-dose EBRT.
→ HDR monotherapy: ISIO 13.5 Gy × 2 (1-day procedure).
→ EBRT 78–80 Gy + 6 months ADT.

UNFAVOURABLE INTERMEDIATE / HIGH RISK:
→ EBRT 45 Gy + HDR boost 15 Gy × 1 (or 10–11 Gy × 2): ASCENDE-RT gold standard.
→ EBRT 45 Gy + LDR boost 110 Gy: effective but HDR boost shows superior bDFS (ASCENDE-RT).
→ EBRT 78 Gy + 2–3 years ADT: standard non-BT option.

KEY TRIAL — ASCENDE-RT (2017):
• EBRT 46 Gy + ADT → randomised: EBRT 78 Gy dose-escalation vs LDR boost 115 Gy
• LDR boost: 9y bDFS 83% vs 75% (dose-escalation EBRT) — statistically superior
• BUT Grade 3 late GU toxicity: 18% LDR vs 5% EBRT — significant toxicity cost
• No OS difference at 9 years

KEY TRIAL — HYPO-RT-PC (2019): 42.7 Gy/7# non-inferior to 78 Gy/39# for EBRT component.
KEY TRIAL — PACE-B (2021): SBRT 36.25 Gy/5# non-inferior to conventional/hypofractionated EBRT.` }, ] }, { id:"p2", icon:"☢", title:"LDR Seed Implant — Complete Guide", subs:[ { id:"p2a", title:"Radioactive Sources — I-125 vs Pd-103 vs Cs-131", body:`SOURCE COMPARISON

I-125 (IODINE-125):
• Half-life: 59.4 days
• Mean photon energy: 28.4 keV
• HVL in tissue: ~2 cm
• Initial dose rate at 1 cm: 7–10 cGy/h
• Time to 90% dose delivery: ~9.7 months
• Monotherapy dose: 145 Gy | Boost dose (after EBRT 45 Gy): 110 Gy
• Preferred: low-risk disease, slower-growing tumours (exploits low dose rate effect maximally)

Pd-103 (PALLADIUM-103):
• Half-life: 16.97 days
• Mean photon energy: 21 keV
• HVL in tissue: ~1.5 cm
• Initial dose rate: 18–22 cGy/h (significantly higher than I-125)
• Time to 90% dose delivery: ~2.9 months (much faster)
• Monotherapy dose: 125 Gy
• Theoretical advantage: higher Gleason-grade tumours (higher α/β tumours benefit less from LDR)
• Practical: faster PSA nadir; fewer patient restrictions on sexual activity/travel

Cs-131 (CAESIUM-131):
• Half-life: 9.7 days
• Mean photon energy: 30 keV
• Fastest dose delivery of all permanent seed isotopes
• Dose: 115 Gy monotherapy
• Emerging: salvage re-implant, faster PSA nadir; limited long-term outcome data

SEED CONSTRUCTION:
• All: titanium-encapsulated cylinder, 0.8 mm × 4.5 mm
• Loose seeds vs stranded seeds (on Vicryl suture, spaced 1 cm apart)
• Stranded seeds: significantly lower migration rate (<1% vs 1–10% loose)

WHY LOW α/β MATTERS FOR PROSTATE:
Prostate cancer α/β ≈ 1.5–3 Gy — unusually low for a malignancy. This means LDR (continuous low dose rate ~7 cGy/h) is biologically extremely effective because the effective dose per fraction equivalent is very high. BED (prostate LDR I-125): typically 200–220 Gy₁.₅ — far exceeding any EBRT schedule.` }, { id:"p2b", title:"TRUS-Guided Implant — Step-by-Step Procedure", body:`PRE-OPERATIVE PLANNING (4–6 WEEKS BEFORE IMPLANT)

VOLUME STUDY:

1. Dorsal lithotomy (identical to implant position — critical for reproducibility)
1. TRUS: transverse images every 5 mm from base to apex; sagittal images
1. Prostate, urethra, rectum contoured on each slice
1. Pubic arch interference assessed — overlay arch on TRUS images
1. TPS (VariSeed / Prowess Brachy / sPlan) generates optimised seed plan
1. Pre-plan targets: V100 ≥95%, D90 ≥145 Gy (I-125), urethral D10 ≤150% prescription, rectal V100 <1 cc

DAY OF IMPLANT

STEP 1 — POSITIONING: Extended dorsal lithotomy (candy-cane stirrups). Legs 45° flexion/abduction. Must exactly match volume study position — crucial for plan transfer.

STEP 2 — ANAESTHESIA: Spinal (T10 level required) or general anaesthesia. Spinal is preferred in many centres (less physiological perturbation, excellent post-op analgesia).

STEP 3 — FOLEY CATHETER: Inserted pre-operatively. Balloon filled with contrast for urethral visualisation on TRUS. Provides critical urethral reference landmark in dosimetry.

STEP 4 — TRUS PROBE: Biplane or end-fire TRUS probe inserted per rectum. Stepper device attached to probe holder — allows controlled 5 mm stepping between image planes. Template grid (Lucite, 5 mm spacing) mounted on stepper unit.

STEP 5 — GLAND ALIGNMENT: Prostate gland aligned with TRUS image to match volume study geometry. Base and apex identified on longitudinal scan.

STEP 6 — NEEDLE PLACEMENT: 18G, 20 cm needles inserted transperineally through template grid holes per pre-plan coordinates. Typically 16–24 needles. Each needle imaged in real-time TRUS.

STEP 7 — INTRAOPERATIVE DOSIMETRY (Real-time planning):
• As seeds deposited, TPS updates dose distribution in real-time
• Cold spots identified → additional needles/seeds placed
• Real-time optimisation critical for final plan quality

STEP 8 — SEED DEPOSITION:
• MICK APPLICATOR (loose seeds): Stylet withdrawn as seeds fired individually from needle
• STRANDED SEEDS: Pre-loaded Vicryl strand with seeds spaced 1 cm deployed as needle withdrawn
• PERIPHERAL LOADING strategy: higher seed density peripherally (peripheral zone = primary cancer site); lower central/urethral density → less urethral toxicity

STEP 9 — POST-SEED TRUS: Images with all seeds in situ. Intraoperative D90 confirmed ≥140 Gy.

POST-PROCEDURE:
• Foley removed in recovery or next morning (LUTS dependent)
• Tamsulosin 0.4 mg: start 1–2 weeks pre-implant, continue 6–12 months
• Strain urine for 2 weeks (voided seeds — patient given collection container)
• No heavy lifting for 1 week
• Sexual activity: resume at 2 weeks; condom use for 2 months
• Return to work: 2–5 days typically` }, { id:"p2c", title:"Post-Implant Dosimetry — CT-Based Quality Assessment", body:`POST-IMPLANT DOSIMETRY (PID) — MANDATORY QUALITY ASSURANCE

TIMING: CT-based PID at DAY 30 post-implant (not immediately after procedure)

WHY DAY 30?
Acute post-implant oedema enlarges the prostate by 20–40% above its true volume. If PID performed immediately:
• Seeds appear more spread out (larger apparent prostate)
• D90 appears artificially low (pessimistic)
• V150 appears artificially low
At Day 30: oedema fully resolved → true prostate geometry → accurate dosimetry

PID PROCEDURE:

1. CT pelvis: 2 mm slice thickness (thin slices essential for accurate seed localisation)
1. Physicist identifies ALL seeds on CT axial images — seed count must match number implanted (documented in operative notes)
1. Prostate contoured on CT (optional MRI fusion — improved delineation especially at apex and base)
1. TPS calculates 3D dose distribution from seed positions
1. DVH analysis

KEY DOSIMETRIC PARAMETERS (ABS / AAPM TG-137):

D90 (minimum dose to 90% of prostate volume):
• Target: ≥100% prescription dose = ≥145 Gy (I-125 monotherapy)
• D90 <100%: suboptimal — consider salvage (re-implant or EBRT supplementation)
• D90 100–150%: optimal range
• D90 >150%: excessive — higher toxicity without additional tumour benefit

V100 (% prostate receiving ≥100% of prescription dose):
• Target: ≥95%

V150 (% prostate receiving ≥150% of prescription dose):
• Target: <50% (higher = more urethral/central toxicity)

Urethral D10 (dose to hottest 10% of urethra):
• Target: <150% prescription dose
• D10 >200%: very high stricture/toxicity risk

Rectal V100 (% rectal volume receiving ≥100% prescription):
• Target: <1 cc absolute

OUTCOMES CORRELATED WITH D90:
Stock et al. (IJROBP 2002): D90 ≥140 Gy → bDFS significantly superior. D90 <100 Gy: markedly inferior.
Zelefsky MSKCC: PSA relapse-free survival 88% (D90 ≥100%) vs 76% (D90 <100%) at 8 years.` }, { id:"p2d", title:"Seed Migration — Mechanism, Detection & Management", body:`SEED MIGRATION — PERMANENT IMPLANT COMPLICATION

DEFINITION: Displacement of implanted seeds from the prostate to a remote anatomical location, most commonly the pulmonary vasculature.

INCIDENCE:
• Loose seeds: 1–10% of implanted seeds may migrate
• Stranded seeds: <1% migration rate — primary prevention strategy
• Most migrations are clinically silent

MECHANISM:

1. VASCULAR ROUTE (most common): Seed enters a periprostatic venule during needle placement/seed delivery → carried via internal iliac vein → common iliac → IVC → right heart → pulmonary artery → lodges in peripheral pulmonary capillary
1. URETHRAL ROUTE: Seed falls into bladder via urethra → voided in urine (patient may notice)
1. RECTAL ROUTE (rare): Seed penetrates very thin rectal wall — requires significant posterior placement error

DETECTION:
• Routine AP + lateral chest X-ray: performed post-implant (or at Day 30 PID CT scan)
• Seeds visible as small radio-opaque elliptical objects, typically at lung bases
• CT thorax: definitive if CXR equivocal

CLINICAL SIGNIFICANCE:
Pulmonary seed: Almost always ASYMPTOMATIC. Radiation dose from a single I-125 seed to surrounding lung tissue: <5 cGy total over its entire decay — clinically negligible. Rare case reports of transient pleural effusion. Management: reassurance and documentation.

Voided seed: Theoretical radiation risk to partner during intercourse — hence condom advice for 2 months. Seeds collected by patient, stored in provided lead container, returned to department as radioactive waste.

Dosimetric impact: 1–3 migrated seeds rarely alters D90 significantly. Cluster migration from peripheral prostate → localised cold spot → identified on Day 30 PID.

PREVENTION:
• Use stranded seeds routinely (strongest evidence for prevention)
• Avoid deep periprostatic venous sinuses during needle insertion
• Correct seed deposition: deposit as needle withdrawn (not advanced)
• Limit loose seeds if used — use seed spacers to reduce total number needed` }, { id:"p2e", title:"Radiation Protection — LDR Seed Patients", body:`RADIATION PROTECTION FOR PERMANENT SEED PATIENTS

SOURCE CHARACTERISTICS:
I-125: 27–35 keV photons (very low energy). HVL in soft tissue ~2 cm. Penetration through body is minimal.
At body surface over implant: ~1 mR/h. At 1 metre: negligible (<0.01 mR/h).
Regular clothing: ~50% attenuation. Lead apron (0.5 mm Pb): >95% attenuation.

PATIENT DISCHARGE CRITERIA:
ICRP / NRC: Patient released if dose to maximally-exposed individual in household < 5 mSv over treatment life. I-125 implant: easily meets this criterion — patient may go home same/next day.

PATIENT INSTRUCTIONS (standard I-125 implant):
• FIRST 2 MONTHS: limit time within 1 metre of pregnant women and children <18 to <2 hours per day
• Sexual activity: resume after 2 weeks; condom use for 2 months (voided seed risk)
• Travel: carry Radiation Alert Card — seeds trigger airport security radiation detectors
• Cremation: inform funeral home; seeds remain active for ~2 years (I-125)
• Urine straining: for 2 weeks post-implant; collect any voided seeds in lead container provided
• Future healthcare: inform all providers of implanted seeds (seeds visible on all imaging modalities)
• Occupational exposure: if patient works with radiation (nuclear medicine, interventional radiology) → additional guidance from RSO required

STAFF PROTECTION DURING PROCEDURE:
• Surgeon + physicist: lead apron + lead glasses during seed handling
• Anaesthesia team: >1 metre from implant site provides adequate protection
• Seed storage: lead-lined seeds box, handled with long forceps
• Theatre survey: physicist surveys room before handover after procedure

WASTE MANAGEMENT:
• Unused seeds: returned to manufacturer as radioactive waste
• Voided seeds: patient-returned lead container → departmental radioactive waste disposal` }, ] }, { id:"p3", icon:"⚡", title:"HDR Prostate — Boost & Monotherapy", subs:[ { id:"p3a", title:"HDR Technique — Needles, Planning & Delivery", body:`HDR PROSTATE BRACHYTHERAPY — PROCEDURAL OVERVIEW

APPLICATOR SYSTEM:
• 6F flexible plastic catheters (afterloading tubes) inserted transperineally
• TRUS guidance — real-time visualisation of needle position within prostate
• Template grid (Nucletron Titanium template or equivalent) mounted on TRUS stepper
• Typically 14–20 catheters for full gland coverage
• Catheters remain in situ for all fractions (single anaesthetic for multi-fraction schedules, or overnight stay)

CT OR MRI-GUIDED PLANNING:
CT (most common): Catheters reconstructed on CT (2 mm slices). Prostate, urethra, rectum, bladder contoured. IPSA optimisation.
MRI (gold standard): Superior soft tissue delineation. Prostate apex/base identification more accurate. Needle artefact manageable with optimised sequences.

KEY DOSIMETRIC CONSTRAINTS (HDR prostate — ABS 2019):
• Prostate V100: ≥95%
• Prostate D90: ≥100% prescription dose
• Urethra D10: ≤110–115% prescription dose
• Rectum D2cc: ≤65–75% prescription dose
• Bladder D2cc: ≤80% prescription dose
• Penile bulb D5cc: <50% prescription dose (erectile preservation)

HDR BOOST SCHEDULES (after EBRT 45–46 Gy/25#):
• 15 Gy × 1 fraction (MSKCC / Beaumont protocol) — single insertion, outpatient
• 11.5 Gy × 2 fractions (most widely used globally) — same-day BD or overnight
• 10 Gy × 2 fractions
• 9.5 Gy × 2 fractions
• 7.5 Gy × 3 fractions (some European centres)

HDR MONOTHERAPY SCHEDULES (low–intermediate risk):
• 13.5 Gy × 2 fractions (ISIO — 1-day procedure, 2 fractions, same catheters)
• 9.5 Gy × 4 fractions (2/day × 2 days — overnight hospital stay)
• 19 Gy × 2 fractions (Beaumont FLAME protocol — very high dose, selected centres)
• 7.5 Gy × 6 fractions (most fractionated — theoretical OAR advantage)

BED COMPARISON (prostate α/β = 1.5 Gy):
• 11.5 Gy × 2 (boost): BED₁.₅ = 2×11.5×(1+11.5/1.5) = 199 Gy₁.₅
• LDR I-125 145 Gy: BED₁.₅ ≈ 220 Gy₁.₅ (accounting for repair during LDR)
• EBRT 78 Gy/39#: BED₁.₅ = 78×(1+2/1.5) = 182 Gy₁.₅
→ HDR boost delivers biologically equivalent or superior dose to EBRT dose-escalation

ADVANTAGES OF HDR OVER LDR:
• No seed migration concern
• Real-time IPSA optimisation per fraction (plan adapted to anatomy)
• No volume restriction (treats large prostates)
• No radiation exposure to close contacts post-procedure
• Applicable to prior-irradiated patients (salvage setting — dose precisely titrated)
• Source decay irrelevant (Ir-192 replaced every 3 months → consistent activity)` }, ] }, { id:"p4", icon:"⚠", title:"Toxicity & Follow-up", subs:[ { id:"p4a", title:"GU, GI & Erectile Toxicity Profile", body:`PROSTATE BRACHYTHERAPY TOXICITY

ACUTE GU (within 6 months post-LDR):
• Urinary frequency/urgency: 80–95% (universal — urethral oedema + inflammatory reaction to seeds)
• Peak symptoms: 2–4 weeks post-implant
• Resolution: 6–12 months for most symptoms
• Acute urinary retention (AUR): 5–15% — risk factors: IPSS >15, large prostate, median lobe
Management: alpha-blocker (tamsulosin 0.4 mg OD — start 1 week pre-implant, continue 12 months); temporary Foley; rarely suprapubic catheter
• Haematuria: 30–50% (transient, mild — needle trauma)
• Haematospermia: common, transient, not harmful

LATE GU:
• Urethral stricture: 1–3% at 5 years. Risk: high urethral D10, prior TURP, post-boost EBRT.
• Urinary incontinence: <5% (far less than radical prostatectomy). Higher risk with prior TURP.
• Dysuria: residual in 5–10% at 1 year
• Grade 3+ GU toxicity: 5–15% (higher with HDR boost — ASCENDE-RT: 18% vs 5%)

ACUTE GI/RECTAL:
• Rectal discomfort/urgency: 15–20% (bowel prep reduces this)
• Rectal bleeding (Grade 1–2): 5–10% — typically resolves spontaneously
• Resolution: 6–12 months post-LDR

LATE RECTAL:
• Grade 3 proctitis / haemorrhage: 1–3% — managed with APC/laser
• Rectourethral fistula: <0.5% (rare but devastating)
• Risk factors: rectal V100 >1 cc; post-implant rectal biopsy (AVOID — very high fistula risk)

RECTAL BIOPSY WARNING:
Biopsy of posterior rectal wall in high-dose region (within 18–24 months post-LDR) carries extremely high rectourethral fistula risk. Any rectal abnormality should be surveilled conservatively until seeds have fully decayed (I-125: ~2 years).

ERECTILE DYSFUNCTION (ED):
• 40–60% at 5 years with LDR monotherapy; higher with ADT combination
• Mechanism: radiation damage to neurovascular bundles and cavernosal arteries (gradual)
• Onset: 18–24 months post-implant (gradual progressive loss)
• Risk factors: age >70, baseline ED, diabetes, cardiovascular disease, ADT use
• Management: PDE5 inhibitors (50–70% response), vacuum erection device, ICI (alprostadil)
• IMPORTANT: Potency preservation with LDR BT is significantly better than radical prostatectomy (nerve-sparing or non-nerve-sparing) in the published literature

PSA BOUNCE (critical concept):
• Benign transient PSA rise occurring in 25–35% of patients post-LDR
• Timing: typically 12–30 months post-implant
• Magnitude: usually <2 ng/mL above nadir; occasionally larger
• NOT biochemical failure — must counsel all patients pre-implant
• Phoenix biochemical failure criterion: nadir + 2 ng/mL on two consecutive measurements
• Distinguish PSA bounce from failure: magnitude, timing, subsequent spontaneous decline` }, ] }, { id:"p5", icon:"🎯", title:"Key Numbers & Viva", subs:[ { id:"p5a", title:"Essential Numbers — Prostate BT", body:`MUST-KNOW NUMBERS

LDR MONOTHERAPY DOSES:
I-125: 145 Gy | Pd-103: 125 Gy | Cs-131: 115 Gy
LDR BOOST DOSE (after EBRT 45 Gy): I-125 110 Gy

HALF-LIVES: I-125 = 59.4 days | Pd-103 = 17.0 days | Cs-131 = 9.7 days
MEAN ENERGIES: I-125 = 28.4 keV | Pd-103 = 21 keV

POST-IMPLANT DOSIMETRY: Day 30 (oedema resolved)
D90 TARGET: ≥145 Gy (I-125 monotherapy) | V100 TARGET: ≥95%
V150 TARGET: <50% | URETHRAL D10: <150% Rx | RECTAL V100: <1 cc

PROSTATE α/β: 1.5–3 Gy | RECTUM α/β: 3 Gy | URETHRA α/β: 5 Gy

HDR BOOST (most common): 11.5 Gy × 2 fractions (after EBRT 45 Gy)
HDR MONOTHERAPY: 13.5 Gy × 2 fractions (ISIO)
VOLUME LIMIT FOR LDR: ≤50 cc (ideally); ADT downsizing if >50 cc

AUR RISK: 5–15% post-LDR | PSA BOUNCE: 25–35%, 12–30 months post
PHOENIX CRITERIA: PSA nadir + 2 ng/mL
ED AT 5 YEARS: 40–60% LDR monotherapy

SEED MIGRATION: 1–10% (loose) vs <1% (stranded)
MOST COMMON MIGRATION SITE: Pulmonary vasculature (lung bases on CXR)
ASCENDE-RT: LDR boost bDFS 83% vs 75% EBRT dose-escalation at 9y` }, { id:"p5b", title:"Viva Questions — Prostate BT", body:`Q: What is the prescription dose for I-125 LDR monotherapy?
A: 145 Gy (monotherapy). For LDR boost after EBRT 45 Gy: 110 Gy. Pd-103 monotherapy: 125 Gy.

Q: Why does prostate cancer have a low α/β ratio and what is the clinical implication?
A: Prostate cancer α/β ≈ 1.5–3 Gy — unusually low for a carcinoma (comparable to late-responding normal tissues). This means prostate cancer is highly sensitive to dose per fraction — larger fractions are disproportionately more lethal to the tumour relative to equivalent total dose in smaller fractions. Clinical implication: LDR brachytherapy exploits this through continuous irradiation at ~7–10 cGy/h which, despite appearing low, accumulates to a very high BED₁.₅ (typically >200 Gy₁.₅). Hypofractionated EBRT (SBRT/HDR) also exploits this — SBRT 36.25 Gy/5# is non-inferior to 78 Gy/39# (PACE-B).

Q: What is a PSA bounce and how do you distinguish it from biochemical failure?
A: PSA bounce: benign transient PSA rise (usually <2 ng/mL) occurring in 25–35% of patients at 12–30 months post-LDR implant. Cause: inflammatory response to seed material; radiation-induced PSA secretion from surviving benign prostate cells. Distinguished from failure by: spontaneous decline after rise (failure continues to rise), magnitude usually <2 ng/mL, timing (18–24 months), absence of clinical recurrence on imaging. Phoenix failure: nadir + 2 ng/mL on two consecutive measurements. Key: counsel all patients before implant to avoid unnecessary salvage therapy.

Q: Why is TURP within 6 months a contraindication?
A: TURP creates a cavity in the central prostate. Seeds cannot be reliably positioned in this defect — creating a geographic cold spot at the urethra/central zone. Risk of urinary incontinence is greatly increased (TURP already weakens the sphincter mechanism; radiation further impairs). Minimum recommended gap: 6–12 months post-TURP.

Q: Explain seed migration — mechanism, detection, and management.
A: Mechanism: loose seeds enter periprostatic venules during needle placement → travel via internal iliac and iliac veins → IVC → right heart → pulmonary arterioles (most common site). Detection: routine CXR or CT at Day 30 PID. Clinical impact: asymptomatic in >99% of cases; radiation dose from single lung seed <5 cGy total — negligible. Management: reassurance, documentation. Prevention: use stranded seeds routinely; correct seed deposition technique (deposit during withdrawal, not advancement).`
},
      ],
    },
  ],
  vault: [
    {
      id:"v1", icon:"📋", title:"Indications & Evidence Base",
      subs:[
        { id:"v1a", title:"Role of VBT — When and Why?",
          body:`VAGINAL VAULT BRACHYTHERAPY — ROLE & INDICATIONS

PRIMARY ROLE:
VBT delivers adjuvant radiation to the vaginal cuff post-hysterectomy for endometrial cancer. It is the most commonly performed gynaecological BT procedure in most radiation oncology departments.

ANATOMICAL TARGET:
The vaginal cuff (surgical margin at the apex of the vagina after hysterectomy) is the most common site of local recurrence in endometrial cancer. VBT targets this region with high local dose and rapid fall-off, sparing rectum, bladder, and bowel.

WHY VBT RATHER THAN EBRT?
PORTEC-2 (2010) definitively established VBT as the standard over EBRT for high-intermediate risk (HIR) endometrial cancer:
• Vaginal relapse rates equal: 1.8% VBT vs 1.6% EBRT at 5 years
• Grade 2+ GI toxicity: 12.6% VBT vs 53.8% EBRT — dramatic difference
• Quality of life: significantly better with VBT
→ VBT replaced EBRT as standard of care for HIR disease

INDICATIONS FOR VBT (ENDOMETRIAL):
Low risk (Stage IA Grade 1–2, no LVSI): observation — no RT
High-intermediate risk (HIR) by PORTEC criteria:
• Stage IA Grade 3 with LVSI
• Stage IB Grade 1–2 (≥50% myometrial invasion)
• Stage IC (outer third myometrial invasion)
→ VBT ALONE: standard (PORTEC-2)

High risk (PORTEC-3 / GOG 249 criteria):
• Stage III disease (node positive, adnexal, peritoneal involvement)
• Serous or clear cell histology
• Grade 3 with substantial LVSI
• Positive surgical margins
→ EBRT + VBT boost ± concurrent/adj chemotherapy (PORTEC-3)

INDICATIONS: CERVIX POST-HYSTERECTOMY:
Stage IA2/IB1 cervical cancer: selected patients post-hysterectomy if no parametrial involvement — VBT to vaginal cuff margin.

VAGINAL CANCER:
Stage I (superficial, vault confined): VBT alone may be curative.
Stage II+: EBRT (45 Gy) + VBT boost.` }, { id:"v1b", title:"PORTEC Trials — Complete Evidence Summary", body:`THE PORTEC EVIDENCE BASE

PORTEC-1 (Creutzberg, Lancet 2000):
• Population: Stage IB Grade 2–3, IC Grade 1–2 endometrial cancer post-hysterectomy
• Randomised: EBRT 46 Gy/23# vs observation
• Result: EBRT reduced LRR (4% vs 14%) but NO OS benefit
• GI toxicity significantly higher EBRT arm
• Conclusion: EBRT improves local control but not survival; toxicity burden significant

PORTEC-2 (Nout, Lancet 2010): ★ PRACTICE-DEFINING
• Population: High-intermediate risk (HIR) endometrial cancer post-hysterectomy
• Randomised: VBT (21 Gy/3# HDR) vs EBRT (46 Gy/23#)
• Vaginal relapse: 1.8% VBT vs 1.6% EBRT at 5 years — EQUIVALENT
• Pelvic/distant failure: not significantly different
• Grade 2+ GI toxicity: 12.6% VBT vs 53.8% EBRT — dramatically better VBT
• Quality of life (SF-36): significantly better VBT
• CONCLUSION: VBT = EBRT for vaginal relapse prevention in HIR; vastly less toxicity
• ★ STANDARD OF CARE established for HIR endometrial cancer

PORTEC-3 (de Boer, Lancet Oncol 2018 / updated 2021):
• Population: High-risk endometrial (Stage III, serous/clear cell, LVSI+, Grade 3)
• Randomised: EBRT alone vs EBRT + concurrent cisplatin → adj carboplatin/paclitaxel
• OS at 5 years: 81% chemoRT vs 76% EBRT alone (HR 0.70, p=0.034 — significant)
• Failure-free survival: 76% vs 69% — superior chemoRT
• CONCLUSION: Concurrent chemoRT superior for high-risk endometrial cancer
• VBT boost (2 Gy × 3 fractions) added in many centre protocols after EBRT

GOG 249 (Randall, JCO 2019):
• Population: HIR endometrial cancer
• Randomised: VBT + adj carboplatin/paclitaxel × 3 cycles vs pelvic EBRT alone
• Vaginal/pelvic control: equivalent in both arms
• Distant failure: marginally higher VBT+chemo arm (not statistically significant)
• Late GI toxicity: VBT+chemo arm less GI toxicity vs EBRT
• CONCLUSION: VBT+chemo is an alternative to EBRT for some HIR patients (avoids pelvic RT)
• Controversial: ongoing debate whether chemo adds value for HIR vs truly high-risk` }, ] }, { id:"v2", icon:"🔧", title:"Cylinder Applicators — Selection & Technique", subs:[ { id:"v2a", title:"Cylinder Types, Sizes & Selection Rationale", body:`VAGINAL CYLINDER APPLICATORS

AVAILABLE TYPES:

1. SINGLE-CHANNEL CYLINDER (standard — most widely used):
   One central afterloading channel. Ir-192 source steps along channel — cylindrical dose distribution.
   Diameters: 2.0 cm, 2.5 cm, 3.0 cm, 3.5 cm, 4.0 cm.
   Most centres stock 2.0–3.5 cm range.
1. MULTI-CHANNEL CYLINDER (Varian Vienna / Elekta MultiCyl):
   Central channel + 2–6 peripheral channels in circular arrangement.
   Advantage: IPSA optimisation — peripheral channels can boost vault dose while central dwell times reduced → lower central high-dose, better dose homogeneity across vaginal wall.
   Particularly useful: asymmetric vault anatomy, unilateral involvement, residual tumour.
1. MIAMI / COMBO APPLICATOR:
   Cylinder + tandem combination. Treats vaginal vault + upper vaginal walls simultaneously.
   Indication: residual disease at vault or proximal vaginal extension.
1. ROTTERDAM APPLICATOR:
   Combines vaginal cylinder with intrauterine tandem. Rare indication — recurrent disease in conserved uterus or vault + central disease.

CYLINDER SIZE SELECTION:
RULE: SELECT THE LARGEST DIAMETER CYLINDER THAT FITS COMFORTABLY.

RATIONALE (inverse square law — identical principle to cervix ovoids):
Dose at the vaginal surface (prescription point) = dose at cylinder surface radius R.
For a larger cylinder: R is larger → source at greater distance from vaginal wall tissue beyond the cylinder → dose to rectum and bladder falls more steeply.

If prescription dose is fixed (e.g., 7 Gy at surface):
• Small cylinder (2 cm, R=1 cm): rectal dose falls off from ~7 Gy at 1 cm to ~4 Gy at 1.5 cm
• Large cylinder (3.5 cm, R=1.75 cm): rectal dose falls off from 7 Gy at 1.75 cm to much lower at 2.25 cm

Also: larger cylinder fills vaginal vault — reduces air gaps that distort dose distribution.

CLINICAL SIZE GUIDE:
• Post-hysterectomy vault (standard): 3.0–3.5 cm
• Atrophic/stenotic vault: begin with 2.0–2.5 cm (gentle dilation pre-treatment may be needed)
• Young premenopausal patient: 3.5–4.0 cm
• Post-radical surgery (Wertheim’s): may be stenotic → careful digital examination before selection

TREATMENT LENGTH:
Standard adjuvant VBT: upper 3 cm of vagina.
Higher-risk (bulky LVSI, close margins): upper 5 cm.
Vaginal cancer: entire vaginal length if necessary.` }, { id:"v2b", title:"Step-by-Step VBT Insertion Procedure", body:`VAGINAL VAULT BRACHYTHERAPY — PROCEDURE

PRE-PROCEDURE PREPARATION:
• Fleet enema 2 hours before each fraction (reduces rectal diameter → improves rectal displacement → lower rectal dose)
• Bladder: semi-full 100–150 mL (reproducible bladder geometry between fractions) — some centres empty bladder completely; either practice acceptable if consistent
• Anxiolytic: oral lorazepam 0.5–1 mg 30 minutes before procedure (no anaesthesia needed for standard VBT)
• Analgesia: paracetamol or NSAIDs 1 hour before (reduces procedural discomfort)

STEP 1 — POSITIONING: Dorsal lithotomy or supine with knees supported. Privacy screen. Adequate lighting (headlight preferred for vault visualisation). Same position each fraction.

STEP 2 — VAGINAL VAULT ASSESSMENT: Brief speculum examination at first fraction — inspect vault scar, mucosal condition, identify any suspicious lesion. Document vault appearance.

STEP 3 — CYLINDER SELECTION: Assess vault calibre (digital examination). Select largest comfortable diameter (see rationale above).

STEP 4 — LUBRICATION: Aqueous lubricant gel on cylinder tip and shaft (non-radio-opaque — gel will not affect dosimetry).

STEP 5 — CYLINDER INSERTION: Gently advance cylinder along vaginal axis. Seat cylinder tip at the vaginal apex. The tip should contact the vault scar without excessive pressure. Confirm full insertion using markings on cylinder shaft — note length of cylinder inserted.

STEP 6 — CYLINDER FIXATION: Lock ring/collar secured at the introitus prevents displacement during treatment. Some centres use a T-bar attachment to the treatment couch for additional stability. The cylinder must remain in IDENTICAL position throughout treatment.

STEP 7 — TREATMENT LENGTH SETTING: Confirm dwell position range on TPS matches intended treatment length (uppermost dwell = cylinder tip; lowest dwell = 3 cm below). Verify on planning system before treatment.

STEP 8 — IMAGING (if CT-based planning):
• CT pelvis: 2–3 mm slices with cylinder in situ
• Contour: vaginal vault CTV, rectum, bladder, sigmoid, small bowel
• For standard adjuvant VBT with normal anatomy: 2D X-ray planning is acceptable

STEP 9 — PLAN APPROVAL: Physicist or dosimetrist generates plan. Standard single-channel cylinder: standard dwell sequence. Multi-channel: IPSA optimisation. Radiation oncologist approves.

STEP 10 — TREATMENT: Patient transferred to HDR room. Source connected. Treatment duration: typically 5–10 minutes per fraction. Monitor via camera/microphone.

STEP 11 — POST-TREATMENT: Cylinder removed. Patient may dress independently. Brief nursing assessment. Discharge home in 30 minutes.

BETWEEN FRACTIONS:
• Minimum 48-hour inter-fraction interval (mucosal healing)
• Typical schedule: twice weekly (Monday/Thursday or Tuesday/Friday)
• Complete all VBT within 3–4 weeks` }, ] }, { id:"v3", icon:"📐", title:"Dose Schedules — Evidence-Based", subs:[ { id:"v3a", title:"HDR VBT Schedules — Complete Reference", body:`HDR VBT DOSE SCHEDULES

STANDARD ADJUVANT VBT (post-hysterectomy, no EBRT component):

PORTEC-2 SCHEDULE (most widely used, best evidence):
• 7 Gy × 3 fractions = 21 Gy prescribed to VAGINAL SURFACE (cylinder outer surface)
• BED (mucosa α/β=3): 21×(1+7/3) = 70 Gy₃ → EQD2 = 58.3 Gy
• BED (tumour α/β=10): 21×(1+7/10) = 35.7 Gy₁₀ → EQD2 = 29.8 Gy

5-FRACTION SCHEDULE (some centres — better OAR sparing):
• 5.5 Gy × 5 fractions = 27.5 Gy at vaginal surface
• BED₃ = 27.5×(1+5.5/3) = 77.9 Gy₃ → EQD2 = 64.9 Gy (slightly higher mucosal BED)
• Advantage: smaller dose per fraction → less rectal dose concern if bowel close

ALTERNATIVE SCHEDULES:
• 6 Gy × 4 fractions = 24 Gy at surface
• 10.5 Gy × 2 fractions (some ABS-guided US protocols)

VBT BOOST (after EBRT 45–50.4 Gy):
• 5.5 Gy × 2 fractions at vaginal surface
• 6 Gy × 2 fractions at vaginal surface
• 4 Gy × 3 fractions at 5 mm depth
• Total combined EQD2 (mucosa): EBRT (3 Gy/fx → EQD2=53 Gy) + VBT boost → combined ~75–80 Gy₃

VAGINAL RECURRENCE — SALVAGE VBT (no prior RT):
• EBRT 45 Gy + VBT boost to HR-CTV D90 ≥ 65–70 Gy EQD2 (GEC-ESTRO volumetric approach)
• HDR: 7–8 Gy × 3–4 fractions boost after EBRT

PRESCRIPTION DEPTH CONVENTION:
• Standard: vaginal surface = cylinder outer surface (at radius R of cylinder)
• Some centres/protocols: 5 mm depth (R + 0.5 cm) — for residual disease or thicker vault
• ALWAYS DOCUMENT prescription depth clearly — dose numbers differ significantly between conventions

OAR DOSE CONSTRAINTS (combined EBRT + VBT, GEC-ESTRO / ICRU 89):
• Rectum D2cc: < 75 Gy EQD2₃
• Bladder D2cc: < 90 Gy EQD2₃
• Sigmoid colon D2cc: < 75 Gy EQD2₃
• Vaginal mucosa D2cc: < 130 Gy EQD2₃ (often not a limiting factor with VBT alone)

BED/EQD2 CALCULATION REMINDER:
BED = n × d × (1 + d/α/β)
EQD2 = BED / (1 + 2/α/β)
For VBT alone OAR calculation: also add EBRT contributions before comparing to limits.` }, ] }, { id:"v4", icon:"⚠", title:"Toxicity & Follow-up", subs:[ { id:"v4a", title:"Acute & Late Toxicity Profile", body:`VBT TOXICITY PROFILE

ACUTE TOXICITY (during and up to 6 weeks post-VBT):
• Vaginal soreness/irritation: 30–50% (Grade 1–2) — self-limiting, peaks at end of course
• Mild vaginal discharge: 20–30% (serous/mucopurulent), resolves within weeks
• Urinary frequency/dysuria: <10% (rare — major advantage over EBRT)
• Bowel effects: minimal (<5%) — KEY advantage vs EBRT (PORTEC-2: 12.6% vs 53.8% Grade 2+)

LATE TOXICITY:
VAGINAL STENOSIS (most common significant late effect):
• Without dilator use: 30–50% develop clinically significant stenosis
• With dilator use: <10% — dilator use is ESSENTIAL, not optional
• Impact: dyspareunia, inability to undergo speculum examination for follow-up/smear
• Prevention: vaginal dilator 3× weekly from 4–6 weeks post-treatment; topical oestrogen cream (low-dose vaginal — safe for most endometrial histologies including ER+)
• Sexual intercourse: also prevents stenosis — encourage if appropriate and desired

VAGINAL DRYNESS / ATROPHY: Very common (~60%). Topical oestrogen cream first-line (Vagifem, Ovestin). Systemic HRT: generally avoided for endometrial cancer (exception: clear cell/serous where hormones not relevant, or after specialist MDT discussion).

VAGINAL TELANGIECTASIA / BLEEDING: 5–15% at 5 years (Grade 1–2, manageable). Grade 3 vaginal haemorrhage: <1%.

GRADE 3+ LATE TOXICITY: <1% with modern dosimetry and constraint-based planning.

BOWEL TOXICITY (GI):
• VBT alone: Grade 2+ at 5 years ~12% (vs 54% with EBRT — PORTEC-2)
• Predominantly from sigmoid/small bowel loops that may droop into pelvis
• Bowel preparation before each fraction reduces acute bowel dose

FOLLOW-UP PROTOCOL:
• 3-monthly for 2 years → 6-monthly for 3 years → annual thereafter
• Each visit: speculum examination of vaginal vault — visual inspection for vault recurrence (bluish/vascular nodule or friable tissue = suspect recurrence)
• Vault cytology: low yield in asymptomatic patients — some centres omit; others perform annually
• MRI pelvis: if symptoms or examination abnormality — not routine surveillance

MANAGING VAULT RECURRENCE:
• Isolated vault recurrence after VBT alone: re-irradiation possible but with significant risk of fistula. Multidisciplinary discussion: surgery (pelvic exenteration in selected fit patients) vs re-irradiation ± interstitial BT boost.` }, ] }, { id:"v5", icon:"🎯", title:"Key Numbers & Viva", subs:[ { id:"v5a", title:"Essential Numbers — Vault BT", body:`MUST-KNOW NUMBERS — VBT

PORTEC-2 DOSE: 7 Gy × 3 fractions = 21 Gy (at vaginal surface) ← STANDARD
ALTERNATIVE: 5.5 Gy × 5 fractions = 27.5 Gy at surface
VBT BOOST (after EBRT 45 Gy): 5.5 Gy × 2 fractions at surface

TREATMENT LENGTH (standard adjuvant): Upper 3 cm of vagina
PRESCRIPTION DEPTH: Vaginal surface (= cylinder outer surface = radius R)

CYLINDER DIAMETERS: 2.0, 2.5, 3.0, 3.5, 4.0 cm
STANDARD VAULT CYLINDER: 3.0–3.5 cm (largest fitting)
PRINCIPLE: Largest fitting (inverse square law — same as cervix ovoids)

PORTEC-2 KEY RESULT:
VBT = EBRT for vaginal relapse (1.8% vs 1.6%)
GI toxicity Grade 2+: 12.6% VBT vs 53.8% EBRT ← dramatic advantage

PORTEC-3: ChemoRT superior to EBRT alone for high-risk endometrial (OS 81% vs 76% at 5y)

OAR CONSTRAINTS (combined EBRT+VBT):
Rectum D2cc < 75 Gy EQD2₃ | Bladder D2cc < 90 Gy EQD2₃
Sigmoid D2cc < 75 Gy EQD2₃

VAGINAL STENOSIS: 30–50% without dilator; <10% with dilator use
DILATOR START: 4–6 weeks post-treatment, 3× per week
INTER-FRACTION INTERVAL: Minimum 48 hours
FRACTION FREQUENCY: Twice weekly (Mon/Thu)` }, { id:"v5b", title:"Viva Questions — Vault BT", body:`Q: What did PORTEC-2 establish and what were its key results?
A: PORTEC-2 (Nout, Lancet 2010) randomised 427 high-intermediate risk endometrial cancer patients post-hysterectomy to VBT (21 Gy/3# HDR at vaginal surface) vs pelvic EBRT (46 Gy/23#). Key results: vaginal relapse rates were equivalent (1.8% VBT vs 1.6% EBRT at 5 years). Grade 2+ GI toxicity was dramatically lower with VBT (12.6% vs 53.8%). QoL significantly better with VBT. PORTEC-2 established VBT as standard of care for HIR endometrial cancer, replacing pelvic EBRT.

Q: Why do you choose the largest fitting cylinder?
A: Inverse square law: dose falls as 1/r². The dose is prescribed to the cylinder surface (at radius R). A larger cylinder places the source further from the vaginal wall, and therefore even further from the rectum and bladder — OAR dose falls more steeply. Additionally, a larger cylinder fills the vaginal vault fully, eliminating air gaps that would distort the dose distribution. The principle is identical to selecting the largest ovoid in cervix brachytherapy.

Q: How do you prevent vaginal stenosis post-VBT?
A: Regular vaginal dilator use beginning 4–6 weeks post-treatment, minimum 3 times per week. The dilator mechanically maintains vaginal patency during the inflammatory/fibrosis phase. Without it: 30–50% significant stenosis. With regular use: <10%. Topical low-dose oestrogen cream (Vagifem, Ovestin) aids mucosal recovery. Sexual intercourse also effective. Counselling and nursing education at each visit essential.

Q: When would you add pelvic EBRT instead of VBT alone?
A: High-risk features requiring pelvic EBRT: Stage III disease (nodal, adnexal, or peritoneal involvement), serous or clear cell histology, Grade 3 with significant LVSI, positive surgical margins (parametrial or vaginal). PORTEC-3 supports concurrent chemoRT (EBRT + cisplatin → adj carbo/taxol) for Stage III and serous/clear cell. GOG 249 supports EBRT for high pelvic nodal risk. VBT alone insufficient for known nodal metastases.

Q: What is the minimum inter-fraction interval for HDR VBT and why?
A: Minimum 48 hours. This allows adequate recovery of vaginal mucosa between fractions — mucosal repair reduces acute toxicity and prevents excessive late effects. Fractions given <24 hours apart increase acute and late GI/mucosal toxicity markedly. Standard practice: twice weekly (e.g., Monday and Thursday).`
},
      ],
    },
  ],
  skin: [
    {
      id:"s1", icon:"🧴", title:"Indications & Technique",
      subs:[
        { id:"s1a", title:"Indications for Skin Brachytherapy",
          body:`HDR SKIN BRACHYTHERAPY — RATIONALE

PHYSICAL PRINCIPLE — RAPID DOSE FALL-OFF:
BT dose falls as 1/r². At 5 mm below the skin surface prescription depth, dose drops to ~60–70% of surface dose. At 1 cm: ~30–40% of surface dose. This protects underlying cartilage, bone, and deeper structures.
EBRT (even orthovoltage 50–100 kV): more uniform depth dose — higher cartilage/bone dose for the same surface dose.

ADVANTAGES OVER EXTERNAL BEAM:

1. Rapid depth dose fall-off → spares cartilage/bone/orbit (critical for ear, nose, eyelid)
1. Custom conformity to complex surfaces (Valencia, Leipzig, custom moulds)
1. No exit dose effects
1. Shorter overall treatment duration (especially Valencia 6 Gy × 3 — completed in 1 week)
1. No bolus preparation required for flat/semi-flat lesions (commercial applicators)
1. Better long-term cosmesis in some series (less deep fibrosis vs orthovoltage)

ADVANTAGES OVER SURGERY (selected lesions):
• No anaesthesia required
• No wound complications/reconstruction
• Preserved function: eyelid (no ectropion), ear (no auricular reconstruction), nose (no skin graft)
• Equivalent local control for BCC/SCC T1–2 in most published series

INDICATIONS FOR SKIN BT:
Primary: Non-melanoma skin cancer (NMSC) — BCC and SCC
• Lesions ≤3 cm diameter (commercial applicators); up to 5 cm with custom moulds
• Cosmetically/functionally critical sites: nasal ala/tip, eyelid, ear pinna/concha, lip vermilion, scalp, medial canthus
• Patients unfit for surgery
• Patient preference (refuses surgery)
• Multiple/recurrent lesions

Other indications:
• Keloid scars: post-excision adjuvant BT (within 24h of surgery)
• Merkel cell carcinoma (small, superficial)
• Cutaneous T-cell lymphoma (mycosis fungoides — refractory to topical treatment)
• Angiosarcoma of scalp (palliative)
• Recurrent NMSC after prior EBRT (if BT not previously used)
• Post-surgical bed adjuvant (positive margins, PNI — when EBRT logistically difficult)` }, { id:"s1b", title:"Skin Radiobiology — α/β & Fractionation Impact", body:`SKIN RADIOBIOLOGY — KEY PRINCIPLES

α/β RATIOS (critical for schedule selection):
• BCC: α/β ≈ 8–10 Gy (typical carcinoma)
• SCC: α/β ≈ 8–10 Gy
• Skin late effects (dermis, connective tissue): α/β ≈ 3 Gy
• Cartilage: α/β ≈ 1.5–2 Gy ← VERY LOW — highly sensitive to dose per fraction
• Bone cortex: α/β ≈ 2 Gy

CLINICAL IMPLICATIONS:

HYPOFRACTIONATION (large dose/fraction):
• Tumour: BED minimally reduced relative to conventional fractionation (α/β=10)
• Late skin: BED significantly increased (α/β=3) → more telangiectasia, atrophy, fibrosis
• Cartilage: BED dramatically increased (α/β=2) → risk of NECROSIS

CARTILAGE RULE:
For treatments overlying ear pinna, nasal ala/tip, nasal cartilages:
→ LIMIT DOSE PER FRACTION TO ≤3.5 Gy
→ Use more fractionated schedules (3 Gy × 10–15 fx) rather than 6 Gy × 3 (Valencia standard)
→ Cartilage necrosis is the most feared late complication of skin BT — painful, poorly healing, may require reconstructive surgery

BED COMPARISON (tumour, α/β=10):
Valencia 6 Gy × 3: BED₁₀ = 18×(1+6/10) = 28.8 Gy₁₀ — efficient but lower BED
3.5 Gy × 10: BED₁₀ = 35×(1+3.5/10) = 47.3 Gy₁₀ — higher tumour BED
→ For invasive SCC or thicker lesions: more fractionated schedule delivers higher BED

BED COMPARISON (late skin, α/β=3):
Valencia 6 Gy × 3: BED₃ = 18×(1+6/3) = 54 Gy₃ → EQD2 = 45 Gy
3.5 Gy × 10: BED₃ = 35×(1+3.5/3) = 75.8 Gy₃ → EQD2 = 63.2 Gy
→ More fractions = higher late-effect BED too — trade-off but with reduced dose/fraction the key protective factor for cartilage

PRESCRIPTION DEPTH:
• 3 mm: thin BCC, superficial lesions (BCC clinically <2 mm invasion)
• 5 mm: SCC or clinically thicker lesions, post-inflammatory BCC
• Always report dose at prescription depth — not surface dose only` }, ] }, { id:"s2", icon:"🔲", title:"Applicators — Valencia, Leipzig, HAM & Moulds", subs:[ { id:"s2a", title:"Valencia Applicator — Design & Use", body:`VALENCIA APPLICATOR (Varian Medical Systems)

DESIGN:
Rigid circular flat-surface acrylic applicator. Ir-192 source travels in a circular groove at fixed geometry — sweep path at 1 cm from applicator face → flat circular isodose ideal for flat skin lesions.

SIZES:
• VA-2: 2 cm diameter treatment area (lesions ≤1.5 cm)
• VA-3: 3 cm diameter treatment area (lesions ≤2.5–3 cm)

SOURCE-SKIN DISTANCE (SSD): 5 mm (applicator face held firmly against skin surface)

STANDARD HDR SCHEDULE:
• 6 Gy × 3 fractions prescribed to 3 mm depth (on alternate days: Mon/Wed/Fri)
• BED₁₀ (tumour): 28.8 Gy₁₀ → EQD2₁₀ = 24 Gy
• BED₃ (late skin): 54 Gy₃ → EQD2₃ = 45 Gy

ALTERNATIVE SCHEDULES:
• 7 Gy × 3 fractions (slightly higher — select with care over cartilage)
• 4 Gy × 6 fractions prescribed to 3 mm (for cartilaginous sites)
• 3.5 Gy × 10 fractions prescribed to 3 mm (conventional-equivalent — over ear/nose)
• 9 Gy × 4 fractions prescribed to 3 mm (some European centres — aggressive)

IDEAL LESION CHARACTERISTICS FOR VALENCIA:
• Round or slightly oval shape
• Flat anatomical surface (cheek, forehead, scalp, trunk, extremity)
• ≤3 cm diameter
• Superficial (≤5 mm clinical depth)

NOT SUITABLE FOR VALENCIA:
• Curved concave surfaces (nasal ala, ear concha, inner canthus) — use Leipzig + bolus
• Lesions >3 cm — use HAM or custom mould
• Irregular margins requiring shaped field

LOCAL CONTROL (Valencia):
Ballester-Sánchez (2013, 156 patients): BCC/SCC ≤4 cm treated 6 Gy × 3 → 3y local control: 100% BCC, 96.7% SCC.
Tormo series (2014): 120 patients, 3y LC 97% BCC, 92% SCC. Good/excellent cosmesis 92%.` }, { id:"s2b", title:"Leipzig Applicator — Design & Use", body:`LEIPZIG APPLICATOR (Eckert & Ziegler BEBIG)

DESIGN:
Conical applicator — source pathway angled at 45° creating an asymmetric isodose distribution that conforms better to concave and curved surfaces than the Valencia’s flat-field geometry.

SIZES: 2 cm, 3 cm, 4 cm outer diameter cones.

COMPARISON — VALENCIA vs LEIPZIG:
• Valencia: flat source path → uniform flat isodose; best for flat/convex surfaces
• Leipzig: angled source path → anisotropic distribution; better conformity to curved/concave anatomy
• Leipzig preferred: nasal ala, nasal tip, ear pinna/concha, inner canthus, lip commissure, scalp with curvature
• Valencia preferred: cheek, forehead, flat scalp, trunk, extremity flat surface

BOLUS FOR CURVED SURFACES:
For concave anatomy (nasal ala, ear concha): BOLUS IS MANDATORY.
An air gap between applicator and skin dramatically reduces surface dose:
• 5 mm air gap: surface dose reduced by ~20–25% below planned value
• 10 mm air gap: surface dose reduced by ~40–50%

Bolus types:
• Superflab (polythene-equivalent, flexible) — most practical
• Saline-filled surgical glove (adapts to any contour)
• Aquaplast thermoplastic (heated, moulded, sets on cooling)
• Dental wax (moulds to complex anatomy)

TECHNIQUE (nasal ala, Leipzig):

1. Position patient supine, head neutral
1. Shape bolus to conform to nasal curvature
1. Apply bolus to nasal ala — confirm full contact with no air space
1. Apply Leipzig cone over bolus
1. Confirm applicator axis perpendicular to skin surface within the treatment area
1. Treat per planned dwell sequence

SCHEDULE: Same as Valencia — 6 Gy × 3 most common, 3.5 Gy × 10 for cartilaginous sites.` }, { id:"s2c", title:"HAM / Freiburg Flap Applicator", body:`HAM (HIGH-ACTIVITY MULTIPLE-SOURCE) / FREIBURG FLAP APPLICATOR

DESIGN:
Flexible flat applicator containing an array of parallel afterloading catheters (6 French silicone tubes) spaced 1 cm apart. Source travels sequentially through each catheter — creates a planar dose distribution over large area.

CONFIGURATIONS:
• 3×4, 4×4, 4×5, 5×5, 6×5 catheter arrays (rows × columns)
• 4×4 array: ~4×4 cm treatment area
• 6×5 array: ~6×5 cm — largest standard configuration
• Custom configurations: up to ~10×8 cm possible

INDICATIONS FOR HAM:
• Lesions 3–8 cm (too large for Valencia/Leipzig)
• Irregular-shaped lesions (non-circular)
• Post-excision bed (adjuvant, including keloid)
• Larger scalp lesions
• Trunk/extremity where larger coverage needed

PRESCRIPTION:
Source-skin distance: applicator face directly on skin (0 mm additional SSD).
Prescription depth: 5 mm (deeper than Valencia — for thicker lesions; HAM more commonly used for SCC or adjuvant).
IPSA optimisation: adjusts dwell times across all catheter channels to achieve dose homogeneity ±5–10% across the planned area.

STANDARD HDR SCHEDULES (HAM):
• 4 Gy × 8 fractions = 32 Gy at 5 mm (BID × 4 days) — most common
• 4 Gy × 10 fractions = 40 Gy at 5 mm (BID × 5 days)
• 3.5 Gy × 10 fractions = 35 Gy at 5 mm (BID × 5 days — over cartilaginous sites)
• 3 Gy × 15 fractions = 45 Gy at 5 mm (once daily — most fractionated, for complex anatomy)
• KELOID: 6 Gy × 3 fractions at 5 mm (within 24h of excision surgery)

IMMOBILISATION:
Applicator fixed with adhesive tape, skin staples, or Velcro straps.
Patient must remain completely still during each treatment (5–12 minutes per fraction).
Multiple catheters connected simultaneously to afterloader via multi-channel indexer connector.

BID FRACTIONATION NOTE:
Minimum 6-hour gap between BID fractions (allow normal tissue repair).` }, { id:"s2d", title:"Custom Surface Moulds", body:`CUSTOM SURFACE MOULDS — BESPOKE BRACHYTHERAPY

INDICATIONS:
• Lesions >4 cm or irregular shape not covered by commercial applicators
• Complex anatomical sites (ear, nose with extensive involvement, scalp with multiple lesions)
• Post-surgical/reconstruction sites requiring bespoke conformity
• When multiple lesions in same region treated simultaneously
• Paediatric sites (commercial applicators not available in small sizes)

CONSTRUCTION PROCESS:

1. IMPRESSION: Dental alginate or plaster of Paris mould of treatment site. Patient positioned in treatment position (reproducibility essential).
1. POSITIVE CAST: Plaster cast made from impression — exact replica of anatomy.
1. MOULD FABRICATION: Aquaplast (thermoplastic) or silicone material heated and moulded over cast. Afterloading catheters (silicone 6F tubes) embedded at 1 cm spacing, 5–10 mm above planned skin surface.
1. SOURCE-SKIN DISTANCE VERIFICATION: Ruler measurement at multiple points; photographer documentation.
1. CT SIMULATION: Patient wears mould. CT with mould in situ → 3D reconstruction of catheter positions → TPS planning with proper depth dosimetry.
1. PLAN GENERATION: IPSA optimises dwell times across catheters to achieve target dose at 5 mm depth ±10% heterogeneity.

MOULD MATERIALS:
• Aquaplast (most common): transparent thermoplastic, 65°C activation, sets rigid at room temp
• Silicone impression material: flexible, better for ear/complex anatomy
• Polyurethane foam: very flexible, conforms to moving structures

DOSE SCHEDULES (custom mould):
• 3.5 Gy × 10 fractions = 35 Gy at 5 mm (BID × 5 days) — standard
• 3 Gy × 15 fractions = 45 Gy at 5 mm (once daily — over cartilage)
• 2.5 Gy × 20 fractions = 50 Gy at 5 mm (conventional equivalent)
• RECURRENCE post-EBRT: 4 Gy × 8 fractions = 32 Gy (with prior dose review)

KELOID MOULD:
Created day of surgery. Applied to wound bed within 24 hours of excision (before fibroblast proliferation). Delivers 6–7 Gy × 3 fractions prescribed to wound surface (3 mm depth or wound surface). Local control: 80–90% vs 50–60% excision alone.` }, { id:"s2e", title:"Eyelid & Periorbital BT — Special Considerations", body:`EYELID BRACHYTHERAPY — HIGHEST-COMPLEXITY SKIN BT SITE

INDICATIONS:
• BCC/SCC of eyelid (lower > upper eyelid; medial canthus most common)
• Medial canthal lesion (Mohs technically difficult here)
• Patient refusing reconstructive surgery
• Merkel cell of eyelid

THE CRITICAL CHALLENGE:
The lens (dose >5 Gy → cataract), retina (>45 Gy → retinopathy), and lacrimal drainage must be protected from direct radiation. The eye is immediately beneath the treatment field — only a few millimetres of tissue between source and globe.

EYE PROTECTION — LEAD SHIELD:
Design: Tungsten/bismuth/lead alloy disc, shaped like a large contact lens (~22 mm diameter, 1–2 mm thick). Configured for subpalpebral insertion.
Attenuation: >95% for I-192 photons (high-energy equivalent lead thickness)

SHIELD INSERTION TECHNIQUE:

1. Topical proxymetacaine 0.5% (or oxybuprocaine 0.4%) drops — 2 drops, wait 2 minutes
1. Patient looks up; lower eyelid retracted with cotton swab or lid retractor
1. Shield slid under lower eyelid onto sclera — gentle lateral guidance with tip of shield
1. Patient blinks gently — shield seats in conjunctival fornix between globe and inner eyelid surface
1. Applicator (Valencia VA-2 most common) placed over closed eyelid above shield
1. Confirm applicator properly positioned — lesion centred under applicator window
1. Treatment delivered (5 minutes per fraction)
1. Shield removed — rinse eye with saline, check for any abrasion

DOSE SCHEDULE (eyelid Valencia + lead shield):
• 6 Gy × 3 fractions (Mon/Wed/Fri) prescribed to 3 mm depth — standard if not over tarsus
• 3.5 Gy × 10 fractions (BID) — for lesions involving tarsus (cartilaginous plate)
• Total dose: must keep lens EQD2 <5 Gy (with shield: easily achieved — residual lens dose <0.1 Gy)

OUTCOMES:
• Local control 5y: 92–97% BCC eyelid (Espenel, Chapet series)
• Good/excellent cosmesis: 93% at 3 years
• Epiphora (watering eye from lacrimal damage): 5–15%
• Dry eye: 10–20% (lacrimal gland in field for upper lid lesions)
• Cataract with shield: <1%` }, ] }, { id:"s3", icon:"📐", title:"Dose Schedules, QA & Complications", subs:[ { id:"s3a", title:"Comprehensive Schedule Reference", body:`SKIN BT DOSE SCHEDULES — COMPLETE REFERENCE TABLE

DEFINITIVE BCC/SCC ≤3 cm (flat surface):
Valencia/Leipzig:
• 6 Gy × 3 = 18 Gy @ 3 mm depth — STANDARD (alternate days)
• 7 Gy × 3 = 21 Gy @ 3 mm depth — higher dose (select with care over cartilage)
• 3.5 Gy × 10 = 35 Gy @ 3 mm depth (BID × 5 days — OVER CARTILAGE preferred)
• 4 Gy × 8 = 32 Gy @ 5 mm depth (for thicker SCC, BID × 4 days)

DEFINITIVE BCC/SCC 3–8 cm (HAM/Freiburg/mould):
• 4 Gy × 8 = 32 Gy @ 5 mm (BID × 4 days)
• 4 Gy × 10 = 40 Gy @ 5 mm (BID × 5 days) — for SCC/higher-risk
• 3.5 Gy × 10 = 35 Gy @ 5 mm (BID × 5 days — cartilaginous sites)
• 3 Gy × 15 = 45 Gy @ 5 mm (once daily — over complex cartilage/bone areas)

ADJUVANT (positive margins):
• Same as definitive but consider: 4 Gy × 8 = 32 Gy @ 5 mm (reduced if surgery + RT)
• Or: 50–60 Gy EBRT equivalent (if EBRT preferred for deep positive margins)

KELOID (post-excision adjuvant — WITHIN 24h):
• 6–7 Gy × 3 fractions @ 5 mm depth (commence within 24h, complete within 2 weeks)
• 8.5 Gy × 2 fractions (Renz 2020 alternative schedule)
• BID acceptable for keloid — skin tolerance less critical given small treatment area

PALLIATIVE (skin metastases, angiosarcoma):
• 8–10 Gy × 1–2 fractions (very short course)
• 4 Gy × 5 fractions (BID × 2.5 days) for better palliation

SPECIAL SITES:
Eyelid: 6 Gy × 3 (non-tarsus) or 3.5 Gy × 10 (tarsal/cartilage)
Ear pinna/concha: 3.5 Gy × 10 or 3 Gy × 15 (always limit to ≤3.5 Gy/fraction)
Nasal ala/tip: 3.5 Gy × 10 or 3 Gy × 15 (cartilage protection essential)
Lip vermilion: 6 Gy × 3 (no cartilage; excellent cosmesis results)
Scalp: 4 Gy × 8–10 (good tolerance; no cartilage concern)

BED COMPARISON AT PRESCRIPTION DEPTH (tumour α/β=10):
6 Gy×3 = BED 28.8 Gy₁₀ | 3.5 Gy×10 = BED 47.3 Gy₁₀ | 3 Gy×15 = BED 58.5 Gy₁₀
→ More fractions = higher tumour BED despite same dose-rate protection for cartilage` }, { id:"s3b", title:"Physics QA for Skin BT", body:`SKIN BT PHYSICS QA — ESSENTIAL CHECKS

PRE-TREATMENT QA (every fraction):
• Patient identification and treatment site verification (written check by two staff)
• Fraction number confirmed vs treatment plan
• Source strength current (well-chamber calibration ≤7 days or per departmental protocol)
• Plan dwell times recalculated for current source strength (Ir-192 decays ~1%/day — plans recalculated from TPS as source ages or fixed dwell times corrected)
• Applicator serial number matches plan
• Treatment length matches plan

APPLICATOR-SPECIFIC QA:
Valencia/Leipzig:
• Source pathway in groove confirmed — manufacturer’s dummy source check (drive test) before each session
• Source-skin distance = 0.5 cm: applicator must be pressed firmly to skin (zero air gap)
• Confirm applicator orientation (central lesion under applicator window)
• Bolus placement documented (curved surfaces) with photo

HAM/Freiburg:
• All catheter channels connected and individually verified (use colour-coded connectors)
• Channel sequencing: TPS plan channel numbering matches physical catheter label numbering
• Dummy source run through each channel: confirms no obstruction, correct length
• Source-skin distance: applicator flat on skin (no elevation)
• IPSA plan: physicist verifies DVH — target V100 ≥95%, V150 documented

Custom Mould:
• Catheter connection per documented sequence (mould diagram mandatory)
• SSD measured at multiple points vs simulation CT values (tolerance ±1 mm)
• Mould repositioning reproducibility: photo comparison, skin surface landmarks
• Patient-specific phantom measurement recommended (Gafchromic EBT3 film) at least for first fraction

PERIODIC DOSIMETRIC VERIFICATION:
• Gafchromic EBT3 film in solid water phantom at prescription depth → compare to TPS
• Ion chamber (Markus/PPC40 parallel-plate) in mini-phantom: absolute dose measurement
• In-vivo dosimetry (MOSFET/TLD on skin surface): dose comparison with planned surface dose
• All measurements within ±5% tolerance of TPS calculated dose` }, { id:"s3c", title:"Toxicity & Cosmetic Outcomes", body:`SKIN BT TOXICITY PROFILE

ACUTE REACTIONS (during treatment and up to 6 weeks):
Grade 1 — Erythema: virtually universal (>90%) — peaks at end of treatment, resolves 2–4 weeks
Grade 2 — Moist desquamation (patchy): 15–30% — particularly in skin folds, sebaceous areas
Grade 3 — Confluent moist desquamation/necrosis: <5% — risk factors: large lesion, high dose/fraction, over cartilage, diabetes, immunosuppression

WOUND CARE MANAGEMENT:
• Grade 1: aqueous cream or non-perfumed emollient 3× daily; Cavilon barrier spray
• Grade 2: hydrocolloid dressing (DuoDERM) or silicone-coated non-adherent (Mepitel One, Aquacel)
• Grade 3: wound care team review, consider treatment interruption, hydrogel (Intrasite gel), silver dressing if infected
• All grades: avoid sun exposure, mechanical trauma, soap to treatment area

LATE REACTIONS (>3 months post-treatment):
Telangiectasia: 15–30% at 5 years (dilated dermal capillaries — dose/fraction dependent)
Hypopigmentation: 20–40% (permanent depigmentation within treatment field)
Hyperpigmentation: 10–20% (transient post-inflammatory)
Skin atrophy: 10–20% (thinning, fine texture change)
Permanent hair loss within treatment area: universal (follicle damage)
Fibrosis (deep): 5–10% — especially over cartilage, prior RT

CARTILAGE NECROSIS (most serious late complication):
• Incidence: <1% with appropriate fractionation (≤3.5 Gy/fraction over cartilage)
• Risk factors: >4 Gy/fraction over ear/nasal cartilage, total dose >45 Gy at cartilage level, prior surgery/trauma
• Presentation: pain, discharge, exposed cartilage, perichondritis
• Management: hyperbaric oxygen (evidence for radiation tissue injury), debridement, auricular/nasal reconstruction
• Prevention: RESPECT THE CARTILAGE FRACTIONATION RULE — most important principle

COSMETIC OUTCOMES:
• Good/excellent cosmesis at 3–5 years: 85–95% in published series
• BT cosmesis generally superior to surgery for: nasal ala (no graft), medial canthus, ear pinna, scalp
• Better long-term cosmesis than orthovoltage EBRT in some series (less deep tissue fibrosis)

LOCAL CONTROL RATES:
BCC T1 (≤2 cm): 95–99% at 5 years
BCC T2 (2–4 cm): 88–92% at 5 years
SCC T1: 90–96% at 5 years
SCC T2: 80–88% at 5 years
Keloid (BT adjuvant): 80–90% at 2 years vs 50–60% excision alone` }, ] }, { id:"s4", icon:"🎯", title:"Key Numbers & Viva", subs:[ { id:"s4a", title:"Essential Numbers — Skin BT", body:`MUST-KNOW NUMBERS — SKIN BT

STANDARD SCHEDULE: 6 Gy × 3 fractions (18 Gy at 3 mm depth) — Valencia/Leipzig
CARTILAGE SITES: 3.5 Gy × 10 fractions (35 Gy at 3 mm) or 3 Gy × 15 (45 Gy at 5 mm)
HAM STANDARD: 4 Gy × 8–10 fractions (32–40 Gy at 5 mm, BID)
KELOID: 6–7 Gy × 3 fractions (within 24h post-excision)

SOURCE-SKIN DISTANCE: 5 mm (Valencia/Leipzig direct contact)
PRESCRIPTION DEPTH: 3 mm (thin BCC) or 5 mm (SCC/thicker lesions)
BOLUS: MANDATORY for curved/concave surfaces (nasal ala, ear concha) — eliminates air gap

CARTILAGE DOSE/FRACTION LIMIT: ≤3.5 Gy (prevent necrosis; α/β cartilage ≈ 1.5–2 Gy)
α/β BCC/SCC: 8–10 Gy | Skin late: 3 Gy | Cartilage: 1.5–2 Gy

EYELID: Lead shield subpalpebral; Valencia VA-2; 6 Gy × 3 (non-tarsus)
LENS DOSE THRESHOLD FOR CATARACT: >5 Gy

LOCAL CONTROL BCC T1: 95–99% at 5y
LOCAL CONTROL SCC T1: 90–96% at 5y
GOOD/EXCELLENT COSMESIS: 85–95% at 3–5y
CARTILAGE NECROSIS RATE: <1% (with appropriate fractionation)

FILM DOSIMETRY: Gafchromic EBT3 — phantom verification
FREQUENCY: 3× weekly (Valencia) or BID × 4–5 days (HAM)` }, { id:"s4b", title:"Viva Questions — Skin BT", body:`Q: Why is dose per fraction limited when treating over cartilage?
A: Cartilage has α/β ≈ 1.5–2 Gy — extremely low, meaning it is exquisitely sensitive to dose per fraction (more so than late-responding skin at α/β=3). Large doses per fraction cause disproportionate late damage to cartilage: chondrocyte death, avascular necrosis, perichondritis, and ultimately cartilage exposure — a painful, poorly healing complication requiring complex reconstruction. Dose per fraction should be limited to ≤3.5 Gy when treating over ear pinna, nasal ala, or nasal tip. Use 3.5 Gy × 10 or 3 Gy × 15 fractions rather than the typical 6 Gy × 3 Valencia schedule for these sites.

Q: How does Valencia differ from Leipzig applicator and when would you choose each?
A: Valencia: flat circular design, source travels in a circular groove parallel to the applicator face — produces a uniform flat isodose; ideal for flat skin surfaces (cheek, forehead, trunk). Leipzig: conical design with 45° angled source path — asymmetric dose distribution; better conformity to curved and concave surfaces (nasal ala, ear concha, inner canthus). Both available in 2 cm and 3 cm treatment field diameters. For concave anatomy, Leipzig applicator must be used with tissue-equivalent bolus to fill any air gap — even 5 mm of air reduces surface dose by 20–25%.

Q: What is the purpose of bolus in skin brachytherapy and what types are used?
A: Bolus fills the air gap between a curved/concave skin surface and the flat applicator face. An air gap dramatically reduces the dose at the skin surface because the inverse square law creates a steep dose gradient — a 5 mm gap reduces surface dose by ~20–25%. Bolus material should be: tissue-equivalent (water/polythene equivalent), flexible (conforms to anatomy), radio-opaque if possible (confirms contact on imaging). Types used: Superflab, saline-filled surgical glove (most flexible, adapts to any contour), Aquaplast thermoplastic (heated and moulded), dental wax, wet gauze.

Q: What eye protection is used for eyelid BT and how is it placed?
A: A tungsten/bismuth lead-alloy shield shaped like a large contact lens (22 mm diameter, ~1.5 mm thick) is inserted under local anaesthetic (topical proxymetacaine drops) beneath the eyelid onto the sclera — positioned between the globe and the inner eyelid surface. Attenuation >95% for Ir-192 energy range. Critical to protect: lens (>5 Gy → cataract), retina (>45 Gy → retinopathy), lacrimal gland. Shield is inserted before each fraction and removed after. Topical anaesthetic applied before each insertion; rinse eye with saline and check for abrasion after removal.

Q: What is the rationale for keloid brachytherapy and what is the schedule?
A: Keloids result from pathological fibroblast proliferation after skin injury. Post-excision BT prevents recurrence by irradiating the wound bed before the fibroblast proliferative phase begins (which starts 24–48h post-surgery). Timing is critical: BT must commence within 24 hours of surgical excision. Standard schedule: 6–7 Gy × 3 fractions prescribed to 5 mm depth (wound surface) using HAM applicator or custom mould placed directly on the wound. Local control: 80–90% with BT adjuvant vs 50–60% excision alone`
},
      ],
    },
  ],
};

// COMPONENT: ContentBlock
const ContentBlock = ({ body, color }: { body: string, color: string }) => {
  if (!body) return null;
  
  // Split by double newline for paragraphs, but handle lists better
  const sections = body.split('\n\n');

  return (
    <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-light">
      {sections.map((section, idx) => {
        const lines = section.split('\n');
        
        // Check if it's a list or special block
        if (lines.length > 1 && (lines[0].startsWith('•') || lines[0].startsWith('1.'))) {
             return (
               <ul key={idx} className="space-y-2 pl-4">
                 {lines.map((line, i) => (
                   <li key={i} className="flex gap-3">
                     <span style={{ color }} className="font-bold min-w-[1.5em]">{line.match(/^([•\d.]+)/)?.[1]}</span>
                     <span>{line.replace(/^[•\d.]+\s*/, '')}</span>
                   </li>
                 ))}
               </ul>
             );
        }

        // Check for headers (lines ending in :)
        if (lines[0].trim().endsWith(':') && !lines[0].includes('http')) {
             return (
               <div key={idx}>
                 <h4 style={{ color }} className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-white/10 pb-1 inline-block">
                   {lines[0]}
                 </h4>
                 {lines.slice(1).map((l, i) => <p key={i} className="mb-1">{l}</p>)}
               </div>
             );
        }

        return <p key={idx}>{section}</p>;
      })}
    </div>
  );
};

// COMPONENT: SubAccordion
function SubAccordion({ sub, color }: { sub: any, color: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom:`1px solid ${C.border}` }}>
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
          color: isOpen ? "#FFF" : C.sub,
          fontFamily:"'DM Sans',sans-serif",
        }}>
          {sub.title}
        </span>
        <ChevronDown 
          size={14}
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transition:"transform 0.2s",
            color: isOpen ? color : C.dim,
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
}

// COMPONENT: SectionCard
function SectionCard({ section, color, isOpen, onToggle, idx }: { section: any, color: string, isOpen: boolean, onToggle: () => void, idx: number }) {
  return (
    <div style={{
      marginBottom:"12px", borderRadius:"16px",
      backgroundColor:C.card, border:`1px solid ${isOpen ? color : C.border}`,
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
          backgroundColor: isOpen ? color : C.card2,
          color: isOpen ? "#000" : C.sub,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px", transition:"all 0.3s",
        }}>
          {section.icon}
        </div>
        <div style={{ flex:1 }}>
          <h3 style={{
            fontSize:"14px", fontWeight:700, color: isOpen ? "#FFF" : C.text,
            fontFamily:"'Outfit',sans-serif", transition:"color 0.3s",
          }}>
            {section.title}
          </h3>
          {!isOpen && (
            <p style={{ fontSize:"11px", color:C.dim, marginTop:"2px", fontFamily:"'JetBrains Mono',monospace" }}>
              {section.subs.length} topics
            </p>
          )}
        </div>
        <div style={{
          width:"28px", height:"28px", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          backgroundColor: isOpen ? `${color}22` : "transparent",
          color: isOpen ? color : C.dim,
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
            <div style={{ borderTop:`1px solid ${C.border}` }}>
              {section.subs.map((sub: any) => (
                <SubAccordion key={sub.id} sub={sub} color={color} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPONENT: QuickRefPanel
function QuickRefPanel({ siteId }: { siteId: string }) {
  const site = SITES[siteId as keyof typeof SITES];
  // Extract key numbers from KB if possible, or just hardcode/render specific section
  // For now, let's render a placeholder or specific content if we can find it
  const keyNumbersSection = KB[siteId as keyof typeof KB]?.find(s => s.title.includes("Key Numbers"));
  
  if (!keyNumbersSection) return <div className="p-8 text-center text-slate-500">No quick reference data available.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {keyNumbersSection.subs.map(sub => (
        <div key={sub.id} className="bg-[#0A1020] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: site.primary }}>
            <Activity size={18} /> {sub.title}
          </h3>
          <ContentBlock body={sub.body} color={site.primary} />
        </div>
      ))}
    </div>
  );
}

// COMPONENT: DiagramPanel
function DiagramPanel({ siteId }: { siteId: string }) {
  if (siteId === "prostate") {
    return (
      <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto" }}>
          <defs>
            <radialGradient id="prostateGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.6" />
            </radialGradient>
            <linearGradient id="probeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4B5563" />
              <stop offset="50%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Rectum */}
          <path d="M 150 280 Q 200 250 250 280 L 250 300 L 150 300 Z" fill="#7F1D1D" opacity="0.6" />
          <text x="200" y="290" fill="#F87171" fontSize="10" textAnchor="middle" fontFamily="monospace">Anterior Rectum</text>

          {/* TRUS Probe */}
          <rect x="180" y="220" width="40" height="80" rx="20" fill="url(#probeGrad)" />
          <circle cx="200" cy="230" r="15" fill="#111827" opacity="0.5" />
          <text x="240" y="250" fill="#A78BFA" fontSize="10" fontFamily="monospace">TRUS Probe</text>
          <path d="M 220 245 L 235 245" stroke="#A78BFA" strokeWidth="1" strokeDasharray="2,2" />

          {/* Prostate Gland */}
          <ellipse cx="200" cy="140" rx="70" ry="50" fill="url(#prostateGrad)" stroke="#60A5FA" strokeWidth="2" />
          
          {/* Urethra */}
          <path d="M 200 90 L 200 190" stroke="#86EFAC" strokeWidth="6" opacity="0.8" />
          <text x="200" y="80" fill="#86EFAC" fontSize="10" textAnchor="middle" fontFamily="monospace">Urethra</text>

          {/* Isodose Line (V100) */}
          <ellipse cx="200" cy="140" rx="80" ry="60" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4,4" filter="url(#glow)" />
          <text x="290" y="140" fill="#FBBF24" fontSize="10" fontFamily="monospace">100% Isodose</text>
          <path d="M 280 135 L 285 135" stroke="#FBBF24" strokeWidth="1" />

          {/* Seeds */}
          {[
            [160, 120], [180, 110], [220, 110], [240, 120],
            [150, 140], [170, 135], [230, 135], [250, 140],
            [160, 160], [180, 165], [220, 165], [240, 160],
            [190, 125], [210, 125], [190, 155], [210, 155]
          ].map((pos, i) => (
            <rect key={i} x={pos[0]-2} y={pos[1]-4} width="4" height="8" rx="1" fill="#22D3EE" filter="url(#glow)" />
          ))}

          {/* Template Grid (Abstract representation) */}
          <g opacity="0.3">
            {[140, 160, 180, 200, 220, 240, 260].map((x, i) => (
              <line key={`v${i}`} x1={x} y1="100" x2={x} y2="180" stroke="#22D3EE" strokeWidth="0.5" />
            ))}
            {[100, 120, 140, 160, 180].map((y, i) => (
              <line key={`h${i}`} x1="140" y1={y} x2="260" y2={y} stroke="#22D3EE" strokeWidth="0.5" />
            ))}
          </g>
        </svg>
      </div>
    );
  }

  if (siteId === "vault") {
    return (
      <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="cylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#F472B6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glowPink">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Vaginal Mucosa (Rx Depth) */}
          <path d="M 160 50 L 160 250 M 240 50 L 240 250" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4,4" />
          <path d="M 160 50 Q 200 30 240 50" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4,4" fill="none" />
          <text x="110" y="150" fill="#86EFAC" fontSize="10" fontFamily="monospace">Rx Surface</text>
          <path d="M 150 145 L 155 145" stroke="#86EFAC" strokeWidth="1" />

          {/* Bladder */}
          <ellipse cx="120" cy="100" rx="30" ry="40" fill="#1E3A8A" opacity="0.6" />
          <text x="120" y="100" fill="#60A5FA" fontSize="10" textAnchor="middle" fontFamily="monospace">Bladder</text>

          {/* Rectum */}
          <path d="M 280 80 Q 260 150 280 220" stroke="#7F1D1D" strokeWidth="20" opacity="0.6" fill="none" />
          <text x="295" y="150" fill="#F87171" fontSize="10" fontFamily="monospace">Rectum</text>

          {/* HDR Cylinder */}
          <path d="M 170 60 L 170 280 L 230 280 L 230 60 Q 200 40 170 60 Z" fill="url(#cylinderGrad)" stroke="#F472B6" strokeWidth="1" />
          <text x="200" y="270" fill="#F472B6" fontSize="10" textAnchor="middle" fontFamily="monospace">Cylinder</text>

          {/* Central Channel & Dwell Positions */}
          <line x1="200" y1="50" x2="200" y2="280" stroke="#9CA3AF" strokeWidth="2" />
          {[60, 70, 80, 90, 100, 110].map((y, i) => (
            <circle key={i} cx="200" cy={y} r="3" fill="#FFF" filter="url(#glowPink)" />
          ))}
          <text x="245" y="85" fill="#FFF" fontSize="10" fontFamily="monospace">Active Dwells</text>
          <path d="M 210 80 L 240 80" stroke="#FFF" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />

          {/* Isodose Lines */}
          <path d="M 150 60 L 150 130 Q 200 150 250 130 L 250 60 Q 200 20 150 60 Z" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.8" />
        </svg>
      </div>
    );
  }

  if (siteId === "skin") {
    return (
      <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowAmber">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Skin Surface */}
          <path d="M 50 150 Q 200 140 350 150 L 350 250 L 50 250 Z" fill="url(#skinGrad)" />
          <path d="M 50 150 Q 200 140 350 150" stroke="#FBBF24" strokeWidth="2" fill="none" />
          
          {/* Lesion */}
          <path d="M 170 147 Q 200 160 230 147 Q 200 140 170 147 Z" fill="#EF4444" opacity="0.8" />
          <text x="250" y="140" fill="#EF4444" fontSize="10" fontFamily="monospace">Target Lesion</text>

          {/* Cartilage Layer */}
          <path d="M 50 220 Q 200 210 350 220" stroke="#F87171" strokeWidth="4" fill="none" opacity="0.6" />
          <text x="280" y="235" fill="#F87171" fontSize="10" fontFamily="monospace">Cartilage</text>

          {/* Applicator (Valencia/Leipzig style) */}
          <path d="M 160 50 L 240 50 L 230 140 L 170 140 Z" fill="#374151" stroke="#9CA3AF" strokeWidth="2" />
          <rect x="190" y="20" width="20" height="30" fill="#9CA3AF" />
          <text x="200" y="100" fill="#FBBF24" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">Applicator</text>

          {/* Source Position */}
          <circle cx="200" cy="130" r="4" fill="#FFF" filter="url(#glowAmber)" />
          
          {/* Isodose Lines */}
          {/* 3mm Rx Line */}
          <path d="M 160 165 Q 200 175 240 165" stroke="#86EFAC" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
          <text x="110" y="170" fill="#86EFAC" fontSize="10" fontFamily="monospace">3mm Rx</text>
          
          {/* 5mm Rx Line */}
          <path d="M 150 180 Q 200 195 250 180" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
          <text x="110" y="185" fill="#A78BFA" fontSize="10" fontFamily="monospace">5mm Rx</text>

          {/* Radiation Rays */}
          <g opacity="0.4" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2,2">
            <line x1="200" y1="130" x2="170" y2="180" />
            <line x1="200" y1="130" x2="185" y2="190" />
            <line x1="200" y1="130" x2="200" y2="195" />
            <line x1="200" y1="130" x2="215" y2="190" />
            <line x1="200" y1="130" x2="230" y2="180" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "300px", backgroundColor: C.card2, borderRadius: "12px",
      border: `1px solid ${C.border}`, padding: "32px", textAlign: "center"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🔬</div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", marginBottom: "8px" }}>Diagram Not Available</h3>
      <p style={{ fontSize: "12px", color: C.dim, maxWidth: "300px" }}>
        Detailed anatomical diagrams for this site are currently being developed.
      </p>
    </div>
  );
}

export default function BrachytherapyReference() {
  const [activeSite, setActiveSite] = useState("prostate");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<'content' | 'diagram'>('content');
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const site = SITES[activeSite as keyof typeof SITES];

  const filtered = useMemo(() => {
    const siteData = KB[activeSite as keyof typeof KB] || [];
    if (!search) return siteData;
    return siteData.map(section => ({
      ...section,
      subs: section.subs.filter(sub => 
        sub.title.toLowerCase().includes(search.toLowerCase()) || 
        sub.body.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(section => section.subs.length > 0);
  }, [activeSite, search]);

  const totalSections = KB[activeSite as keyof typeof KB]?.length || 0;
  const totalTopics = KB[activeSite as keyof typeof KB]?.reduce((a, s) => a + s.subs.length, 0) || 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      {/* ── STICKY HEADER ── */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(5,8,15,0.97)", backdropFilter:"blur(22px)",
        borderBottom:`1px solid ${site.border}`,
        transition:"border-color 0.4s",
      }}>
        <div style={{ maxWidth:"740px", margin:"0 auto", padding:"11px 16px" }}>
          {/* Title row */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
            <div style={{
              width:"44px", height:"44px", borderRadius:"13px", flexShrink:0,
              background:`linear-gradient(135deg,${site.primary},${site.primary}88)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"22px", boxShadow:`0 0 22px ${site.primary}44`,
              transition:"background 0.4s, box-shadow 0.4s",
            }}>💉</div>
            <div style={{ flex:1 }}>
              <h1 style={{
                fontSize:"15px", fontWeight:900, color:"#FFF",
                fontFamily:"'Outfit',sans-serif", letterSpacing:"-0.02em", lineHeight:1,
              }}>Prostate, uterine & Surface brachytherapy</h1>
              <div style={{
                fontSize:"10px", color:C.dim, marginTop:"2px",
                fontFamily:"'JetBrains Mono',monospace",
              }}>Prostate · Endometrial/Vault · Skin/Surface · {totalSections} sections · {totalTopics} topics</div>
            </div>
            <div style={{
              padding:"3px 10px", borderRadius:"20px",
              backgroundColor:site.bg, border:`1px solid ${site.border}`,
              fontSize:"9px", color:site.primary,
              fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
              transition:"all 0.3s",
            }}>CLINICAL REF</div>
          </div>

          {/* Site selector */}
          <div style={{
            display:"flex", gap:"4px",
            backgroundColor:"rgba(255,255,255,0.03)",
            padding:"3px", borderRadius:"14px",
            border:`1px solid ${C.border}`,
          }}>
            {Object.values(SITES).map(s => (
              <button key={s.id} onClick={() => setActiveSite(s.id)} style={{
                flex:1, padding:"9px 6px", borderRadius:"11px",
                backgroundColor: activeSite===s.id ? s.primary : "transparent",
                border:"none", cursor:"pointer",
                color: activeSite===s.id ? "#05080F" : s.primary,
                fontSize:"11px", fontWeight:800,
                fontFamily:"'Outfit',sans-serif",
                transition:"all 0.25s ease",
                boxShadow: activeSite===s.id ? `0 0 16px ${s.primary}55` : "none",
              }}>
                <span style={{ marginRight:"4px" }}>{s.icon}</span>
                {s.id === "prostate" ? "Prostate" : s.id === "vault" ? "Vault/Endo" : "Skin/Surface"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"740px", margin:"0 auto", padding:"14px 16px" }}>

        {/* ── SITE BANNER ── */}
        <div style={{
          padding:"14px 18px", borderRadius:"16px", marginBottom:"14px",
          background:`linear-gradient(135deg,${site.primary}15,${site.primary}05)`,
          border:`1px solid ${site.border}`,
          display:"flex", alignItems:"center", gap:"14px",
        }} className="fade-in">
          <div style={{ fontSize:"28px" }}>{site.icon}</div>
          <div>
            <div style={{
              fontSize:"15px", fontWeight:900, color:site.primary,
              fontFamily:"'Outfit',sans-serif",
            }}>{site.label}</div>
            <div style={{ fontSize:"10px", color:C.dim, marginTop:"2px", fontFamily:"'JetBrains Mono',monospace" }}>
              {KB[activeSite as keyof typeof KB].length} sections · {KB[activeSite as keyof typeof KB].reduce((a,s)=>a+s.subs.length,0)} clinical topics
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", gap:"3px", alignItems:"flex-end" }}>
            {activeSite==="prostate" && [["I-125","145 Gy"],[" Pd-103","125 Gy"]].map(([k,v])=>(
              <div key={k} style={{ fontSize:"10px", color:site.primary, fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ color:C.dim }}>{k}:</span> {v}
              </div>
            ))}
            {activeSite==="vault" && [["Std dose","7×3=21Gy"],["Rx to","Surface"]].map(([k,v])=>(
              <div key={k} style={{ fontSize:"10px", color:site.primary, fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ color:C.dim }}>{k}:</span> {v}
              </div>
            ))}
            {activeSite==="skin" && [["Valencia","6×3=18Gy"],["Cartilage","≤3.5Gy/fx"]].map(([k,v])=>(
              <div key={k} style={{ fontSize:"10px", color:site.primary, fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ color:C.dim }}>{k}:</span> {v}
              </div>
            ))}
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div style={{ position:"relative", marginBottom:"12px" }}>
          <span style={{
            position:"absolute", left:"13px", top:"50%",
            transform:"translateY(-50%)", fontSize:"14px",
            color:C.dim, pointerEvents:"none",
          }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${site.label} topics…`}
            style={{
              width:"100%", padding:"11px 13px 11px 40px",
              background:"rgba(255,255,255,0.05)",
              border:`1px solid ${C.border}`,
              borderRadius:"11px", color:C.text,
              fontSize:"13px", outline:"none",
              fontFamily:"'DM Sans',sans-serif",
              transition:"border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = site.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position:"absolute", right:"11px", top:"50%",
              transform:"translateY(-50%)", background:"none",
              border:"none", color:C.dim, cursor:"pointer", fontSize:"16px",
            }}>×</button>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display:"flex", gap:"4px", marginBottom:"16px",
          backgroundColor:"rgba(255,255,255,0.03)",
          padding:"3px", borderRadius:"13px",
          border:`1px solid ${C.border}`,
        }}>
          {[
            { id:"content",  label:"📚 Reference" },
            { id:"diagram",  label:"🔬 Diagram" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              flex:1, padding:"9px 5px", borderRadius:"10px",
              backgroundColor: tab===t.id ? site.primary : "transparent",
              border:"none",
              color: tab===t.id ? "#05080F" : C.dim,
              fontSize:"11px", fontWeight:800, cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",
              transition:"all 0.22s ease",
              boxShadow: tab===t.id ? `0 0 14px ${site.primary}44` : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── CONTENT TAB ── */}
        {tab === "content" && (
          <div>
            {search.trim() && (
              <div style={{ fontSize:"11px", color:C.dim, marginBottom:"10px", fontFamily:"'JetBrains Mono',monospace" }}>
                {filtered.reduce((a,s) => a+s.subs.length, 0)} results for "{search}"
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 24px", color:C.dim, fontSize:"13px" }}>
                <div style={{ fontSize:"32px", marginBottom:"12px" }}>🔎</div>
                No topics found for "{search}"
              </div>
            ) : (
              filtered.map((sec, idx) => (
                <SectionCard
                  key={sec.id}
                  section={sec}
                  color={site.primary}
                  isOpen={openSection === sec.id}
                  onToggle={() => setOpenSection(p => p===sec.id ? null : sec.id)}
                  idx={idx}
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
              <DiagramPanel siteId={activeSite} />
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
            </div>
          </div>
        )}

        {/* ── QUICK REF SIDEBAR ── */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(4px)", zIndex: 100
                }}
              />
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
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      background: "none", border: "none", color: C.dim, cursor: "pointer",
                      padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div style={{ padding: "16px", flex: 1 }}>
                  <div style={{
                    fontSize: "10px", color: site.primary, fontWeight: 700,
                    letterSpacing: "0.12em", fontFamily: "'JetBrains Mono',monospace",
                    marginBottom: "14px",
                  }}>⚡ {site.label.toUpperCase()}</div>
                  <QuickRefPanel siteId={activeSite} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!isSidebarOpen && (
          <motion.button 
            initial={{ x: 80 }}
            animate={{ x: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: "fixed", right: 0, top: "120px", zIndex: 90,
              backgroundColor: C.card, color: C.text, padding: "12px",
              borderRadius: "12px 0 0 12px", border: `1px solid ${site.border}`,
              borderRight: "none", boxShadow: "-4px 0 16px rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
              cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${site.primary}22`}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.card}
          >
            <BookOpen size={20} color={site.primary} />
            <span style={{
              writingMode: "vertical-lr", transform: "rotate(180deg)",
              fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#FFF"
            }}>
              Quick Ref
            </span>
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
