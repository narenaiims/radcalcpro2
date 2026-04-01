import { NumberInput } from '../src/components/NumberInput';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, 
  ReferenceLine, Label, PieChart, Pie
} from 'recharts';
import { 

  Shield, Calculator, Info, BookOpen, Baby, 
  Briefcase, Search, ChevronRight, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, Activity,
  Stethoscope, Zap, GraduationCap, ChevronLeft
} from 'lucide-react';


// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface Procedure {
  id: string;
  name: string;
  category: 'X-ray' | 'CT' | 'Nuclear Medicine' | 'Fluoroscopy' | 'Radiation Therapy' | 'Environmental';
  effectiveDose: number; // mSv
  organDoses?: { organ: string; dose: number; unit: 'mGy' | 'mSv' }[];
  description: string;
  icrpRef?: string;
  isPediatricScalable?: boolean;
  pediatricScaleFactor?: number;
  clinicalContext?: string;
  alternativeNoRadiation?: string;
  isFetalSpecialCase?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'intern' | 'resident' | 'fellow';
  reference: string;
}

interface ClinicalCase {
  id: string;
  scenario: string;
  question: string;
  teachingAnswer: string;
  reference: string;
}

// ─── CONSTANTS & DATA ────────────────────────────────────────────────────────

const STORAGE_KEY = 'radonco_dose_pro_v3';

const PROCEDURES: Procedure[] = [
  { id: 'cxr', name: 'Chest X-ray', category: 'X-ray', effectiveDose: 0.1, description: 'Standard 2-view chest imaging.', alternativeNoRadiation: 'Clinical exam / Ultrasound (limited)', icrpRef: 'NCRP 184' },
  { id: 'hct', name: 'Head CT', category: 'CT', effectiveDose: 2.0, description: 'Non-contrast brain survey.', alternativeNoRadiation: 'MRI Brain', icrpRef: 'ICRP 103' },
  { id: 'cct', name: 'Chest CT', category: 'CT', effectiveDose: 7.0, description: 'Thoracic survey.', alternativeNoRadiation: 'MRI Chest / Ultrasound (pleural)', icrpRef: 'ICRP 103' },
  { id: 'apct', name: 'Abdomen/Pelvis CT', category: 'CT', effectiveDose: 10.0, description: 'Comprehensive torso imaging.', alternativeNoRadiation: 'MRI Abdomen / Ultrasound', icrpRef: 'ICRP 103' },
  { id: 'petct', name: 'FDG PET/CT (Whole Body)', category: 'Nuclear Medicine', effectiveDose: 12.0, description: 'Metabolic tumor survey.', icrpRef: 'NCRP 184' },
  { id: 'rt_sim', name: 'RT Simulation CT (Planning)', category: 'Radiation Therapy', effectiveDose: 15.0, description: 'High-res planning CT.', clinicalContext: 'Radiation Oncology Simulation', icrpRef: 'ICRP 103' },
  { id: 'cbct', name: 'CBCT (per fraction)', category: 'Radiation Therapy', effectiveDose: 2.0, description: 'Daily setup verification.', clinicalContext: 'Daily IGRT', icrpRef: 'NCRP 184' },
  { id: 'brachy_fluoro', name: 'Brachytherapy Fluoroscopy', category: 'Fluoroscopy', effectiveDose: 7.5, description: 'Applicator placement guidance.', clinicalContext: 'GYN/Prostate Brachy', icrpRef: 'ICRP 103' },
  { id: 'psma_pet', name: 'PSMA PET/CT (Ga-68)', category: 'Nuclear Medicine', effectiveDose: 8.0, description: 'Prostate specific imaging.', clinicalContext: 'Prostate Staging/Recurrence', icrpRef: 'NCRP 184' },
  { id: 'fmiso_pet', name: 'FMISO PET/CT (Hypoxia)', category: 'Nuclear Medicine', effectiveDose: 14.0, description: 'Tumor hypoxia assessment.', clinicalContext: 'Research/Dose Painting', icrpRef: 'Clinical Data' },
  { id: 'fdg_brain', name: 'FDG PET (Brain Only)', category: 'Nuclear Medicine', effectiveDose: 5.0, description: 'Brain metabolic study.', clinicalContext: 'Neuro-oncology', icrpRef: 'ICRP 106' },
  { id: 'fetal_ct', name: 'Fetal Dose (Pelvic CT)', category: 'CT', effectiveDose: 0, organDoses: [{ organ: 'Fetus', dose: 25, unit: 'mGy' }], description: 'Direct fetal exposure.', isFetalSpecialCase: true, clinicalContext: 'Maternal Trauma/Emergency', icrpRef: 'ICRP 84' },
  { id: 'bg_annual', name: 'Annual Background', category: 'Environmental', effectiveDose: 3.0, description: 'Average natural background.', icrpRef: 'UNSCEAR' },
  { id: 'mammo', name: 'Mammogram', category: 'X-ray', effectiveDose: 0.4, description: 'Breast cancer screening.', alternativeNoRadiation: 'Ultrasound / MRI Breast', icrpRef: 'NCRP 184' },
  { id: 'dental', name: 'Dental X-ray', category: 'X-ray', effectiveDose: 0.01, description: 'Intraoral bitewing.', icrpRef: 'NCRP 184' },
  { id: 'flight', name: 'Transatlantic Flight', category: 'Environmental', effectiveDose: 0.05, description: 'Cosmic radiation exposure.', icrpRef: 'ICRP 103' },
  { id: 'spine_lxray', name: 'Lumbar Spine X-ray', category: 'X-ray', effectiveDose: 1.5, description: 'Multi-view lumbar spine imaging.', alternativeNoRadiation: 'MRI Spine', icrpRef: 'NCRP 184' },
  { id: 'extremity_xray', name: 'Extremity X-ray (Hand/Foot)', category: 'X-ray', effectiveDose: 0.001, description: 'Imaging of small joints.', alternativeNoRadiation: 'Clinical exam', icrpRef: 'NCRP 184' },
  { id: 'barium_swallow', name: 'Barium Swallow', category: 'Fluoroscopy', effectiveDose: 1.5, description: 'Upper GI contrast study.', alternativeNoRadiation: 'Endoscopy', icrpRef: 'NCRP 184' },
  { id: 'barium_enema', name: 'Barium Enema', category: 'Fluoroscopy', effectiveDose: 8.0, description: 'Lower GI contrast study.', alternativeNoRadiation: 'Colonoscopy', icrpRef: 'NCRP 184' },
  { id: 'coronary_cta', name: 'Coronary CT Angiography', category: 'CT', effectiveDose: 12.0, description: 'Non-invasive coronary artery survey.', alternativeNoRadiation: 'Stress Echo / MRI', icrpRef: 'ICRP 103' },
  { id: 'calcium_score', name: 'Calcium Scoring CT', category: 'CT', effectiveDose: 1.0, description: 'Screening for coronary calcification.', icrpRef: 'NCRP 184' },
  { id: 'ct_urogram', name: 'CT Urogram', category: 'CT', effectiveDose: 15.0, description: 'Detailed imaging of the urinary tract.', alternativeNoRadiation: 'Ultrasound / MRI', icrpRef: 'NCRP 184' },
  { id: 'ct_colonography', name: 'CT Colonography', category: 'CT', effectiveDose: 6.0, description: 'Virtual colonoscopy.', alternativeNoRadiation: 'Colonoscopy', icrpRef: 'NCRP 184' },
  { id: 'bone_scan', name: 'Bone Scan (Tc-99m)', category: 'Nuclear Medicine', effectiveDose: 4.0, description: 'Whole body skeletal survey.', alternativeNoRadiation: 'Whole Body MRI', icrpRef: 'NCRP 184' },
  { id: 'mpi_sestamibi', name: 'Myocardial Perfusion (Sestamibi)', category: 'Nuclear Medicine', effectiveDose: 9.0, description: 'Cardiac stress/rest perfusion.', alternativeNoRadiation: 'Stress Echo / MRI', icrpRef: 'NCRP 184' },
  { id: 'thyroid_scan', name: 'Thyroid Scan (I-123)', category: 'Nuclear Medicine', effectiveDose: 0.2, description: 'Functional thyroid imaging.', alternativeNoRadiation: 'Ultrasound', icrpRef: 'ICRP 106' },
  { id: 'vq_scan', name: 'V/Q Lung Scan', category: 'Nuclear Medicine', effectiveDose: 2.0, description: 'Ventilation/Perfusion lung survey.', alternativeNoRadiation: 'CTPA (higher dose)', icrpRef: 'NCRP 184' },
  { id: 'dxa_scan', name: 'DXA Scan (Bone Density)', category: 'X-ray', effectiveDose: 0.001, description: 'Bone mineral density assessment.', icrpRef: 'NCRP 184' },
  { id: 'cerebral_angio', name: 'Cerebral Angiogram', category: 'Fluoroscopy', effectiveDose: 7.0, description: 'Invasive brain vascular imaging.', alternativeNoRadiation: 'MRA / CTA', icrpRef: 'NCRP 184' },
  { id: 'cardiac_cath', name: 'Cardiac Catheterization', category: 'Fluoroscopy', effectiveDose: 7.0, description: 'Invasive coronary angiography.', alternativeNoRadiation: 'CCTA', icrpRef: 'NCRP 184' },
  { id: 'ercp', name: 'ERCP', category: 'Fluoroscopy', effectiveDose: 4.0, description: 'Endoscopic retrograde cholangiopancreatography.', alternativeNoRadiation: 'MRCP', icrpRef: 'NCRP 184' },
  { id: 'sinus_ct', name: 'Sinus CT', category: 'CT', effectiveDose: 0.6, description: 'Paranasal sinus survey.', alternativeNoRadiation: 'Clinical exam', icrpRef: 'NCRP 184' },
  { id: 'c_spine_ct', name: 'Cervical Spine CT', category: 'CT', effectiveDose: 3.0, description: 'C-spine trauma or survey.', alternativeNoRadiation: 'MRI C-spine', icrpRef: 'NCRP 184' },
  { id: 't_spine_ct', name: 'Thoracic Spine CT', category: 'CT', effectiveDose: 6.0, description: 'T-spine survey.', alternativeNoRadiation: 'MRI T-spine', icrpRef: 'NCRP 184' },
  { id: 'l_spine_ct', name: 'Lumbar Spine CT', category: 'CT', effectiveDose: 6.0, description: 'L-spine survey.', alternativeNoRadiation: 'MRI L-spine', icrpRef: 'NCRP 184' },
  { id: 'pelvis_xray', name: 'Pelvis X-ray', category: 'X-ray', effectiveDose: 0.7, description: 'Standard pelvis imaging.', alternativeNoRadiation: 'Ultrasound / MRI', icrpRef: 'NCRP 184' },
  { id: 'abdomen_xray', name: 'Abdomen X-ray (KUB)', category: 'X-ray', effectiveDose: 0.7, description: 'Kidney, Ureter, Bladder survey.', alternativeNoRadiation: 'Ultrasound', icrpRef: 'NCRP 184' },
  { id: 'skull_xray', name: 'Skull X-ray', category: 'X-ray', effectiveDose: 0.1, description: 'Standard skull imaging.', alternativeNoRadiation: 'CT Head (higher dose)', icrpRef: 'NCRP 184' },
  { id: 'hida_scan', name: 'HIDA Scan', category: 'Nuclear Medicine', effectiveDose: 3.0, description: 'Hepatobiliary functional scan.', alternativeNoRadiation: 'Ultrasound', icrpRef: 'NCRP 184' },
  { id: 'mibg_scan', name: 'MIBG Scan', category: 'Nuclear Medicine', effectiveDose: 5.0, description: 'Neuroendocrine tumor survey.', alternativeNoRadiation: 'PET/CT', icrpRef: 'NCRP 184' },
];

const CLINICAL_PEARLS = [
  "A pelvic CT delivers ~10 mSv — equivalent to 3 years background. For a 25yo woman, BEIR VII estimates ~1 in 1000 attributable cancer risk.",
  "Fetal doses <50 mGy are NOT associated with increased malformations or pregnancy loss (ACOG PB #723).",
  "Radiation therapy delivers 40–80 Gy to target — 4,000–8,000× higher than a diagnostic CT.",
  "Children are 2–3× more radiosensitive than adults due to higher cell proliferation and longer life expectancy.",
  "The 'dose' in PET/CT comes primarily from the CT component, not the radiotracer in most protocols.",
  "ALARA is a design principle for radiation protection programs — not a reason to withhold a clinically indicated scan.",
  "Occupational exposure in RadOnc: modern linac therapists typically receive <1 mSv/yr — well below limits.",
  "The LNT model is a regulatory tool, not a proven biologic mechanism at doses <50 mSv.",
  "I-131 therapy for thyroid cancer: patient may receive 3,700–7,400 MBq — thyroid absorbed dose 50–300 Gy.",
  "A radiation oncologist's career cumulative dose is typically <50 mSv — less than a frequent flier."
];

const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'case1',
    scenario: "A 32yo woman (8 weeks pregnant) needs a staging CT chest/abdomen/pelvis for a new diagnosis of aggressive lymphoma.",
    question: "What is the estimated fetal dose and is it safe to proceed?",
    teachingAnswer: "The estimated fetal dose from a maternal CT abdomen/pelvis is 10–25 mGy. According to ACOG Practice Bulletin #723 and ICRP 84, fetal doses <50 mGy are not associated with increased risk of malformations or pregnancy loss. If the scan is clinically indicated for life-saving lymphoma staging and treatment planning, it should proceed with optimization (e.g., shielding if outside FOV, though scatter is internal).",
    reference: "ACOG Practice Bulletin #723; ICRP Publication 84"
  },
  {
    id: 'case2',
    scenario: "A 4yo male requires a repeat Head CT for follow-up of a ventricular shunt.",
    question: "How should the dose be adjusted for this pediatric patient?",
    teachingAnswer: "Pediatric protocols (Image Gently) must be used. For a 4yo, the effective dose from a standard adult protocol would be ~3x higher due to smaller body diameter and higher organ sensitivity. Using pediatric-specific kVp and mAs settings can reduce dose by 50% while maintaining diagnostic quality. Always consider if Rapid MRI can replace CT for shunt checks.",
    reference: "Image Gently Campaign; BEIR VII"
  },
  {
    id: 'case3',
    scenario: "A first-year resident accidentally remains in the room during a 30-second fluoroscopy run for a brachytherapy procedure without wearing a lead apron.",
    question: "What is the estimated dose and should this be reported?",
    teachingAnswer: "A 30-second fluoroscopy run might deliver 1–5 mSv to the resident depending on distance and orientation. This must be reported to the Radiation Safety Officer (RSO). While well below the 20 mSv annual limit, it represents a significant unplanned exposure and a breach of safety protocols. ALARA principles were violated.",
    reference: "ICRP 103 Table B.12; Institutional RSO Policy"
  },
  {
    id: 'case4',
    scenario: "A patient is undergoing RT simulation for a complex H&N cancer. The simulation involves a non-contrast CT, a contrast-enhanced CT, and a 4D-CT for motion assessment.",
    question: "What is the cumulative effective dose from this simulation session?",
    teachingAnswer: "A single planning CT is ~15 mSv. A 3-scan simulation session (Non-con, Con, 4D) can easily exceed 40–50 mSv. This is equivalent to ~15 years of background radiation. While justified for curative RT, it highlights why simulation should be precisely targeted to avoid unnecessary volume coverage.",
    reference: "NCRP Report 184"
  },
  {
    id: 'case5',
    scenario: "An interventional radiologist performs a complex TIPS procedure with 45 minutes of total fluoroscopy time.",
    question: "What is the risk of deterministic skin effects?",
    teachingAnswer: "45 minutes of fluoroscopy can deliver skin doses >3–5 Gy (3000–5000 mGy). This exceeds the threshold for transient erythema (2 Gy). The patient must be monitored for 'radiation burns' at the entry site. This is a deterministic effect, unlike the stochastic cancer risks calculated via LNT.",
    reference: "ICRP 118; SIR Guidelines"
  }
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: "Which of the following imaging procedures typically results in the highest effective dose?",
    options: ["Chest X-ray (PA/Lat)", "Head CT", "PET/CT (Whole Body)", "Abdomen/Pelvis CT"],
    correctIndex: 2,
    explanation: "A whole-body PET/CT typically results in ~12-15 mSv, whereas an Abdomen/Pelvis CT is ~10 mSv and a Head CT is ~2 mSv.",
    difficulty: 'intern',
    reference: 'NCRP Report 184'
  },
  {
    id: 'q2',
    question: "According to ICRP 103, what is the annual effective dose limit for a radiation worker (averaged over 5 years)?",
    options: ["1 mSv", "5 mSv", "20 mSv", "50 mSv"],
    correctIndex: 2,
    explanation: "ICRP 103 recommends a limit of 20 mSv per year, averaged over 5 years, with no more than 50 mSv in any single year (ICRP 103 Table B.12).",
    difficulty: 'resident',
    reference: 'ICRP Publication 103'
  },
  {
    id: 'q3',
    question: "What is the generally accepted threshold dose (mGy) below which deterministic fetal effects are not observed?",
    options: ["1 mGy", "10 mGy", "100 mGy", "500 mGy"],
    correctIndex: 2,
    explanation: "Deterministic effects on the fetus (malformation, IQ reduction) are generally not observed below a threshold of 100 mGy (ACOG PB #723).",
    difficulty: 'resident',
    reference: 'ACOG Committee Opinion No. 723'
  },
  {
    id: 'q4',
    question: "The Linear No-Threshold (LNT) model is primarily used for:",
    options: ["Predicting acute radiation syndrome", "Estimating stochastic risks (cancer)", "Calculating deterministic thresholds", "Determining radiotherapy fractionation"],
    correctIndex: 1,
    explanation: "The LNT model is used to estimate the risk of stochastic effects (cancer) at low doses, assuming risk is proportional to dose with no safe threshold.",
    difficulty: 'intern',
    reference: 'ICRP 103'
  },
  {
    id: 'q5',
    question: "Compared to an adult, a 5-year-old child's lifetime risk of cancer from a CT scan is approximately:",
    options: ["The same", "2-3 times higher", "10 times higher", "Lower due to smaller size"],
    correctIndex: 1,
    explanation: "Children are more radiosensitive and have a longer life expectancy to manifest cancer, resulting in a 2-3x higher lifetime risk per unit dose.",
    difficulty: 'resident',
    reference: 'BEIR VII'
  }
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const RTvsDiagWidget = () => {
  const markers = [
    { label: 'Dental X-ray', dose: 0.01, context: 'Diagnostic' },
    { label: 'Annual Background', dose: 3, context: 'Environmental' },
    { label: 'Chest CT', dose: 7, context: 'Diagnostic' },
    { label: 'PET/CT', dose: 12, context: 'Diagnostic' },
    { label: 'TBI (12 Gy)', dose: 12000, context: 'RT (12,000 mSv equiv)' },
    { label: 'Chest RT (50 Gy)', dose: 50000, context: 'RT (50,000 mSv equiv)' },
  ];

  const minLog = -3; // 0.001
  const maxLog = 5;  // 100,000
  const getPos = (val: number) => {
    const log = Math.log10(val);
    return ((log - minLog) / (maxLog - minLog)) * 100;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">RT vs Diagnostic Dose Magnitude</h3>
      </div>
      <div className="relative h-24 mt-12 mb-8 mx-4">
        {/* Log Scale Bar */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 rounded-full -translate-y-1/2" />
        
        {/* Ticks */}
        {[-3, -2, -1, 0, 1, 2, 3, 4, 5].map(tick => (
          <div 
            key={tick} 
            className="absolute top-1/2 h-4 w-px bg-slate-200 -translate-y-1/2"
            style={{ left: `${((tick - minLog) / (maxLog - minLog)) * 100}%` }}
          >
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-400">
              10<sup>{tick}</sup>
            </span>
          </div>
        ))}

        {/* Markers */}
        {markers.map((m, i) => (
          <div 
            key={i}
            className="absolute top-1/2 -translate-y-1/2 group"
            style={{ left: `${getPos(m.dose)}%` }}
          >
            <div className="w-3 h-3 bg-rose-600 rounded-full border-2 border-white shadow-sm cursor-help" />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg shadow-xl">
                <p className="font-bold">{m.label}</p>
                <p className="text-slate-400">{m.dose.toLocaleString()} mSv</p>
                <p className="text-rose-400 italic">{m.context}</p>
              </div>
            </div>
            {/* Static Labels for key ones */}
            {(m.label === 'Dental X-ray' || m.label === 'Chest RT (50 Gy)' || m.label === 'Annual Background') && (
              <div className={`absolute ${m.label === 'Chest RT (50 Gy)' ? 'top-full mt-6' : 'bottom-full mb-6'} left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-slate-500 text-center`}>
                {m.label}<br/>{m.dose} mSv
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-400 text-center italic">Logarithmic scale highlighting the 6-log-order difference between diagnostic and therapeutic radiation.</p>
    </div>
  );
};

const DoseExposuresPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'calculator' | 'risk' | 'pediatric' | 'occupational' | 'quiz'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [patientAge, setPatientAge] = useState(40);
  const [patientSex, setPatientSex] = useState<'M' | 'F'>('M');

  // Occupational State
  const [occRole, setOccRole] = useState('Radiation Oncologist');
  const [occDose, setOccDose] = useState(2.5);

  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Carousel State
  const [pearlIdx, setPearlIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0);

  useEffect(() => {
    const pearlInterval = setInterval(() => setPearlIdx(i => (i + 1) % CLINICAL_PEARLS.length), 8000);
    return () => clearInterval(pearlInterval);
  }, []);

  const filteredProcedures = useMemo(() => {
    return PROCEDURES.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const topProcedures = useMemo(() => {
    return [...PROCEDURES]
      .filter(p => p.effectiveDose > 0)
      .sort((a, b) => b.effectiveDose - a.effectiveDose)
      .slice(0, 15);
  }, []);

  const cumulativeDose = useMemo(() => {
    return selectedProcedures.reduce((acc, id) => {
      const p = PROCEDURES.find(proc => proc.id === id);
      return acc + (p?.effectiveDose || 0);
    }, 0);
  }, [selectedProcedures]);

  const lntRisk = useMemo(() => {
    const doseSv = cumulativeDose / 1000;
    const risk = doseSv * 0.055; // ICRP 103: 5.5% per Sv for cancer detriment
    return {
      risk,
      riskIncrease: risk > 0 ? `1 in ${Math.round(1 / risk).toLocaleString()}` : '0'
    };
  }, [cumulativeDose]);

  const beirRisk = useMemo(() => {
    const doseSv = cumulativeDose / 1000;
    let ageMultiplier = 1.0;
    if (patientAge < 15) ageMultiplier = 3.0;
    else if (patientAge < 30) ageMultiplier = 1.5;
    else if (patientAge > 60) ageMultiplier = 0.5;
    const sexMultiplier = patientSex === 'F' ? 1.2 : 0.8;
    const risk = doseSv * 0.055 * ageMultiplier * sexMultiplier;
    return {
      risk,
      riskIncrease: risk > 0 ? `1 in ${Math.round(1 / risk).toLocaleString()}` : '0'
    };
  }, [cumulativeDose, patientAge, patientSex]);

  const getDoseColor = (dose: number) => {
    if (dose < 1) return 'text-emerald-600';
    if (dose <= 10) return 'text-yellow-600';
    if (dose <= 20) return 'text-orange-600';
    return 'text-rose-600';
  };

  const QUICK_REF_DATA = {
    limits: [
      { label: 'Occupational (Annual)', value: '20 mSv' },
      { label: 'Public (Annual)', value: '1 mSv' },
      { label: 'Fetal (Pregnancy)', value: '1 mSv' },
      { label: 'Eye Lens (Annual)', value: '20 mSv' },
      { label: 'Skin/Extremity', value: '500 mSv' },
      { label: 'Emergency (Life)', value: '250 mSv' },
      { label: 'Emergency (Property)', value: '100 mSv' },
    ],
    weighting: [
      { label: 'Photons/Electrons (wR)', value: '1' },
      { label: 'Protons (wR)', value: '2' },
      { label: 'Alpha Particles (wR)', value: '20' },
      { label: 'Neutrons (wR)', value: '2 - 20' },
      { label: 'Breast (wT)', value: '0.12' },
      { label: 'Gonads (wT)', value: '0.08' },
      { label: 'Bone Marrow (wT)', value: '0.12' },
      { label: 'Lung (wT)', value: '0.12' },
      { label: 'Colon (wT)', value: '0.12' },
      { label: 'Stomach (wT)', value: '0.12' },
    ],
    thresholds: [
      { label: 'Fetal IQ (Threshold)', value: '100 mGy' },
      { label: 'Transient Erythema', value: '2 Gy' },
      { label: 'Permanent Epilation', value: '7 Gy' },
      { label: 'Main Erythema', value: '6 Gy' },
      { label: 'Dry Desquamation', value: '10 Gy' },
      { label: 'Moist Desquamation', value: '15 Gy' },
      { label: 'Dermal Necrosis', value: '18 Gy' },
      { label: 'Cataract (Acute)', value: '0.5 Gy' },
    ]
  };

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
  }));


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <div className="bg-rose-600 text-white p-3 rounded-2xl shadow-lg shadow-rose-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Radiation Protection & Dose</h1>
            <p className="text-sm text-slate-500 font-medium">Clinical Residency Training Module · ICRP 103 / BEIR VII</p>
          </div>
        </div>
      </div>

      {/* Case of the Day */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Stethoscope className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Case of the Day</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setCaseIdx(i => (i - 1 + CLINICAL_CASES.length) % CLINICAL_CASES.length)} className="p-1 hover:bg-white/10 rounded-lg transition"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCaseIdx(i => (i + 1) % CLINICAL_CASES.length)} className="p-1 hover:bg-white/10 rounded-lg transition"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-bold leading-relaxed">{CLINICAL_CASES[caseIdx].scenario}</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-black text-rose-300 uppercase mb-2">Question:</p>
              <p className="text-xs text-slate-200">{CLINICAL_CASES[caseIdx].question}</p>
              <details className="mt-4 group">
                <summary className="text-[10px] font-black uppercase tracking-widest text-rose-400 cursor-pointer hover:text-rose-300 transition list-none flex items-center gap-1">
                  View Teaching Answer <ChevronRight className="w-3 h-3 group-open:rotate-90 transition" />
                </summary>
                <div className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                  {CLINICAL_CASES[caseIdx].teachingAnswer}
                  <p className="mt-2 text-[10px] text-rose-300 italic">Ref: {CLINICAL_CASES[caseIdx].reference}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Pearls Carousel */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="bg-rose-600 text-white p-2 rounded-xl shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div className="flex-1 overflow-hidden">
          <>
            <p 
              key={pearlIdx}
              className="text-xs font-bold text-rose-900 leading-tight"
            >
              {CLINICAL_PEARLS[pearlIdx]}
            </p>
          </>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-3xl overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'table', label: 'Procedures', icon: Search },
          { id: 'calculator', label: 'Calculator', icon: Calculator },
          { id: 'pediatric', label: 'Pediatric', icon: Baby },
          { id: 'occupational', label: 'Occupational', icon: Briefcase },
          { id: 'quiz', label: 'Quiz', icon: BookOpen },
          { id: 'risk', label: 'Risk Facts', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'calculator' | 'pediatric' | 'occupational' | 'quiz' | 'risk')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white shadow-sm text-rose-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
          );
        })}
      </div>

      <>
        <div
          key={activeTab}
        >
          {/* ── TABLE TAB ── */}
          {activeTab === 'table' && (
            <div className="space-y-6">
              <RTvsDiagWidget />
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap gap-2">
                    {['All', 'X-ray', 'CT', 'Nuclear Medicine', 'Fluoroscopy', 'Radiation Therapy', 'Environmental'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                          categoryFilter === cat 
                          ? 'bg-rose-600 text-white border-rose-600' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search procedures..." 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-50">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Procedure</th>
                        <th className="px-6 py-4">Effective Dose</th>
                        <th className="px-6 py-4">Alt. (No Radiation)</th>
                        <th className="px-6 py-4 text-right">ICRP Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProcedures.map(p => (
                        <tr key={p.id} className="group hover:bg-rose-50/30 transition-colors relative">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              {p.name}
                              {(p.organDoses || p.clinicalContext) && (
                                <div className="relative group/popover">
                                  <Info className="w-3 h-3 text-slate-300 cursor-help" />
                                  <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-slate-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/popover:opacity-100 group-hover/popover:visible transition-all z-50">
                                    {p.clinicalContext && <p className="mb-2 font-bold text-rose-400 uppercase tracking-widest">Context: {p.clinicalContext}</p>}
                                    {p.organDoses && (
                                      <div className="space-y-1">
                                        <p className="font-bold border-b border-white/10 pb-1 mb-1">Organ Dose Breakdown:</p>
                                        {p.organDoses.map((od, i) => (
                                          <div key={i} className="flex justify-between">
                                            <span>{od.organ}</span>
                                            <span className="font-mono">{od.dose} {od.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{p.category}</div>
                          </td>
                          <td className={`px-6 py-4 font-mono font-black ${getDoseColor(p.effectiveDose)}`}>
                            {p.effectiveDose > 0 ? `${p.effectiveDose.toFixed(2)} mSv` : 'Special Case'}
                          </td>
                          <td className="px-6 py-4 text-[10px] text-slate-500 italic">
                            {p.alternativeNoRadiation || '—'}
                          </td>
                          <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-300">
                            {p.icrpRef || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Dose Comparison: Top 15 Procedures</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProcedures} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={150} fontSize={9} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="effectiveDose" radius={[0, 4, 4, 0]}>
                        {topProcedures.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.effectiveDose > 10 ? '#e11d48' : '#4f46e5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── CALCULATOR TAB ── */}
          {activeTab === 'calculator' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                        <span>Age: {patientAge} years</span>
                      </div>
                      <input 
                        type="range" min="0" max="80" value={patientAge} 
                        onChange={(e) => setPatientAge(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPatientSex('M')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${patientSex === 'M' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        Male
                      </button>
                      <button 
                        onClick={() => setPatientSex('F')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${patientSex === 'F' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Procedures</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-2">
                    {PROCEDURES.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedProcedures(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          selectedProcedures.includes(p.id) ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-700">{p.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{p.effectiveDose} mSv</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-rose-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Effective Dose</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black">{cumulativeDose.toFixed(2)}</span>
                      <span className="text-xl font-bold opacity-70">mSv</span>
                    </div>
                    
                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase opacity-70">
                        <span>vs Annual Background (3 mSv)</span>
                        <span>{((cumulativeDose / 3) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min((cumulativeDose / 3) * 100, 100)}%` }}
                          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">LNT Model Risk (ICRP 103)</p>
                    <p className="text-2xl font-black text-rose-600">{lntRisk.riskIncrease}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Nominal cancer detriment (5.5% per Sv)</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">BEIR VII Adjusted</p>
                    <p className="text-2xl font-black text-indigo-600">{beirRisk.riskIncrease}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Age/Sex adjusted (Low-LET only)</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Risk in Context</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Lifetime Baseline Cancer Risk', val: '42%', color: 'bg-slate-700' },
                      { label: 'Calculated Procedure Risk', val: `${(beirRisk.risk * 100).toFixed(4)}%`, color: 'bg-rose-500' },
                      { label: 'Driving 1000 Miles (Fatal)', val: '1 in 10,000', color: 'bg-slate-700' },
                      { label: 'Smoking 1 Cigarette (Risk)', val: '1 in 1,000,000', color: 'bg-slate-700' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-xs font-medium text-slate-300">{item.label}</span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${item.color}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PEDIATRIC TAB ── */}
          {activeTab === 'pediatric' && (
            <div className="space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <Baby className="w-8 h-8 text-rose-600" />
                  <h3 className="text-lg font-black text-rose-900">ALARA in Pediatric Imaging</h3>
                </div>
                <p className="text-sm text-rose-800 leading-relaxed">
                  Children are <strong>2-3x more radiosensitive</strong> than adults due to higher cell proliferation rates and a longer life expectancy to manifest stochastic effects. ACR guidance (Image Gently) emphasizes weight-based dose reduction and the use of non-ionizing alternatives (MRI/US) where possible.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Pediatric Dose Scaling Example</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {PROCEDURES.filter(p => p.category === 'CT').slice(0, 6).map(p => (
                    <div key={p.id} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-800 mb-2">{p.name}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] text-slate-400 uppercase">Adult</p>
                          <p className="text-sm font-bold text-slate-400">{p.effectiveDose} mSv</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-rose-300 mb-1" />
                        <div className="text-right">
                          <p className="text-[8px] text-rose-400 uppercase">Pediatric (3x)</p>
                          <p className="text-lg font-black text-rose-600">{(p.effectiveDose * 3).toFixed(1)} mSv</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── OCCUPATIONAL TAB ── */}
          {activeTab === 'occupational' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Staff Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Role</label>
                      <select 
                        value={occRole} 
                        onChange={(e) => setOccRole(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                      >
                        {['Radiation Oncologist', 'RT Therapist', 'Physicist', 'Nurse', 'Public', 'Pregnant Worker'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Annual Dose (mSv)</label>
                      <NumberInput 
                         value={occDose} 
                        onChange={(e) => setOccDose(parseFloat(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                  <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: (occDose / (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20)) * 100 },
                            { value: Math.max(0, 100 - (occDose / (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20)) * 100) }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill={occDose > (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20) ? '#e11d48' : '#4f46e5'} />
                          <Cell fill="#f1f5f9" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800">{((occDose / (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20)) * 100).toFixed(0)}%</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">of limit</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-800">Dose Status</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        occDose <= (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {occDose <= (occRole === 'Public' || occRole === 'Pregnant Worker' ? 1 : 20) ? 'Safe' : 'Exceeded'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed pt-2 border-t border-slate-50">
                      <strong>ICRP 103 Table B.12:</strong> Occupational limit is 20 mSv/yr averaged over 5 years, with no single year exceeding 50 mSv. Public and fetal limits are 1 mSv/year.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── QUIZ TAB ── */}
          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {!quizFinished ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600 text-white p-2 rounded-xl">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resident Assessment</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Question {currentQuestionIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${((currentQuestionIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-slate-900 leading-tight">{QUIZ_QUESTIONS[currentQuestionIdx].question}</h4>
                    <div className="grid gap-3">
                      {QUIZ_QUESTIONS[currentQuestionIdx].options.map((opt, i) => (
                        <button
                          key={i}
                          disabled={showExplanation}
                          onClick={() => {
                            setSelectedOption(i);
                            setShowExplanation(true);
                            if (i === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex) {
                              setQuizScore(s => s + 1);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                            selectedOption === i 
                              ? (i === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800')
                              : (showExplanation && i === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 hover:border-indigo-200')
                          }`}
                        >
                          {opt}
                          {showExplanation && i === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {showExplanation && selectedOption === i && i !== QUIZ_QUESTIONS[currentQuestionIdx].correctIndex && <XCircle className="w-4 h-4 text-rose-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <>
                    {showExplanation && (
                      <div
                        className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teaching Point</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{QUIZ_QUESTIONS[currentQuestionIdx].explanation}</p>
                        <p className="text-[10px] text-indigo-600 font-bold italic">Ref: {QUIZ_QUESTIONS[currentQuestionIdx].reference}</p>
                        <button 
                          onClick={() => {
                            if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
                              setCurrentQuestionIdx(currentQuestionIdx + 1);
                              setShowExplanation(false);
                              setSelectedOption(null);
                            } else {
                              setQuizFinished(true);
                            }
                          }}
                          className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                          {currentQuestionIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                      </div>
                    )}
                  </>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center space-y-6">
                  <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Quiz Completed!</h3>
                  <div className="space-y-2">
                    <p className="text-slate-500 text-sm">Your Score:</p>
                    <p className="text-5xl font-black text-indigo-600">{quizScore} / {QUIZ_QUESTIONS.length}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentQuestionIdx(0);
                      setQuizScore(0);
                      setShowExplanation(false);
                      setSelectedOption(null);
                      setQuizFinished(false);
                    }}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                  >
                    Restart Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RISK FACTS TAB ── */}
          {activeTab === 'risk' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-black text-slate-900">Radiation Protection Principles</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'LNT Model', desc: 'Linear No-Threshold model assumes risk is proportional to dose down to zero. Used for protection policy.' },
                    { title: 'ALARA', desc: 'As Low As Reasonably Achievable. Optimization of protection to minimize unnecessary exposure.' },
                    { title: 'Stochastic Effects', desc: 'Random effects (cancer, genetic) where probability increases with dose, but severity is independent.' },
                    { title: 'Deterministic Effects', desc: 'Threshold effects (cataracts, skin erythema) where severity increases with dose above a threshold.' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-800 mb-1">{item.title}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
                <h3 className="text-lg font-black flex items-center gap-3">
                  <Activity className="w-5 h-5 text-rose-400" />
                  Global Standards
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Primary References</p>
                    <ul className="space-y-4">
                      {[
                        'ICRP Publication 103: 2007 Recommendations',
                        'BEIR VII Phase 2: Health Risks from Exposure to Low Levels of Ionizing Radiation',
                        'NCRP Report 184: Medical Radiation Exposure (2019)',
                        'UNSCEAR 2020/2021: Medical Exposure Evaluation',
                        'ACOG Practice Bulletin #723: Guidelines for Imaging During Pregnancy'
                      ].map((ref, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {ref}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default DoseExposuresPage;