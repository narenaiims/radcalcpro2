import { Section } from "../../types/brachytherapy";

export const vaultData: Section[] = [
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
A: PORTEC-2 (Nout, Lancet 2010) randomised 427 high-intermediate risk endometrial cancer patients post-hysterectomy to VBT (21 Gy/3# HDR at vaginal surface) vs pelvic EBRT (46 Gy/23#). Key results: vaginal relapse rates were equivalent (1.8% VBT vs 1.6% EBRT at 5 years). Grade 2+ GI toxicity was dramatically lower with VBT (12.6% vs 53.8%). QoL significantly better with VBT. PORTEC-2 established VBT as standard of care for HIR endometrial cancer, replacing pelvic EBRT.` }, ] },
];
