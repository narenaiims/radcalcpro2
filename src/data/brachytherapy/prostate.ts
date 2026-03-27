import { Section } from "../../types/brachytherapy";

export const prostateData: Section[] = [
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
];
