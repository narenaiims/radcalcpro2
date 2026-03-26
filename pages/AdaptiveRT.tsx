import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, Activity, Target, Layers, Zap, Calculator, CheckSquare, AlertTriangle, X, ArrowRight, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { AnimatedNumber } from '../src/components/AnimatedNumber';

// --- DATA ---
const ART_TYPES = [
  {
    id: "online",
    name: "Online ART",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    description: "Adaptation performed while the patient is on the treatment couch.",
    pros: ["Accounts for daily anatomical changes", "Maximal normal tissue sparing", "Enables margin reduction"],
    cons: ["Time-consuming (patient on couch)", "Requires fast auto-contouring and planning", "Intensive QA requirements"],
    examples: ["Ethos (CBCT-based)", "MR-Linac (Unity, MRIdian)"]
  },
  {
    id: "offline",
    name: "Offline ART",
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
    description: "Adaptation performed between fractions based on imaging trends.",
    pros: ["Less time pressure", "Standard QA processes can be used", "Better for systematic changes (e.g., weight loss)"],
    cons: ["Does not account for daily random variations", "Requires additional planning time between fractions"],
    examples: ["Plan of the Day (PoD) for Bladder", "Re-planning for H&N weight loss"]
  }
];

const CLINICAL_SITES = [
  {
    site: "Head & Neck",
    rationale: "Significant weight loss, tumor shrinkage, and resolution of edema during a 6-7 week course.",
    strategy: "Typically Offline ART. Re-plan around week 3-4 if mask becomes loose or significant anatomical changes are noted on CBCT.",
    benefit: "Prevents overdosing of parotids and spinal cord; ensures target coverage."
  },
  {
    site: "Bladder",
    rationale: "Highly variable daily bladder filling and shape.",
    strategy: "Plan of the Day (PoD) - Offline library of plans (Empty, Small, Medium, Large). Daily CBCT selects the best fit.",
    benefit: "Reduces dose to bowel and rectum while ensuring bladder coverage."
  },
  {
    site: "Cervix",
    rationale: "Uterus position varies with bladder/rectum filling; tumor regression during treatment.",
    strategy: "PoD (library of plans) or Online MR-guided ART.",
    benefit: "Spares bowel and rectum; adapts to tumor shrinkage."
  },
  {
    site: "Prostate",
    rationale: "Daily variations in rectal and bladder filling; prostate motion.",
    strategy: "Online ART (e.g., MR-Linac) or daily IGRT with fiducials.",
    benefit: "Extreme margin reduction (e.g., 2-3mm) for SBRT, reducing GI/GU toxicity."
  },
  {
    site: "Lung / Abdomen",
    rationale: "Tumor motion (respiratory) and baseline shifts; tumor shrinkage.",
    strategy: "Online MR-guided ART (gating + adaptation) or Offline re-planning for atelectasis resolution.",
    benefit: "Safe dose escalation to central/ultra-central tumors; sparing of healthy lung/GI organs."
  }
];

const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: "Key Definitions",
    emoji: "📚",
    accent: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.1)",
    border: "rgba(34, 211, 238, 0.3)",
    rows: [
      { k: "ART", v: "Adaptive Radiotherapy" },
      { k: "IGRT", v: "Image-Guided Radiotherapy" },
      { k: "PoD", v: "Plan of the Day" }
    ]
  },
  {
    title: "Imaging Modalities",
    emoji: "📷",
    accent: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.3)",
    rows: [
      { k: "CBCT", v: "Standard for most linacs" },
      { k: "MR-Linac", v: "Superior soft-tissue contrast" },
      { k: "CT-on-rails", v: "Diagnostic quality CT" }
    ]
  },
  {
    title: "Workflow Steps",
    emoji: "🔄",
    accent: "#4ade80",
    bg: "rgba(74, 222, 128, 0.1)",
    border: "rgba(74, 222, 128, 0.3)",
    rows: [
      { k: "1. Image", v: "Acquire daily anatomy" },
      { k: "2. Contour", v: "AI/Deformable registration" },
      { k: "3. Plan", v: "Re-optimize dose" },
      { k: "4. QA", v: "Independent dose calculation" },
      { k: "5. Deliver", v: "Treat the patient" }
    ]
  }
];

const CHECKLIST_ITEMS = [
  { id: "c1", category: "Clinical Assessment", text: "Review daily CBCT trends (shifts > 5mm for 3 consecutive days)" },
  { id: "c2", category: "Clinical Assessment", text: "Assess patient weight loss (> 10% from baseline)" },
  { id: "c3", category: "Clinical Assessment", text: "Check for resolving edema or tumor shrinkage on imaging" },
  { id: "c4", category: "Dosimetric Review", text: "Verify OAR doses on daily imaging (if dose accumulation available)" },
  { id: "c5", category: "Dosimetric Review", text: "Check target coverage on deformed anatomy" },
  { id: "c6", category: "Action Plan", text: "Consult with physics regarding re-plan feasibility and timeline" },
  { id: "c7", category: "Action Plan", text: "Schedule Re-CT scan with same immobilization" },
  { id: "c8", category: "Action Plan", text: "Re-contour target volumes and OARs on new CT" },
  { id: "c9", category: "Action Plan", text: "Generate, evaluate, and approve new adaptive plan" },
  { id: "c10", category: "Action Plan", text: "Perform patient-specific QA for new plan before delivery" }
];

export default function AdaptiveRT() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mainTab, setMainTab] = useState("overview"); // 'overview', 'calculators', 'checklist'
  const [activeArtTab, setActiveArtTab] = useState("online");
  const [showUrgentModal, setShowUrgentModal] = useState(false);

  // Calculator 1: Re-plan Need Assessment
  const [calcState, setCalcState] = useState({
    site: "hn",
    fraction: 15,
    weightLoss: 0,
    cbctShift: 0,
    volumeChange: 0,
    oarStatus: "safe",
    toxicity: 0
  });

  // Calculator 2: EQD2 / BED
  const [eqd2State, setEqd2State] = useState({
    totalDose: 60,
    dosePerFx: 2,
    abRatio: 10
  });

  // Calculator 3: Timing Estimator
  const [timingState, setTimingState] = useState({
    triggerFx: 15,
    totalFx: 30,
    urgency: "standard",
    weekend: false
  });

  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checklistProgress = Math.round((Object.values(checkedItems).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100) || 0;

  // Derived Calculator Results
  const getReplanVerdict = () => {
    let score = 0;
    if (calcState.weightLoss >= 10) score += 3;
    else if (calcState.weightLoss >= 5) score += 1;
    
    if (calcState.cbctShift >= 10) score += 4;
    else if (calcState.cbctShift >= 5) score += 2;
    
    if (calcState.volumeChange >= 20) score += 2;
    
    if (calcState.oarStatus === "exceeded") score += 5;
    else if (calcState.oarStatus === "approaching") score += 3;
    
    if (calcState.toxicity >= 3) score += 3;

    if (score >= 5 || calcState.oarStatus === "exceeded") {
      return { text: "RE-PLAN REQUIRED", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]", dot: "bg-red-500", score };
    } else if (score >= 3) {
      return { text: "MONITOR & REVIEW", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]", dot: "bg-amber-500", score };
    } else {
      return { text: "CONTINUE TREATMENT", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]", dot: "bg-green-500", score };
    }
  };

  const getEqd2Results = () => {
    const { totalDose, dosePerFx, abRatio } = eqd2State;
    if (!totalDose || !dosePerFx || !abRatio) return { bed: 0, eqd2: 0 };
    const bed = totalDose * (1 + (dosePerFx / abRatio));
    const eqd2 = bed / (1 + (2 / abRatio));
    return { bed, eqd2 };
  };

  const getTimingResults = () => {
    const { triggerFx, totalFx, urgency, weekend } = timingState;
    let delayDays = urgency === "urgent" ? 1 : 3;
    if (weekend) delayDays += 2;
    
    const missedFx = Math.min(delayDays, totalFx - triggerFx);
    const newPlanFx = Math.min(triggerFx + missedFx + 1, totalFx);
    
    return { missedFx, newPlanFx };
  };

  const verdict = getReplanVerdict();
  const eqd2Res = getEqd2Results();
  const timingRes = getTimingResults();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-cyan-500/30 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Adaptive RT Decision Tool</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUrgentModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-sm font-medium text-red-400 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Urgent Triggers</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Main Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
          {[
            { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
            { id: "calculators", label: "Calculators", icon: <Calculator className="w-4 h-4" /> },
            { id: "checklist", label: "Checklist", icon: <CheckSquare className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                mainTab === tab.id 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {mainTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <section className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                  Adapting to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Anatomical Changes</span>
                </h2>
                <p className="text-lg text-zinc-400 max-w-3xl leading-relaxed">
                  Adaptive Radiotherapy (ART) is a closed-loop process where the treatment plan is modified using feedback from image guidance to account for patient-specific anatomical or biological changes during the treatment course.
                </p>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-zinc-100">ART Strategies</h3>
                </div>
                
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                  {ART_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setActiveArtTab(type.id)}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeArtTab === type.id 
                          ? "bg-white/10 text-white shadow-sm" 
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <AnimatePresence mode="wait">
                    {ART_TYPES.filter(t => t.id === activeArtTab).map(type => (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            {type.icon}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-zinc-100">{type.name}</h4>
                            <p className="text-zinc-400 mt-1">{type.description}</p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-green-400 uppercase tracking-wider">Advantages</h5>
                            <ul className="space-y-2">
                              {type.pros.map((pro, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                  <ChevronRight className="w-4 h-4 text-green-500/50 shrink-0 mt-0.5" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-red-400 uppercase tracking-wider">Challenges</h5>
                            <ul className="space-y-2">
                              {type.cons.map((con, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                  <ChevronRight className="w-4 h-4 text-red-500/50 shrink-0 mt-0.5" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                           <h5 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Examples</h5>
                           <div className="flex flex-wrap gap-2">
                              {type.examples.map((ex, i) => (
                                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                                  {ex}
                                </span>
                              ))}
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-zinc-100">Clinical Indications & Strategies</h3>
                </div>

                <div className="grid gap-4">
                  {CLINICAL_SITES.map((site, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                      <h4 className="text-lg font-semibold text-cyan-400 mb-3">{site.site}</h4>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rationale</span>
                          <p className="text-sm text-zinc-300">{site.rationale}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Strategy</span>
                          <p className="text-sm text-zinc-300">{site.strategy}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Clinical Benefit</span>
                          <p className="text-sm text-zinc-300">{site.benefit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* CALCULATORS TAB */}
          {mainTab === "calculators" && (
            <motion.div
              key="calculators"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Calc 1: Re-plan Need Assessment */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-100">Re-plan Need Assessment</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Weight Loss (%)</label>
                        <input 
                          type="number" 
                          value={calcState.weightLoss}
                          onChange={e => setCalcState({...calcState, weightLoss: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">CBCT Shift (mm)</label>
                        <input 
                          type="number" 
                          value={calcState.cbctShift}
                          onChange={e => setCalcState({...calcState, cbctShift: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Volume Change (%)</label>
                        <input 
                          type="number" 
                          value={calcState.volumeChange}
                          onChange={e => setCalcState({...calcState, volumeChange: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Toxicity Grade</label>
                        <select 
                          value={calcState.toxicity}
                          onChange={e => setCalcState({...calcState, toxicity: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                        >
                          <option value={0}>Grade 0-1</option>
                          <option value={2}>Grade 2</option>
                          <option value={3}>Grade 3</option>
                          <option value={4}>Grade 4</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400 uppercase">OAR Status on CBCT</label>
                      <select 
                        value={calcState.oarStatus}
                        onChange={e => setCalcState({...calcState, oarStatus: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="safe">Safe (Well below tolerance)</option>
                        <option value="approaching">Approaching Tolerance</option>
                        <option value="exceeded">Exceeding Tolerance</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-500 ${verdict.bg} ${verdict.border} ${verdict.glow}`}>
                    <div className="text-sm text-zinc-400 mb-2 uppercase tracking-wider font-medium">Assessment Score: {verdict.score}</div>
                    <div className={`text-2xl sm:text-3xl font-bold text-center flex items-center justify-center gap-3 ${verdict.color}`}>
                      <span className="relative flex h-4 w-4">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${verdict.dot}`}></span>
                        <span className={`relative inline-flex rounded-full h-4 w-4 ${verdict.dot}`}></span>
                      </span>
                      {verdict.text}
                    </div>
                    {verdict.score >= 5 && (
                      <p className="text-sm text-red-300/80 text-center mt-4">
                        Immediate physics consult and re-planning workflow initiation recommended.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Calc 2: EQD2 / BED */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Calculator className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100">EQD2 / BED Converter</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Total Dose (Gy)</label>
                        <input 
                          type="number" 
                          value={eqd2State.totalDose}
                          onChange={e => setEqd2State({...eqd2State, totalDose: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Dose/Fx (Gy)</label>
                        <input 
                          type="number" 
                          value={eqd2State.dosePerFx}
                          onChange={e => setEqd2State({...eqd2State, dosePerFx: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400 uppercase">Alpha/Beta Ratio (Gy)</label>
                      <select 
                        value={eqd2State.abRatio}
                        onChange={e => setEqd2State({...eqd2State, abRatio: Number(e.target.value)})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value={10}>10 (Tumor / Early Responding)</option>
                        <option value={3}>3 (Late Responding / CNS)</option>
                        <option value={2}>2 (Spinal Cord)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">BED</div>
                        <div className="text-xl font-semibold text-amber-400"><AnimatedNumber value={Number(eqd2Res.bed)} /> <span className="text-sm text-zinc-500">Gy</span></div>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-center">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">EQD2</div>
                        <div className="text-xl font-semibold text-amber-400"><AnimatedNumber value={Number(eqd2Res.eqd2)} /> <span className="text-sm text-zinc-500">Gy</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calc 3: Timing Estimator */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100">Re-CT Timing Estimator</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Trigger Fx #</label>
                        <input 
                          type="number" 
                          value={timingState.triggerFx}
                          onChange={e => setTimingState({...timingState, triggerFx: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Total Fx</label>
                        <input 
                          type="number" 
                          value={timingState.totalFx}
                          onChange={e => setTimingState({...timingState, totalFx: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Urgency</label>
                        <select 
                          value={timingState.urgency}
                          onChange={e => setTimingState({...timingState, urgency: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                        >
                          <option value="standard">Standard (3 days)</option>
                          <option value="urgent">Urgent (1 day)</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={timingState.weekend}
                            onChange={e => setTimingState({...timingState, weekend: e.target.checked})}
                            className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-green-500 focus:ring-green-500 focus:ring-offset-zinc-950"
                          />
                          <span className="text-sm text-zinc-300">Spans Weekend</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Estimated Missed Fx:</span>
                        <span className="font-semibold text-zinc-100">{timingRes.missedFx}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">New Plan Ready By Fx:</span>
                        <span className="font-semibold text-green-400">#{timingRes.newPlanFx}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CHECKLIST TAB */}
          {mainTab === "checklist" && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100">Adaptive Workflow Checklist</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-zinc-400">{checklistProgress}% Complete</div>
                    <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${checklistProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {["Clinical Assessment", "Dosimetric Review", "Action Plan"].map(category => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{category}</h4>
                      <div className="space-y-2">
                        {CHECKLIST_ITEMS.filter(item => item.category === category).map(item => (
                          <label 
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              checkedItems[item.id] 
                                ? "bg-blue-500/10 border-blue-500/30" 
                                : "bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-900"
                            }`}
                          >
                            <div className="mt-0.5">
                              {checkedItems[item.id] ? (
                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />
                              )}
                            </div>
                            <span className={`text-sm transition-colors ${checkedItems[item.id] ? "text-zinc-200" : "text-zinc-400"}`}>
                              {item.text}
                            </span>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              checked={!!checkedItems[item.id]}
                              onChange={() => toggleCheck(item.id)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        data={SIDEBAR_DATA}
      />

      {/* Urgent Triggers Modal */}
      <AnimatePresence>
        {showUrgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUrgentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-red-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 font-display">Urgent Re-Plan Triggers</h3>
                </div>
                <button 
                  onClick={() => setShowUrgentModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-300">
                  The following are absolute indications for an immediate halt to treatment and urgent re-planning:
                </p>
                
                <ul className="space-y-3">
                  {[
                    "Spinal cord or brainstem dose limit exceeded on daily CBCT.",
                    "Massive tumor progression outside the PTV.",
                    "Immobilization mask or device no longer fits (cannot safely position patient).",
                    "Severe, unexpected Grade 3+ toxicity early in treatment course.",
                    "Significant anatomical shift (e.g., massive pleural effusion, atelectasis) compromising target coverage."
                  ].map((trigger, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-200">{trigger}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowUrgentModal(false)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

