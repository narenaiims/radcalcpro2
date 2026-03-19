import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from "@/components/KeyFactsSidebar";

// ─── GRADE CONFIG ─────────────────────────────────────────────────────────────
const GRADE: Record<number, { label: string; desc: string; color: string; text: string; dot: string }> = {
  0: { label: "0", desc: "None",     color: "#334155", text: "#64748B", dot: "#1E293B" },
  1: { label: "1", desc: "Mild",     color: "#065F46", text: "#6EE7B7", dot: "#10B981" },
  2: { label: "2", desc: "Moderate", color: "#92400E", text: "#FCD34D", dot: "#F59E0B" },
  3: { label: "3", desc: "Severe",   color: "#7C2D12", text: "#FCA5A5", dot: "#EF4444" },
  4: { label: "4", desc: "Life-threatening", color: "#581C87", text: "#E9D5FF", dot: "#A855F7" },
  5: { label: "5", desc: "Death",    color: "#1A0A0A", text: "#FCA5A5", dot: "#7F1D1D" },
};

// ─── TOXICITY DATABASE ────────────────────────────────────────────────────────
const SITES = [
  {
    id: "hn",
    name: "Head & Neck",
    icon: "🗣",
    color: "#F59E0B",
    toxicities: [
      {
        name: "Mucositis (Oral)",
        system: "Mucosal",
        rtog: [
          "No change",
          "Injection / may experience mild pain not requiring analgesic",
          "Patchy mucositis producing serosanguineous discharge; may experience moderate pain requiring analgesic",
          "Confluent fibrinous mucositis; may include severe pain requiring narcotic",
          "Ulceration, haemorrhage or necrosis",
          "Death directly related to toxicity"
        ],
        ctcae: [
          "No change",
          "Asymptomatic or mild symptoms; intervention not indicated",
          "Moderate pain; not interfering with oral intake; modified diet indicated",
          "Severe pain; interfering with oral intake; IV alimentation indicated",
          "Life-threatening consequences; urgent intervention indicated",
          "Death"
        ],
        onset: "Day 7–10",
        peak: "Week 3–5",
        resolution: "2–4 weeks post-RT",
        management: ["Benzydamine mouthwash (Grade 1–2)", "Systemic analgesia (Grade 2–3)", "NGT/PEG if oral intake <50% (Grade 3)", "IV fluids + hospitalisation (Grade 4)"],
        note: "Most common dose-limiting acute toxicity in H&N RT. Concurrent cisplatin significantly worsens."
      },
      {
        name: "Xerostomia",
        system: "Salivary",
        rtog: [
          "No change",
          "Slight dryness; slightly thickened saliva, normal secretion",
          "Moderate dryness; thick viscous saliva; marked decrease in secretion",
          "Complete dryness; no saliva; cannot eat solids",
          "Fibrosis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Symptomatic (dry or thick saliva); unstimulated salivary flow >0.2 mL/min",
          "Mod. symptoms; oral intake altered; unstimulated salivary flow 0.1–0.2 mL/min; IV fluids <24h",
          "Inability to adequately eat/swallow; tube feeding or hospitalisation indicated; flow <0.1 mL/min",
          "Life-threatening consequences",
          "Death"
        ],
        onset: "Week 1–2",
        peak: "End of treatment",
        resolution: "Partial (6–12 months); may be permanent",
        management: ["Parotid-sparing IMRT / VMAT", "Pilocarpine 5mg TDS (Grade 2+)", "Saliva substitutes", "Amifostine (evidence limited)"],
        note: "Late xerostomia most impactful QoL issue. Parotid D_mean <26 Gy significantly reduces risk."
      },
      {
        name: "Dysphagia",
        system: "Swallowing",
        rtog: [
          "No change",
          "Mild dysphagia; may have mild pain requiring non-narcotic",
          "Moderate dysphagia; requiring narcotic, soft diet",
          "Severe dysphagia with dehydration/weight loss >15%; requires NG tube/IV fluids",
          "Complete obstruction, ulceration, perforation, fistula",
          "Death"
        ],
        ctcae: [
          "No change",
          "Symptomatic, able to eat regular diet",
          "Symptomatic and altered eating/swallowing; IV fluids <24h",
          "Severely altered eating/swallowing; tube feeding or parenteral nutrition indicated; hospitalisation",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "Week 2–3",
        peak: "Week 4–6",
        resolution: "Variable; late stricture risk",
        management: ["Speech/swallow therapy", "Dietary modification", "NG tube (Grade 3)", "PEG if prolonged", "Dilation for late stricture"],
        note: "Inferior constrictor and cricopharyngeus dose predictors. IMRT pharyngeal-sparing critical."
      },
      {
        name: "Dermatitis (Skin)",
        system: "Skin",
        rtog: [
          "No change",
          "Faint erythema or dry desquamation; epilation; decreased sweating",
          "Tender/bright erythema, patchy moist desquamation <1cm; moderate oedema",
          "Confluent moist desquamation >1.5cm; pitting oedema",
          "Ulceration, haemorrhage, necrosis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Faint erythema or dry desquamation",
          "Moderate to brisk erythema; patchy moist desquamation mainly in skin folds; moderate oedema",
          "Moist desquamation not confined to skin folds; bleeding induced by minor trauma or abrasion",
          "Life-threatening; skin necrosis or ulceration of full thickness dermis; spontaneous bleeding",
          "Death"
        ],
        onset: "Week 2–3",
        peak: "End of RT",
        resolution: "2–4 weeks post-RT",
        management: ["Aqueous cream / barrier cream (Grade 1)", "Hydrogel dressings (Grade 2–3)", "Silver sulfadiazine (Grade 3)", "Wound care ± topical steroids"],
        note: "Bolus and tangential beams increase skin dose. Skin-sparing technique important in IMRT."
      },
      {
        name: "Osteoradionecrosis (Mandible)",
        system: "Bone",
        rtog: [
          "No change",
          "Minimal bone exposure; no surgery required",
          "Bone exposure; minor surgery required (sequestrectomy)",
          "Bone exposure; major surgery required",
          "Life-threatening; loss of mandible",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; clinical or diagnostic observations only",
          "Symptomatic; medical intervention indicated",
          "Severe symptoms; limiting self-care ADL; elective operative intervention indicated",
          "Life-threatening; urgent intervention indicated",
          "Death"
        ],
        onset: "6 months–years post-RT",
        peak: "1–5 years",
        resolution: "Often requires surgery; rarely self-resolving",
        management: ["Prevention: dental clearance pre-RT", "HBO therapy", "Conservative debridement (Grade 1–2)", "Hemimandibulectomy (Grade 3–4)"],
        note: "Mandible D_max >60 Gy major risk factor. Dental extractions post-RT within 3 years high risk."
      },
    ]
  },
  {
    id: "thorax",
    name: "Thorax / Lung",
    icon: "🫁",
    color: "#60A5FA",
    toxicities: [
      {
        name: "Radiation Pneumonitis",
        system: "Pulmonary",
        rtog: [
          "No change",
          "Mild symptoms; radiographic changes; no steroids required",
          "Moderate symptoms; steroids required",
          "Severe symptoms; steroids required; oxygen required",
          "Severe respiratory insufficiency; continuous oxygen or ventilator",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; clinical or diagnostic observations only; intervention not indicated",
          "Symptomatic; medical intervention indicated; limiting instrumental ADL",
          "Severe symptoms; limiting self-care ADL; oxygen indicated",
          "Life-threatening; urgent intervention indicated",
          "Death"
        ],
        onset: "4–12 weeks post-RT",
        peak: "6–10 weeks",
        resolution: "6–12 weeks (may → fibrosis)",
        management: ["Oral prednisolone 1mg/kg (Grade 2+)", "Antibiotics if superinfection", "O2 therapy (Grade 3)", "ICU/ventilation (Grade 4)", "Slow steroid taper over 4–6 weeks"],
        note: "MLD >20 Gy and V20 >35% major predictors. PACIFIC: durvalumab does not significantly increase Grade ≥3 pneumonitis."
      },
      {
        name: "Pulmonary Fibrosis",
        system: "Pulmonary",
        rtog: [
          "No change",
          "Slight fibrosis or slight loss of pulmonary function; no symptoms",
          "Moderate symptomatic fibrosis; patchy radiographic changes; moderate decrease in pulmonary function",
          "Severe symptomatic fibrosis; dense radiographic changes; severe decrease in pulmonary function",
          "Severe respiratory insufficiency; ventilator support",
          "Death"
        ],
        ctcae: [
          "No change",
          "Mild hypoxemia; radiologic pulmonary fibrosis <25% of lung volume",
          "Moderate hypoxemia; evidence of pulmonary hypertension; radiologic fibrosis 25–50%",
          "Severe hypoxemia; evidence of right-sided heart failure; radiologic fibrosis >50%",
          "Life-threatening; ventilator support indicated",
          "Death"
        ],
        onset: "3–12 months post-RT",
        peak: "12–24 months",
        resolution: "Permanent; progressive",
        management: ["Pulmonary rehab", "O2 long-term therapy", "Anti-fibrotics (nintedanib) — evidence limited", "Palliative management Grade 4"],
        note: "Late sequela of pneumonitis. Dose-volume constraint adherence primary prevention."
      },
      {
        name: "Oesophagitis",
        system: "GI Upper",
        rtog: [
          "No change",
          "Mild dysphagia; soft diet",
          "Moderate dysphagia requiring narcotic analgesia; semi-liquid diet",
          "Severe dysphagia with dehydration/weight loss; NG tube required",
          "Complete obstruction, ulceration, perforation, fistula",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; clinical observations only",
          "Symptomatic; altered eating/swallowing; IV fluids <24h",
          "Severely altered eating/swallowing; tube feeding/TPN or hospitalisation indicated",
          "Life-threatening consequences; urgent intervention",
          "Death"
        ],
        onset: "Week 2–3",
        peak: "Week 4–6",
        resolution: "2–4 weeks post-RT",
        management: ["Mucaine/antacids (Grade 1)", "Opioid analgesia (Grade 2–3)", "NG/PEG feeding (Grade 3)", "IV fluids ± hospitalisation (Grade 3–4)"],
        note: "V55 Gy esophagus most predictive. Concurrent chemotherapy dramatically worsens."
      },
      {
        name: "Cardiac Toxicity (Pericarditis)",
        system: "Cardiovascular",
        rtog: [
          "No change",
          "Asymptomatic; ECG/echo changes only",
          "Symptomatic pericarditis requiring analgesia/anti-inflammatory",
          "Pericarditis with physiological consequences; drainage or surgery required",
          "Tamponade; urgent drainage required",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; ECG changes; no intervention",
          "Symptomatic pericarditis; cardiac function normal; diuretics indicated",
          "Pericarditis with physiological consequences; pericardiocentesis or draining indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "Weeks–years",
        peak: "Acute: 4–8 weeks; Late: years",
        resolution: "Variable; late constrictive pericarditis risk",
        management: ["NSAIDs / colchicine (Grade 2)", "Corticosteroids (Grade 2–3)", "Pericardiocentesis (Grade 4)", "Cardiac surgery (constrictive)"],
        note: "Heart D_mean <20 Gy target. V25 <10%. Concurrent anthracyclines synergistic cardiotoxicity."
      },
    ]
  },
  {
    id: "breast",
    name: "Breast",
    icon: "🎗",
    color: "#F472B6",
    toxicities: [
      {
        name: "Breast Dermatitis",
        system: "Skin",
        rtog: [
          "No change",
          "Faint erythema; dry desquamation; epilation",
          "Tender / bright erythema; patchy moist desquamation < 1cm; oedema",
          "Confluent moist desquamation > 1.5cm; pitting oedema",
          "Ulceration; haemorrhage; necrosis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Faint erythema or dry desquamation",
          "Moderate to brisk erythema; patchy moist desquamation, mainly confined to skin folds and creases",
          "Moist desquamation in areas other than skin folds; bleeding with minor trauma",
          "Necrosis or full-thickness dermal ulceration; spontaneous haemorrhage",
          "Death"
        ],
        onset: "Week 2–3",
        peak: "End of RT",
        resolution: "2–3 weeks post-RT",
        management: ["Aqueous cream prophylaxis", "Calendula cream (RCT evidence)", "Moist wound dressings (Grade 3)", "Systemic antibiotics if infected"],
        note: "Inframammary fold and axilla most affected. Hypofractionation (40 Gy/15#) may reduce acute skin toxicity vs 50 Gy/25#."
      },
      {
        name: "Breast Fibrosis / Cosmesis",
        system: "Soft Tissue",
        rtog: [
          "No change",
          "Slight atrophy; pigmentation change; some hair loss",
          "Patchy atrophy; moderate telangiectasia; total hair loss",
          "Marked atrophy; gross telangiectasia",
          "Ulceration",
          "Death"
        ],
        ctcae: [
          "No change",
          "Mild induration; loss of subcutaneous fat",
          "Moderate fibrosis with loss of subcutaneous tissue; difficult to pinch",
          "Very marked density/firmness; retraction or fixation",
          "Necrosis",
          "Death"
        ],
        onset: "3–24 months",
        peak: "1–2 years",
        resolution: "Permanent; may progress",
        management: ["Pentoxifylline + vitamin E (Grade 2–3 late)", "Hyperbaric oxygen", "Fat grafting (selected cases)", "Physiotherapy"],
        note: "FAST-Forward 26 Gy/5# shows no increased late fibrosis at 5 years vs 40 Gy/15#."
      },
      {
        name: "Lymphoedema (Arm)",
        system: "Lymphatic",
        rtog: [
          "No change",
          "Mild oedema (<5% limb volume increase)",
          "Moderate oedema (5–10% increase); limiting ADL",
          "Severe oedema (>10%); limiting self-care",
          "Disabling",
          "Death"
        ],
        ctcae: [
          "No change",
          "Trace thickening or faint discolouration",
          "Marked discolouration; leathery skin texture; papillary formation; limiting instrumental ADL",
          "Severe symptoms; limiting self-care ADL",
          "Life-threatening; urgent intervention indicated",
          "Death"
        ],
        onset: "Months–years",
        peak: "1–3 years",
        resolution: "Rarely resolves; managed long-term",
        management: ["Complex decongestive physiotherapy (CDT)", "Compression garments", "Manual lymphatic drainage (MLD)", "Avoid venepuncture ipsilateral arm"],
        note: "Axillary RT + ALND synergistically increases risk. SLNB preferred over ALND when possible."
      },
      {
        name: "Radiation Pneumonitis (Breast)",
        system: "Pulmonary",
        rtog: [
          "No change",
          "Mild; no steroids",
          "Moderate; steroids required",
          "Severe; O2 required",
          "Ventilator support",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; radiologic changes only",
          "Symptomatic; limiting instrumental ADL",
          "Severe; limiting self-care ADL; O2 indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "4–12 weeks",
        peak: "8–10 weeks",
        resolution: "6–12 weeks",
        management: ["Corticosteroids 1mg/kg (Grade 2+)", "Antibiotics if infection", "Slow taper 4–6 weeks", "O2 support (Grade 3–4)"],
        note: "RNI (MA.20) associated with 1.3% Grade 2+ pneumonitis. V20 lung constraint mandatory."
      },
    ]
  },
  {
    id: "prostate",
    name: "Prostate / Pelvis",
    icon: "🔵",
    color: "#34D399",
    toxicities: [
      {
        name: "Rectal Toxicity / Proctitis",
        system: "GI Lower",
        rtog: [
          "No change",
          "Mild diarrhoea; mild cramping; < 5 stools/day; slight rectal discharge",
          "Moderate diarrhoea; moderate cramping; > 5 stools/day; rectal mucus/bleeding",
          "Obstruction or bleeding requiring surgery; > 10 stools/day; incontinence; hospitalisation",
          "Necrosis, perforation, fistula",
          "Death"
        ],
        ctcae: [
          "No change",
          "Rectal discomfort; intervention not indicated",
          "Moderate symptoms; medical intervention; limiting instrumental ADL",
          "Severe symptoms; limiting self-care ADL; hospitalisation indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "Acute: Week 2–4; Late: >3 months",
        peak: "Acute: Week 4–6; Late: 1–2 years",
        resolution: "Acute: 4–8 weeks. Late: persistent",
        management: ["Dietary modification: low-residue", "Loperamide (Grade 1–2)", "Topical sucralfate enemas (late)", "APC (argon plasma coagulation) for haemorrhage", "Hyperbaric O2 (Grade 3 late)"],
        note: "Rectal V60 <50% and V70 <20% are key constraints. Rectal spacer (SpaceOAR hydrogel) reduces dose by 5–8 Gy."
      },
      {
        name: "Urinary Toxicity / Cystitis",
        system: "GU",
        rtog: [
          "No change",
          "Frequency/nocturia × 2 baseline; dysuria not requiring medication",
          "Frequency ×3–4 baseline; dysuria/urgency requiring local anaesthetic",
          "Frequency with urgency and nocturia hourly or more; dysuria, haematuria, pelvic pain requiring narcotic",
          "Haematuria requiring transfusion; contracted bladder; severe haemorrhagic cystitis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; clinical observations; intervention not indicated",
          "Symptomatic (frequency, urgency, dysuria); medical intervention; limiting instrumental ADL",
          "Severe symptoms; limiting self-care ADL; elective operative intervention indicated",
          "Life-threatening; urgent intervention indicated",
          "Death"
        ],
        onset: "Acute: Week 2–4; Late: 6–24 months",
        peak: "Acute: Week 4–6; Late: 1–2 years",
        resolution: "Acute: 6–8 weeks. Late: persists/progresses",
        management: ["Alpha-blockers tamsulosin (frequency)", "Oxybutynin/tolterodine (urgency)", "Cystoscopy + fulguration (haematuria)", "Hyperbaric O2 (Grade 3 late haemorrhagic cystitis)", "Continuous bladder irrigation (severe haematuria)"],
        note: "Bladder V65 <50% key constraint. EBRT+brachytherapy boost: higher late GU risk vs EBRT alone."
      },
      {
        name: "Erectile Dysfunction",
        system: "Sexual",
        rtog: [
          "No change",
          "Decreased tumescence",
          "Impaired tumescence; some erections",
          "No erection",
          "",
          ""
        ],
        ctcae: [
          "No change",
          "Decrease in sensitivity; no change in function",
          "Decreased erectile function but erections sufficient for intercourse",
          "Erections insufficient for intercourse",
          "Persistent, significant loss of erectile function",
          "Death"
        ],
        onset: "12–24 months post-RT",
        peak: "2–3 years",
        resolution: "Rarely reverses without treatment",
        management: ["PDE5 inhibitors (sildenafil) — first-line", "Vacuum erection device", "Intracavernosal injection", "Penile prosthesis (refractory)", "Penile rehabilitation programme"],
        note: "Neurovascular bundle dose: D_mean <50 Gy significantly preserves potency. Baseline function most important predictor."
      },
      {
        name: "Bowel Toxicity (Pelvic RT)",
        system: "GI Lower",
        rtog: [
          "No change",
          "Increased frequency/change in bowel habits; rectal mucus/no analgesia",
          "Diarrhoea; mucus/intermittent bleeding; most functions suppressible",
          "Obstruction, fistula, or perforation; bleeding requiring transfusion",
          "Necrosis; perforation; fistula",
          "Death"
        ],
        ctcae: [
          "No change",
          "Mild increase in stool frequency/change in bowel habits; intervention not indicated",
          "Moderate increase in stool frequency; medical intervention; limiting instrumental ADL",
          "Severe increase in stool frequency; hospitalisation; elective operative indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "Acute: Week 2–4; Late: months–years",
        peak: "Week 4–6",
        resolution: "Acute: weeks. Late: chronic",
        management: ["Low-residue diet", "Loperamide", "Psyllium husk (bulk-forming)", "Pelvic floor physiotherapy", "Surgery for fistula/obstruction"],
        note: "Small bowel V45 <195cc critical. Prone positioning with belly-board reduces small bowel dose in pelvic RT."
      },
    ]
  },
  {
    id: "cns",
    name: "CNS / Brain",
    icon: "🧠",
    color: "#A78BFA",
    toxicities: [
      {
        name: "Cerebral Oedema / Acute",
        system: "Neurological",
        rtog: [
          "No change",
          "Fully functional; headache/nausea controlled with dexamethasone",
          "Neurological findings; dexamethasone ≤16mg/day",
          "Serious neurological impairment; dexamethasone >16mg/day",
          "Seizures or paralysis or coma",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; clinical observations only",
          "Moderate symptoms; medical intervention indicated",
          "Severe symptoms; neurological deficit; hospitalisation indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "During or within 2 weeks of RT",
        peak: "Mid-course to end",
        resolution: "Days–weeks with dexamethasone",
        management: ["Dexamethasone (titrated to symptoms)", "Mannitol IV (acute raised ICP)", "Anti-epileptics if seizures", "Avoid dexamethasone >6 weeks (adrenal suppression)"],
        note: "GBM/large tumours higher risk. PTV with large perilesional oedema — consider sequential boost."
      },
      {
        name: "Radiation Necrosis",
        system: "Neurological",
        rtog: [
          "No change",
          "Slight neurological findings; no medications required",
          "Moderate neurological findings; dexamethasone",
          "Severe neurological findings; dexamethasone/mannitol",
          "Seizures/paralysis/coma — not due to disease",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; imaging changes only",
          "Moderate symptoms; medical intervention (steroids) indicated",
          "Severe symptoms; limiting self-care ADL; surgery indicated",
          "Life-threatening; urgent intervention",
          "Death"
        ],
        onset: "6 months – 2 years post-RT",
        peak: "12–18 months",
        resolution: "Rarely resolves; surgical excision may be needed",
        management: ["Bevacizumab (most evidence — reduces oedema/necrosis)", "Dexamethasone (Grade 2–3)", "Hyperbaric O2", "Surgical resection (Grade 4, diagnostic + therapeutic)"],
        note: "Radionecrosis vs tumour progression: PET, MRS, perfusion MRI. V60 brainstem <0.03cc critical."
      },
      {
        name: "Neurocognitive Decline",
        system: "Neurological",
        rtog: [
          "No change",
          "Slight cognitive decline; no functional impact",
          "Moderate cognitive decline; functional limitation, independent",
          "Severe cognitive impairment; requires assistance",
          "Dementia / coma",
          "Death"
        ],
        ctcae: [
          "No change",
          "Mild cognitive deficit; not interfering with daily activities",
          "Moderate cognitive deficit; interfering with complex instrumental ADL",
          "Severe cognitive deficit; limiting self-care ADL",
          "Life-threatening",
          "Death"
        ],
        onset: "3–12 months post-WBRT",
        peak: "12–24 months",
        resolution: "Progressive; may stabilise after WBRT cessation",
        management: ["Hippocampal avoidance WBRT (Brown 2020)", "Memantine — modest protective effect", "Donepezil — cognitive benefit (RTOG 0614)", "Neuropsychology assessment + rehabilitation"],
        note: "Hippocampal D_mean >7.3 Gy correlates with memory decline. Prophylactic memantine recommended with WBRT."
      },
      {
        name: "Lhermitte’s Syndrome",
        system: "Spinal",
        rtog: [
          "No change",
          "Mild — electric shock sensation on neck flexion",
          "Moderate — limits daily activities",
          "Severe — persistent, disabling",
          "",
          ""
        ],
        ctcae: [
          "No change",
          "Mild paraesthesia; not interfering with function",
          "Moderate paraesthesia; medical intervention indicated",
          "Severe paraesthesia; limiting self-care ADL",
          "Life-threatening",
          "Death"
        ],
        onset: "1–3 months post-RT",
        peak: "2–4 months",
        resolution: "Usually resolves 6–12 months",
        management: ["Reassurance (Grade 1)", "NSAIDs / gabapentin (Grade 2)", "Cervical collar to minimise neck flexion", "Monitor for myelopathy progression"],
        note: "Transient demyelination. Different from radiation myelopathy (rare, irreversible). Spinal cord D_max <45–50 Gy protective."
      },
    ]
  },
  {
    id: "rectum",
    name: "Abdomen / GI",
    icon: "🫘",
    color: "#FB923C",
    toxicities: [
      {
        name: "Hepatotoxicity (RILD)",
        system: "Hepatic",
        rtog: [
          "No change",
          "Mild LFT elevation; no clinical symptoms",
          "Moderate LFT elevation; clinical hepatitis; intervention required",
          "Severe hepatic failure; encephalopathy",
          "Hepatic necrosis/coma",
          "Death"
        ],
        ctcae: [
          "No change",
          "Asymptomatic; liver enzyme elevation <3× ULN",
          "Symptomatic hepatic dysfunction; 3–20× ULN; medical intervention indicated",
          "Severe hepatic dysfunction; LFT >20× ULN; hospitalisation",
          "Life-threatening; hepatic encephalopathy",
          "Death"
        ],
        onset: "2 weeks – 3 months",
        peak: "4–6 weeks",
        resolution: "Variable; may → chronic damage",
        management: ["Corticosteroids (Grade 2–3 RILD)", "Ursodeoxycholic acid", "Hepatology review", "Supportive — albumin, diuretics (ascites)"],
        note: "Classic RILD: anicteric ascites. Non-classic RILD: elevated LFTs only. Mean liver dose <25–30 Gy key constraint."
      },
      {
        name: "Renal Toxicity",
        system: "Renal",
        rtog: [
          "No change",
          "Transient creatinine elevation (1.5–2× baseline)",
          "Persistent creatinine elevation (2–3×); urine output normal",
          "Creatinine >3× baseline; oliguria, severe anaemia, severe HTN",
          "Acute renal failure requiring dialysis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Creatinine 1–1.5× baseline; GFR <10% decrease",
          "Creatinine 1.5–3× baseline or GFR 10–50% decrease",
          "Creatinine >3× baseline; GFR >50% decrease; dialysis indicated",
          "Life-threatening; dialysis or transplant indicated",
          "Death"
        ],
        onset: "Months–years",
        peak: "6–24 months",
        resolution: "Rarely reverses; progressive",
        management: ["ACEi/ARB for proteinuria/HTN", "Dialysis (Grade 4)", "Nephrology co-management", "Erythropoietin for anaemia"],
        note: "Kidney V18 <30%. Bilateral > 15 Gy: renal failure risk. Wilms tumour contralateral kidney paramount."
      },
      {
        name: "Enteritis / Small Bowel",
        system: "GI",
        rtog: [
          "No change",
          "Increased stool frequency/cramping; anti-diarrhoeal agents",
          "Moderate diarrhoea/obstruction/nausea/vomiting; requires surgical evaluation",
          "Obstruction/fistula/perforation requiring surgery",
          "Necrosis, perforation, fistula",
          "Death"
        ],
        ctcae: [
          "No change",
          "Mild change in bowel habits; intervention not indicated",
          "Moderate cramping/diarrhoea; IV fluids <24h; limiting instrumental ADL",
          "Severe cramping; hospitalisation; elective operative or radiologic intervention",
          "Life-threatening; urgent operative intervention",
          "Death"
        ],
        onset: "Acute: Week 2–4; Late: months–years",
        peak: "Week 4–6",
        resolution: "Acute resolves; late may be permanent",
        management: ["Low-fat, low-residue diet", "Loperamide, codeine phosphate", "Total parenteral nutrition (severe acute)", "Surgery for fistula/obstruction/perforation"],
        note: "Small bowel V45 <195cc. Late enteritis: chronic malabsorption, bacterial overgrowth — manage with antibiotics, pancreatic enzymes."
      },
    ]
  },
  {
    id: "skin",
    name: "Skin / Superficial",
    icon: "🧴",
    color: "#E879F9",
    toxicities: [
      {
        name: "Acute Radiation Dermatitis",
        system: "Skin",
        rtog: [
          "No change",
          "Faint erythema or dry desquamation; epilation; decreased sweating",
          "Tender / bright erythema; patchy moist desquamation <1cm diameter; moderate oedema",
          "Confluent moist desquamation other than skin folds; diameter > 1.5cm; pitting oedema",
          "Ulceration; haemorrhage; necrosis",
          "Death"
        ],
        ctcae: [
          "No change",
          "Faint erythema or dry desquamation",
          "Moderate to brisk erythema; patchy moist desquamation mainly confined to skin folds and creases; moderate oedema",
          "Moist desquamation in areas other than skin folds and creases; bleeding induced by minor trauma",
          "Skin necrosis or ulceration of full thickness dermis; spontaneous bleeding from involved site",
          "Death"
        ],
        onset: "Day 10–14",
        peak: "End of RT",
        resolution: "2–4 weeks post-RT",
        management: ["Barrier cream (prophylaxis)", "Hydrocolloid/hydrogel dressings (moist desquamation)", "Topical steroids (brisk erythema)", "Silver-containing dressings (infected Grade 3)"],
        note: "Higher risk: bolus, tangential fields, skinfolds, photosensitising drugs (doxorubicin, hydroxyurea)."
      },
      {
        name: "Late Skin Changes / Telangiectasia",
        system: "Skin",
        rtog: [
          "None",
          "Slight atrophy; pigmentation change; some hair loss",
          "Patchy atrophy; moderate telangiectasia; total hair loss",
          "Marked atrophy; gross telangiectasia",
          "Ulceration",
          "Death"
        ],
        ctcae: [
          "None",
          "Telangiectasia covering <10% BSA; asymptomatic",
          "Telangiectasia covering 10–30% BSA; associated blanching, telangiectatic matting",
          "Telangiectasia covering >30% BSA; associated ulceration",
          "Widespread telangiectasia with skin necrosis",
          "Death"
        ],
        onset: "6 months – years",
        peak: "1–3 years",
        resolution: "Permanent; laser treatment possible",
        management: ["Pulsed-dye laser (cosmetic telangiectasia)", "Sun protection mandatory", "Pentoxifylline + vitamin E (fibrosis)", "Topical tretinoin cream"],
        note: "Telangiectasia correlates with D_max >40 Gy (skin). Hypofractionation may slightly increase late skin changes in breast RT."
      },
    ]
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function GradeCell({ gradeNum, text, compact }: { gradeNum: number; text: string; compact?: boolean }) {
  const g = GRADE[gradeNum];
  if (!text || text === "") return (
    <div style={{
      padding: compact ? "6px 8px" : "10px 12px",
      backgroundColor: "rgba(255,255,255,0.02)",
      borderRadius: "8px", minHeight: compact ? "36px" : "52px",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <span style={{ color: "#1E293B", fontSize: "10px" }}>—</span>
    </div>
  );
  return (
    <div style={{
      padding: compact ? "6px 8px" : "10px 12px",
      backgroundColor: g.color + "33",
      borderRadius: "8px",
      borderLeft: `3px solid ${g.dot}`,
      minHeight: compact ? "36px" : "52px"
    }}>
      <div style={{
        fontSize: compact ? "10px" : "11px",
        color: g.text, lineHeight: 1.5
      }}>{text}</div>
    </div>
  );
}

function GradeHeader({ num }: { num: number }) {
  const g = GRADE[num];
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%",
        backgroundColor: g.dot, margin: "0 auto 4px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 900, color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: `0 0 10px ${g.dot}66`
      }}>{num}</div>
      <div style={{ fontSize: "9px", color: g.text, fontWeight: 600, letterSpacing: "0.05em" }}>
        {g.desc}
      </div>
    </div>
  );
}

function ToxicityCard({ tox, siteColor, index }: { tox: typeof SITES[0]['toxicities'][0]; siteColor: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("rtog");

  return (
    <div style={{
      borderRadius: "16px", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.07)",
      backgroundColor: "#0C1320",
      marginBottom: "12px",
      animationDelay: `${index * 0.06}s`
    }}
    className="tox-card"
    >
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px",
        display: "flex", alignItems: "center", gap: "12px",
        background: "none", border: "none", cursor: "pointer", textAlign: "left"
      }}>
        <div style={{
          flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px",
          backgroundColor: siteColor + "22",
          border: `1px solid ${siteColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            fontSize: "8px", fontWeight: 900, color: siteColor,
            fontFamily: "'JetBrains Mono', monospace", textAlign: "center",
            lineHeight: 1.2
          }}>RTOG<br />CTCAE</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "14px", fontWeight: 800, color: "#F1F5F9",
            fontFamily: "'Raleway', sans-serif", marginBottom: "3px"
          }}>{tox.name}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "9px", padding: "2px 8px", borderRadius: "20px",
              backgroundColor: siteColor + "1A",
              color: siteColor, fontFamily: "'JetBrains Mono', monospace",
              border: `1px solid ${siteColor}33`
            }}>{tox.system}</span>
            <span style={{
              fontSize: "9px", padding: "2px 8px", borderRadius: "20px",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "#475569", fontFamily: "'JetBrains Mono', monospace"
            }}>Onset: {tox.onset}</span>
          </div>
        </div>
        <span style={{
          color: siteColor, fontSize: "14px",
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.25s"
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Timeline strip */}
          <div style={{
            display: "flex", gap: "8px", marginTop: "14px", marginBottom: "16px",
            flexWrap: "wrap"
          }}>
            {[
              { label: "Onset", value: tox.onset },
              { label: "Peak", value: tox.peak },
              { label: "Resolution", value: tox.resolution },
            ].map(item => (
              <div key={item.label} style={{
                flex: "1 1 auto", minWidth: "120px",
                padding: "8px 12px", borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: `1px solid ${siteColor}22`
              }}>
                <div style={{
                  fontSize: "9px", color: siteColor,
                  fontWeight: 700, letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace", marginBottom: "3px"
                }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: "11px", color: "#CBD5E1" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* RTOG / CTCAE toggle */}
          <div style={{
            display: "flex", gap: "4px", marginBottom: "14px",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: "4px", borderRadius: "10px"
          }}>
            {["rtog", "ctcae"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1, padding: "8px",
                backgroundColor: view === v ? siteColor : "transparent",
                border: "none", borderRadius: "8px",
                color: view === v ? "#0A0F1A" : "#64748B",
                fontSize: "11px", fontWeight: 800,
                cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.2s"
              }}>
                {v.toUpperCase()} {v === "rtog" ? "v2.0" : "v5.0"}
              </button>
            ))}
          </div>

          {/* Grade table */}
          <div style={{ marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            <div style={{ minWidth: "650px" }}>
              {/* Grade headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "6px", marginBottom: "8px"
              }}>
                {[0,1,2,3,4,5].map(n => <GradeHeader key={n} num={n} />)}
              </div>
              {/* Grade cells */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "6px"
              }}>
                {[0,1,2,3,4,5].map(n => (
                  <GradeCell key={n} gradeNum={n} text={(view === "rtog" ? tox.rtog : tox.ctcae)[n]} />
                ))}
              </div>
            </div>
          </div>

          {/* Management */}
          <div style={{
            padding: "12px 14px", borderRadius: "12px",
            backgroundColor: siteColor + "0D",
            border: `1px solid ${siteColor}2A`, marginBottom: "10px"
          }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: siteColor,
              letterSpacing: "0.1em", marginBottom: "8px",
              fontFamily: "'JetBrains Mono', monospace"
            }}>💊 MANAGEMENT LADDER</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {tox.management.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, fontSize: "10px", fontWeight: 700,
                    color: siteColor, fontFamily: "'JetBrains Mono', monospace",
                    paddingTop: "1px"
                  }}>{i + 1}.</span>
                  <span style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.5 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical note */}
          {tox.note && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <span style={{
                fontSize: "9px", fontWeight: 700, color: "#94A3B8",
                letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace"
              }}>📋 NOTE &nbsp;</span>
              <span style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.6 }}>{tox.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// ─── SIDEBAR DATA ─────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'General Grading',
    emoji: '📊',
    accent: '#38bdf8',
    bg: 'rgba(56,189,232,0.08)',
    border: 'rgba(56,189,232,0.4)',
    rows: [
      { k: 'Grade 1', v: 'Mild / Asymptomatic', mono: true },
      { k: 'Grade 2', v: 'Moderate / Outpatient', mono: true },
      { k: 'Grade 3', v: 'Severe / Hospitalisation', mono: true },
      { k: 'Grade 4', v: 'Life-threatening', mono: true },
      { k: 'Grade 5', v: 'Death', mono: true },
    ]
  },
  {
    title: 'Common Onsets',
    emoji: '⏱️',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.4)',
    rows: [
      { k: 'Mucositis', v: 'Day 7-10', mono: true },
      { k: 'Dermatitis', v: 'Week 2-3', mono: true },
      { k: 'Pneumonitis', v: '1-6 months', mono: true },
      { k: 'Proctitis', v: 'Week 3-4', mono: true },
    ]
  }
];

export default function ToxicityGrading() {
  const [activeSite, setActiveSite] = useState("hn");
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentSite = SITES.find(s => s.id === activeSite);

  const filtered = useMemo(() => {
    if (!currentSite) return [];
    let list = currentSite.toxicities;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(s) ||
        t.system.toLowerCase().includes(s) ||
        t.note?.toLowerCase().includes(s) ||
        t.management.some(m => m.toLowerCase().includes(s))
      );
    }
    return list;
  }, [currentSite, search]);

  const totalTox = SITES.reduce((a, s) => a + s.toxicities.length, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #070C17 0%, #0B1220 55%, #070C17 100%)",
      fontFamily: "'DM Sans', sans-serif", color: "#F1F5F9"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@700;800;900&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 3px; height: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; } @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } .tox-card { animation: fadeUp 0.38s ease both; } .site-scroll { -ms-overflow-style:none; scrollbar-width:none; } .site-scroll::-webkit-scrollbar { display:none; }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: "sticky", top: "44px", zIndex: 40,
        background: "rgba(7,12,23,0.94)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
              background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 0 24px rgba(239,68,68,0.4)"
            }}>⚕</div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: "16px", fontWeight: 900, color: "#F8FAFC",
                fontFamily: "'Raleway', sans-serif", letterSpacing: "-0.02em", lineHeight: 1
              }}>RT Toxicity Grading</h1>
              <div style={{
                fontSize: "10px", color: "#475569", marginTop: "2px",
                fontFamily: "'JetBrains Mono', monospace"
              }}>RTOG v2.0 · CTCAE v5.0 · {SITES.length} sites · {totalTox} toxicities</div>
            </div>
            {/* Grade legend mini */}
            <div style={{ display: "flex", gap: "3px" }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  backgroundColor: GRADE[n].dot,
                  boxShadow: `0 0 6px ${GRADE[n].dot}88`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "8px", fontWeight: 900, color: "#fff",
                  fontFamily: "'JetBrains Mono', monospace"
                }}>{n}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "14px 16px" }}>

        {/* ── SEARCH ── */}
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <span style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)", fontSize: "14px",
            color: "#475569", pointerEvents: "none"
          }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search toxicity, management, organ…"
            style={{
              width: "100%", padding: "11px 14px 11px 42px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px", color: "#F1F5F9",
              fontSize: "13px", outline: "none",
              fontFamily: "'DM Sans', sans-serif"
            }}
            onFocus={e => e.target.style.borderColor = currentSite?.color || "#EF4444"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        {/* ── SITE TABS (scrollable) ── */}
        <div className="site-scroll" style={{
          display: "flex", gap: "6px", overflowX: "auto",
          marginBottom: "16px", paddingBottom: "2px"
        }}>
          {SITES.map(site => {
            const isActive = activeSite === site.id;
            return (
              <button key={site.id} onClick={() => { setActiveSite(site.id); setSearch(""); }} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "30px",
                backgroundColor: isActive ? site.color : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? site.color : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "#0A0F1A" : "#64748B",
                fontSize: "11px", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Raleway', sans-serif",
                transition: "all 0.2s ease",
                boxShadow: isActive ? `0 0 16px ${site.color}44` : "none"
              }}>
                <span>{site.icon}</span>
                <span>{site.name}</span>
                <span style={{
                  fontSize: "9px", opacity: 0.7,
                  backgroundColor: isActive ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.08)",
                  padding: "1px 6px", borderRadius: "10px"
                }}>{site.toxicities.length}</span>
              </button>
            );
          })}
        </div>

        {/* ── GRADE LEGEND BAR ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
          gap: "4px", marginBottom: "16px"
        }}>
          {[0,1,2,3,4,5].map(n => {
            const g = GRADE[n];
            return (
              <div key={n} style={{
                padding: "8px 4px", borderRadius: "10px",
                backgroundColor: g.color + "44",
                border: `1px solid ${g.dot}33`,
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "14px", fontWeight: 900, color: g.dot,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>G{n}</div>
                <div style={{ fontSize: "8px", color: g.text, marginTop: "2px", letterSpacing: "0.04em" }}>
                  {g.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SITE LABEL ── */}
        {currentSite && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "14px", padding: "12px 16px",
            backgroundColor: currentSite.color + "11",
            borderRadius: "12px", border: `1px solid ${currentSite.color}33`
          }}>
            <span style={{ fontSize: "22px" }}>{currentSite.icon}</span>
            <div>
              <div style={{
                fontSize: "15px", fontWeight: 900, color: currentSite.color,
                fontFamily: "var(--font-display)"
              }}>{currentSite.name}</div>
              <div style={{
                fontSize: "10px", color: "#475569",
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {filtered.length} toxicities · RTOG + CTCAE grading · Management ladder
              </div>
            </div>
          </div>
        )}

        {/* ── TOXICITY CARDS ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            color: "#475569", fontSize: "13px"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔬</div>
            No toxicities found for "{search}"
          </div>
        ) : (
          filtered.map((tox, i) => (
            <ToxicityCard
              key={tox.name}
              tox={tox}
              siteColor={currentSite?.color || "#EF4444"}
              index={i}
            />
          ))
        )}

        {/* ── DISCLAIMER ── */}
        <div style={{
          marginTop: "20px", padding: "14px 16px", borderRadius: "12px",
          backgroundColor: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.18)"
        }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, color: "#EF4444",
            letterSpacing: "0.1em", marginBottom: "6px",
            fontFamily: "'JetBrains Mono', monospace"
          }}>⚠️ CLINICAL DISCLAIMER</div>
          <div style={{ fontSize: "11px", color: "#6B7280", lineHeight: 1.7 }}>
            RTOG v2.0 and CTCAE v5.0 criteria summarised for bedside reference. Grading should be performed by trained clinical personnel. Management steps represent general guidance only — institutional protocols, patient co-morbidities and clinical judgement must guide treatment decisions. Always consult NCI CTCAE v5.0 (2017) and RTOG documentation for complete criteria.
          </div>
        </div>
        <div style={{ height: "32px" }} />
      </div>

      <KeyFactsSidebar data={SIDEBAR_DATA} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} />

    </div>
  );
}
