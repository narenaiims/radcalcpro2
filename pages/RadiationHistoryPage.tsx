import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface TimelineEvent {
  year: string; title: string; discoverer: string;
  description: string; clinicalImpact: string; radiobiologyNote: string;
  category: 'Diagnostic' | 'Therapeutic' | 'Physics' | 'Brachy' | 'Biology';
  nobelPrize?: string; keyRef?: string;
}
interface QuizQuestion {
  question: string; options: string[]; correctIndex: number;
  explanation: string; difficulty: 'Basic' | 'Intermediate' | 'Advanced'; topic: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EVENTS: TimelineEvent[] = [
  {
    year: '1895', title: 'Discovery of X-rays', discoverer: 'W.C. Röntgen',
    description: 'Accidental discovery during cathode-ray tube experiments. Named "X" for unknown. First medical image: Bertha Röntgen\'s hand on 8 Nov 1895.',
    clinicalImpact: 'First non-invasive visualisation of internal anatomy. Therapeutic use within 4 years (skin cancer cure 1899).',
    radiobiologyNote: 'Ionising photons produce OH• radicals → DNA DSBs. Oxygen fixation hypothesis not yet understood. No dosimetry — burns as endpoint.',
    category: 'Diagnostic', nobelPrize: 'Nobel Prize in Physics 1901 (1st Nobel ever awarded in Physics)',
    keyRef: 'Röntgen WC. Über eine neue Art von Strahlen. Würzburg: Stahel, 1895.'
  },
  {
    year: '1896', title: 'Discovery of Radioactivity', discoverer: 'H. Becquerel',
    description: 'Uranium salts emitted penetrating rays spontaneously — independent of external light. First evidence of nuclear decay.',
    clinicalImpact: 'Foundation for all radionuclide therapy. Conceptualised internal radiation sources distinct from X-ray machines.',
    radiobiologyNote: 'α-particles: RBE 20, LET ~80 keV/μm. γ-rays: RBE 1, LET ~0.3 keV/μm. β−: RBE 1, intermediate range. LET dictates DNA damage clustering.',
    category: 'Physics', nobelPrize: 'Nobel Physics 1903 (shared with Curies)',
    keyRef: 'Becquerel H. CR Acad Sci. 1896;122:501.'
  },
  {
    year: '1898', title: 'Radium & Polonium Isolated', discoverer: 'M. & P. Curie',
    description: 'Isolated from pitchblende (uranium ore). Ra-226 T½=1600y, emits α+γ (0.83 MeV). Po-210 T½=138d. Coined term "radioactivity".',
    clinicalImpact: 'Ra-226 needles became first brachytherapy source (1901–1970s). Replaced by Ir-192 but conceptually identical — interstitial implant.',
    radiobiologyNote: 'Ra-226 α-emission: high LET, clustered DNA damage (>2 DSBs within 10 bp). Significant γ-emission: staff hazard. No personal dosimetry existed.',
    category: 'Physics', nobelPrize: 'Nobel Physics 1903; Nobel Chemistry 1911 (Marie — only person with 2 Nobel in different sciences)',
    keyRef: 'Curie M. Recherches sur les substances radioactives. Thesis. Paris, 1903.'
  },
  {
    year: '1899', title: 'First X-ray Therapeutic Cure', discoverer: 'Stenbeck & Sjögren (Stockholm)',
    description: 'BCC of nose treated with multiple X-ray exposures over weeks. Patient disease-free >30 years — proving durability of RT cure.',
    clinicalImpact: 'Established RT as curative modality. Skin erythema used as dose surrogate. Fractionation embryonic — intuitive, not biological.',
    radiobiologyNote: 'Pre-LQ era: dose measured by skin reaction (Holzknecht chromo-meter). No understanding of OAR repair kinetics.',
    category: 'Therapeutic',
    keyRef: 'Stenbeck T. Monatsh Prakt Dermatol. 1900;31:150.'
  },
  {
    year: '1901', title: 'First Brachytherapy', discoverer: 'Danlos & Bloch (Institut Curie, Paris)',
    description: 'Radium tubes applied directly to skin lesions. By 1903–1905: interstitial Ra needles for cervix (Abbe, Wickham). Manchester System codified 1930s.',
    clinicalImpact: 'BT remains standard for cervix (FIGO IB2–IVA), endometrium, prostate. GEC-ESTRO IGABT: D90 CTV-HR ≥85 Gy EQD2₁₀.',
    radiobiologyNote: 'LDR (0.4–2 Gy/h): continuous dose delivery → SLD repair between dose increments. Differential repair: tumour (fast-cycling) repairs less than late-reacting normal tissue.',
    category: 'Brachy',
    keyRef: 'ABS Guidelines; ICRU Report 38 (1985); GEC-ESTRO Recs, Radiother Oncol 2005–2012.'
  },
  {
    year: '1913', title: 'Coolidge Hot-Cathode X-ray Tube', discoverer: 'W.D. Coolidge (GE Research)',
    description: 'Tungsten filament in high vacuum replaces gas tubes. Controllable, stable kV and mA. Enabled 200–500 kVp orthovoltage "deep therapy".',
    clinicalImpact: 'First reliable tool for treating internal tumours (chest, abdomen). But skin dose = 100% (Dmax at surface). Bone absorption 3–4× tissue.',
    radiobiologyNote: 'Photoelectric effect dominates <100 keV: Z³ dependence → high bone dose. Orthovoltage: no skin sparing, rib/vertebra necrosis common. Needs megavoltage.',
    category: 'Diagnostic',
    keyRef: 'Coolidge WD. A powerful Röntgen ray tube with a pure electron discharge. Phys Rev. 1913;2:409.'
  },
  {
    year: '1915', title: 'Radon Seed Brachytherapy', discoverer: 'H.H. Janeway (MSKCC, New York)',
    description: 'Rn-222 (T½=3.8d) encapsulated in gold seeds. Permanent implant. Continuous LDR until source exhausted (~20d).',
    clinicalImpact: 'Pioneer concept for permanent seed implant — directly inspired I-125 prostate BT (LDR permanent implant, still standard 2024 for low-risk PCa: NCCN preferred).',
    radiobiologyNote: 'Effective T½ drives dose rate decay. I-125 T½=59.4d, Eγ=27–35 keV (Auger + γ), mean range 1.7 cm. Prostate D90 prescription: 145 Gy LDR.',
    category: 'Brachy',
    keyRef: 'Janeway HH. The radium and mesothorium treatment of malignant disease. AJR. 1917;4:193.'
  },
  {
    year: '1920s', title: 'Fractionation Principles Established', discoverer: 'Coutard & Regaud (Institut Curie)',
    description: 'Regaud: ram testis model showed fractionated RT → sterilisation without skin necrosis. Coutard: protracted H&N fractionation → improved control vs single dose.',
    clinicalImpact: 'Foundation of conventional 1.8–2 Gy/fraction, 5×/week. The 4 Rs: Repair, Repopulation, Redistribution, Reoxygenation (Withers 1975). Fifth R: Radiosensitivity (Steel 1989).',
    radiobiologyNote: 'LQ model: S = e^−(αD+βD²). α/β ratio: tumour ~10 Gy (acute); prostate/breast ~1.5–3 Gy (late-behaving tumour). BED = D[1+d/(α/β)]. EQD2 = BED/(1+2/[α/β]).',
    category: 'Biology',
    keyRef: 'Coutard HL. Roentgenotherapy of epitheliomas. AJR. 1932;28:313. Withers HR. The 4 Rs of radiobiology. Adv Radiat Biol. 1975.'
  },
  {
    year: '1928', title: 'Roentgen (R) Unit Standardised', discoverer: '2nd International Congress of Radiology',
    description: 'R defined as charge of 1 esu per 0.001293 g air. Superseded by Gray (Gy = J/kg absorbed dose, SI 1975) and Sievert (Sv = effective dose).',
    clinicalImpact: 'Universal dosimetric language enabling reproducible treatments. IAEA TRS-398 (2000): gold standard for absorbed dose to water in MV beams using ionisation chamber.',
    radiobiologyNote: '1 R ≈ 0.00877 Gy in air. 1 cGy = 1 rad (old unit). IAEA TRS-398: calibration factor ND,w × kQ × M → Dw. Output constancy ±2% per AAPM TG-142.',
    category: 'Physics',
    keyRef: 'IAEA TRS-398. Absorbed Dose Determination in External Beam RT. 2nd ed. 2000. AAPM TG-142.'
  },
  {
    year: '1934', title: 'Artificial Radioactivity', discoverer: 'I. & F. Joliot-Curie (Paris)',
    description: 'Al + α → P-30 + n. P-30 → Si-30 + β+. First cyclotron-produced artificial radionuclide. Opened library of therapeutic/diagnostic isotopes.',
    clinicalImpact: 'P-32, I-131, Tc-99m, In-111, Ga-68, F-18, Lu-177, Y-90, Ra-223, Ac-225 — all derive from this discovery. Enables theranostics era.',
    radiobiologyNote: 'Lu-177 β−: Emax 0.5 MeV, mean tissue range 0.67 mm, + γ 208 keV for SPECT dosimetry. MIRD formalism: absorbed dose = S-value × cumulated activity. Ac-225 α: 4×α, 6 MeV, RBE 20.',
    category: 'Physics', nobelPrize: 'Nobel Prize Chemistry 1935',
    keyRef: 'Joliot-Curie I, Joliot-Curie F. Un nouveau type de radioactivité. CR Acad Sci. 1934;198:254.'
  },
  {
    year: '1946', title: 'Proton Therapy Proposed', discoverer: 'Robert R. Wilson (Harvard Cyclotron Lab)',
    description: 'Landmark paper proposing Bragg peak exploitation: 60–250 MeV protons deposit max dose at finite range then stop. Zero exit dose.',
    clinicalImpact: 'IMPT (pencil beam scanning): 3D dose painting with ~50% less integral dose vs IMRT. Best evidence: paeds CNS, skull base chordoma, ocular melanoma. Prostate: ASTRO 2022 — conditional recommendation.',
    radiobiologyNote: 'RBE protons = 1.1 (generic clinical value). LET increases near Bragg peak → variable RBE 1.1–1.7 at distal edge. Concern: brainstem, optic pathway in SRS. Monte Carlo engine preferred for distal-edge OAR planning.',
    category: 'Therapeutic',
    keyRef: 'Wilson RR. Radiological use of fast protons. Radiology. 1946;47:487–491.'
  },
  {
    year: '1951', title: 'First Cobalt-60 Machine', discoverer: 'Harold E. Johns (Univ. Saskatchewan)',
    description: 'Co-60 T½=5.26y. γ-rays 1.17 + 1.33 MeV (avg 1.25 MeV). First patient: 27 Aug 1951. Saskatoon, Canada.',
    clinicalImpact: 'Megavoltage: Dmax 0.5 cm (skin sparing). D10cm >75%. Curative RT for cervix, lung, bladder. Standard globally until LINACs matured ~1985. Still used: Gamma Knife, Gamma Pod (SABR), low-resource settings.',
    radiobiologyNote: 'Compton dominates at 1.25 MeV: mass attenuation coefficient tissue-independent. No differential bone absorption → eliminated rib necrosis of orthovoltage era.',
    category: 'Therapeutic',
    keyRef: 'Johns HE et al. Cobalt-60 gamma-ray therapy unit. Nature. 1951;168:502.'
  },
  {
    year: '1953', title: 'First Clinical LINAC (Hammersmith)', discoverer: 'Metropolitan-Vickers / MRC',
    description: '8 MV LINAC. Electrons accelerated by 3 GHz microwave (S-band). Bending magnet → isocentric beam. Hammersmith Hospital, London.',
    clinicalImpact: 'Modern LINAC: 6 MV (Dmax 1.5 cm), 10 MV (2.5 cm), 15–18 MV (3.3 cm). Digital imaging, EPID, CBCT, MLC now standard. >15,000 LINACs worldwide (2024).',
    radiobiologyNote: 'Higher MV: deeper Dmax, reduced penumbra, less skin dose. But 18 MV: neutron contamination (H* production in head) → avoid for superficial targets. 6 MV optimal for most indications.',
    category: 'Therapeutic',
    keyRef: 'Bewley DK. The physics of the 8 MV linear accelerator at Hammersmith. Br J Radiol. 1956.'
  },
  {
    year: '1956', title: 'Mammalian Cell Survival Curve', discoverer: 'Puck & Marcus (HeLa cells, Colorado)',
    description: 'First quantitative clonogenic survival curve for mammalian cells. Demonstrated shoulder (SLD repair). Plotted log survival vs dose.',
    clinicalImpact: 'Quantified radiosensitivity: SF2 (0.3–0.8), D10, D37. Foundation of LQ model (Chadwick & Leenhouts 1973). Now: BED/EQD2 calculation, hypofractionation design.',
    radiobiologyNote: 'LQ: S = e^−(αD+βD²). α = single-hit lethal; β = two-hit lethal (repair-saturable). α/β (Gy) = −α/β. Prostate α/β = 1.5 Gy (Brenner & Hall 1999). H&N tumour α/β = 10–15 Gy.',
    category: 'Biology',
    keyRef: 'Puck TT, Marcus PI. Action of X-rays on mammalian cells. J Exp Med. 1956;103:653.'
  },
  {
    year: '1968', title: 'First Gamma Knife Treatment', discoverer: 'Lars Leksell (Karolinska, Stockholm)',
    description: '179 (→ 201 → 192 in Perfexion) Co-60 sources focused to single isocenter in stereotactic frame. Sub-mm precision.',
    clinicalImpact: 'Non-invasive ablation: AVM, acoustic neuroma (VS), meningioma, brain mets (1–4, up to 10), trigeminal neuralgia (TN: 80–90 Gy). No general anaesthesia. >1M treatments globally.',
    radiobiologyNote: 'SRS: single fraction 12–20 Gy. BED = D(1+d/α/β). AVM: BED ≫100 Gy. Mechanism differs from fractionated RT: vascular endothelial apoptosis (ceramide pathway), not mitotic death. V12Gy <10 cm³ for brain (QUANTEC 2010).',
    category: 'Therapeutic',
    keyRef: 'Leksell L. Stereotaxis and radiosurgery. 1971. QUANTEC: Marks LB et al. IJROBP. 2010;76(3 Suppl).'
  },
  {
    year: '1970s', title: '3D-CRT via CT-Based Planning', discoverer: 'Hounsfield/Cormack (CT 1971) + TPS Developers',
    description: 'CT HU values → electron density maps for dose calculation. DVH introduced. GTV→CTV→PTV concept (ICRU-50, 1993; ICRU-62, 1999; ICRU-83, 2010 for IMRT).',
    clinicalImpact: '3D conformal fields reduce small bowel, bladder, rectal dose. Curative pelvic RT redesigned. Normal tissue complication probability (NTCP) modelling enabled.',
    radiobiologyNote: 'NTCP: Lyman-Kutcher-Burman model. DVH compression to single parameter (Vx or Dx). Parallel OAR (lung/liver): volume effect dominant. Serial OAR (cord/bowel): max point dose critical. QUANTEC 2010 defines evidence-based constraints.',
    category: 'Physics',
    keyRef: 'ICRU Report 50 (1993); ICRU Report 62 (1999). QUANTEC, IJROBP. 2010;76(3 Suppl):S1–S160.'
  },
  {
    year: '1980s', title: 'HDR Brachytherapy (Remote Afterloading)', discoverer: 'Nucletron / GammaMed (Ir-192)',
    description: 'Ir-192 source activity ≥370 GBq (10 Ci). Step-and-shoot remote afterloading. Dose rate >12 Gy/h (HDR ICRU definition). Staff dose → zero.',
    clinicalImpact: 'Outpatient treatment. Optimised dwell-time distributions. Standard for cervix (tandem+ring or ovoid), endometrium, lung, breast (APBI), prostate. EMBRACE-II: online MRI-guided IGABT.',
    radiobiologyNote: 'HDR: no repair between increments. Isoeffective LDR/HDR: BED_HDR = n·d·(1+d/[α/β]). Cervix α/β tumour = 10 Gy. Example: 7 Gy × 4fr HDR → BED₁₀ = 47.6 Gy (vs LDR 40 Gy → BED₁₀ ≈ 53 Gy with repair).',
    category: 'Brachy',
    keyRef: 'Pötter R et al. EMBRACE. Radiother Oncol. 2021. GEC-ESTRO Recs (2005–2016 series).'
  },
  {
    year: '1991', title: 'First Hospital-Based Proton Center', discoverer: 'Loma Linda University Medical Center',
    description: 'First proton facility integrated within a hospital. Synchrotron-based. Preceded by Berkeley (1954) and Harvard (1961) physics-lab treatments.',
    clinicalImpact: 'Normalised proton therapy. ~110 centres worldwide (2024). Paediatric CNS: reduce neurocognitive late effects. Skull base chordoma: 5y LC 70–80% with 74 CGE (proton preferred over photon).',
    radiobiologyNote: 'CGE (cobalt gray equivalent) = proton dose × RBE(1.1). IMPT pencil beam scanning: Bragg peak per pencil → 3D dose sculpting. Variable RBE at distal edge raises concern for brainstem: use distal-edge margin 3–5 mm.',
    category: 'Therapeutic',
    keyRef: 'Suit H et al. Should positive phase III clinical trial data be required before proton therapy is more widely adopted? Radiother Oncol. 2010;95:3.'
  },
  {
    year: '1992', title: 'IMRT: Intensity Modulated Radiotherapy', discoverer: 'Nomos Peacock (1992) + Carol / Bortfeld (inverse planning)',
    description: 'Non-uniform beam fluence via dynamic MLC (DMLC) or segmental MLC. Inverse planning: optimise fluence from dose-volume objectives. Step-and-shoot or sliding-window.',
    clinicalImpact: 'Concave dose distributions. H&N: parotid sparing (PARSPORT 2011: grade ≥2 xerostomia 38% vs 74%, p<0.001). Prostate: rectal V70 <25%. Cervix: bowel bag V45 <195 cc. IMRT now global standard.',
    radiobiologyNote: 'IMRT SIB (simultaneous integrated boost): variable d/fraction across PTV → LQ correction per voxel: EQD2_voxel = d×(α/β+d)/(α/β+2). Integral dose increase (low-dose bath): theoretical secondary cancer concern over 20y.',
    category: 'Therapeutic',
    keyRef: 'Nutting CM et al. PARSPORT. Lancet Oncol. 2011;12:127. Bortfeld T. IMRT: a review and preview. Phys Med Biol. 2006;51:R363.'
  },
  {
    year: '2001', title: 'CyberKnife FDA Approval', discoverer: 'John R. Adler (Stanford) / Accuray',
    description: '6 MV LINAC on KUKA robotic arm (6 degrees of freedom). 1200 non-coplanar nodes. X-sight spine/lung/fiducial real-time tracking. Synchrony™: respiratory motion ± 0.5 mm.',
    clinicalImpact: 'Frameless SRS/SBRT. Spine SBRT: 16–24 Gy/1–3fr (ASTRO 2022). Lung SBRT: 54 Gy/3fr (RTOG 0236). Pancreas: 25–33 Gy/5fr. Prostate: 36.25 Gy/5fr (HYPO-RT-PC, PACE-B).',
    radiobiologyNote: 'SBRT BED >100 Gy₁₀: vascular endothelial apoptosis + immune activation (abscopal effect via cGAS-STING pathway). BED lung 54/3fr: 54×(1+18/10) = 151.2 Gy₁₀. EQD2 = 75.6 Gy₂ — ablative equivalent.',
    category: 'Therapeutic',
    keyRef: 'Timmerman R et al. RTOG 0236. JAMA. 2010;303:1070. Adler JR et al. Neurosurgery. 1997;41:1299.'
  },
  {
    year: '2008', title: 'VMAT & Advanced IGRT', discoverer: 'Karl Otto (VMAT); OBI/XVI manufacturers',
    description: 'VMAT: continuous gantry rotation + dynamic MLC + variable dose rate. Otto 2008. Onboard kV CBCT for daily 3D setup verification.',
    clinicalImpact: 'VMAT: treatment time 2 min vs 15 min (IMRT). CBCT-guided IGRT: PTV margin reduction 5→3 mm. SBRT/SABR: oligometastasis standard (SABR-COMET 2019: OS 41% vs 28%, HR 0.57).',
    radiobiologyNote: 'Hypofractionation: CHHiP (2016) 60 Gy/20fr = 74 Gy/37fr for prostate (α/β 1.5). FAST-Forward (2020): 26 Gy/5fr non-inferior for breast (α/β ~4 Gy). BED comparison mandatory when changing fractionation.',
    category: 'Therapeutic',
    keyRef: 'Otto K. VMAT. Med Phys. 2008;35:310. Palma DA. SABR-COMET. Lancet. 2019;393:2051.'
  },
  {
    year: '2014', title: 'FLASH Radiotherapy', discoverer: 'Favaudon et al. (Institut Gustave Roussy)',
    description: 'Ultra-high dose rate (UHDR) >40 Gy/s. Electron FLASH in cat paw/mini-pig lung: iso-effective tumour kill with markedly reduced normal tissue toxicity.',
    clinicalImpact: 'First human case: skin FLASH electrons 2020 (TRID01, EPFL/CHUV). Proton FLASH clinical trials: FAST-01 (osteolytic mets). X-ray FLASH under development (IntraOp/Varian). Potential: compress 30fr→1–3fr FLASH.',
    radiobiologyNote: 'Mechanism debated: (1) Transient O₂ depletion (10–100 μs) → hypoxic normal tissue protection. (2) Immune modulation. (3) DNA repair kinetics change. FLASH requires >40 Gy/s; not reproducible <10 Gy/s. Standard ionisation chambers saturate: requires Faraday cups, scintillators.',
    category: 'Biology',
    keyRef: 'Favaudon V et al. Ultrahigh dose-rate FLASH irradiation. Sci Transl Med. 2014;6:245ra93.'
  },
  {
    year: '2015', title: 'MR-Guided Radiotherapy (MRgRT)', discoverer: 'ViewRay MRIdian (0.35T) / Elekta Unity (1.5T)',
    description: 'MRI integrated with LINAC. Real-time soft-tissue visualisation during beam-on. Online daily adaptive RT (ART) workflow: recontouring + reoptimisation in <15–30 min.',
    clinicalImpact: 'Pancreas SBRT (SMART): 50 Gy/5fr — LC 90% at 1y (Henke 2021). Bladder/cervix daily ART. PTV margin reduction 5→3 mm. Prostate: focal boost to DIL. Reduces grade ≥3 GI toxicity.',
    radiobiologyNote: 'MRI-based contouring superior for soft-tissue GTV (no CT-MRI registration error). B-field effect: secondary electrons curve → dose perturbation at tissue-air interfaces. B-field correction in MCS/GPU dose engines. Daily deformable registration for dose accumulation.',
    category: 'Therapeutic',
    keyRef: 'Henke L et al. SMART trial. Lancet Oncol. 2021;22:1313. Intven MPW et al. Unity bladder. Lancet Oncol. 2021;22:660.'
  },
  {
    year: '2021', title: 'AI-Adaptive Therapy & Theranostics (Lu-177)', discoverer: 'Varian Ethos; Sartor/VISION NEJM',
    description: 'Ethos AI: auto-segmentation + reoptimisation in <10 min. VISION trial: Lu-177-PSMA-617 + SOC vs SOC in PSMA+ mCRPC (n=831).',
    clinicalImpact: 'VISION: rPFS 8.7 vs 3.4 mo (HR 0.40, p<0.001); OS 15.3 vs 11.3 mo (HR 0.62, p<0.001). Lu-177 FDA approved 2022 (Pluvicto). Ethos: H&N adaptive in 30 min; reduces parotid dose ~3–5 Gy vs non-adaptive.',
    radiobiologyNote: 'Lu-177 β−: Emax 0.497 MeV, mean range 0.67 mm. Cross-fire effect treats adjacent PSMA− cells. SPECT-based dosimetry: MIRD formalism. Absorbed dose kidney <40 Gy per cycle. Synergy with PARP inhibitors (olaparib): PSMA DSB + repair inhibition.',
    category: 'Therapeutic',
    keyRef: 'Sartor O et al. VISION. NEJM. 2021;385:2137. Ethos clinical performance: Christiansen RL et al. Radiother Oncol. 2022.'
  }
];

const ERA_CAPABILITIES = [
  { era: '1900s', precision: 5, depth: 5, toxicity: 95 },
  { era: '1930s', precision: 15, depth: 30, toxicity: 80 },
  { era: '1960s', precision: 45, depth: 75, toxicity: 45 },
  { era: '1980s', precision: 65, depth: 90, toxicity: 30 },
  { era: '2000s', precision: 85, depth: 97, toxicity: 15 },
  { era: '2020s', precision: 97, depth: 99, toxicity: 5 }
];

const QUIZ: QuizQuestion[] = [
  {
    question: 'BED for prostate SBRT 36.25 Gy/5fr using α/β = 1.5 Gy is:',
    options: ['108.4 Gy₁.₅', '211.5 Gy₁.₅', '62.5 Gy₁₀', '157.1 Gy₁.₅'],
    correctIndex: 1,
    explanation: 'BED = D×[1+d/(α/β)] = 36.25×[1+7.25/1.5] = 36.25×5.833 = 211.5 Gy₁.₅. EQD2₁.₅ = 211.5/(1+2/1.5) = 211.5/2.33 = 90.8 Gy — far exceeds conventional 78 Gy. This exploits prostate\'s low α/β ratio (Brenner & Hall 1999).',
    difficulty: 'Advanced', topic: 'LQ Model / BED'
  },
  {
    question: 'CHHiP trial (Lancet Oncol 2016) established which hypofractionation schedule as non-inferior for prostate cancer?',
    options: ['60 Gy/20fr', '52.5 Gy/20fr', '66 Gy/22fr', '57 Gy/19fr'],
    correctIndex: 0,
    explanation: 'CHHiP: 60 Gy/20fr (3 Gy/fr, 4 weeks) non-inferior to 74 Gy/37fr for biochemical PFS (HR 0.84, 90% CI 0.68–1.03). 57 Gy/19fr also non-inferior. Both exploit prostate α/β ~1.5 Gy. Now NCCN/ASTRO preferred fractionation.',
    difficulty: 'Intermediate', topic: 'Clinical Trials / Prostate'
  },
  {
    question: 'QUANTEC 2010 brain constraint to keep symptomatic radionecrosis <5% in SRS:',
    options: ['V12Gy <5 cm³', 'V12Gy <10 cm³', 'V20Gy <5 cm³', 'Dmax <15 Gy'],
    correctIndex: 1,
    explanation: 'QUANTEC (Marks et al. IJROBP 2010;76 Suppl): V12Gy <10 cm³ → <5% symptomatic radionecrosis risk. Risk increases significantly for >3 lesions or combined SRS+WBRT. For multiple brain mets, HA-WBRT (NRG CC001) or SRS alone preferred to preserve neurocognition.',
    difficulty: 'Advanced', topic: 'QUANTEC / Dose Constraints'
  },
  {
    question: 'PARSPORT trial (Nutting 2011) demonstrated IMRT advantage in H&N cancer via:',
    options: ['Improved 5y OS', 'Reduced grade ≥2 xerostomia (38% vs 74%)', 'Reduced mucositis grade ≥3', 'Faster PTV coverage'],
    correctIndex: 1,
    explanation: 'PARSPORT: contralateral parotid-sparing IMRT vs 3D-CRT. Grade ≥2 xerostomia at 12mo: 38% vs 74% (p<0.0001). Mean contralateral parotid dose <26 Gy = key constraint. No significant OS difference. Xerostomia = primary QoL endpoint in H&N RT.',
    difficulty: 'Intermediate', topic: 'Clinical Trials / H&N'
  },
  {
    question: 'The Bragg peak in proton therapy enables dose advantage because:',
    options: ['Compton scatter increases at depth', 'Protons deposit maximum LET at finite range then stop (zero exit dose)', 'Protons have RBE 5× photons throughout track', 'Pair production dominates at 250 MeV'],
    correctIndex: 1,
    explanation: 'Bragg peak: protons slow by ionisation energy loss (Bethe-Bloch formula). LET ∝ 1/v² → maximum energy deposition at end of range then near-zero exit dose. Wilson proposed this in 1946. Enables sparing of OARs distal to target — impossible with photons. RBE clinically = 1.1 (generic), higher near Bragg peak.',
    difficulty: 'Basic', topic: 'Radiation Physics / Protons'
  },
  {
    question: 'In IGABT (MRI-guided BT) for cervical cancer, the GEC-ESTRO/EMBRACE target parameter is:',
    options: ['Point A dose ≥85 Gy EQD2', 'D90 CTV-HR ≥85 Gy EQD2₁₀ + EBRT', 'D90 CTV-HR ≥70 Gy EQD2₁₀', 'V100% >90% of CTV-IR'],
    correctIndex: 1,
    explanation: 'EMBRACE data: D90 CTV-HR ≥85 Gy EQD2₁₀ (tumour α/β=10) combining EBRT (45–50.4 Gy) + BT → local control >90% for ≤4 cm tumours. Late toxicity constraints: D2cc rectum/sigmoid <75 Gy EQD2₃; bladder <90 Gy EQD2₃. EBRT contribution: 40–50 Gy = 40–50 Gy EQD2.',
    difficulty: 'Advanced', topic: 'Brachytherapy / Cervix'
  },
  {
    question: 'FLASH radiotherapy threshold dose rate is >40 Gy/s. The leading mechanistic hypothesis is:',
    options: ['Accelerated DSB repair at high dose rate', 'Transient oxygen depletion protecting normal tissue', 'Ceramide apoptotic pathway activation', 'Selective G2/M arrest in tumour cells'],
    correctIndex: 1,
    explanation: 'Leading hypothesis (Spitz et al.): ultra-fast irradiation transiently depletes O₂ in well-perfused normal tissue (μs timescale) → reduced O₂ fixation of radiation-induced radicals → less DNA damage in normal tissue. Tumour remains comparably damaged (hypoxic microenvironment baseline). O₂ depletion confirmed by EPR. Challenge: dosimetry — standard ion chambers saturate, require Faraday cups/plastic scintillators.',
    difficulty: 'Advanced', topic: 'FLASH / Radiobiology'
  },
  {
    question: 'VISION trial (Sartor 2021, NEJM): Lu-177-PSMA-617 in mCRPC showed OS improvement of:',
    options: ['2.1 months (15.3 vs 13.2)', '4.0 months (15.3 vs 11.3)', '6.5 months (18 vs 11.5)', '1.9 months (13.2 vs 11.3)'],
    correctIndex: 1,
    explanation: 'VISION (n=831, PSMA+ mCRPC, post-ARSI + taxane): OS 15.3 vs 11.3 mo (HR 0.62, 95% CI 0.52–0.74, p<0.001). rPFS 8.7 vs 3.4 mo (HR 0.40). Lu-177 FDA approved March 2022 (Pluvicto). Lu-177 β− mean range 0.67 mm + γ 208 keV for dosimetry SPECT.',
    difficulty: 'Intermediate', topic: 'Theranostics / VISION'
  },
  {
    question: 'Conventional fractionation (2 Gy/fr) is derived from which radiobiological principle?',
    options: ['Maximum tumour BED in 6 weeks', 'Differential α/β between acute-reacting tumour and late-reacting OAR', 'Repopulation completing between fractions', 'Redistribution to radiosensitive G2/M phase only'],
    correctIndex: 1,
    explanation: 'Regaud/Coutard empirically showed fractionated doses spare late-reacting tissues more than tumour. Mechanistically: late-reacting OARs (α/β ~3 Gy) spare more per fraction than tumour (α/β ~10 Gy). 2 Gy/fr sits in the "therapeutic window" of this differential. Withers 1975 formalised as 4 Rs (Repair, Repopulation, Redistribution, Reoxygenation).',
    difficulty: 'Intermediate', topic: 'Radiobiology Fundamentals'
  },
  {
    question: 'SABR-COMET (Palma 2019, Lancet) demonstrated SBRT benefit in oligometastatic disease with:',
    options: ['OS: 41% vs 28% at 5y (HR 0.57)', 'PFS only benefit, no OS signal', 'OS: 60% vs 40% at 3y', 'Benefit only in lung oligomets'],
    correctIndex: 0,
    explanation: 'SABR-COMET (n=99): SBRT to all sites (≤5 mets) + SOC vs SOC alone. 5y OS: 42.3% vs 17.7% (HR 0.57, p=0.006). Grade ≥2 toxicity 29% vs 9% (p=0.03). Spawned multiple disease-specific trials: SABR-COMET-3, SABR-COMET-10, ORIOLE, STOMP. ASTRO 2023: conditional recommendation for oligometastatic SBRT.',
    difficulty: 'Intermediate', topic: 'SBRT / Oligometastasis'
  }
];

const CAT_STYLE: Record<string, { border: string; text: string; bg: string; dot: string }> = {
  Therapeutic: { border: 'border-blue-800/40', text: 'text-blue-400', bg: 'bg-blue-950/30', dot: 'bg-blue-500' },
  Diagnostic:  { border: 'border-amber-800/40', text: 'text-amber-400', bg: 'bg-amber-950/30', dot: 'bg-amber-500' },
  Brachy:      { border: 'border-emerald-800/40', text: 'text-emerald-400', bg: 'bg-emerald-950/30', dot: 'bg-emerald-500' },
  Physics:     { border: 'border-purple-800/40', text: 'text-purple-400', bg: 'bg-purple-950/30', dot: 'bg-purple-500' },
  Biology:     { border: 'border-rose-800/40', text: 'text-rose-400', bg: 'bg-rose-950/30', dot: 'bg-rose-500' }
};

const QUICK_REF_DATA = {
  eras: [
    { label: 'Foundation', value: '1895 - 1920s' },
    { label: 'Megavoltage', value: '1930s - 1960s' },
    { label: '3D / CT', value: '1970s - 1990s' },
    { label: 'IMRT / SBRT', value: '2000s - 2010s' },
    { label: 'AI / Adaptive', value: '2015 - Present' }
  ],
  milestones: [
    { label: 'Röntgen', value: 'X-ray discovery (1895)' },
    { label: 'Becquerel', value: 'Radioactivity (1896)' },
    { label: 'Curies', value: 'Radium (1898)' }
  ],
  constants: [
    { label: '1 R', value: '≈ 0.00877 Gy' },
    { label: '1 Ci', value: '3.7 × 10¹⁰ Bq' },
    { label: '1 rad', value: '1 cGy' }
  ]
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const RadiationHistoryPage: React.FC = () => {
  const [tab, setTab] = useState<'timeline' | 'eras' | 'quiz'>('timeline');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [expandedEras, setExpandedEras] = useState<string[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFB, setShowFB] = useState(false);
  const [finished, setFinished] = useState(false);
  const [diffFilter, setDiffFilter] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as any[]).map((item: any) => ({ k: item.label, v: item.value }))
  }));


  const filteredQuiz = useMemo(() =>
    diffFilter === 'All' ? QUIZ : QUIZ.filter(q => q.difficulty === diffFilter), [diffFilter]);
  const currentQ = filteredQuiz[qIdx] ?? QUIZ[0];

  const filtered = useMemo(() => EVENTS.filter(e => {
    const s = search.toLowerCase();
    return (!search || e.title.toLowerCase().includes(s) || e.year.includes(s) || e.discoverer.toLowerCase().includes(s))
      && (catFilter === 'All' || e.category === catFilter);
  }), [search, catFilter]);

  const handleAnswer = (i: number) => {
    if (showFB) return;
    setSelected(i); setShowFB(true);
    if (i === currentQ.correctIndex) setScore(s => s + 1);
  };
  const nextQ = () => {
    setShowFB(false); setSelected(null);
    if (qIdx < filteredQuiz.length - 1) setQIdx(qIdx + 1); else setFinished(true);
  };
  const resetQuiz = () => { setQIdx(0); setScore(0); setSelected(null); setShowFB(false); setFinished(false); };
  const pct = filteredQuiz.length > 0 ? Math.round((score / filteredQuiz.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      
      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-900/60 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-white leading-tight">History of Radiation Oncology</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">1895→2024 · {EVENTS.length} milestones · {QUIZ.length} MCQs · Guideline-referenced</p>
          </div>
        </div>
        <div className="flex gap-1">
          {(['timeline','eras','quiz'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all ${
                tab === t ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
              {t === 'timeline' ? 'Timeline' : t === 'eras' ? 'Eras' : `Quiz·${QUIZ.length}`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3 space-y-2">

        {/* ══════ TIMELINE ══════ */}
        {tab === 'timeline' && (
          <>
            <div className="relative">
              <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search year, discoverer, modality…"
                className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-blue-700"/>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {['All','Therapeutic','Physics','Biology','Brachy','Diagnostic'].map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
                    catFilter === c ? 'bg-blue-700 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Count pills */}
            <div className="flex gap-1">
              {(['Therapeutic','Physics','Biology','Brachy','Diagnostic'] as const).map(cat => {
                const st = CAT_STYLE[cat];
                return (
                  <div key={cat} className={`flex-1 ${st.bg} border ${st.border} rounded-lg p-2 text-center`}>
                    <div className={`text-sm font-black ${st.text}`}>{EVENTS.filter(e=>e.category===cat).length}</div>
                    <div className="text-[10px] text-gray-600 leading-tight">{cat.slice(0,5)}</div>
                  </div>
                );
              })}
            </div>

            {/* Timeline list */}
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-800"></div>
              {filtered.length === 0 && <p className="text-center text-gray-600 text-sm py-8">No results</p>}
              {filtered.map((ev, idx) => {
                const st = CAT_STYLE[ev.category];
                const open = expandedIdx === idx;
                return (
                  <div key={idx} className="relative mb-2">
                    <div className={`absolute -left-[10px] top-3.5 w-2 h-2 rounded-full ${st.dot} border border-gray-950`}></div>
                    <button onClick={() => setExpandedIdx(open ? null : idx)}
                      className={`w-full text-left bg-gray-800/60 border ${open ? st.border : 'border-gray-700/40'} rounded-xl overflow-hidden transition-all`}>
                      <div className="flex items-start gap-2 p-2.5">
                        <span className="text-xs font-black text-gray-500 w-9 flex-shrink-0 pt-0.5">{ev.year}</span>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{ev.category}</span>
                            {ev.nobelPrize && <span className="text-xs">🏆</span>}
                          </div>
                          <h3 className="text-sm font-bold text-white leading-snug">{ev.title}</h3>
                          <p className="text-xs text-gray-500">{ev.discoverer}</p>
                        </div>
                        <svg className={`w-3 h-3 text-gray-600 flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>

                      {open && (
                        <div className="border-t border-gray-700/40 px-2.5 pb-3 pt-2 space-y-2">
                          <div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Description</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{ev.description}</p>
                          </div>
                          <div className={`${CAT_STYLE.Therapeutic.bg} border border-blue-900/30 rounded-lg p-2`}>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">⚡ Clinical Impact</p>
                            <p className="text-sm text-blue-200 leading-relaxed">{ev.clinicalImpact}</p>
                          </div>
                          <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg p-2">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">🔬 Radiobiology / Physics</p>
                            <p className="text-sm text-rose-200 leading-relaxed">{ev.radiobiologyNote}</p>
                          </div>
                          {ev.nobelPrize && (
                            <div className="bg-yellow-950/20 border border-yellow-800/20 rounded-lg p-2 flex gap-2 items-start">
                              <span className="text-base">🏆</span>
                              <p className="text-sm text-yellow-300 font-semibold leading-snug">{ev.nobelPrize}</p>
                            </div>
                          )}
                          {ev.keyRef && (
                            <p className="text-xs text-gray-600 italic leading-relaxed border-t border-gray-700/30 pt-2">{ev.keyRef}</p>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════ ERAS ══════ */}
        {tab === 'eras' && (
          <div className="space-y-2">
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Era-Based Capability Index (%)</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ERA_CAPABILITIES} margin={{ top:4, right:8, left:-25, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                    <XAxis dataKey="era" stroke="#374151" fontSize={10} axisLine={false} tickLine={false}/>
                    <YAxis stroke="#374151" fontSize={10} axisLine={false} tickLine={false}/>
                    <RechartsTooltip contentStyle={{ background:'#111827', border:'1px solid #374151', borderRadius:8, fontSize:12 }} labelStyle={{ color:'#9ca3af' }}/>
                    <Legend wrapperStyle={{ fontSize:10, color:'#6b7280', paddingTop:4 }}/>
                    <Line type="monotone" dataKey="precision" stroke="#3b82f6" strokeWidth={2} dot={{ r:2 }} name="Spatial Precision"/>
                    <Line type="monotone" dataKey="depth" stroke="#10b981" strokeWidth={2} dot={{ r:2 }} name="Depth Penetration"/>
                    <Line type="monotone" dataKey="toxicity" stroke="#ef4444" strokeWidth={2} dot={{ r:2 }} name="Collateral Toxicity"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-700 text-center italic mt-1">Conceptual index. Toxicity = inversely desirable (lower is better).</p>
            </div>

            {[
              { era:'1895–1920s', title:'Foundation Era', col:'border-amber-800/30 bg-amber-950/10',
                physics:'Orthovoltage ≤500 kVp. Photoelectric effect dominates <100 keV. Skin Dmax=100%. Bone absorption 3–4× tissue.',
                biology:'No radiobiology theory. Skin erythema dose as endpoint. Fractionation empirical (Regaud 1922, Coutard 1920s).',
                tech:'Gas tube → Coolidge tube (1913). Ra-226 needles. Roentgen unit (1928). No personal dosimetry.',
                trials:'Stenbeck BCC cure (1899). Coutard H&N fractionation (1934). Manchester Ra system (1934).',
                limits:'Severe skin necrosis, bone radionecrosis, no depth dose, uncontrolled staff exposure.' },
              { era:'1930s–1960s', title:'Megavoltage Birth', col:'border-purple-800/30 bg-purple-950/10',
                physics:'Co-60 1.25 MeV: Compton dominant, tissue-independent attenuation. Dmax=0.5 cm (skin sparing). No bone differential.',
                biology:'4 Rs formalised (Withers 1975). LQ model (Chadwick 1973). α/β concept derived. HeLa survival curve (Puck 1956).',
                tech:'Co-60 teletherapy Johns 1951. First LINAC Hammersmith 1953. Betatron. Radon → I-125 seeds.',
                trials:'Early Co-60 vs orthovoltage. ICRU definitions emerging. First SRS (Leksell 1968).',
                limits:'2D planning only. No volumetric imaging. Fixed field geometries. Large setup uncertainty.' },
              { era:'1970s–1990s', title:'CT & Volumetric Revolution', col:'border-blue-800/30 bg-blue-950/10',
                physics:'CT HU → electron density. Pencil beam/convolution algorithms. MLC development (1980s). Dose-volume histograms.',
                biology:'NTCP/TCP modelling (Lyman-Kutcher-Burman). DVH → Vx/Dx parameters. QUANTEC precursor data.',
                tech:'CT simulator. 3D-CRT. HDR remote afterloading (Nucletron Ir-192). First proton hospital LLUMC 1991.',
                trials:'ICRU-50 (1993): GTV/CTV/PTV. Early RTOG prostate/lung trials. LDR BT cervix standardisation.',
                limits:'No IGRT. Large margins (1–2 cm PTV). Organ motion unaccounted. IMRT not yet available.' },
              { era:'2000s–2010s', title:'IMRT/IGRT/SBRT Era', col:'border-emerald-800/30 bg-emerald-950/10',
                physics:'DMLC/VMAT. CBCT onboard kV imaging. 4DCT motion management. TomoTherapy helical delivery.',
                biology:'SBRT BED >100 Gy₁₀: endothelial apoptosis, immunomodulation (cGAS-STING). Oligometastasis hypothesis. Hypofractionation α/β exploitation.',
                tech:'OBI/XVI CBCT. CyberKnife 2001. Tomo 2003. VMAT (Otto 2008). Elekta Unity 1.5T MRgRT 2018.',
                trials:'PARSPORT 2011. RTOG 0236 SBRT. CHHiP 2016. FAST-Forward 2020. SABR-COMET 2019.',
                limits:'CBCT: limited soft-tissue contrast. No real-time plan adaptation. High integral dose (IMRT). SBRT: early dosimetry challenges.' },
              { era:'2015–Present', title:'AI-Adaptive & Theranostics', col:'border-rose-800/30 bg-rose-950/10',
                physics:'MR-LINAC: B-field secondary electron correction. Monte Carlo dose engines. AI auto-segmentation (nnU-Net). Daily deformable registration.',
                biology:'FLASH (>40 Gy/s): O₂ depletion hypothesis. Variable proton RBE at Bragg peak (1.1–1.7). Lu-177/Ac-225 dosimetry (MIRD). DNA damage + PARP synergy.',
                tech:'Ethos AI adaptive. ViewRay MRIdian. Varian Halcyon/Ethos. Lu-177-PSMA (Pluvicto). Carbon ion (HIMAC/CNAO/HIT). Ac-225 emerging.',
                trials:'VISION 2021 (Lu-177). SMART pancreas 2021. NRG CC001 HA-WBRT. FAST-01 FLASH proton. EMBRACE-II MRgBT.',
                limits:'FLASH: dosimetry unsolved, delivery systems immature. Proton RBE uncertainty. AI contouring QA. Cost and access barriers.' }
            ].map((era, i) => (
              <div key={i} className={`border ${era.col} rounded-xl overflow-hidden`}>
                <button onClick={() => setExpandedEras(p => p.includes(era.era) ? p.filter(x=>x!==era.era) : [...p, era.era])}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-all">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">{era.era}</p>
                    <h4 className="text-sm font-bold text-white">{era.title}</h4>
                  </div>
                  <svg className={`w-3 h-3 text-gray-600 transition-transform ${expandedEras.includes(era.era) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {expandedEras.includes(era.era) && (
                  <div className="border-t border-gray-700/20 p-3 space-y-2">
                    {[['⚛️ Physics', era.physics],['🔬 Biology/Dosimetry', era.biology],['🛠️ Technology', era.tech],['📋 Key Trials/Guidelines', era.trials],['⚠️ Limitations', era.limits]].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════ QUIZ ══════ */}
        {tab === 'quiz' && (
          <div className="space-y-2">
            {!finished && (
              <div className="flex gap-1">
                {['All','Basic','Intermediate','Advanced'].map(d => (
                  <button key={d} onClick={() => { setDiffFilter(d); resetQuiz(); }}
                    className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all ${
                      diffFilter === d
                        ? d==='Advanced' ? 'bg-red-900 border-red-700 text-white'
                          : d==='Intermediate' ? 'bg-yellow-900 border-yellow-700 text-white'
                          : d==='Basic' ? 'bg-green-900 border-green-700 text-white'
                          : 'bg-blue-900 border-blue-700 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}

            {!finished ? (
              <div className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      currentQ.difficulty==='Advanced' ? 'bg-red-900/60 text-red-400'
                      : currentQ.difficulty==='Intermediate' ? 'bg-yellow-900/60 text-yellow-400'
                      : 'bg-green-900/60 text-green-400'}`}>{currentQ.difficulty}</span>
                    <span className="text-[10px] text-gray-600">{currentQ.topic}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-bold">{qIdx+1}/{filteredQuiz.length} · ✓{score}</span>
                </div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full mb-3">
                  <div className="h-0.5 bg-blue-600 rounded-full" style={{ width: `${(qIdx/filteredQuiz.length)*100}%` }}></div>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug mb-3">{currentQ.question}</h3>
                <div className="space-y-1.5">
                  {currentQ.options.map((opt, i) => (
                    <button key={i} disabled={showFB} onClick={() => handleAnswer(i)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        showFB
                          ? i===currentQ.correctIndex ? 'bg-green-900/40 border-green-700 text-green-300'
                            : i===selected ? 'bg-red-900/40 border-red-700 text-red-300'
                            : 'bg-gray-700/30 border-gray-700 text-gray-600'
                          : 'bg-gray-700/40 border-gray-600/60 text-gray-200 hover:border-blue-700 hover:bg-gray-700 active:scale-[0.99]'}`}>
                      <span className="font-black text-gray-600 mr-2">{String.fromCharCode(65+i)}.</span>{opt}
                    </button>
                  ))}
                </div>
                {showFB && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">
                        {selected===currentQ.correctIndex ? '✅ Correct' : '❌ Incorrect'} — Expert Explanation
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">{currentQ.explanation}</p>
                    </div>
                    <button onClick={nextQ} className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-all">
                      {qIdx===filteredQuiz.length-1 ? 'Finish Quiz →' : 'Next →'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{pct>=80?'🎓':pct>=60?'📚':'🔄'}</div>
                <h2 className="text-base font-black text-white">{score}/{filteredQuiz.length} · {pct}%</h2>
                <div className="w-full h-2 bg-gray-700 rounded-full my-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${pct>=80?'bg-green-500':pct>=60?'bg-yellow-500':'bg-red-500'}`} style={{ width:`${pct}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mb-4">{pct>=80?'Excellent — Senior Resident / Fellow Level':pct>=60?'Good — Junior Resident Level':'Review: ICRU/QUANTEC/GEC-ESTRO guidelines recommended'}</p>
                <div className="flex gap-2">
                  <button onClick={resetQuiz} className="flex-1 py-2 bg-blue-700 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition">Retry</button>
                  <button onClick={() => { resetQuiz(); setTab('timeline'); }} className="flex-1 py-2 bg-gray-700 text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-600 transition">Timeline</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-3 pb-2 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Rad-Calc Pro · RNT Medical College · Dr. Narendra Rathore</p>
          <p className="text-[10px] text-gray-700 mt-0.5">ICRU 50/62/83 · QUANTEC 2010 · GEC-ESTRO · ASTRO · NCCN</p>
        </div>
      </div>
    </div>
  );
};

export default RadiationHistoryPage;