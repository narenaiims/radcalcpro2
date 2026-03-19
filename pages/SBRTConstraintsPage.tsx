/**
 * SBRTConstraintsPage.tsx — PRO LEVEL v4
 * Comprehensive SBRT/SRS OAR constraints reference for radiation oncology trainees
 *
 * Sources: AAPM TG-101, RTOG 0236/0813/0915/0631/0938, UK Consensus (UKRO),
 *          HyTEC (Grimm 2021), TROG 09.02, PACE-B, NRG-BR001, ASTRO SBRT Guidelines
 *
 * Fractions covered: 1, 3, 5 fx (with BED/EQD2 display)
 * Sites: Lung, Spine/SBRT, Liver, Prostate, Adrenal/Oligomets, SRS (Brain)
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import {
  Target, Shield, Zap, BookOpen, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, Info, BarChart2, Activity,
  GraduationCap, ChevronUp, Eye
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────

type FxCount = 1 | 3 | 5 | 6 | 8 | 10;
type Priority = 'Absolute' | 'Hard' | 'Soft';
type EvidenceLevel = '1A' | '1B' | '2A' | '2B' | '3' | 'Expert';

interface SBRTConstraint {
  organ: string;
  type: 'Serial' | 'Parallel' | 'Mixed';
  metric: string;
  metricType: 'Dmax' | 'Dncc' | 'Vxx' | 'Dmean';
  limit_1fx?: number;
  limit_3fx?: number;
  limit_5fx?: number;
  limit_6fx?: number;
  limit_8fx?: number;
  limit_10fx?: number;
  unit: 'Gy' | 'cc' | '%';
  priority: Priority;
  evidence: EvidenceLevel;
  endpoint: string;
  grade: 'G2' | 'G3' | 'G4' | 'G5';
  source: string[];
  notes?: string;
  chemoMod?: string;
  ab: number; // α/β ratio
}

interface SBRTSite {
  id: string;
  name: string;
  shortName: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
  accentColor: string; // hex for inline use
  rxDose: {
    fx: FxCount;
    dose: number;
    isodose: number; // prescription isodose %
    protocol: string;
  }[];
  constraints: SBRTConstraint[];
  planningPearls: {
    title: string;
    detail: string;
    category: 'Dosimetry' | 'Motion' | 'Radiobiology' | 'QA' | 'Clinical';
  }[];
  contraindications?: string[];
  metricDefs?: string;
}

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
  site: string;
}

// ─── BED / EQD2 helpers ───────────────────────────────────────────────────
const BED = (total: number, dpf: number, ab: number) =>
  total * (1 + dpf / ab);
const EQD2 = (total: number, dpf: number, ab: number) =>
  (total * (dpf + ab)) / (2 + ab);

// ─── DATA ─────────────────────────────────────────────────────────────────

const SBRT_SITES: SBRTSite[] = [
  {
    id: 'lung_peripheral',
    name: 'Lung — Peripheral',
    shortName: 'Lung P',
    color: 'bg-sky-600',
    textColor: 'text-sky-600',
    accentColor: '#0284c7',
    rxDose: [
      { fx: 3, dose: 54, isodose: 80, protocol: 'RTOG 0236 (3×18 Gy)' },
      { fx: 5, dose: 50, isodose: 80, protocol: 'RTOG 0813 (5×10 Gy)' },
      { fx: 5, dose: 55, isodose: 80, protocol: 'RTOG 0915 (5×11 Gy)' },
    ],
    constraints: [
      {
        organ: 'Spinal Cord', type: 'Serial',
        metric: 'Dmax (point)', metricType: 'Dmax',
        limit_3fx: 22, limit_5fx: 30,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Myelopathy', grade: 'G4',
        source: ['RTOG 0236', 'TG-101'], ab: 2.0,
        notes: 'Apply to thecal sac PRV. BED₂(3fx): 22×(1+22/3/2) ≈ 102 Gy'
      },
      {
        organ: 'Esophagus', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 25.2, limit_5fx: 35,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Stenosis / fistula', grade: 'G4',
        source: ['TG-101', 'RTOG 0813'], ab: 3.0,
        notes: 'D5cc < 19.5 Gy (3fx). Risk significantly increases if tumor is central.'
      },
      {
        organ: 'Trachea / Prox. Bronchus', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 30, limit_5fx: 40,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Stenosis / fistula', grade: 'G4',
        source: ['TG-101'], ab: 3.0,
        notes: 'Proximal bronchial tree = 2cm from carina. Defines central vs. peripheral zone.'
      },
      {
        organ: 'Heart / Pericardium', type: 'Parallel',
        metric: 'Dmax / V15Gy', metricType: 'Dmax',
        limit_3fx: 30, limit_5fx: 38,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Cardiac toxicity', grade: 'G3',
        source: ['TG-101', 'NRG-BR001'], ab: 2.5,
        notes: 'V15Gy < 15cc (3fx); V32Gy < 15cc (5fx). Each 1Gy heart Dmean ≈ 7.4% relative ↑ MACE.'
      },
      {
        organ: 'Great Vessels', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 45, limit_5fx: 53,
        unit: 'Gy', priority: 'Soft', evidence: 'Expert',
        endpoint: 'Haemorrhage / wall necrosis', grade: 'G5',
        source: ['TG-101'], ab: 3.0,
      },
      {
        organ: 'Brachial Plexus', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 24, limit_5fx: 30.5,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Neuropathy', grade: 'G3',
        source: ['TG-101', 'RTOG 0813'], ab: 2.0,
        notes: 'Risk of Pancoast syndrome if tumour adjacent to plexus. EQD2₂(3fx,24Gy) ≈ 72 Gy.'
      },
      {
        organ: 'Lung (Total)', type: 'Parallel',
        metric: 'V20Gy / Mean', metricType: 'Vxx',
        limit_3fx: 10, limit_5fx: 10,
        unit: '%', priority: 'Hard', evidence: '2A',
        endpoint: 'Pneumonitis Gr2+', grade: 'G3',
        source: ['RTOG 0236', 'QUANTEC 2010'], ab: 3.0,
        notes: 'V20Gy < 10% (combined both lungs). Mean lung dose < 8 Gy (3fx). Bilateral disease warrants LUNG SPARING OPTIMIZATION.'
      },
      {
        organ: 'Chest Wall / Ribs', type: 'Mixed',
        metric: 'Dmax / V30Gy', metricType: 'Dmax',
        limit_3fx: 30, limit_5fx: 35,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'Rib fracture / pain', grade: 'G3',
        source: ['UK Consensus', 'TG-101'], ab: 3.0,
        notes: 'V30Gy < 30cc (3fx); V32Gy < 30cc (5fx). Risk increases with V30Gy > 70cc. Inform patients of late fracture risk at ~6–18 months.'
      },
      {
        organ: 'Skin', type: 'Mixed',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 24, limit_5fx: 32,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'Dermatitis / ulceration', grade: 'G3',
        source: ['TG-101'], ab: 10.0,
        notes: 'Particularly for very superficial tumours. Bolus effect of gating device.'
      },
      {
        organ: 'Stomach / Duodenum', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 22.2, limit_5fx: 32,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Perforation / ulceration', grade: 'G4',
        source: ['TG-101'], ab: 3.0,
        notes: 'D5cc < 16.5 Gy (3fx); D5cc < 18 Gy (5fx).'
      },
    ],
    planningPearls: [
      {
        title: 'Peripheral vs Central Definition',
        detail: 'Peripheral = not within 2cm of proximal bronchial tree AND not adjacent to mediastinum. Central tumours require modified 5fx schedules (RTOG 0813). Ultra-central (touching PBT) = higher risk; consult NRG-BR001 constraints.',
        category: 'Clinical'
      },
      {
        title: 'Prescription Isodose',
        detail: 'Typically prescribed to 60–80% isodose line, placing high-dose heterogeneity within target. D95% of PTV = 100% is NOT standard for SBRT — heterogeneity is therapeutic. Report: Dmax, R50%, GI (Paddick), D95%, CI (Paddick).',
        category: 'Dosimetry'
      },
      {
        title: 'Motion Management',
        detail: '4D-CT mandatory. ITV approach (contour all 10 phases) or gating/tracking. BH (breath-hold) acceptable for apical lesions. Gating windows typically ≤30% duty cycle. Residual motion should be <5mm within ITV.',
        category: 'Motion'
      },
      {
        title: 'Small Field Dosimetry (ICRU 91)',
        detail: 'Fields ≤3cm at isocentre: lateral charged-particle equilibrium NOT established. Detector choice critical: microDiamond, Exradin W1 scintillator, or IBA SFD diode. Do NOT use parallel-plate chamber. Output factor uncertainty can be >5% with wrong detector.',
        category: 'QA'
      },
      {
        title: 'BED₁₀ Threshold for Ablative Effect',
        detail: 'BED₁₀ ≥ 100 Gy associated with improved LC (Onishi 2007, Eriguchi 2014). 3×18 Gy: BED₁₀=151 Gy. 5×10 Gy: BED₁₀=100 Gy. 3×15 Gy: BED₁₀=112 Gy. Avoid sub-ablative BED (e.g., 5×7.5 Gy = BED₁₀=65 Gy).',
        category: 'Radiobiology'
      },
      {
        title: 'R50% & Gradient Index (Paddick GI)',
        detail: 'R50% = V50%_isodose / V_PTV: target <3.5 for tumours ≤20cc; <4 for 20–50cc. Paddick GI = V50%_isodose / V100%_isodose: target <4. Poor GI increases chest wall dose and late toxicity.',
        category: 'Dosimetry'
      },
    ],
    contraindications: [
      'Central/ultra-central location (relative CI; requires modified fractionation)',
      'Tumour >5cm without institutional SBRT experience for large field',
      'Prior ipsilateral lung RT >40 Gy (re-RT requires EQD2 cumulative assessment)',
      'Interstitial lung disease (high pneumonitis risk; relative CI)'
    ]
  },
  {
    id: 'spine_sbrt',
    name: 'Spine SBRT',
    shortName: 'Spine',
    color: 'bg-violet-600',
    textColor: 'text-violet-600',
    accentColor: '#7c3aed',
    rxDose: [
      { fx: 1, dose: 24, isodose: 90, protocol: 'RTOG 0631 (1×24 Gy)' },
      { fx: 1, dose: 16, isodose: 90, protocol: 'RTOG 0631 (1×16 Gy, paraspinal)' },
      { fx: 3, dose: 27, isodose: 90, protocol: 'ASTRO 2013 (3×9 Gy)' },
      { fx: 5, dose: 30, isodose: 90, protocol: 'UK Consensus (5×6 Gy)' },
    ],
    constraints: [
      {
        organ: 'Spinal Cord (Thecal Sac)', type: 'Serial',
        metric: 'D0.35cc (point max)', metricType: 'Dncc',
        limit_1fx: 14, limit_3fx: 21.9, limit_5fx: 30,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Myelopathy', grade: 'G4',
        source: ['RTOG 0631', 'Sahgal 2013', 'TG-101'], ab: 2.0,
        notes: 'RTOG 0631: D0.35cc ≤14 Gy (1fx). Sahgal 4/5 rule: cord Dmax:PTV Dmax ratio determines myelopathy risk. EQD2₂(1fx,14Gy) = 14×16/4 = 56 Gy.'
      },
      {
        organ: 'Cauda Equina', type: 'Serial',
        metric: 'D0.35cc / Dmax', metricType: 'Dncc',
        limit_1fx: 16, limit_3fx: 24, limit_5fx: 32,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Radiculopathy / incontinence', grade: 'G4',
        source: ['TG-101', 'ASTRO Spine SBRT 2013'], ab: 2.0,
        notes: 'Slightly higher tolerance than spinal cord. Applies to L2 and below.'
      },
      {
        organ: 'Nerve Roots (Paraspinal)', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 16, limit_3fx: 22, limit_5fx: 30,
        unit: 'Gy', priority: 'Hard', evidence: 'Expert',
        endpoint: 'Motor / sensory neuropathy', grade: 'G3',
        source: ['TG-101'], ab: 2.0,
      },
      {
        organ: 'Esophagus', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_1fx: 15.4, limit_3fx: 25.2, limit_5fx: 35,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Stenosis / fistula', grade: 'G4',
        source: ['TG-101', 'UK Consensus'], ab: 3.0,
        notes: 'D5cc: ≤11.9 Gy (1fx), ≤17.7 Gy (3fx). Notify patients of dysphagia risk for cervicothoracic spine.'
      },
      {
        organ: 'Trachea / Proximal Bronchus', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 20.2, limit_3fx: 30, limit_5fx: 40,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Stenosis / fistula', grade: 'G4',
        source: ['TG-101'], ab: 3.0,
      },
      {
        organ: 'Brachial Plexus', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 17.5, limit_3fx: 24, limit_5fx: 30.5,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Plexopathy', grade: 'G3',
        source: ['TG-101'], ab: 2.0,
        notes: 'Cervical and upper thoracic spine: contour plexus specifically.'
      },
      {
        organ: 'Kidney (each)', type: 'Parallel',
        metric: 'V15Gy / Dmean', metricType: 'Vxx',
        limit_1fx: 10, limit_3fx: 15, limit_5fx: 20,
        unit: '%', priority: 'Soft', evidence: '3',
        endpoint: 'Renal failure', grade: 'G4',
        source: ['TG-101', 'QUANTEC 2010'], ab: 3.0,
        notes: 'Ensure contralateral kidney Dmean < 5 Gy. V15Gy <32% both kidneys combined.'
      },
      {
        organ: 'Vertebral Body', type: 'Mixed',
        metric: 'D10% (coverage)', metricType: 'Dmax',
        limit_1fx: 24, limit_3fx: 27, limit_5fx: 30,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'VCF / Osteonecrosis', grade: 'G3',
        source: ['ASTRO 2013', 'Sahgal 2016'], ab: 3.0,
        notes: 'Vertebral compression fracture risk 14–39% at 1 year. Lytic lesions, >40% body involvement, and pre-existing kyphosis increase risk significantly.'
      },
    ],
    planningPearls: [
      {
        title: 'Sahgal 4/5 Rule (Myelopathy Risk)',
        detail: 'Risk of radiation myelopathy is related to the cord Dmax / PTV Dmax ratio. If this ratio exceeds 0.8 (i.e., cord getting >80% of target dose), risk escalates dramatically. Key: the cord point max Dmax should be ≤14 Gy (1fx) regardless of PTV prescription.',
        category: 'Radiobiology'
      },
      {
        title: 'Epidural Disease Grading (Bilsky Scale)',
        detail: 'Grade 0: bone only. Grade 1: epidural extension, no cord compression. Grade 2: cord displaced but CSF visible. Grade 3: cord compression, no CSF. SBRT generally safe for Grades 0–1c; Grade 2–3 requires decompression ± stabilization first (NOMS framework).',
        category: 'Clinical'
      },
      {
        title: 'Vertebral Compression Fracture (VCF) Risk',
        detail: 'SINS score >12 (unstable) = surgical stabilization before SBRT. Risk factors: lytic lesion >40% vertebral body, baseline deformity, ≥3 levels, high dose per fraction. Consider prophylactic vertebroplasty in high-risk patients before treatment.',
        category: 'Clinical'
      },
      {
        title: 'Separation Surgery + SBRT',
        detail: 'Separation surgery (minimal epidural decompression) enables creation of ≥2mm gap between cord and tumor, allowing escalated SBRT dose. Standard approach for Bilsky 2–3 disease. Post-op SBRT typically at 24 Gy in 2 fractions or 27 Gy in 3 fractions.',
        category: 'Clinical'
      },
      {
        title: 'IGRT Requirements',
        detail: '6-degree-of-freedom (6DoF) couch mandatory for spine SBRT. kV CBCT with bony registration to within 1mm/1°. Intrafraction monitoring every 30–40 minutes or real-time. Immobilization: thermoplastic mask (cervical); BodyFix/SBRT frame (thoracolumbar).',
        category: 'QA'
      },
    ],
  },
  {
    id: 'liver_sbrt',
    name: 'Liver SBRT',
    shortName: 'Liver',
    color: 'bg-amber-600',
    textColor: 'text-amber-600',
    accentColor: '#d97706',
    rxDose: [
      { fx: 3, dose: 45, isodose: 80, protocol: 'Typical (3×15 Gy, BED₁₀=112)' },
      { fx: 5, dose: 40, isodose: 80, protocol: 'Child-Pugh A (5×8 Gy, BED₁₀=72)' },
      { fx: 6, dose: 60, isodose: 80, protocol: 'RTOG 1112 (6×10 Gy for HCC)' },
    ],
    constraints: [
      {
        organ: 'Liver (Total − GTV)', type: 'Parallel',
        metric: 'Mean / V15Gy', metricType: 'Dmean',
        limit_3fx: 15, limit_5fx: 13, limit_8fx: 10,
        unit: 'Gy', priority: 'Hard', evidence: '2A',
        endpoint: 'RILD (Classic/Non-Classic)', grade: 'G4',
        source: ['QUANTEC 2010', 'RTOG 1112'], ab: 3.0,
        notes: 'Child-Pugh A: mean ≤20 Gy (3fx), ≤13 Gy (5fx). Child-Pugh B: mean ≤6 Gy (3fx). V15Gy < 700cc liver spared is key constraint. At 8Gy/fx, scaled limit = 30×5/(8+3) = 13.6 Gy mean.'
      },
      {
        organ: 'Normal Liver Volume (≥700cc)', type: 'Parallel',
        metric: 'Volume metric', metricType: 'Vxx',
        limit_3fx: 700, limit_5fx: 700,
        unit: 'cc', priority: 'Absolute', evidence: '2A',
        endpoint: 'RILD', grade: 'G5',
        source: ['QUANTEC 2010'], ab: 3.0,
        notes: '≥700cc of uninvolved liver must receive <15 Gy (Child-Pugh A). Reduces to 500cc for CP-B. Critical constraint — check BEFORE planning.'
      },
      {
        organ: 'Stomach', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 22.2, limit_5fx: 32,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Ulceration / perforation', grade: 'G4',
        source: ['TG-101', 'UK Consensus'], ab: 3.0,
        notes: 'D5cc < 16.5 Gy (3fx). NSAID counselling peri-treatment.'
      },
      {
        organ: 'Duodenum', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 22.2, limit_5fx: 32,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Perforation / fistula', grade: 'G5',
        source: ['TG-101'], ab: 3.0,
        notes: 'D5cc ≤ 11.2 Gy (3fx); D5cc ≤ 18 Gy (5fx). D10cc ≤ 9 Gy (3fx). Highest risk structure for right-lobe HCC. MRI-guided SBRT preferred for duodenal proximity.'
      },
      {
        organ: 'Small Bowel', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 25.2, limit_5fx: 35,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Obstruction / perforation', grade: 'G4',
        source: ['TG-101'], ab: 3.0,
        notes: 'D5cc ≤ 19.5 Gy (3fx). Contour entire bowel bag as approximation when loop identification difficult.'
      },
      {
        organ: 'Spinal Cord', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 22, limit_5fx: 30,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Myelopathy', grade: 'G4',
        source: ['TG-101'], ab: 2.0,
      },
      {
        organ: 'Kidney (each)', type: 'Parallel',
        metric: 'V15Gy / Dmean', metricType: 'Vxx',
        limit_3fx: 35, limit_5fx: 35,
        unit: '%', priority: 'Hard', evidence: '2A',
        endpoint: 'Renal failure', grade: 'G4',
        source: ['QUANTEC 2010'], ab: 3.0,
        notes: 'Ipsilateral kidney often partially in field. Ensure contra Dmean <8 Gy if prior nephrectomy. V20Gy < 32% per kidney combined.'
      },
      {
        organ: 'Bile Duct (Central)', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_3fx: 50, limit_5fx: 60,
        unit: 'Gy', priority: 'Soft', evidence: 'Expert',
        endpoint: 'Biliary stricture / cholangitis', grade: 'G3',
        source: ['Shen 2018', 'ASTRO HCC 2022'], ab: 3.0,
        notes: 'Particularly relevant for perihilar cholangiocarcinoma SBRT. Risk of late biliary toxicity underestimated.'
      },
    ],
    planningPearls: [
      {
        title: 'Child-Pugh Score & RILD Risk',
        detail: 'Child-Pugh A (CP5-6): conventional SBRT doses feasible. CP-B (7-9): RILD risk markedly higher, mean liver dose limit ≈6–8 Gy (3fx). CP-C: SBRT generally contraindicated. ALBI grade increasingly used as more discriminatory than CP score.',
        category: 'Clinical'
      },
      {
        title: 'MRI-Guided SBRT (MR-Linac)',
        detail: 'Preferred for lesions near duodenum/stomach (Viewray MRIdian, Elekta Unity). Online adaptive replanning on MRI allows reduction of PRV margins by 30–50%. Enables dose escalation for adjacent-bowel lesions previously not treatable with conventional CBCT-guided SBRT.',
        category: 'QA'
      },
      {
        title: 'Tumour Tracking / Gating',
        detail: '4D-CT or 4D-MRI mandatory. Diaphragmatic excursion >10mm: consider active breathing control (ABC) or fiducial-guided gating. Fiducials: 3–4 gold markers placed 2–3 weeks pre-RT (coil migration risk). CyberKnife Synchrony or Vero DMLC tracking reduces ITV.',
        category: 'Motion'
      },
      {
        title: 'BED₁₀ for HCC Local Control',
        detail: 'BED₁₀ ≥100 Gy associated with significantly improved LC. 3×15 Gy = BED₁₀ 112.5 Gy. 5×10 Gy = BED₁₀ 100 Gy. 5×8 Gy = BED₁₀ 72 Gy (sub-ablative, inferior LC). Escalate to achieve BED₁₀ ≥100 Gy when liver constraints permit.',
        category: 'Radiobiology'
      },
    ],
  },
  {
    id: 'prostate_sbrt',
    name: 'Prostate SBRT',
    shortName: 'Prostate',
    color: 'bg-teal-600',
    textColor: 'text-teal-600',
    accentColor: '#0d9488',
    rxDose: [
      { fx: 5, dose: 36.25, isodose: 80, protocol: 'PACE-B (5×7.25 Gy)' },
      { fx: 5, dose: 40, isodose: 80, protocol: 'HYPO-RT-PC (5×8 Gy, EQD2₁.₅=128 Gy)' },
      { fx: 5, dose: 35, isodose: 80, protocol: 'PRICE (5×7 Gy, ISUP 1–2)' },
    ],
    constraints: [
      {
        organ: 'Rectum', type: 'Serial',
        metric: 'V36.25Gy / V38Gy', metricType: 'Vxx',
        limit_5fx: 1,
        unit: 'cc', priority: 'Absolute', evidence: '1B',
        endpoint: 'Rectal haemorrhage / fistula', grade: 'G3',
        source: ['PACE-B', 'HYPO-RT-PC', 'RTOG 0938'], ab: 3.0,
        notes: 'V36.25Gy < 1cc (PACE-B). V38Gy < 0.5cc. D50% (median rectal dose) < 16–18 Gy. EQD2₃(5fx,36.25Gy) = 36.25×(7.25+3)/(2+3) = 74.3 Gy — well within QUANTEC rectal tolerance.'
      },
      {
        organ: 'Rectum (Volume)', type: 'Parallel',
        metric: 'V29Gy / V18Gy', metricType: 'Vxx',
        limit_5fx: 20,
        unit: 'cc', priority: 'Hard', evidence: '1B',
        endpoint: 'Late rectal toxicity', grade: 'G2',
        source: ['PACE-B', 'RTOG 0938'], ab: 3.0,
        notes: 'V29Gy < 20cc; V18Gy < 50% of rectal volume. D2cc (near-max) < 38 Gy.'
      },
      {
        organ: 'Bladder', type: 'Parallel',
        metric: 'V37Gy / Dmax', metricType: 'Vxx',
        limit_5fx: 10,
        unit: 'cc', priority: 'Hard', evidence: '1B',
        endpoint: 'Cystitis / haematuria', grade: 'G3',
        source: ['PACE-B', 'RTOG 0938'], ab: 5.0,
        notes: 'V37Gy < 10cc; V18.3Gy < 40% bladder volume. D2cc < 38–40 Gy. Bladder should be comfortably full to reduce dose.'
      },
      {
        organ: 'Urethra', type: 'Serial',
        metric: 'Dmax (point)', metricType: 'Dmax',
        limit_5fx: 42,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Stricture / retention', grade: 'G3',
        source: ['RTOG 0938', 'King 2013'], ab: 3.0,
        notes: 'D10% (proximal urethra) < 42 Gy. EQD2₃(5fx) = 42×(8.4+3)/(2+3) = 95.8 Gy — at limit of stricture risk. α-blockers peri-treatment recommended.'
      },
      {
        organ: 'Penile Bulb', type: 'Serial',
        metric: 'Dmean / D50%', metricType: 'Dmean',
        limit_5fx: 29.5,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'Erectile dysfunction', grade: 'G3',
        source: ['RTOG 0938', 'Memorial protocol'], ab: 3.0,
        notes: 'D50% < 29.5 Gy. Dmean < 25 Gy. Relevant in nerve-sparing cases and patients prioritising sexual function.'
      },
      {
        organ: 'Neurovascular Bundles', type: 'Serial',
        metric: 'Dmax (ipsilateral)', metricType: 'Dmax',
        limit_5fx: 35,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'Erectile dysfunction', grade: 'G2',
        source: ['King 2013', 'Expert Consensus'], ab: 3.0,
        notes: 'NVBs at 5 and 7 o\'clock positions. Contour on MRI planning if available. Dose reduction of >10% in NVB sparing arm of PACE-B trials.'
      },
      {
        organ: 'Femoral Heads', type: 'Mixed',
        metric: 'Dmax / V30Gy', metricType: 'Dmax',
        limit_5fx: 30,
        unit: 'Gy', priority: 'Soft', evidence: '3',
        endpoint: 'Avascular necrosis', grade: 'G3',
        source: ['TG-101', 'Emami'], ab: 1.8,
        notes: 'V30Gy < 2% per femoral head. EQD2₁.₈(5fx,30Gy) = 30×(6+1.8)/(2+1.8) = 61.6 Gy — approaching Emami TD5/5=52 Gy.'
      },
    ],
    planningPearls: [
      {
        title: 'Prostate α/β Ratio (1.5 Gy)',
        detail: 'Prostate cancer has an extremely low α/β (~1.5 Gy), lower than late-responding rectum/bladder (α/β ~3 Gy). This means hypofractionation produces higher TCP relative to late toxicity — the radiobiological basis for SBRT advantage. EQD2₁.₅(5×7.25 Gy) = 142 Gy (tumour) vs EQD2₃ for rectum = 74 Gy.',
        category: 'Radiobiology'
      },
      {
        title: 'Rectal Preparation & Immobilisation',
        detail: 'Rectal spacer (hydrogel SpaceOAR or equivalent) reduces rectal D2cc by 30–40% — critical for meeting V36.25Gy < 1cc. Evacuated rectum at planning and treatment. Bladder filling protocol: void, drink 250ml, plan at 90 minutes. TRUS-guided hydrogel injection: avoid in prior rectal surgery.',
        category: 'Clinical'
      },
      {
        title: 'Daily IGRT & Intrafraction Monitoring',
        detail: '6DoF CBCT with intraprostatic fiducial markers (3 gold seeds). Match to fiducials, NOT bony anatomy. Intrafraction CBCT after 40–50% dose delivery. Prostate motion >3mm in 30% of fractions without real-time tracking. Calypso/Anchored Beacon or MR-Linac for continuous tracking.',
        category: 'QA'
      },
      {
        title: 'PACE-B vs HYPO-RT-PC — Key Differences',
        detail: 'PACE-B: 36.25 Gy/5fx, 91.6% 5yr bRFS, non-inferior to 78 Gy/39fx. HYPO-RT-PC: 42.7 Gy/7fx OR 42.7 Gy/7fx (moderate HFx) — neither arm was SBRT. For true SBRT: PACE-B is the pivotal Level 1B trial. Intra-SBRT IGRT frequency (daily vs alternate day) impacts toxicity.',
        category: 'Clinical'
      },
    ],
  },
  {
    id: 'srs_brain',
    name: 'Brain SRS / SRT',
    shortName: 'Brain SRS',
    color: 'bg-rose-600',
    textColor: 'text-rose-600',
    accentColor: '#e11d48',
    rxDose: [
      { fx: 1, dose: 24, isodose: 50, protocol: 'RTOG 90-05 (≤2cm: 24 Gy; 2–3cm: 18 Gy; 3–4cm: 15 Gy)' },
      { fx: 3, dose: 27, isodose: 70, protocol: 'SRT (3×9 Gy) — perioptic lesions' },
      { fx: 5, dose: 25, isodose: 70, protocol: 'SRT (5×5 Gy) — large lesions, WHO II glioma' },
    ],
    constraints: [
      {
        organ: 'Brainstem', type: 'Serial',
        metric: 'Dmax / V12Gy', metricType: 'Dmax',
        limit_1fx: 15, limit_3fx: 23.1, limit_5fx: 31,
        unit: 'Gy', priority: 'Absolute', evidence: '2A',
        endpoint: 'Brainstem necrosis / CN palsy', grade: 'G4',
        source: ['AAPM TG-101', 'HyTEC 2021', 'RTOG 90-05'], ab: 2.1,
        notes: 'V12Gy < 5cc (1fx). Surface > Core tolerance. Always add 1–3mm PRV. D1cc < 22.5 Gy (1fx) according to HyTEC.'
      },
      {
        organ: 'Optic Chiasm / Nerves', type: 'Serial',
        metric: 'Dmax (point max)', metricType: 'Dmax',
        limit_1fx: 10, limit_3fx: 19.5, limit_5fx: 25,
        unit: 'Gy', priority: 'Absolute', evidence: '2A',
        endpoint: 'Radiation optic neuropathy (blindness)', grade: 'G4',
        source: ['AAPM TG-101', 'HyTEC 2021', 'Leber 1998'], ab: 2.0,
        notes: 'RON risk <1% at ≤8 Gy (1fx). Rises steeply above 10 Gy. For perioptic lesions: FSRT 3×6–8 Gy or 5×5 Gy reduces risk to <2%. EQD2₂(1fx,10Gy) = 10×(10+2)/4 = 30 Gy.'
      },
      {
        organ: 'Cochlea', type: 'Serial',
        metric: 'Dmean / Dmax', metricType: 'Dmean',
        limit_1fx: 9, limit_3fx: 17.1, limit_5fx: 25,
        unit: 'Gy', priority: 'Hard', evidence: '2A',
        endpoint: 'Sensorineural hearing loss (SNHL)', grade: 'G2',
        source: ['QUANTEC 2010', 'RTOG 0933', 'Bhandare 2010'], ab: 3.0,
        notes: 'Dmean ≤45 Gy EQD2 = <30% SNHL risk. At 1fx: iso-effective Dmean ≤9 Gy. Concurrent cisplatin: reduce by 30–40%. RTOG 0933 threshold for Wmean guidance.'
      },
      {
        organ: 'Spinal Cord (Cervical)', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 14, limit_3fx: 21.9, limit_5fx: 30,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Myelopathy', grade: 'G4',
        source: ['TG-101'], ab: 2.0,
      },
      {
        organ: 'Normal Brain', type: 'Parallel',
        metric: 'V12Gy (SRS-specific)', metricType: 'Vxx',
        limit_1fx: 10,
        unit: 'cc', priority: 'Hard', evidence: '1B',
        endpoint: 'Radionecrosis', grade: 'G3',
        source: ['Shaw 2000', 'Flickinger 2000', 'HyTEC 2021'], ab: 3.0,
        notes: 'V12Gy > 10cc: 10× increase in Grade 3 toxicity (Shaw IJROBP 2000). V12Gy critical constraint for standard SRS. For multimets: cumulative V12Gy across all fractions matters.'
      },
      {
        organ: 'Hippocampus (WBRT + SRS)', type: 'Mixed',
        metric: 'D100% / Dmean', metricType: 'Dmax',
        limit_1fx: 9, limit_3fx: 14.4, limit_5fx: 18,
        unit: 'Gy', priority: 'Soft', evidence: '1B',
        endpoint: 'Neurocognitive function', grade: 'G2',
        source: ['RTOG 0933', 'NRG CC001', 'Brown 2020'], ab: 2.0,
        notes: 'RTOG 0933: Hippocampal D100% < 9 Gy in 30 Gy WBRT. At 1fx SRS: D100% < 9 Gy iso-effective. Contour bilateral hippocampi (RTOG delineation atlas). Add 5mm PRV: HA-PTV (hippocampal avoidance PTV).'
      },
      {
        organ: 'Lens', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 2, limit_3fx: 2, limit_5fx: 2,
        unit: 'Gy', priority: 'Hard', evidence: '1A',
        endpoint: 'Cataract (deterministic)', grade: 'G2',
        source: ['ICRP 2012', 'NRPB', 'Expert Consensus'], ab: 1.2,
        notes: 'ICRP threshold: 0.5 Gy ACUTE, 5 Gy fractionated (revised 2012). For SRS: practical limit ≤2 Gy total. α/β ≈1.2 Gy — extreme fraction-sensitivity. At 3fx: iso-effective = 2×(1+1.2/1)/(1+1.2/3×1) = 1.65 Gy.'
      },
    ],
    planningPearls: [
      {
        title: 'RTOG 90-05 Dose Limits by Size',
        detail: 'Dose prescription based on max diameter: ≤2cm → 24 Gy; >2–3cm → 18 Gy; >3–4cm → 15 Gy. These are MAXIMUM tolerated doses with acceptable radionecrosis rates (10–15% G3+). RCT data shows no OS benefit from escalation above these doses.',
        category: 'Clinical'
      },
      {
        title: 'V12Gy and Radionecrosis',
        detail: 'V12Gy is the gold-standard SRS constraint for brain radionecrosis risk. <5cc: <20% risk. >10cc: >10× G3 risk. Multiple simultaneous metastases: sum V12Gy across all targets. Per-fraction prescription should be reduced for multimets (e.g., 5×5 Gy = V12Gy per lesion).',
        category: 'Radiobiology'
      },
      {
        title: 'Perioptic Lesions: FSRT Indication',
        detail: 'Optic apparatus within 2–3mm of target: consider FSRT 3×7 Gy (BED₃=63) or 5×5 Gy (BED₁₀=50). Single fraction ≤8 Gy for optic apparatus. Fractionation reduces the sharp dose gradient needed; conformality index optimization essential. D max optic apparatus ≤8 Gy (1fx).',
        category: 'Clinical'
      },
      {
        title: 'Multi-Met SRS — Aggregated Dose',
        detail: 'For ≥5 brain metastases (SRS preferred over WBRT per JCOG0504/ASTRO 2022): total cumulative V12Gy across all isocentres. Risk of CNS radionecrosis proportional to total V12Gy, not individual lesions. Accept higher V12Gy per lesion for dominant symptom.',
        category: 'Dosimetry'
      },
    ],
  },
  {
    id: 'adrenal_oligo',
    name: 'Adrenal / Oligomets',
    shortName: 'Adrenal',
    color: 'bg-orange-600',
    textColor: 'text-orange-600',
    accentColor: '#ea580c',
    rxDose: [
      { fx: 3, dose: 36, isodose: 80, protocol: 'Adrenal (3×12 Gy, BED₁₀=84)' },
      { fx: 5, dose: 40, isodose: 80, protocol: 'NRG-BR001 (5×8 Gy extracranial oligo)' },
      { fx: 1, dose: 28, isodose: 80, protocol: 'Single fraction (SRS ≤3cm adrenal)' },
    ],
    constraints: [
      {
        organ: 'Spinal Cord', type: 'Serial',
        metric: 'Dmax', metricType: 'Dmax',
        limit_1fx: 14, limit_3fx: 22, limit_5fx: 30,
        unit: 'Gy', priority: 'Absolute', evidence: '3',
        endpoint: 'Myelopathy', grade: 'G4',
        source: ['TG-101'], ab: 2.0,
      },
      {
        organ: 'Kidney (ipsilateral)', type: 'Parallel',
        metric: 'V18Gy / Dmean', metricType: 'Vxx',
        limit_3fx: 35, limit_5fx: 35,
        unit: '%', priority: 'Hard', evidence: '3',
        endpoint: 'Renal failure', grade: 'G4',
        source: ['TG-101', 'NRG-BR001'], ab: 3.0,
        notes: 'Ipsilateral kidney usually partially involved in adrenal field. V18Gy < 35%; Dmean < 8–10 Gy. Contralateral kidney: V5Gy < 30%.'
      },
      {
        organ: 'Small Bowel', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 25.2, limit_5fx: 35,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Obstruction / perforation', grade: 'G4',
        source: ['TG-101', 'NRG-BR001'], ab: 3.0,
      },
      {
        organ: 'Stomach', type: 'Serial',
        metric: 'Dmax / D5cc', metricType: 'Dmax',
        limit_3fx: 22.2, limit_5fx: 32,
        unit: 'Gy', priority: 'Hard', evidence: '3',
        endpoint: 'Ulceration / haemorrhage', grade: 'G4',
        source: ['TG-101'], ab: 3.0,
      },
      {
        organ: 'Liver', type: 'Parallel',
        metric: 'Mean / Spared volume', metricType: 'Dmean',
        limit_3fx: 15, limit_5fx: 13,
        unit: 'Gy', priority: 'Hard', evidence: '2A',
        endpoint: 'RILD', grade: 'G4',
        source: ['QUANTEC 2010'], ab: 3.0,
        notes: 'Right adrenal SBRT: significant hepatic dose likely. Follow liver SBRT constraints. ≥700cc normal liver below tolerance threshold.'
      },
    ],
    planningPearls: [
      {
        title: 'Oligometastatic Disease: SBRT Evidence Base',
        detail: 'NRG-BR001 (Phase I): SBRT to extracranial oligomets (≤3 sites). ORIOLE (Phase II): SBRT vs observation in oligometastatic prostate — improved PFS. SABR-COMET (Phase II): SBRT + standard care vs standard care — improved OS (HR 0.57). Evidence growing but Phase III trials maturing.',
        category: 'Clinical'
      },
      {
        title: 'Adrenal SBRT: Hypertensive Crisis Risk',
        detail: 'For adrenal metastases, particularly with prior contralateral adrenalectomy or known pheochromocytoma: alpha-blockade (phenoxybenzamine) before treatment. Functional adrenal tissue may cause catecholamine surge during RT. Biochemical workup (24hr urine metanephrines) before adrenal SBRT.',
        category: 'Clinical'
      },
      {
        title: 'SBRT for Lymph Node Oligomets',
        detail: 'NRG-BR001 constraints for pelvic/para-aortic lymph nodes. Bowel constraints are the dominant limiting factor. Consider bowel displacement techniques (belly board, bladder filling). Dose: 5×7 Gy (BED₁₀=59.5) is sub-ablative; prefer 5×8 Gy (BED₁₀=72) or 3×12 Gy (BED₁₀=84).',
        category: 'Dosimetry'
      },
    ],
  },
];

// ─── QUIZ DATA ────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'RTOG 0631 defines the primary spinal cord constraint for single-fraction spine SBRT as:',
    options: ['D1cc < 14 Gy', 'D0.35cc < 14 Gy', 'Dmax < 22 Gy', 'D2% < 10 Gy'],
    correct: 1,
    explanation: 'RTOG 0631 uses D0.35cc (a small absolute volume constraint, approximately point dose) ≤ 14 Gy as the thecal sac constraint for 1fx spine SBRT. This corresponds to an EQD2₂ of 56 Gy using the LQ model.',
    site: 'Spine SBRT'
  },
  {
    q: 'What is the minimum BED₁₀ generally accepted for ablative intent in peripheral lung SBRT?',
    options: ['≥80 Gy', '≥100 Gy', '≥120 Gy', '≥60 Gy'],
    correct: 1,
    explanation: 'BED₁₀ ≥100 Gy is widely accepted as the threshold for ablative local control in early-stage NSCLC SBRT (Onishi 2007). RTOG 0236 (3×18 Gy) achieves BED₁₀ = 151 Gy. 5×10 Gy exactly achieves BED₁₀ = 100 Gy.',
    site: 'Lung P'
  },
  {
    q: 'In SRS, which constraint volume metric is most predictive of Grade 3+ brain radionecrosis?',
    options: ['V10Gy (cc)', 'V12Gy (cc)', 'Dmax (Gy)', 'Mean brain dose'],
    correct: 1,
    explanation: 'V12Gy (volume of normal brain receiving ≥12 Gy) > 10cc is associated with a 10-fold increase in Grade 3 toxicity (Shaw IJROBP 2000, RTOG 90-05). This is the gold standard SRS brain constraint.',
    site: 'Brain SRS'
  },
  {
    q: 'In prostate SBRT (5×7.25 Gy), what is the approximate EQD2₃ for the rectum at V36.25Gy < 1cc?',
    options: ['36 Gy', '52 Gy', '74 Gy', '95 Gy'],
    correct: 2,
    explanation: 'EQD2₃ = 36.25 × (7.25 + 3) / (2 + 3) = 36.25 × 10.25/5 = 74.3 Gy. This is below the QUANTEC conventional rectal constraint of V70Gy < 20%, confirming the safety of the PACE-B protocol. Prostate α/β = 1.5, so EQD2₁.₅ = 141 Gy (favourable therapeutic ratio).',
    site: 'Prostate'
  },
  {
    q: 'The Paddick Gradient Index (GI) for SBRT is defined as:',
    options: ['V80% / V_PTV', 'V50% / V100% isodose', 'V50% / V_PTV', 'V12Gy / V_PTV'],
    correct: 1,
    explanation: 'Paddick Gradient Index (GI) = V50%_isodose / V100%_isodose. It measures the steepness of dose fall-off beyond the target. Target GI < 4 for typical lung SBRT. Distinguished from R50% = V50% / V_PTV (dose spillage metric used in RTOG trials).',
    site: 'Lung P'
  },
  {
    q: 'For liver SBRT in a Child-Pugh A patient, the minimum volume of normal liver below the tolerance threshold is:',
    options: ['≥500cc', '≥700cc', '≥900cc', '≥300cc'],
    correct: 1,
    explanation: 'QUANTEC 2010 states ≥700cc of uninvolved liver must receive <15 Gy (3fx equivalent) to maintain <5% RILD risk in Child-Pugh A patients. For Child-Pugh B, this threshold rises to ≥500cc at a lower dose constraint (~6–8 Gy mean). Always calculate liver volume minus GTV.',
    site: 'Liver'
  },
  {
    q: 'Sahgal\'s rule regarding spine SBRT myelopathy risk relates cord Dmax to:',
    options: ['PTV volume', 'PTV prescription dose', 'Number of fractions', 'Tumour BED'],
    correct: 1,
    explanation: 'Sahgal established that radiation myelopathy risk in spine SBRT is critically related to the ratio of cord Dmax to PTV prescription Dmax. When cord Dmax approaches >80% of the prescribed PTV dose ("4/5 rule"), the risk of myelopathy escalates dramatically. The absolute cord limit (D0.35cc ≤14 Gy at 1fx) takes precedence.',
    site: 'Spine'
  },
  {
    q: 'Which structure requires a Dmax ≤ 10 Gy for single-fraction SRS due to radiation optic neuropathy risk?',
    options: ['Cochlea', 'Optic chiasm / nerves', 'Brainstem', 'Hippocampus'],
    correct: 1,
    explanation: 'The optic chiasm and optic nerves have a practical single-fraction SRS limit of Dmax ≤ 10 Gy (EQD2₂ = 30 Gy) to keep RON risk <1–3%. Above 12 Gy (1fx), the risk of permanent blindness rises significantly. For peri-optic lesions, fractionated SRT (3–5 fractions) is preferred.',
    site: 'Brain SRS'
  },
];

// ─── SIDEBAR DATA ─────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: "α/β Ratios — SBRT Context",
    emoji: "🧬",
    accent: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
    rows: [
      { k: 'Spinal cord', v: '2.0 Gy' },
      { k: 'Brainstem', v: '2.1 Gy' },
      { k: 'Lung / Parotid', v: '3.0 Gy' },
      { k: 'Bowel / Stomach', v: '3.0 Gy' },
      { k: 'Heart', v: '2.5 Gy' },
      { k: 'Prostate tumour', v: '1.5 Gy' },
      { k: 'Breast tumour', v: '4.0 Gy' },
    ]
  },
  {
    title: "SBRT Dosimetry Metrics",
    emoji: "📏",
    accent: "#0ea5e9",
    bg: "rgba(14, 165, 233, 0.1)",
    border: "rgba(14, 165, 233, 0.3)",
    rows: [
      { k: 'Paddick GI', v: 'V50% / V100% (Target < 4)' },
      { k: 'Conformity Index', v: 'V100% / V_PTV (Target < 1.2)' },
      { k: 'R50%', v: 'V50% / V_PTV (Size dependent)' },
      { k: 'Dmax (Point)', v: 'Usually D0.03cc or D0.1cc' },
    ]
  },
  {
    title: "Radiobiology: LQ Model",
    emoji: "🧮",
    accent: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    rows: [
      { k: 'BED', v: 'D × (1 + d / α/β)', mono: true },
      { k: 'EQD2', v: 'D × (d + α/β) / (2 + α/β)', mono: true },
    ]
  }
];

// ─── PRIORITY BADGE STYLES ────────────────────────────────────────────────
const PRIORITY_STYLE: Record<Priority, string> = {
  Absolute: 'bg-red-500/10 text-red-500 border-red-500/20',
  Hard: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Soft: 'bg-white/5 text-slate-500 border-white/10',
};

const EVIDENCE_STYLE: Record<EvidenceLevel, string> = {
  '1A': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  '1B': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  '2A': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '2B': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Expert': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const TYPE_STYLE: Record<string, string> = {
  Serial: 'text-red-600 bg-red-50 border-red-200',
  Parallel: 'text-blue-600 bg-blue-50 border-blue-200',
};

const CATEGORY_STYLE: Record<string, string> = {
  Dosimetry: 'bg-indigo-50 border-indigo-300 text-indigo-700',
  Motion: 'bg-sky-50 border-sky-300 text-sky-700',
  Radiobiology: 'bg-violet-50 border-violet-300 text-violet-700',
  QA: 'bg-amber-50 border-amber-300 text-amber-700',
  Clinical: 'bg-emerald-50 border-emerald-300 text-emerald-700',
};

// ─── BED DISPLAY ──────────────────────────────────────────────────────────
const BEDDisplay: React.FC<{ total: number; fx: number; ab?: number }> = ({ total, fx, ab = 10 }) => {
  const dpf = fx > 0 ? total / fx : 0;
  const bed = BED(total, dpf, ab);
  const eqd2 = EQD2(total, dpf, ab);
  return (
    <span className="font-mono text-[9px] text-slate-500">
      BED₁₀={bed.toFixed(0)} · EQD2={eqd2.toFixed(0)} Gy
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

const SBRTConstraintsPage: React.FC = () => {
  const [activeSiteId, setActiveSiteId] = useState(SBRT_SITES[0].id);
  const [activeFx, setActiveFx] = useState<FxCount>(5);
  const [quizMode, setQuizMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);

  const site = SBRT_SITES.find(s => s.id === activeSiteId)!;

  const availableFx = useMemo(() => {
    const fxSet = new Set<number>();
    site.constraints.forEach(c => {
      if (c.limit_1fx !== undefined) fxSet.add(1);
      if (c.limit_3fx !== undefined) fxSet.add(3);
      if (c.limit_5fx !== undefined) fxSet.add(5);
      if (c.limit_8fx !== undefined) fxSet.add(8);
      if (c.limit_10fx !== undefined) fxSet.add(10);
    });
    return [...fxSet].sort((a, b) => a - b) as FxCount[];
  }, [site]);

  // Auto-select a valid fx when site changes
  React.useEffect(() => {
    if (!availableFx.includes(activeFx)) {
      setActiveFx(availableFx[0] ?? 5);
    }
  }, [site.id]);

  const getLimit = (c: SBRTConstraint, fx: FxCount): number | undefined => {
    if (fx === 1) return c.limit_1fx;
    if (fx === 3) return c.limit_3fx;
    if (fx === 5) return c.limit_5fx;
    if (fx === 8) return c.limit_8fx;
    if (fx === 10) return c.limit_10fx;
  };

  const curQ = QUIZ_QUESTIONS[qIdx];

  const filteredConstraints = useMemo(() => {
    return site.constraints.filter(c => getLimit(c, activeFx) !== undefined);
  }, [site, activeFx]);

  return (
    <div className="space-y-8 animate-slam">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
      >
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "SBRT requires high precision in both planning and delivery. Small field dosimetry and motion management are as critical as the dose constraints themselves."
          </p>
        </div>
      </KeyFactsSidebar>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            <p className="label-micro text-teal">OAR Safety Reference</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">SBRT Constraints</h1>
          <p className="text-sm text-slate-500 font-serif italic">Evidence-based limits for high-dose fractionation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuizMode(!quizMode)}
            className={`btn-premium py-2 flex items-center gap-2 ${quizMode ? 'btn-primary' : 'btn-outline'}`}
          >
            <GraduationCap className="w-4 h-4" />
            {quizMode ? 'Back to Reference' : 'Self-Assessment'}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {quizMode ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            {qDone ? (
              <section className="card-premium p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-teal" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight">Assessment Complete</h2>
                  <p className="text-slate-400 font-serif italic">You've completed the SBRT constraints review.</p>
                </div>
                <div className="text-6xl font-black text-white">
                  {qScore}<span className="text-2xl text-slate-600">/{QUIZ_QUESTIONS.length}</span>
                </div>
                <button
                  onClick={() => { setQIdx(0); setQScore(0); setQDone(false); setQAnswered(null); }}
                  className="btn-premium btn-primary py-3 px-8"
                >
                  Restart Assessment
                </button>
              </section>
            ) : (
              <section className="card-premium p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold">
                      {qIdx + 1}
                    </div>
                    <div>
                      <p className="label-micro opacity-40">Question {qIdx + 1} of {QUIZ_QUESTIONS.length}</p>
                      <p className="text-xs font-bold text-white">{curQ.site}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label-micro opacity-40">Score</p>
                    <p className="text-xl font-black text-teal">{qScore}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white leading-tight">
                  {curQ.q}
                </h2>

                <div className="space-y-3">
                  {curQ.options.map((opt, i) => {
                    let status = 'default';
                    if (qAnswered !== null) {
                      if (i === curQ.correct) status = 'correct';
                      else if (i === qAnswered) status = 'wrong';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => { setQAnswered(i); if (i === curQ.correct) setQScore(s => s + 1); }}
                        disabled={qAnswered !== null}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                          status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                          status === 'wrong' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                          'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <span className="font-medium">{opt}</span>
                        {status === 'correct' && <CheckCircle className="w-5 h-5" />}
                        {status === 'wrong' && <AlertTriangle className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>

                {qAnswered !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-teal/5 rounded-xl border border-teal/10 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-teal">
                      <Info className="w-4 h-4" />
                      <p className="label-micro">Clinical Explanation</p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      {curQ.explanation}
                    </p>
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setQAnswered(null);
                          if (qIdx + 1 >= QUIZ_QUESTIONS.length) setQDone(true);
                          else setQIdx(i => i + 1);
                        }}
                        className="btn-premium btn-primary py-2 px-6"
                      >
                        {qIdx === QUIZ_QUESTIONS.length - 1 ? 'Finish' : 'Next Question'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reference"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* ── Site Selector ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SBRT_SITES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSiteId(s.id)}
                  className={`p-4 rounded-xl border transition-all text-left group ${
                    activeSiteId === s.id
                      ? 'bg-teal/10 border-teal/50 shadow-lg shadow-teal/5'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className={`label-micro mb-1 ${activeSiteId === s.id ? 'text-teal' : 'opacity-40'}`}>
                    {s.shortName}
                  </p>
                  <p className={`text-sm font-bold leading-tight ${activeSiteId === s.id ? 'text-white' : 'text-slate-400'}`}>
                    {s.name.split(' — ')[0]}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* ── Left Column: Site Info ──────────────────────────────── */}
              <div className="lg:col-span-4 space-y-6">
                <section className="card-premium p-6 space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{site.name}</h2>
                    <p className="text-xs text-slate-500 font-serif italic">Standard protocols & planning pearls</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="label-micro opacity-40">Fractionation Selection</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableFx.map(fx => (
                        <button
                          key={fx}
                          onClick={() => setActiveFx(fx)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeFx === fx
                              ? 'bg-teal text-white shadow-lg shadow-teal/20'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {fx} Fx
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="label-micro opacity-40">Common Protocols</h3>
                    <div className="space-y-2">
                      {site.rxDose.map((rx, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{rx.dose} Gy / {rx.fx} fx</p>
                            <p className="text-[10px] text-slate-500">{rx.protocol}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-teal">{rx.isodose}% IDL</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="label-micro opacity-40">Planning Pearls</h3>
                  <div className="space-y-3">
                    {site.planningPearls.map((pearl, i) => (
                      <div key={i} className="card-premium p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-teal">{pearl.title}</p>
                          <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded uppercase tracking-wider text-slate-500">
                            {pearl.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          {pearl.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Right Column: Constraints Table ─────────────────────── */}
              <div className="lg:col-span-8 space-y-6">
                <section className="card-premium overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal" />
                      <h2 className="label-micro">OAR Constraints — {activeFx} Fractions</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[9px] text-slate-500 uppercase">Absolute</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-[9px] text-slate-500 uppercase">Hard</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                          <th className="px-6 py-4 label-micro">Organ / Endpoint</th>
                          <th className="px-6 py-4 label-micro">Metric</th>
                          <th className="px-6 py-4 label-micro text-right">Limit</th>
                          <th className="px-6 py-4 label-micro text-right">BED / EQD2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredConstraints.map((c, i) => {
                          const limit = getLimit(c, activeFx)!;
                          const dpf = limit / activeFx;
                          const bedVal = BED(limit, dpf, c.ab);
                          const eqd2Val = EQD2(limit, dpf, c.ab);

                          return (
                            <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.priority === 'Absolute' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                  <p className="text-sm font-bold text-white">{c.organ}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase mt-0.5">{c.endpoint}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-slate-400">{c.metric}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 uppercase">
                                    {c.type}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${EVIDENCE_STYLE[c.evidence]}`}>
                                    Ev: {c.evidence}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-lg font-black text-white font-mono">{limit} <span className="text-[10px] font-normal text-slate-500">{c.unit}</span></p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500">BED: <span className="text-white font-mono">{bedVal.toFixed(1)}</span></p>
                                  <p className="text-[10px] text-slate-500">EQD2: <span className="text-teal font-mono">{eqd2Val.toFixed(1)}</span></p>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card-premium p-6 bg-red-500/5 border-red-500/10">
                    <div className="flex items-center gap-2 text-red-500 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      <h3 className="label-micro">Critical Warnings</h3>
                    </div>
                    <ul className="space-y-2">
                      {site.contraindications?.map((ci, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2 italic">
                          <span className="text-red-500 mt-1">•</span>
                          {ci}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-premium p-6 bg-blue-500/5 border-blue-500/10">
                    <div className="flex items-center gap-2 text-blue-400 mb-3">
                      <BookOpen className="w-4 h-4" />
                      <h3 className="label-micro">Evidence Sources</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(site.constraints.flatMap(c => c.source))).map((s, i) => (
                        <span key={i} className="text-[9px] px-2 py-1 bg-white/5 rounded text-slate-500 uppercase tracking-wider">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SBRTConstraintsPage;