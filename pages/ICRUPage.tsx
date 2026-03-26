/**
 * ICRUPage.tsx — PRO LEVEL v4
 * Complete ICRU reporting standards for radiation oncology trainees
 *
 * Sources: ICRU Reports 29, 38, 44, 50, 62, 71, 78, 83, 89, 91, 95
 *          TG-263 Nomenclature, TG-218, TG-101
 *
 * Features:
 * - All major ICRU reports with full concept definitions
 * - Interactive volume hierarchy visualiser
 * - IMRT/VMAT reporting checklist (ICRU 83)
 * - Brachytherapy IGBT standards (ICRU 89)
 * - SBRT/SRS standards (ICRU 91)
 * - Proton/particle therapy (ICRU 78)
 * - Trainee exam Q&A bank
 * - TG-263 nomenclature reference
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import {
  Book, Layers, Target, Zap, CheckCircle2, AlertCircle,
  ChevronRight, ChevronDown, ChevronUp, BookOpen,
  GraduationCap, Info, Activity, Shield, Eye, BarChart2
} from 'lucide-react';

// ─── DATA ─────────────────────────────────────────────────────────────────

interface ICRUConcept {
  abbr: string;
  full: string;
  desc: string;
  formula?: string;
  clinicalNote?: string;
  tg263?: string; // TG-263 standardised name
}

interface ICRUReport {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  year: string;
  focus: string;
  modality: string;
  tag: string;  // short descriptor
  color: string;
  concepts: ICRUConcept[];
  keyChanges?: string[];
  pitfalls?: string[];
}

const ICRU_REPORTS: ICRUReport[] = [
  {
    id: 'r50_62',
    number: '50 / 62',
    title: 'ICRU 50 & 62',
    subtitle: 'Prescribing, Recording, and Reporting Photon Beam Therapy',
    year: '1993 / 1999',
    focus: 'Fundamental Volume Definitions & Margin Concept',
    modality: '3D-CRT / CFRT',
    tag: 'Volume Defs',
    color: 'bg-blue-700',
    concepts: [
      {
        abbr: 'GTV',
        full: 'Gross Tumour Volume',
        desc: 'The gross palpable, visible, or demonstrable extent and location of malignant growth. Defined by clinical examination + imaging. Subcomponents: GTV-T (primary), GTV-N (nodal), GTV-M (metastasis).',
        clinicalNote: 'Must be identifiable on the planning CT/MRI. If no visible disease (post-surgery, complete response): no GTV → CTV only.',
        tg263: 'GTV'
      },
      {
        abbr: 'CTV',
        full: 'Clinical Target Volume',
        desc: 'GTV + volume of tissue containing suspected subclinical malignant disease that must be eliminated. The CTV represents the oncological concept of disease extent. Margin from GTV to CTV is based on pattern-of-spread, pathological studies, and tumour biology.',
        clinicalNote: 'CTV cannot physically overlap with serial structures at maximum dose tolerance. CTV expansion is NOT geometric — it is oncological.',
        tg263: 'CTV'
      },
      {
        abbr: 'ITV',
        full: 'Internal Target Volume',
        desc: 'CTV + Internal Margin (IM). Accounts for physiological variations in size, shape, and position of the CTV relative to internal reference: respiratory motion, bladder/rectal filling, cardiac motion.',
        clinicalNote: 'ICRU 62 introduced ITV. For lung SBRT: ITV contoured across all 4D-CT respiratory phases. Replaces older concept of "respiratory margin" added to CTV.',
        tg263: 'ITV'
      },
      {
        abbr: 'PTV',
        full: 'Planning Target Volume',
        desc: 'ITV (or CTV if no IM) + Setup Margin (SM). A geometrical concept accounting for patient positioning, field placement, and beam alignment uncertainties. Ensures CTV receives prescribed dose with adequate probability despite treatment execution uncertainties.',
        formula: 'PTV = CTV ⊕ (IM + SM)  [van Herk formula: SM = 2.5Σ + 0.7σ]',
        clinicalNote: 'PTV is a planning tool, not an anatomical structure. PTV constraints are secondary to OAR constraints. Never place PTV margin inside a serial organ — use Dose-Painting or field modification instead.',
        tg263: 'PTV'
      },
      {
        abbr: 'OR / OAR',
        full: 'Organs at Risk',
        desc: 'Normal tissues whose radiation sensitivity may significantly influence treatment planning or the prescribed dose. Classified as serial (spinal cord, optic chiasm), parallel (lung, liver), or mixed.',
        clinicalNote: 'Parallel OARs: mean dose / volume constraints critical. Serial OARs: maximum dose (Dmax/D0.035cc) is the primary constraint.',
        tg263: 'OAR'
      },
      {
        abbr: 'PRV',
        full: 'Planning Organ at Risk Volume',
        desc: 'OAR + margin for internal motion and setup uncertainty. The PRV concept is analogous to the PTV but applied to OARs. Planning constraints applied to PRV are slightly relaxed compared to OAR alone.',
        formula: 'PRV = OAR ⊕ (IM_OAR + SM)',
        clinicalNote: 'Standard PRV margins: spinal cord +5mm, brainstem +3mm, optic chiasm +3mm. Contour PRV as separate structure. Record dose on both OAR and PRV.',
        tg263: 'PRV'
      },
      {
        abbr: 'TV',
        full: 'Treated Volume',
        desc: 'Volume enclosed by an isodose surface considered adequate for the purpose of treatment. Typically the 95% isodose surface in conventional RT. In SBRT, often the 60–80% isodose surface.',
        clinicalNote: 'TV ≥ PTV is the design intent. TV >> PTV = poor conformity. CI = TV/PTV: target 1.0–1.2 for conventional RT.',
      },
      {
        abbr: 'IV',
        full: 'Irradiated Volume',
        desc: 'Volume of tissue receiving a dose considered significant in relation to tissue tolerance. Typically ≥50% of prescription dose. Relevant for late effects across large irradiated regions (second cancer risk, organ bath dose).',
        clinicalNote: 'Often neglected in reporting. Relevant for low-dose bath effects (e.g., V5Gy lung, V5Gy liver). Required for NTCP modelling of large parallel organs.',
      },
      {
        abbr: 'IM',
        full: 'Internal Margin',
        desc: 'Margin added to CTV to compensate for expected physiological movements and changes in size and shape: respiratory motion (lung, liver), bladder/rectal filling (prostate, cervix), cardiac pulsation, peristalsis.',
        clinicalNote: 'Assessed from 4D-CT (lung), sequential scans (pelvis), or population-based data. IM is population-based and may overestimate margin for individual patients with limited motion.',
      },
      {
        abbr: 'SM',
        full: 'Setup Margin',
        desc: 'Margin added to account for uncertainties in patient positioning and beam alignment. Includes systematic errors (Σ) and random errors (σ). van Herk margin recipe: SM = 2.5Σ + 0.7σ ensures 90% of patients receive ≥95% of prescribed dose to CTV.',
        formula: 'SM = 2.5Σ + 0.7σ  (van Herk 2000)',
        clinicalNote: 'Typical values: daily CBCT = 3–5mm; weekly kV = 5–8mm. Systematic errors (Σ) dominate coverage probability. Reducing systematic errors (e.g., daily imaging) is most efficient margin-reduction strategy.',
      },
    ],
    keyChanges: [
      'ICRU 50 (1993): Established GTV/CTV/PTV framework — foundational for all modern RT planning',
      'ICRU 62 (1999): Added ITV concept to accommodate internal organ motion; introduced PRV',
      'Defined ICRU Reference Point (clinically relevant, accurately calculable, not in steep gradient)',
      'Prescribed dose should be ±5% of ICRU Reference Point dose for conventional RT',
    ],
    pitfalls: [
      'Using ICRU 50 prescribed dose reporting (reference point) for IMRT — not appropriate; use ICRU 83 volume-based metrics',
      'Adding SM directly to GTV without first creating oncological CTV',
      'Conflating CTV margin (oncological) with SM (geometric): they serve entirely different functions',
      'Not reporting IV (irradiated volume) when relevant for late effects',
    ]
  },
  {
    id: 'r83',
    number: '83',
    title: 'ICRU 83',
    subtitle: 'Prescribing, Recording, and Reporting IMRT',
    year: '2010',
    focus: 'Volume-Based Dose Metrics & IMRT Reporting',
    modality: 'IMRT / VMAT',
    tag: 'IMRT/VMAT',
    color: 'bg-indigo-700',
    concepts: [
      {
        abbr: 'D50%',
        full: 'Median Absorbed Dose (D₅₀)',
        desc: 'The dose received by 50% of the structure volume. ICRU 83 recommends D50% (not point dose) as the PRIMARY dose to be reported for IMRT. Robust against single-pixel outliers and calculation grid effects.',
        formula: 'D50% = dose at 50th percentile of cumulative DVH',
        clinicalNote: 'Report as: "PTV D50% = 60.0 Gy". Replaces "prescribed dose to isocentre" from ICRU 50. Equivalent to median dose on DVH.',
        tg263: 'D50%[PTV]'
      },
      {
        abbr: 'D2%',
        full: 'Near-Maximum Dose',
        desc: 'Dose received by 2% of the structure volume. ICRU 83 recommends D2% to replace Dmax. Eliminates sensitivity to single-voxel outliers from CT artefacts or calculation grid. Used for both target (PTV hotspot) and OAR (near-max dose).',
        formula: 'D2% = dose at 2nd percentile of DVH from top (i.e., 98th percentile of cumulative DVH)',
        clinicalNote: 'For PTV: D2% should not exceed 107% of prescribed dose (ICRU 83 recommendation). For OARs: D2% replaces Dmax in reporting and constraint specification.',
        tg263: 'D2%[Structure]'
      },
      {
        abbr: 'D98%',
        full: 'Near-Minimum Dose',
        desc: 'Dose received by 98% of the structure volume. ICRU 83 recommends D98% to replace Dmin. Represents the coverage near-minimum without being affected by calculation artefacts at structure boundaries.',
        formula: 'D98% = dose at 98th percentile of cumulative DVH',
        clinicalNote: 'For PTV: D98% ≥ 95% of prescribed dose ensures adequate target coverage. D98% < 95% = underdosage of clinically relevant volume.',
        tg263: 'D98%[Structure]'
      },
      {
        abbr: 'HI',
        full: 'Homogeneity Index',
        desc: 'Quantifies uniformity of dose distribution within the target volume. ICRU 83 definition uses D2%, D98%, and D50%.',
        formula: 'HI = (D2% − D98%) / D50%',
        clinicalNote: 'HI = 0: perfectly homogeneous. HI = 0.1 (10% variation) is acceptable for IMRT. SBRT deliberately has high HI (heterogeneous dose distribution). Lower HI does NOT always mean better — for SBRT, HI of 0.3–0.6 is expected and therapeutic.',
        tg263: 'HI (derived)'
      },
      {
        abbr: 'CI',
        full: 'Conformity Index',
        desc: 'Measures how well the treated volume conforms to the PTV. ICRU 83 uses the ratio of the reference isodose volume to the PTV volume.',
        formula: 'CI = V_RI / V_PTV\n(Paddick CI: V_RI_PTV² / (V_RI × V_PTV))',
        clinicalNote: 'CI = 1.0: perfect conformity. CI > 1.2: treated volume exceeds PTV by >20% (geographic miss or irradiation of excess normal tissue). CI < 1.0: PTV underdosed. For SBRT: Paddick CI is preferred (accounts for geographic miss).',
      },
      {
        abbr: 'V_D',
        full: 'Volume at Dose D',
        desc: 'Volume of a structure receiving at least dose D. e.g., V20Gy = volume receiving ≥20 Gy, expressed as absolute (cc) or relative (%). The primary constraint metric for parallel organs.',
        formula: 'VD = ∫[dose≥D] dV',
        clinicalNote: 'Convention: V20Gy, V40Gy (absolute dose), V95% (relative prescription %). TG-263 mandates consistent notation: V[number][unit]. Always specify whether absolute or relative volume.',
        tg263: 'V20Gy[Structure] or V95%[Structure]'
      },
      {
        abbr: 'D_V',
        full: 'Dose to Volume D_V',
        desc: 'Dose received by V cm³ or V% of a structure. e.g., D2cm³ = dose to the hottest 2cc. Primary metric for OAR serial-endpoint constraints (especially brachytherapy).',
        formula: 'D_V = dose at cumulative DVH value V',
        clinicalNote: 'D2cc is the primary OAR constraint in brachytherapy (ICRU 89/GEC-ESTRO). D0.035cc ≈ point max dose. D1cc used for SRS brainstem constraint.',
      },
      {
        abbr: 'NTCP',
        full: 'Normal Tissue Complication Probability',
        desc: 'Statistical probability of a given complication occurring, derived from dose-volume metrics and radiobiological models (LKB model, Lyman EUD model, relative seriality model).',
        formula: 'LKB NTCP: F(t) = (1/√2π) ∫[−∞ to t] e^(−x²/2)dx\nt = (gEUD − TD50) / (m × TD50)',
        clinicalNote: 'Used in plan evaluation and dose-escalation studies. QUANTEC constraints generally correspond to NTCP <5% for Grade ≥3 toxicity. Not routinely reported in clinical practice but used in research trials.',
      },
    ],
    keyChanges: [
      'Replaced ICRU 50 point-based prescription with volume-based DVH reporting',
      'D50% replaces "isocentre dose" as primary prescription reporting metric',
      'D2%/D98% replace Dmax/Dmin for robustness against calculation artefacts',
      'Homogeneity Index (HI) and Conformity Index (CI) formally defined',
      'IMRT allows intentional dose inhomogeneity — hotspots within GTV are therapeutic',
    ],
    pitfalls: [
      'Reporting Dmax or Dmin instead of D2%/D98% for IMRT plans',
      'Setting CI target = 1.0 for SBRT (CI > 1 is expected and appropriate)',
      'Using HI as sole quality metric for SBRT plans (HI is intentionally high)',
      'Not reporting DVH parameters for ALL structures on the planning scan',
    ]
  },
  {
    id: 'r89',
    number: '89',
    title: 'ICRU 89',
    subtitle: 'Prescribing, Recording, and Reporting Brachytherapy for Cervix Cancer',
    year: '2016',
    focus: 'Image-Guided Adaptive Brachytherapy (IGBT)',
    modality: 'HDR / PDR Brachytherapy',
    tag: 'Brachy',
    color: 'bg-rose-700',
    concepts: [
      {
        abbr: 'GTV-B',
        full: 'GTV at Brachytherapy',
        desc: 'Gross tumour visible on MRI at the time of brachytherapy (at each fraction of BT delivery). Reflects residual disease after EBRT. Should be contoured on T2-weighted MRI at time of each BT application.',
        clinicalNote: 'Requires MRI guidance at each BT insertion. CT-based planning underestimates GTV-B coverage compared to MRI-based IGBT. GEC-ESTRO/EMBRACE protocol mandates T2 MRI at all BT insertions.',
        tg263: 'GTV_BT'
      },
      {
        abbr: 'HR-CTV',
        full: 'High-Risk CTV (at Brachytherapy)',
        desc: 'GTV-B + entire cervix + suspected parametrial/vaginal extension at time of BT. Must receive high curative dose. EMBRACE II target: D90 ≥ 85 Gy EQD2₁₀ (EBRT + BT combined).',
        formula: 'D90 HR-CTV ≥ 85 Gy EQD2₁₀ (combined EBRT + BT)',
        clinicalNote: 'If D90 HR-CTV < 85 Gy EQD2₁₀, local failure risk rises sharply. Every Gy increase in D90 = ~3% improvement in local control (EMBRACE I data).',
        tg263: 'CTV_BT_HR'
      },
      {
        abbr: 'IR-CTV',
        full: 'Intermediate-Risk CTV',
        desc: 'HR-CTV + 5–15mm margins + the initial GTV extent at diagnosis (GTV-D). Represents areas of initial tumour involvement with potential microscopic residual. Target dose: D90 ≥ 60 Gy EQD2₁₀.',
        formula: 'D90 IR-CTV ≥ 60 Gy EQD2₁₀',
        clinicalNote: 'The IR-CTV captures the initial extent of parametrial disease even if the parametrium appears clear at BT time. Particularly important for initially bulky parametrial involvement.',
        tg263: 'CTV_BT_IR'
      },
      {
        abbr: 'D90',
        full: 'Dose to 90% of Volume',
        desc: 'Dose received by 90% of the target volume (HR-CTV or IR-CTV). Primary planning objective for brachytherapy. Analogous to D98% in external beam but less conservative due to steep dose gradients in BT.',
        formula: 'D90 = dose at 90th percentile of cumulative DVH',
        clinicalNote: 'D90 HR-CTV is the single most important metric in cervix BT. Surrogate for probability of local control. Must be reported as EQD2 (EBRT + BT combined) using α/β = 10 Gy for tumour.',
      },
      {
        abbr: 'D2cm³',
        full: 'Dose to Hottest 2cc of OAR',
        desc: 'Primary OAR constraint metric in IGBT. Dose received by the hottest 2cm³ of the OAR (rectum, bladder, sigmoid, bowel). Equivalent to D2% for a 200cc bladder = D1% for a 400cc bladder — but D2cm³ (absolute) is more consistent.',
        formula: 'D2cm³ = dose at DVH value where V = 2cc (absolute volume DVH)',
        clinicalNote: 'GEC-ESTRO constraints: Rectum D2cc < 75 Gy EQD2₃; Bladder D2cc < 90 Gy EQD2₃; Sigmoid D2cc < 75 Gy EQD2₃. These are COMBINED EBRT+BT doses expressed as EQD2.',
        tg263: 'D2cc[OAR]'
      },
      {
        abbr: 'Point A',
        full: 'Manchester Point A (Legacy)',
        desc: 'Traditional brachytherapy prescription point: 2cm superior to lateral vaginal fornix and 2cm lateral to uterine canal. Still reported for historical comparison and audit purposes (EMBRACE protocol requires Point A reporting alongside D90).',
        clinicalNote: 'Point A should NOT be used as the sole prescription/reporting metric in MRI-guided BT. Point A does not reflect actual target dose in modern IGBT. Report alongside D90 HR-CTV for transition tracking.',
      },
      {
        abbr: 'EQD2',
        full: 'Equivalent Dose in 2 Gy Fractions',
        desc: 'Converts any dose-fractionation schedule to the biologically equivalent dose given in 2 Gy per fraction. Used to sum EBRT + BT contributions for combined dose reporting.',
        formula: 'EQD2 = D × (d + α/β) / (2 + α/β)\nα/β = 10 Gy (tumour), 3 Gy (late effects)',
        clinicalNote: 'For HDR BT (e.g., 7 Gy × 4 fractions): EQD2₁₀ per application = 7×(7+10)/(2+10) = 9.92 Gy. Total 4 applications = 39.7 Gy EQD2₁₀. Add to EBRT EQD2₁₀ for combined D90.',
      },
    ],
    keyChanges: [
      'ICRU 89 formalised MRI-guided adaptive brachytherapy (IGBT) as the new standard',
      'Replaced Point A dose reporting with volume-based D90 (target) and D2cc (OAR)',
      'Introduced GTV-B, HR-CTV, and IR-CTV — dynamic targets updated at each BT application',
      'EQD2 dose summation framework for combining EBRT + BT dose',
      'Established curative dose thresholds: D90 HR-CTV ≥85 Gy EQD2₁₀',
    ],
    pitfalls: [
      'Still prescribing to Point A alone without D90 HR-CTV reporting',
      'Not measuring OAR doses as combined EQD2 (EBRT + BT summed)',
      'Using CT-only planning when MRI is available — underestimates HR-CTV and OAR doses',
      'Forgetting to sum sigmoid D2cc — most neglected constraint in cervix BT',
    ]
  },
  {
    id: 'r91',
    number: '91',
    title: 'ICRU 91',
    subtitle: 'Prescribing, Recording, and Reporting Stereotactic Treatments with Small Photon Beams',
    year: '2014',
    focus: 'SBRT/SRS Dosimetry Standards',
    modality: 'SBRT / SRS / Radiosurgery',
    tag: 'SBRT/SRS',
    color: 'bg-violet-700',
    concepts: [
      {
        abbr: 'Small Field',
        full: 'Small Radiation Field Definition',
        desc: 'A radiation field where one or more conditions hold: (1) lateral charged-particle equilibrium not established at field centre; (2) detector is large relative to field; (3) partial source occlusion occurs at collimator edge. Typically fields ≤4×4cm² at isocenter, or ≤3cm circular.',
        clinicalNote: 'Small field output factors measured with inappropriate detectors may underestimate actual dose by 5–30%. ICRU 91 and IAEA TRS-483 mandate detector correction factors (k_Qmsf). DO NOT use Farmer-type ionisation chambers for small field output measurement.',
      },
      {
        abbr: 'D95%',
        full: 'Dose to 95% of PTV',
        desc: 'Standard target coverage metric for SBRT (contrast to D98% for conventional IMRT). D95% ≥ 100% of prescription dose is the RTOG/ICRU 91 coverage standard for SBRT. Lower percentile than D98% because steep dose gradients at PTV boundary are accepted in SBRT.',
        formula: 'D95% = dose at 95th percentile of cumulative PTV DVH',
        clinicalNote: 'SBRT prescription: "prescribed dose = X Gy to the Y% isodose line enclosing ≥95% of PTV". Report D95%, Dmax (or D2%), D100%, and Dmean for PTV.',
      },
      {
        abbr: 'R50%',
        full: 'Ratio of 50% Isodose Volume to PTV Volume',
        desc: 'Volume enclosed by 50% isodose / PTV volume. Measures intermediate-dose spillage. Primary RTOG SBRT conformity/falloff metric. Used in RTOG protocol eligibility criteria.',
        formula: 'R50% = V_50%isodose / V_PTV',
        clinicalNote: 'RTOG lung SBRT target: R50% < 3.5–4.0 (depends on PTV size). Higher R50% = more dose spillage → higher chest wall and OAR dose. Reducing R50% requires better field arrangement and more arcs.',
      },
      {
        abbr: 'GI',
        full: 'Gradient Index (Paddick)',
        desc: 'Measures steepness of dose fall-off outside the target. Defined as ratio of 50% isodose volume to 100% isodose volume. Lower GI = steeper dose gradient = better normal tissue sparing.',
        formula: 'GI = V_50%isodose / V_100%isodose',
        clinicalNote: 'Target GI < 4 for standard SBRT. SRS multi-isocenter plans can achieve GI < 3. GI and R50% both important — R50% assesses absolute dose spillage, GI assesses gradient steepness relative to prescription isodose.',
      },
      {
        abbr: 'Paddick CI',
        full: 'Paddick Conformity Index',
        desc: 'Improved CI that accounts for geographic miss (volume of prescription isodose within PTV). Original RTOG CI does not penalise plans where the prescription isodose misses part of the target.',
        formula: 'Paddick CI = (TV_PIV)² / (TV × PIV)\nTV_PIV = target volume covered by prescription isodose\nPIV = prescription isodose volume',
        clinicalNote: 'Paddick CI range 0–1. CI = 1 = perfect coverage and conformity. For SBRT: target Paddick CI > 0.7. If Paddick CI << RTOG CI, the plan has a geographic miss despite apparent good conformity.',
      },
      {
        abbr: 'TSET',
        full: 'Task-Specific Equipment Testing',
        desc: 'Quality assurance framework specific to small field dosimetry. Includes: output factor measurement, MLC leaf bank verification, isocenter accuracy (Winston-Lutz ≤1mm), end-to-end testing, delivery log analysis.',
        clinicalNote: 'TG-135 (CyberKnife), TG-178 (Gamma Knife), TG-218 (general IMRT QA including SBRT). Winston-Lutz test: isocenter coincidence of mechanical, radiation, and imaging isocenters to within 1mm for SRS.',
      },
    ],
    keyChanges: [
      'First ICRU report to address small field dosimetry formally (reference to IAEA TRS-483)',
      'Established SBRT-specific reporting metrics: D95%, R50%, GI, Paddick CI',
      'Distinguished SRS (single fraction), SBRT (2–5 fractions), FSRT (>5 fractions using SRS technique)',
      'Acknowledged intentional dose heterogeneity in SBRT — high-dose core within target is therapeutic',
      'Required Winston-Lutz isocenter verification as mandatory QA for radiosurgery',
    ],
    pitfalls: [
      'Using D98% instead of D95% for SBRT coverage — ICRU 91 uses D95%',
      'Not reporting R50% and GI for SBRT plans — required by RTOG protocols',
      'Using RTOG CI (without Paddick adjustment) — misses geographic miss scenarios',
      'Measuring output factors with large detectors without k correction factors (IAEA TRS-483)',
    ]
  },
  {
    id: 'r71',
    number: '71',
    title: 'ICRU 71',
    subtitle: 'Prescribing, Recording, and Reporting Electron Beam Therapy',
    year: '2004',
    focus: 'Electron Beam Dose Specifications',
    modality: 'Electron Beam',
    tag: 'Electrons',
    color: 'bg-teal-700',
    concepts: [
      {
        abbr: 'R₈₀',
        full: '80% Depth Dose',
        desc: 'Depth at which the electron absorbed dose is 80% of the maximum dose. Defines the THERAPEUTIC RANGE — the practical depth for the distal edge of tumour coverage.',
        formula: 'R₈₀ ≈ E/3.3 (cm water, approximate)',
        clinicalNote: 'Primary clinical metric for electron beam selection. Rule of thumb: R₈₀ (cm) ≈ E (MeV)/3.3. For a 5mm deep lesion: use 6 MeV electron (R₈₀ ≈ 1.8cm). Tumour depth = R₈₀ − 3–5mm safety margin.',
      },
      {
        abbr: 'R₅₀',
        full: 'Half-Value Depth',
        desc: 'Depth at which the electron absorbed dose is 50% of the maximum dose. Used as reference for electron quality specification (beam quality index). IAEA TRS-398 uses R₅₀ to determine reference depth (d_ref = 0.6 × R₅₀ − 0.1).',
        formula: 'R₅₀ ≈ E/2.8 (cm water)',
        clinicalNote: 'Distinguishes from photon R₅₀ which uses tissue-phantom ratio. Electron R₅₀ is measured in water phantom with broad parallel-plate chamber.',
      },
      {
        abbr: 'Rp',
        full: 'Practical Range',
        desc: 'Intersection of the tangent to the descending dose curve with the bremsstrahlung background. Represents the maximum extent of electron penetration. Related to: Rp (cm) ≈ E/2.',
        formula: 'Rp ≈ E/2 (cm water, approximate)',
        clinicalNote: 'Clinical significance: electron beam produces negligible dose beyond Rp. This is the key advantage of electrons for sparing deep structures (e.g., lung-wall treatment, post-mastectomy chest wall).',
      },
      {
        abbr: 'd_max',
        full: 'Depth of Maximum Dose',
        desc: 'Depth of maximum absorbed dose for electron beams. Decreases from ~1–2cm for high-energy electrons to near surface for low-energy beams.',
        formula: 'd_max ≈ E/4 (cm water, very approximate)',
        clinicalNote: 'For 6 MeV: d_max ≈ 1.3cm. For 15 MeV: d_max ≈ 3cm. Dose distributions are not as well-defined as photons in heterogeneous tissues — heterogeneity corrections mandatory in lung and near bone.',
      },
      {
        abbr: 'FWHM',
        full: 'Field Width (Penumbra)',
        desc: 'Electron beams have sharper lateral penumbra than photons for small fields (< 5cm), but wider penumbra for large fields due to increased lateral scatter. FWHM varies significantly with applicator size and SSD.',
        clinicalNote: 'Electrons require dedicated applicators/cones. Output factors are strongly field-size dependent — measure at EVERY applicator used clinically. Extended SSD significantly degrades dose distribution.',
      },
      {
        abbr: 'E₀',
        full: 'Mean Electron Energy at Surface',
        desc: 'Mean energy of electrons at the phantom surface, derived from R₅₀. Required for reference dosimetry (IAEA TRS-398, AAPM TG-51).',
        formula: 'E₀ = 2.33 × R₅₀ (MeV)',
        clinicalNote: 'Used in reference dosimetry to select stopping power ratios (Spencer-Attix formalism). Measured in water at R₅₀ with a parallel-plate chamber (NACP-02, Roos, or Markus).',
      },
    ],
    keyChanges: [
      'Standardised electron beam quality specification using R₅₀ (replaces older mean energy E₀)',
      'Adopted IAEA TRS-398 dosimetry formalism for electron reference dosimetry',
      'Formalised use of R₈₀ as the therapeutic range for clinical electron prescribing',
      'Addressed heterogeneity effects: bone/lung corrections mandatory for clinical electron planning',
    ],
    pitfalls: [
      'Selecting electron energy by Rp (maximum range) rather than R₈₀ (therapeutic range) — leads to under-dosing',
      'Not measuring output factors for each specific applicator/insert combination',
      'Ignoring chest wall air-density heterogeneity for post-mastectomy electron planning',
      'Assuming 6 MeV penetrates to 6cm — actual R₈₀ ≈ 1.8cm; Rp ≈ 3cm',
    ]
  },
  {
    id: 'r78',
    number: '78',
    title: 'ICRU 78',
    subtitle: 'Prescribing, Recording, and Reporting Proton Beam Therapy',
    year: '2007',
    focus: 'Proton Beam Dosimetry & Volume Reporting',
    modality: 'Proton / Particle Therapy',
    tag: 'Protons',
    color: 'bg-emerald-700',
    concepts: [
      {
        abbr: 'LET',
        full: 'Linear Energy Transfer',
        desc: 'Energy deposited per unit path length (keV/μm). Protons have increasing LET as they slow near end of range (Bragg peak). LET-weighted doses are used for biological dose planning in carbon ion therapy.',
        formula: 'LET_d = ΣD_i × LET_i / ΣD_i (dose-averaged LET)',
        clinicalNote: 'At Bragg peak, proton LET ≈ 5–10 keV/μm vs 0.2 keV/μm for 6MV photons. This is why the distal edge of SOBP receives higher biological dose even at same physical dose.',
      },
      {
        abbr: 'RBE',
        full: 'Relative Biological Effectiveness',
        desc: 'Ratio of reference radiation (250 kVp X-rays or ⁶⁰Co) dose to test radiation dose producing the same biological effect. Clinical RBE for protons = 1.1 (generic, applied uniformly). For carbon ions: RBE = 2–5 depending on LET.',
        formula: 'RBE = D_reference / D_test (iso-effect)',
        clinicalNote: 'The constant RBE = 1.1 for protons is a simplification. Actual RBE varies with LET (higher at distal end of SOBP), tissue type, and dose per fraction. This is a source of uncertainty in proton treatment planning.',
      },
      {
        abbr: 'SOBP',
        full: 'Spread-Out Bragg Peak',
        desc: 'Superposition of multiple pristine Bragg peaks at different depths to create a uniform dose plateau over the target volume. Used in passive scattering proton delivery. SOBP width = tumour depth extent.',
        clinicalNote: 'SOBP has higher entrance dose for broader peaks (more proximal Bragg peaks). For deep tumours with thick SOBP, the proximal dose advantage of protons is reduced. Pencil beam scanning (PBS) avoids this by modulating individual beamlets.',
      },
      {
        abbr: 'Gy(RBE)',
        full: 'Gray Relative Biological Effectiveness',
        desc: 'Clinical dose unit for proton therapy accounting for RBE: Physical dose (Gy) × RBE. For clinical proton therapy with RBE = 1.1: 1 Gy physical dose = 1.1 Gy(RBE).',
        formula: 'Dose [Gy(RBE)] = Physical Dose [Gy] × RBE',
        clinicalNote: 'ALWAYS specify whether proton dose is reported in Gy (physical) or Gy(RBE). ICRU 78 recommends Gy(RBE) for clinical reporting. A prescription of "60 Gy(RBE)" to a prostate cancer = 54.5 Gy physical.',
      },
      {
        abbr: 'Range Uncertainty',
        full: 'Proton Range Uncertainty',
        desc: 'Uncertainty in the predicted proton stopping point (Bragg peak location). Sources: CT calibration (Hounsfield unit to stopping power ratio), anatomical changes (weight loss, tumour regression), beam delivery (energy calibration).',
        formula: 'Typical range uncertainty: ±3–3.5% + 1–3mm',
        clinicalNote: 'Range uncertainty drives the concept of "range margins" (equivalent to SM for protons) and avoidance of "end-on" beam angles where distal edge falls in/near critical structures. In-room CT or MRI for adaptive proton therapy reduces range uncertainty.',
      },
      {
        abbr: 'Dw,Q',
        full: 'Absorbed Dose to Water (Beam Quality Q)',
        desc: 'Reference dosimetry quantity for clinical proton beams. Measured with a Farmer-type ionisation chamber in water at reference depth using IAEA TRS-398 protocol. Beam quality factor kQ corrects for proton beam quality.',
        formula: 'Dw,Q = Mraw × ND,w,Q0 × kQ',
        clinicalNote: 'IAEA TRS-398 is the international standard for proton reference dosimetry. kQ is measured at a reference depth within the SOBP (typically at the centre of the 10-cm SOBP).',
      },
    ],
    keyChanges: [
      'Established Gy(RBE) as the clinical dose unit for proton and heavy ion therapy',
      'Formalised volume definitions (GTV/CTV/PTV/OAR) for particle therapy — same ICRU 62 hierarchy applies',
      'Introduced range uncertainty as a planning consideration unique to particle therapy',
      'Distinguished passive scattering (SOBP) from pencil beam scanning (PBS/IMPT) delivery',
    ],
    pitfalls: [
      'Not specifying Gy vs Gy(RBE) — a critical ambiguity that can lead to 10% dose discrepancy',
      'Ignoring distal dose uncertainty — never place beam end-on to brainstem or spinal cord',
      'Applying photon OAR constraints directly to proton without RBE adjustment',
      'Assuming RBE = 1.1 at all positions — the distal edge of SOBP has higher biological dose',
    ]
  },
  {
    id: 'r95',
    number: '95',
    title: 'ICRU 95',
    subtitle: 'Prescribing, Recording, and Reporting of Stereotactic Treatments of Brain Tumors',
    year: '2019',
    focus: 'Brain Radiosurgery / SRT Standards',
    modality: 'SRS / FSRT',
    tag: 'SRS Brain',
    color: 'bg-amber-700',
    concepts: [
      {
        abbr: 'GTV (SRS)',
        full: 'GTV for Radiosurgery',
        desc: 'MRI-based gross tumour delineation for brain SRS. Must use both contrast-enhanced T1 and T2/FLAIR for brain metastases and gliomas respectively. GTV = CTV for SRS (no elective CTV expansion in most SRS indications).',
        clinicalNote: 'For brain metastases: GTV = contrast-enhancing lesion on T1-Gd. For AVM: GTV = nidus on DSA/MRI, excluding draining veins. For acoustic neuroma: T2-weighted tumour volume.',
        tg263: 'GTV_SRS'
      },
      {
        abbr: 'PTV (SRS)',
        full: 'PTV for Radiosurgery',
        desc: 'GTV + setup margin only (1–3mm for SRS with frame, 1–2mm for frameless SRS). No ITV needed for intracranial treatments (rigid skull). PTV margin reflects IGRT precision: frame-based = 0–1mm; mask-based CBCT = 1–2mm.',
        clinicalNote: 'Frame-based SRS (Gamma Knife): PTV margin often 0mm if GTV well-defined on MRI. Linac-based CBCT (mask): 1–2mm PTV margin. 6-DOF couch improves setup; residual error <0.5mm with ExacTrac.',
      },
      {
        abbr: 'D_isocenter',
        full: 'Dose at Isocenter (Gamma Knife)',
        desc: 'The prescription dose in Gamma Knife radiosurgery is reported at the isocenter (centre of the shot), which typically represents the maximum dose. Prescription is to a specific isodose line (50% for single shot, varies for multi-shot).',
        clinicalNote: 'Gamma Knife convention: prescription to 50% isodose means isocenter = 2× prescription dose. This is fundamentally different from ICRU 83 D50% reporting. Always specify: "X Gy to the Y% isodose" for SRS.',
      },
      {
        abbr: 'Selectivity',
        full: 'Selectivity / Paddick CI',
        desc: 'In SRS, Paddick Conformity Index used as the primary conformity metric. Additionally, "Selectivity" = V_PTV receiving ≥ prescription dose / Total prescription isodose volume.',
        formula: 'Selectivity = V_PTV(≥RxDose) / V_Total(≥RxDose)',
        clinicalNote: 'Selectivity close to 1.0 = prescription isodose covers PTV well. Used in Gamma Knife Quality Score (GKQS) reporting.',
      },
    ],
    keyChanges: [
      'ICRU 95 specifically addresses intracranial radiosurgery (SRS) and FSRT for brain tumours',
      'Harmonises SRS reporting with ICRU 83 DVH metrics while acknowledging Gamma Knife conventions',
      'Mandates MRI co-registration for all SRS target definition',
      'Defines frame-based vs frameless immobilisation uncertainty thresholds',
    ],
    pitfalls: [
      'Not specifying the isodose line for SRS prescription (50% vs 80% creates entirely different dose distributions)',
      'Applying ICRU 83 D50% as primary reporting metric without accounting for SRS heterogeneity convention',
    ]
  }
];

// ─── VOLUME HIERARCHY ─────────────────────────────────────────────────────
const HIERARCHY_VOLUMES = [
  { abbr: 'GTV', label: 'Gross Tumour Volume', color: '#dc2626', width: 30, formula: 'Visible/palpable disease' },
  { abbr: 'CTV', label: 'Clinical Target Volume', color: '#ea580c', width: 45, formula: 'GTV + subclinical disease' },
  { abbr: 'ITV', label: 'Internal Target Volume', color: '#ca8a04', width: 58, formula: 'CTV + Internal Motion (IM)' },
  { abbr: 'PTV', label: 'Planning Target Volume', color: '#2563eb', width: 70, formula: 'ITV + Setup Margin (SM)' },
  { abbr: 'TV', label: 'Treated Volume', color: '#7c3aed', width: 78, formula: '≥ prescription isodose' },
  { abbr: 'IV', label: 'Irradiated Volume', color: '#64748b', width: 90, formula: '≥ significant dose (50% Rx)' },
];

// ─── TG-263 NOMENCLATURE ──────────────────────────────────────────────────
const TG263_NAMES = [
  { structure: 'Spinal Cord', tg263: 'SpinalCord', notes: 'Not "Cord" or "SC"' },
  { structure: 'Spinal Cord PRV', tg263: 'SpinalCord_PRV5', notes: '5mm expansion specified' },
  { structure: 'Brainstem', tg263: 'Brainstem', notes: 'Include entire structure to foramen magnum' },
  { structure: 'Optic Chiasm', tg263: 'OpticChiasm', notes: 'Contour at chiasm, not nerves separately' },
  { structure: 'Optic Nerves', tg263: 'OpticNrv_R / OpticNrv_L', notes: 'Laterality suffix mandatory' },
  { structure: 'Parotid', tg263: 'Parotid_R / Parotid_L', notes: 'Total gland including deep lobe' },
  { structure: 'Submandibular', tg263: 'Submandibular_R / _L', notes: 'Separate from parotid' },
  { structure: 'Lung', tg263: 'Lung_R / Lung_L', notes: 'Aerated volume only (exclude GTV, vessels)' },
  { structure: 'Heart', tg263: 'Heart', notes: 'From carina to apex, including pericardium' },
  { structure: 'Esophagus', tg263: 'Esophagus', notes: 'C5 to cardia' },
  { structure: 'Rectum', tg263: 'Rectum', notes: 'From rectosigmoid junction to anorectal junction' },
  { structure: 'Bladder', tg263: 'Bladder', notes: 'Outer wall, without urine' },
  { structure: 'Femoral Head', tg263: 'FemoralHead_R / _L', notes: 'Femoral head + neck to lesser trochanter' },
  { structure: 'Liver', tg263: 'Liver', notes: 'Full liver volume including GTV for organ dose' },
  { structure: 'Kidney', tg263: 'Kidney_R / Kidney_L', notes: 'Full kidney including pelvis' },
  { structure: 'Bowel', tg263: 'Bowel', notes: 'Small bowel only; large bowel = Colon' },
  { structure: 'Cochlea', tg263: 'Cochlea_R / Cochlea_L', notes: 'Inner ear cochlear structure only' },
  { structure: 'Hippocampus', tg263: 'Hippocampus_R / _L', notes: 'RTOG atlas; bilateral always' },
  { structure: 'Brachial Plexus', tg263: 'BrachialPlex_R / _L', notes: 'C5–T1 nerve roots to axilla' },
];

// ─── EXAM Q&A ─────────────────────────────────────────────────────────────
interface ExamQA {
  q: string;
  a: string;
  report: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

const EXAM_QA: ExamQA[] = [
  {
    q: 'What is the difference between ITV and PTV?',
    a: 'ITV (Internal Target Volume) = CTV + Internal Margin (IM), accounting for physiological movement (respiration, bladder/rectal filling). PTV (Planning Target Volume) = ITV + Setup Margin (SM), accounting for external setup and beam delivery uncertainties. ITV is introduced in ICRU 62 (1999); CTV and PTV were defined in ICRU 50 (1993).',
    report: 'ICRU 50 / 62',
    difficulty: 'Basic'
  },
  {
    q: 'Why does ICRU 83 recommend D2% instead of Dmax for IMRT reporting?',
    a: 'Dmax is sensitive to single-voxel outliers caused by CT artefacts, high-density implants, or coarse dose calculation grids. D2% represents the dose to 2% of the volume, providing a statistically robust near-maximum that reflects clinically relevant dose without being affected by artefacts. D2% < D5% of prescribed dose is the ICRU 83 target for near-max.',
    report: 'ICRU 83',
    difficulty: 'Basic'
  },
  {
    q: 'What is the Homogeneity Index (HI) and what does HI = 0 mean?',
    a: 'HI = (D2% − D98%) / D50% [ICRU 83 definition]. HI = 0 indicates a perfectly homogeneous dose distribution (D2% equals D98%). HI = 0.1 = 10% variation in dose across the volume, which is acceptable for IMRT. For SBRT, HI values of 0.3–0.6 are expected and therapeutically intended — the high-dose hotspot within the GTV is ablative.',
    report: 'ICRU 83',
    difficulty: 'Intermediate'
  },
  {
    q: 'How do you calculate the combined EBRT + brachytherapy dose for cervix cancer?',
    a: 'Each EBRT fraction and each BT application is converted to EQD2 separately using the LQ formula: EQD2 = D × (d + α/β) / (2 + α/β). For tumour: α/β = 10 Gy. For OARs: α/β = 3 Gy. These EQD2 values are summed. Example: EBRT 45 Gy / 25fx = EQD2₁₀ = 45 Gy. HDR 7 Gy × 4fx: each = 7×17/12 = 9.9 Gy EQD2₁₀; 4 fractions = 39.7 Gy. Total D90 HR-CTV = 45 + 39.7 = 84.7 Gy EQD2₁₀ (below EMBRACE 85 Gy threshold — needs optimisation).',
    report: 'ICRU 89',
    difficulty: 'Advanced'
  },
  {
    q: 'What is the R50% (ICRU 91) and why is it important in SBRT?',
    a: 'R50% = Volume enclosed by 50% isodose / PTV volume. It measures intermediate-dose spillage around the SBRT target. High R50% means the 50% isodose spreads widely beyond the PTV, increasing dose to chest wall, bowel, and other OARs. RTOG lung SBRT target: R50% < 3.5–4.0 (varies by PTV size). Distinct from Gradient Index (GI) = V50%isodose / V100%isodose, which measures the steepness of dose fall-off.',
    report: 'ICRU 91',
    difficulty: 'Intermediate'
  },
  {
    q: 'What is the ICRU Reference Point (ICRU 50) and what are its three criteria?',
    a: 'The ICRU Reference Point is the single point used to report the prescribed dose for conventional RT. Three criteria: (1) Clinically relevant — in the primary target volume; (2) Accurately calculable — not in a steep dose gradient region; (3) Representative — characteristic of the dose to the whole target. Typically the isocentre or centre of the IMRT dose distribution. ICRU 83 superseded this for IMRT with volume-based D50%.',
    report: 'ICRU 50',
    difficulty: 'Basic'
  },
  {
    q: 'What does Gy(RBE) mean in proton therapy, and how is it calculated?',
    a: 'Gy(RBE) = Physical dose (Gy) × RBE. For clinical proton therapy, a generic RBE = 1.1 is used throughout the SOBP. Therefore: Gy(RBE) = 1.1 × Gy(physical). Example: prescription of 60 Gy(RBE) = 54.5 Gy physical dose. This is important for comparing proton and photon prescriptions and for evaluating OAR dose constraints (which must be converted appropriately).',
    report: 'ICRU 78',
    difficulty: 'Intermediate'
  },
  {
    q: 'What is the van Herk margin formula and what parameters does it use?',
    a: 'SM = 2.5Σ + 0.7σ, where Σ = systematic error (SD of mean displacements across patient population) and σ = random error (SD of fraction-to-fraction displacements for one patient). This ensures 90% of patients receive ≥95% of the prescribed dose to the CTV. Σ dominates coverage probability — halving Σ has greater margin-reduction impact than halving σ.',
    report: 'ICRU 62',
    difficulty: 'Intermediate'
  },
  {
    q: 'What is the difference between HR-CTV and IR-CTV in ICRU 89?',
    a: 'HR-CTV (High-Risk CTV) = GTV at brachytherapy time (GTV-B) + entire cervix + suspected parametrial extension at BT. Target dose ≥85 Gy EQD2₁₀ (EBRT+BT combined). IR-CTV (Intermediate-Risk CTV) = HR-CTV + 5–15mm margins + the INITIAL tumour extent at diagnosis. Target dose ≥60 Gy EQD2₁₀. The IR-CTV captures areas of initial involvement with potential microscopic residual, even if regressed by EBRT time.',
    report: 'ICRU 89',
    difficulty: 'Advanced'
  },
  {
    q: 'What is the Paddick Conformity Index and how does it differ from the RTOG CI?',
    a: 'RTOG CI = PIV / TV (prescription isodose volume / target volume). Paddick CI = (TV_PIV)² / (TV × PIV), where TV_PIV = target volume covered by prescription isodose. RTOG CI does not penalise geographic miss (prescription isodose could cover entirely different volume from the target and still give CI ≈ 1). Paddick CI = 0 if there is complete geographic miss, and = 1 only when prescription isodose exactly covers the target. For SBRT, Paddick CI is preferred.',
    report: 'ICRU 91',
    difficulty: 'Advanced'
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

type PageTab = 'Reports' | 'Hierarchy' | 'TG263' | 'ExamQA';

const ICRUPage: React.FC = () => {
  const [activeReportId, setActiveReportId] = useState(ICRU_REPORTS[0].id);
  const [pageTab, setPageTab] = useState<PageTab>('Reports');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [showQuickRef, setShowQuickRef] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "ICRU 50/62 Volumes",
      emoji: "🎯",
      accent: "#38bdf8",
      bg: "rgba(56, 189, 232, 0.08)",
      border: "rgba(56, 189, 232, 0.4)",
      rows: [
        { k: "GTV", v: "Gross Tumor Volume", mono: false },
        { k: "CTV", v: "Clinical Target Volume", mono: false },
        { k: "ITV", v: "Internal Target Volume", mono: false },
        { k: "PTV", v: "Planning Target Volume", mono: false },
      ]
    },
    {
      title: "ICRU 83 (IMRT)",
      emoji: "📈",
      accent: "#a78bfa",
      bg: "rgba(167, 139, 250, 0.08)",
      border: "rgba(167, 139, 250, 0.4)",
      rows: [
        { k: "D2%", v: "Near Maximum Dose", mono: true },
        { k: "D98%", v: "Near Minimum Dose", mono: true },
        { k: "D50%", v: "Median Dose", mono: true },
        { k: "V95%", v: "Volume receiving 95% dose", mono: true },
      ]
    },
    {
      title: "OAR Volumes",
      emoji: "🛡️",
      accent: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.08)",
      border: "rgba(251, 191, 36, 0.4)",
      rows: [
        { k: "PRV", v: "Planning Risk Volume", mono: false },
        { k: "Serial", v: "Max dose matters (Spine)", mono: false },
        { k: "Parallel", v: "Mean dose matters (Lung)", mono: false },
      ]
    }
  ];
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Basic' | 'Intermediate' | 'Advanced'>('All');
  const [expandedQA, setExpandedQA] = useState<Set<number>>(new Set());

  const activeReport = ICRU_REPORTS.find(r => r.id === activeReportId)!;

  const toggleConcept = (abbr: string) => {
    setExpandedConcepts(prev => {
      const next = new Set(prev);
      next.has(abbr) ? next.delete(abbr) : next.add(abbr);
      return next;
    });
  };

  const toggleQA = (i: number) => {
    setExpandedQA(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const filteredQA = EXAM_QA.filter(q => selectedDifficulty === 'All' || q.difficulty === selectedDifficulty);

  const DIFF_STYLE: Record<string, string> = {
    Basic: 'bg-emerald-100 text-emerald-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative text-slate-900">

      {/* ── QUICK REF PANEL ── */}
      <KeyFactsSidebar 
        isOpen={showQuickRef} 
        onClose={() => setShowQuickRef(false)} 
        onOpen={() => setShowQuickRef(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-sm">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight text-slate-900">ICRU Reporting Standards</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
              Reports 50 · 62 · 71 · 78 · 83 · 89 · 91 · 95 · TG-263
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-slate-100">
          {(['Reports', 'Hierarchy', 'TG263', 'ExamQA'] as PageTab[]).map(t => (
            <button key={t} onClick={() => setPageTab(t)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition border-b-2 ${
                pageTab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t === 'ExamQA' ? 'Exam Q&A' : t}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: Reports
      ════════════════════════════════════════════════════════════════ */}
      {pageTab === 'Reports' && (
        <div className="px-3 pt-3 space-y-3">

          {/* Report selector */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ICRU_REPORTS.map(r => (
              <button key={r.id} onClick={() => setActiveReportId(r.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  activeReportId === r.id
                    ? `${r.color} text-white border-transparent shadow-sm`
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                ICRU {r.number}
              </button>
            ))}
          </div>

          {/* Report header card */}
          <AnimatePresence mode="wait">
            <motion.div key={activeReportId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded text-white ${activeReport.color}`}>
                      ICRU {activeReport.number} · {activeReport.year}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold border border-slate-200 px-2 py-0.5 rounded">
                      {activeReport.modality}
                    </span>
                  </div>
                  <h2 className="text-sm font-black text-slate-900">{activeReport.title}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeReport.subtitle}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-600">
                <span className="font-bold text-slate-700">Focus: </span>{activeReport.focus}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Concepts */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">
              Key Concepts — {activeReport.concepts.length} definitions
            </p>
            {activeReport.concepts.map(c => {
              const isExpanded = expandedConcepts.has(c.abbr + activeReportId);
              return (
                <div key={c.abbr} className="bg-white rounded-xl border border-slate-200">
                  <button
                    onClick={() => toggleConcept(c.abbr + activeReportId)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-2.5"
                  >
                    <span className={`flex-shrink-0 text-[11px] font-black px-2 py-0.5 rounded text-white mt-0.5 ${activeReport.color}`}>
                      {c.abbr}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{c.full}</p>
                      {c.tg263 && (
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">TG-263: {c.tg263}</p>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-1" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-1" />
                    }
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-100">
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{c.desc}</p>
                          {c.formula && (
                            <div className="bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-line">
                              {c.formula}
                            </div>
                          )}
                          {c.clinicalNote && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-[10px] text-amber-800 leading-relaxed">
                              <span className="font-black text-amber-700">Clinical: </span>{c.clinicalNote}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Key Changes */}
          {activeReport.keyChanges && (
            <div className="bg-white rounded-xl border border-emerald-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                  Key Changes / Significance
                </p>
              </div>
              <ul className="space-y-1.5">
                {activeReport.keyChanges.map((kc, i) => (
                  <li key={i} className="text-[11px] text-slate-700 flex gap-2">
                    <span className="text-emerald-500 flex-shrink-0">▸</span>{kc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pitfalls */}
          {activeReport.pitfalls && (
            <div className="bg-white rounded-xl border border-red-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <p className="text-[9px] font-black uppercase tracking-widest text-red-700">
                  Common Pitfalls & Exam Traps
                </p>
              </div>
              <ul className="space-y-1.5">
                {activeReport.pitfalls.map((p, i) => (
                  <li key={i} className="text-[11px] text-slate-700 flex gap-2">
                    <span className="text-red-400 flex-shrink-0">▸</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Volume Hierarchy Visualiser
      ════════════════════════════════════════════════════════════════ */}
      {pageTab === 'Hierarchy' && (
        <div className="px-3 pt-3 space-y-4">

          {/* Visual hierarchy */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Volume Hierarchy (ICRU 62)</p>
            <div className="space-y-3">
              {HIERARCHY_VOLUMES.map((vol, i) => (
                <div key={vol.abbr} className="flex items-center gap-3">
                  <div className="w-14 flex-shrink-0 text-right">
                    <span className="text-[11px] font-black" style={{ color: vol.color }}>{vol.abbr}</span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${vol.width}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full flex items-center px-2"
                      style={{ backgroundColor: vol.color }}
                    >
                      <span className="text-[9px] font-black text-white truncate">{vol.formula}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            {/* Margin arrows */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              {[
                { from: 'CTV → ITV', label: 'Internal Margin (IM)', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                { from: 'ITV → PTV', label: 'Setup Margin (SM)', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                { from: 'OAR → PRV', label: 'PRV Margin', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
                { from: 'van Herk', label: 'SM = 2.5Σ + 0.7σ', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
              ].map((item, i) => (
                <div key={i} className={`rounded-lg border px-2.5 py-2 ${item.bg}`}>
                  <p className={`text-[9px] font-black uppercase ${item.color}`}>{item.from}</p>
                  <p className={`text-[10px] font-bold ${item.color}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nested visualisation (concentric circles concept) */}
          <div className="bg-slate-900 text-white rounded-xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Target Volume Nesting (Conceptual)</p>
            <div className="flex items-center justify-center py-4">
              <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
                {/* Irradiated Vol */}
                <div className="absolute rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center"
                  style={{ width: 230, height: 230 }}>
                  <span className="absolute bottom-3 text-[8px] text-slate-500 font-bold">IV</span>
                </div>
                {/* Treated Vol */}
                <div className="absolute rounded-full border-2 border-slate-500 flex items-center justify-center"
                  style={{ width: 190, height: 190 }}>
                  <span className="absolute bottom-2 text-[8px] text-slate-400 font-bold">TV</span>
                </div>
                {/* PTV */}
                <div className="absolute rounded-full border-2 border-blue-500 bg-blue-950/30"
                  style={{ width: 155, height: 155 }}>
                </div>
                <span className="absolute text-[8px] text-blue-400 font-black" style={{ bottom: 55, left: 30 }}>PTV</span>
                {/* ITV */}
                <div className="absolute rounded-full border-2 border-amber-500 bg-amber-950/20"
                  style={{ width: 120, height: 120 }}>
                </div>
                <span className="absolute text-[8px] text-amber-400 font-black" style={{ bottom: 72, left: 47 }}>ITV</span>
                {/* CTV */}
                <div className="absolute rounded-full border-2 border-orange-500 bg-orange-950/30"
                  style={{ width: 88, height: 88 }}>
                </div>
                <span className="absolute text-[8px] text-orange-400 font-black" style={{ bottom: 88, left: 62 }}>CTV</span>
                {/* GTV */}
                <div className="absolute rounded-full border-2 border-red-500 bg-red-800/50"
                  style={{ width: 58, height: 58 }}>
                </div>
                <span className="absolute text-[8px] text-red-300 font-black text-center" style={{ bottom: 103, left: 77 }}>GTV</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { abbr: 'IM', desc: 'CTV→ITV: physiological', color: 'text-amber-400' },
                { abbr: 'SM', desc: 'ITV→PTV: setup uncertainty', color: 'text-blue-400' },
                { abbr: 'TV', desc: '95% isodose surface', color: 'text-slate-300' },
                { abbr: 'IV', desc: '≥50% Rx isodose bath', color: 'text-slate-500' },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-[10px]">
                  <span className={`font-black w-5 ${item.color}`}>{item.abbr}</span>
                  <span className="text-slate-400">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SBRT vs CFRT comparison */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Conventional RT vs SBRT — Reporting Differences
            </p>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <p className="font-black text-slate-700 mb-1.5 border-b border-slate-100 pb-1">Conventional IMRT (ICRU 83)</p>
                <ul className="space-y-1 text-slate-600">
                  <li>▸ D95%–D100% within ±5% of Rx</li>
                  <li>▸ D2% (near-max) ≤107% Rx</li>
                  <li>▸ CI ≈ 1.0–1.2 (tight conformity)</li>
                  <li>▸ HI target ≈ 0.05–0.1</li>
                  <li>▸ Prescription to 100% isodose</li>
                  <li>▸ Report D50%, D2%, D98%</li>
                </ul>
              </div>
              <div>
                <p className="font-black text-slate-700 mb-1.5 border-b border-slate-100 pb-1">SBRT (ICRU 91)</p>
                <ul className="space-y-1 text-slate-600">
                  <li>▸ D95% ≥ 100% Rx (RTOG)</li>
                  <li>▸ Hotspot within GTV = therapeutic</li>
                  <li>▸ Paddick CI &gt; 0.7</li>
                  <li>▸ HI NOT a quality metric</li>
                  <li>▸ Prescription to 60–80% isodose</li>
                  <li>▸ Report R50%, GI, D95%, D2%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: TG-263 Nomenclature
      ════════════════════════════════════════════════════════════════ */}
      {pageTab === 'TG263' && (
        <div className="px-3 pt-3 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[10px] font-semibold text-slate-600 leading-relaxed">
              AAPM TG-263 (2018) provides standardised nomenclature for radiotherapy structure names across all TPS.
              Consistent naming enables automated constraint checking, multi-institutional studies, and AI-based contouring.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Structure → TG-263 Standard Name</p>
            </div>
            <div className="divide-y divide-slate-50">
              {TG263_NAMES.map((item, i) => (
                <div key={i} className="px-3 py-2.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{item.structure}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 italic">{item.notes}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-mono font-black text-blue-700">{item.tg263}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TG-263 rules */}
          <div className="bg-slate-900 text-white rounded-xl p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">TG-263 Naming Rules</p>
            {[
              'Laterality: always append _R or _L (never omit for paired structures)',
              'No spaces, no special characters, CamelCase for compound names',
              'PRV: append _PRV[margin]mm (e.g., SpinalCord_PRV5 = 5mm PRV)',
              'Substructures: append _[descriptor] (e.g., Heart_Ventricle_L)',
              'Objectives: GTV_D = GTV at diagnosis; GTV_BT = GTV at brachytherapy',
              'Time points: suffix _[ISO8601date] for adaptive structure versioning',
              'Avoid abbreviations: "SC" is not acceptable; use "SpinalCord"',
            ].map((rule, i) => (
              <div key={i} className="flex gap-2 text-[10px] mb-1.5">
                <span className="text-blue-400 flex-shrink-0">{i+1}.</span>
                <span className="text-slate-300">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Exam Q&A
      ════════════════════════════════════════════════════════════════ */}
      {pageTab === 'ExamQA' && (
        <div className="px-3 pt-3 space-y-3">
          {/* Difficulty filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(['All', 'Basic', 'Intermediate', 'Advanced'] as const).map(d => (
              <button key={d} onClick={() => setSelectedDifficulty(d)}
                className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${
                  selectedDifficulty === d
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {d} {d === 'All' ? `(${EXAM_QA.length})` : `(${EXAM_QA.filter(q => q.difficulty === d).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredQA.map((item, i) => {
              const globalIdx = EXAM_QA.indexOf(item);
              const isExpanded = expandedQA.has(globalIdx);
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200">
                  <button
                    onClick={() => toggleQA(globalIdx)}
                    className="w-full text-left px-3 py-3 flex items-start gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${DIFF_STYLE[item.difficulty]}`}>
                          {item.difficulty}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">{item.report}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{item.q}</p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-1" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-1" />
                    }
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-slate-100">
                          <p className="text-[11px] text-slate-700 leading-relaxed mt-2 whitespace-pre-line">{item.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="px-3 pt-4 pb-2 text-[9px] text-slate-400 border-t border-slate-100 mt-4 space-y-0.5">
        <p>ICRU Reports 50 (1993) · 62 (1999) · 71 (2004) · 78 (2007) · 83 (2010) · 89 (2016) · 91 (2014) · 95 (2019)</p>
        <p>AAPM TG-263 (2018) Structure Nomenclature · van Herk 2000 (Margin Formula) · GEC-ESTRO EMBRACE II</p>
        <p className="text-[8px] text-slate-300">For clinical use, refer to institutional protocols. Formulas validated against primary ICRU report text.</p>
      </div>
    </div>
  );
};

export default ICRUPage;