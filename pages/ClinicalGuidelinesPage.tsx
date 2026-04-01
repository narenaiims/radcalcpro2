import React, { useState } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Regimen {
  dose: string;
  fx: string;
  bed10: string;
  indication: string;
  evidence?: string;
}

const QUICK_REF_DATA = [
  {
    category: "MSCC (Spinal Cord)",
    items: [
      { label: "Dexamethasone", value: "16mg STAT, 4mg QID" },
      { label: "SINS Score", value: "≥ 7: Consult Surgery" },
      { label: "RT Regimen", value: "8 Gy/1fx or 20 Gy/5fx" },
      { label: "Patchell RCT", value: "Surg+RT > RT (Ambulatory)" },
      { label: "SCORAD", value: "8 Gy/1fx non-inferior to 20 Gy/5fx" },
    ]
  },
  {
    category: "SVCS (Vascular)",
    items: [
      { label: "NSCLC RT", value: "3 Gy x 3 then 2 Gy x 7" },
      { label: "Stenting", value: "Fastest relief (hours)" },
      { label: "SCLC/Lymphoma", value: "Chemo first-line" },
      { label: "Steroids", value: "Dexamethasone for oedema" },
      { label: "Anticoagulation", value: "If thrombus present" },
    ]
  },
  {
    category: "Brain Mets",
    items: [
      { label: "GPA Score", value: "Prognostic index (KPS, Age, #Mets)" },
      { label: "SRS Limit", value: "< 4 cm lesions (V12 < 10cc)" },
      { label: "WBRT", value: "30 Gy/10fx or 20 Gy/5fx" },
      { label: "HA-WBRT", value: "Hippocampal avoidance (NRG CC001)" },
      { label: "Memantine", value: "Neuroprotection (RTOG 0614)" },
    ]
  },
  {
    category: "Bone Mets",
    items: [
      { label: "Single Fraction", value: "8 Gy/1fx (Standard)" },
      { label: "Multi-Fraction", value: "20 Gy/5fx or 30 Gy/10fx" },
      { label: "Re-irradiation", value: "8 Gy/1fx (ROSEL/NCIC)" },
      { label: "SBRT", value: "16-18 Gy/1fx (Oligomet)" },
    ]
  }
];

interface Emergency {
  id: string;
  title: string;
  abbr: string;
  category: 'Neuro' | 'Vascular' | 'Airway' | 'Bone' | 'Hematologic' | 'GI';
  urgency: 'STAT' | 'Urgent' | 'Semi-urgent';
  definition: string;
  epidemiology: string;
  regimens: Regimen[];
  initialManagement: string[];
  rtIndications: string[];
  rtContraindications?: string[];
  rtTechnique: string;
  prognosis: string;
  keyTrials: string[];
  pitfall: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EMERGENCIES: Emergency[] = [
  {
    id: 'mscc',
    title: 'Malignant Spinal Cord Compression',
    abbr: 'MSCC',
    category: 'Neuro',
    urgency: 'STAT',
    definition: 'Compression of the thecal sac and spinal cord or cauda equina by direct tumour extension or vertebral collapse. Occurs in 5–10% of cancer patients. Thoracic (70%) > Lumbar (20%) > Cervical (10%).',
    epidemiology: 'Most common primaries: Lung (15%), Breast (15%), Prostate (10%), Myeloma (10%), Renal (7%), Lymphoma (6%), Unknown primary (7%). Median survival after MSCC: 3–6 months (dependent on ambulatory status and primary).',
    regimens: [
      { dose: '8 Gy', fx: '1', bed10: '14.4 Gy₁₀', indication: 'Poor prognosis, non-ambulatory, KPS <60, short life expectancy (<3 mo)', evidence: 'Maranzano JCOG 2005: 8 Gy×1 = 30 Gy/10fx for motor function' },
      { dose: '20 Gy', fx: '5', bed10: '28 Gy₁₀', indication: 'Intermediate prognosis, KPS 60–70, ambulatory with assistance', evidence: 'NCRN SCORAD trial (2019): 8 Gy×1 non-inferior to 20 Gy/5fx (short-course)' },
      { dose: '30 Gy', fx: '10', bed10: '39 Gy₁₀', indication: 'Good prognosis, ambulatory, radiosensitive histology (breast, prostate, lymphoma)', evidence: 'Patchell RCT: surgery+RT vs RT alone (2005)' },
      { dose: '37.5 Gy', fx: '15', bed10: '47 Gy₁₀', indication: 'Good prognosis, curative intent, good performance status, oligometastatic disease' },
      { dose: '24 Gy', fx: '3 (SBRT)', bed10: '43.2 Gy₁₀ (cord: 57.6 Gy₃)', indication: 'Spine SBRT: reirradiation or oligometastatic disease, radioresistant histology (RCC, melanoma, sarcoma)', evidence: 'ASTRO SBRT spine guidelines 2022; Sahgal cord constraint: Dmax <17 Gy/2fx' },
    ],
    initialManagement: [
      'Dexamethasone 16 mg IV STAT (loading), then 4 mg QID. Reduce over 2 weeks after RT completion.',
      'MRI whole spine (gold standard) within 24h. Plain X-ray and CT if MRI unavailable/contraindicated.',
      'SINS Score (Spinal Instability Neoplastic Score): 0–6 Stable; 7–12 Potentially Unstable (refer to surgery); 13–18 Unstable (mandatory surgery). Components: Location, Pain, Bone lesion, Alignment, Vertebral collapse, Posterolateral involvement.',
      'Urgent Neurosurgical referral: surgical decompression if (1) neurological deterioration on steroids, (2) spinal instability (SINS score ≥7), (3) previous RT to site, (4) bony fragment compressing cord, (5) unknown primary (tissue diagnosis needed).',
      'Patchell criteria for surgery: mechanically unstable, single-level, KPS ≥ 50, expected survival >3 months, solid tumour (not lymphoma/myeloma/SCLC — radiosensitive, treat with RT).',
      'Bed rest with log-roll precautions until spinal stability assessed.',
      'DVT prophylaxis (LMWH) unless neurological deterioration or haemorrhagic risk.',
      'Urinary catheter if urinary retention.',
      'Target RT start within 24h of diagnosis (NICE guideline NG127).',
    ],
    rtIndications: [
      'Not a surgical candidate (performance status, co-morbidities, disseminated disease)',
      'Radiosensitive histology: lymphoma, myeloma, SCLC, seminoma → RT first-line',
      'Post-surgical adjuvant RT (within 2 weeks of surgery)',
      'Multiple-level involvement (surgery less feasible)',
    ],
    rtContraindications: [
      'Spinal instability requiring hardware fixation first (stabilise then RT)',
      'Rapidly deteriorating neurology requiring emergency surgery',
    ],
    rtTechnique: 'AP/PA or posterior oblique field. Field: 2 vertebral bodies above and below affected level. Consider CT planning for accurate spinal cord PRV. For SBRT: CBCT daily, CTV=GTV (gross disease only), cord PRV constraint (Dmax <14 Gy/1fr, <17 Gy/2fr, <20 Gy/3fr per Sahgal). Contouring: ASTRO MSCC contouring guideline (Damast 2021).',
    prognosis: 'Tokuhashi score and Tomita score guide prognosis/surgery decision. Ambulatory at RT start: 80% remain ambulatory. Non-ambulatory at start: 30–40% recover. Bladder/bowel function: less recoverable than motor function. Median survival: ambulatory 6mo, non-ambulatory <3mo.',
    keyTrials: [
      'Patchell RA et al. Lancet 2005: Surgery+RT vs RT alone — surgery group better ambulatory rate (84% vs 57%), longer ambulation duration.',
      'Maranzano E et al. JCO 2005: 8 Gy×1 vs 30 Gy/10fx — equivalent motor response.',
      'SCORAD (2019): 8 Gy×1 non-inferior to 20 Gy/5fx for MSCC in RCT (n=686).',
      'NICE NG127 (2023): MSCC management guideline UK.',
    ],
    pitfall: 'Do NOT start RT without corticosteroids — steroid pretreatment is mandatory (reduces cord oedema). Delay in diagnosis >24h worsens ambulatory outcomes. Lymphoma, myeloma, SCLC: RT without surgery (radiosensitive). Solid tumours with instability: surgery first.'
  },

  {
    id: 'svcs',
    title: 'Superior Vena Cava Syndrome',
    abbr: 'SVCS',
    category: 'Vascular',
    urgency: 'Urgent',
    definition: 'Obstruction of SVC (±innominate vein) causing impaired venous drainage from head, neck, and upper extremities. Life-threatening if airway oedema or cerebral oedema present. Stanford Classification: I (90% obstruction, collaterals); II (90-100% obstruction, azygous patent); III (100% obstruction, azygous reversed); IV (100% obstruction, all collaterals blocked).',
    epidemiology: 'Malignant causes: 90%. Lung cancer (NSCLC 52%, SCLC 22%), Lymphoma (10%), Metastatic (10%). Benign: catheter/device-related thrombosis (increasing incidence). Grading (CTCAE v5.0): G1 (Asymptomatic); G2 (Moderate); G3 (Severe — stridor, dysphagia); G4 (Life-threatening — cerebral/laryngeal oedema); G5 (Death).',
    regimens: [
      { dose: '3 Gy×3 then 2 Gy×7 (=23 Gy)', fx: '10', bed10: '27.9 Gy₁₀', indication: 'NSCLC: initial large fractions for rapid decompression, then conventional tail', evidence: 'Armstrong strategy for rapid symptomatic relief' },
      { dose: '30 Gy', fx: '10', bed10: '39 Gy₁₀', indication: 'Standard palliative NSCLC or unknown primary' },
      { dose: '20 Gy', fx: '5', bed10: '28 Gy₁₀', indication: 'Poor PS, urgent symptom relief needed' },
      { dose: '45 Gy', fx: '25 (if SCLC)', bed10: '54 Gy₁₀', indication: 'SCLC: systemic chemo preferred, but if RT: concurrent chemo-RT (etoposide/cisplatin + RT)' },
    ],
    initialManagement: [
      'Elevate head of bed to 45°. Supplemental oxygen. IV access in lower limbs (not upper limbs — impaired venous return).',
      'Dexamethasone 8–16 mg/day for cerebral/laryngeal oedema.',
      'Tissue diagnosis BEFORE treatment whenever feasible (bronchoscopy, EBUS, CT-guided biopsy) — histology determines optimal treatment.',
      'Stenting (SVC/innominate): fastest symptom relief (hours), effective in 95%. First-line for Stanford III/IV (life-threatening) or if diagnosis known/treatment resistance expected.',
      'Chemotherapy FIRST for SCLC, DLBCL, germ cell — excellent response rates, definitive treatment. RT adjunct.',
      'NSCLC: RT + stenting or chemo-RT depending on stage and PS.',
      'Anticoagulation if thrombosis component identified on CT venogram.',
      'Furosemide only if true fluid overload — avoid over-diuresis.',
    ],
    rtIndications: [
      'NSCLC: primary treatment if chemotherapy not feasible',
      'SCLC: concurrent chemo-RT (definitive treatment)',
      'Lymphoma: RT as consolidation or if chemo-refractory',
      'Refractory/recurrent SVCS after stent (re-RT possible)',
      'Unknown primary: empirical RT while awaiting histology',
    ],
    rtTechnique: 'AP/PA or 3D-CRT. Field includes mediastinum, hilum, and primary tumour. For emergency: consider 3–4 Gy large fractions for first 2–3 fractions then reduce to standard fraction. CBCT setup verification. Cord constraint: Dmax ≤45 Gy (conventional).',
    prognosis: 'Median OS depends entirely on histology: SCLC 10–12 mo with treatment. NSCLC (stage III treated definitively) 15–18 mo. Untreated: survival days-weeks. Symptom relief with RT: 70–90% within 2 weeks. Stent: symptom relief within 24–48h.',
    keyTrials: [
      'Rowell NP, Gleeson FV. Cochrane 2002: RT + steroids effective for SVCS palliation.',
      'NICE NG12 lung guidelines: stenting first-line for life-threatening SVCS.',
      'Armstrong BA et al. JCO 1987: large initial fractions strategy for rapid relief.',
    ],
    pitfall: 'Never prescribe furosemide (Lasix) as first-line — SVC obstruction is NOT cardiac oedema. Diuretics cause hypovolaemia, worsening hypoperfusion. Stenting provides fastest relief — do NOT delay for RT setup if airway compromise present (Stanford Grade IV).'
  },

  {
    id: 'brainmets',
    title: 'Brain Metastases (Symptomatic)',
    abbr: 'Brain Mets',
    category: 'Neuro',
    urgency: 'Urgent',
    definition: 'Intracranial metastases presenting with symptomatic mass effect, oedema, seizure, or neurological deficit. Occur in 20–40% of cancer patients. Median survival without treatment: 1–2 months.',
    epidemiology: 'Sources: Lung (40–50%), Breast (15–25%), Melanoma (10%), RCC (7%), CRC (5%), Unknown primary (15%). Melanoma: high predilection for brain. EGFR/ALK NSCLC: high brain met risk. HER2+ breast: high brain met risk (30–50% lifetime).',
    regimens: [
      { dose: '30 Gy', fx: '10', bed10: '39 Gy₁₀', indication: 'Standard WBRT: multiple mets (>4), poor prognosis, leptomeningeal disease, post-SRS additional disease', evidence: 'Borgelt 1980, RTOG 7916 — established standard' },
      { dose: '20 Gy', fx: '5', bed10: '28 Gy₁₀', indication: 'Short-course WBRT: poor PS (KPS<50), limited prognosis <2 months. QUARTZ trial benchmark.' },
      { dose: '12 Gy', fx: '1 (SRS)', bed10: '26.4 Gy₁₀ (≥3cm: 18Gy/1fr)', indication: 'SRS single fraction: 1–4 mets, <3 cm, KPS ≥70. Dose 12 Gy(≥3cm), 15 Gy(2–3cm), 18–24 Gy(<2cm)', evidence: 'RTOG 9508: SRS boost + WBRT ↑survival >3cm. EORTC 22952: SRS vs SRS+WBRT.' },
      { dose: '27 Gy', fx: '3 (SRS)', bed10: '51.3 Gy₁₀', indication: 'SRS 3fr: 3–4 cm lesions or eloquent cortex. Reduced radionecrosis vs 1fr for large lesions.' },
      { dose: '25 Gy', fx: '5 (SRS)', bed10: '37.5 Gy₁₀', indication: 'Fractionated SRS: 4–6 cm, eloquent cortex, or post-op cavity (NCCTG N107C).' },
    ],
    initialManagement: [
      'Dexamethasone: symptomatic oedema → 4–8 mg BID (max 16 mg/day loading dose). Taper by 2 mg/week after RT if tolerated.',
      'Antiepileptics: only if seizures occur — prophylactic AEDs NOT recommended (ASCO/EANO guideline).',
      'Neurosurgical referral: single lesion >3 cm accessible area, good PS, controlled systemic disease → surgical resection.',
      'Systemic therapy considerations: EGFR-mutant NSCLC with brain mets → osimertinib (FLAURA2: CNS PFS benefit). ALK+ → alectinib/brigatinib (CNS penetration). HER2+ breast → tucatinib+trastuzumab+capecitabine (HER2CLIMB: CNS benefit). Melanoma BRAF+ → dabrafenib+trametinib.',
      'MRI brain with gadolinium (gold standard); CT brain contrast if MRI unavailable.',
      'Consider spinal MRI if leptomeningeal spread suspected.',
    ],
    rtIndications: [
      'WBRT: >4 mets, leptomeningeal dissemination, multiple recurrences after SRS, SCLC brain mets (prophylactic or therapeutic)',
      'SRS alone: 1–10 mets (selected), KPS ≥70, controlled systemic disease or active systemic treatment, lesion <4 cm',
      'Post-op SRS (cavity): NCCTG N107C — cavity SRS non-inferior to post-op WBRT for LC, better cognitive outcomes',
      'HA-WBRT + Memantine (NRG CC001): KPS ≥ 60, >4 mets, prognosis 4–6 months — reduces cognitive decline',
    ],
    rtTechnique: 'WBRT: opposed lateral fields. Borders: superior vertex, inferior C2 (include cerebellum), posterior retina-to-retina flash. HA-WBRT: VMAT or IMRT. Hippocampal PRV (2 mm expansion): V40Gy <100% (mean <8 Gy). Memantine 10 mg BID weeks 1–24. SRS: Gamma Knife, CyberKnife or SRS-LINAC. CBCT localisation. Frame-based (Gamma Knife) or frameless (CyberKnife/LINAC). V12Gy <10 cm³ (QUANTEC radionecrosis constraint).',
    prognosis: 'GPA (Graded Prognostic Assessment) Score: Age (<50, 50-60, >60), KPS (70, 80, 90-100), Number of Brain Mets (1, 2-3, >3), Extracranial Metastases (Present, Absent). GPA 0-1: OS 2.6 mo; GPA 3.5-4: OS 11 mo. DS-GPA (diagnosis-specific) now preferred.',
    keyTrials: [
      'QUARTZ (Mulvenna 2016, Lancet): WBRT vs optimal supportive care for NSCLC brain mets — no OS benefit for poor PS patients.',
      'NRG CC001 (Brown 2020, JCO): HA-WBRT + Memantine vs WBRT + Memantine — significantly improved cognitive function at 4mo.',
      'NCCTG N107C (Brown 2017, Lancet Oncol): Post-op SRS cavity vs post-op WBRT — SRS non-inferior for OS, superior cognitive outcomes.',
      'EORTC 22952 (Kocher 2011): SRS±WBRT — WBRT reduces intracranial recurrence but no OS benefit; cognitive harm.',
      'RTOG 9508: SRS boost + WBRT vs WBRT alone — SRS improves MS for single met, KPS improvement.',
    ],
    pitfall: 'WBRT is NOT superior to SRS in patients with ≤10 mets and good PS — it adds neurocognitive harm without OS benefit (EORTC 22952, NRG CC001). Prophylactic AEDs are NOT indicated. Do not omit hippocampal avoidance for good-prognosis patients — cognitive preservation is a measurable outcome.'
  },

  {
    id: 'hemoptysis',
    title: 'Massive Haemoptysis / Airway Obstruction',
    abbr: 'Haemoptysis',
    category: 'Airway',
    urgency: 'STAT',
    definition: 'Haemoptysis: expectoration of blood from lower respiratory tract. Massive = >200–600 mL/24h (definitions vary; any life-threatening bleed = massive). Airway obstruction: endoluminal or extrinsic compression causing dyspnoea/stridor/post-obstructive pneumonia.',
    epidemiology: 'Malignant causes: primary lung cancer (NSCLC/SCLC), carcinoid, endobronchial metastases. 3% of lung cancer patients develop massive haemoptysis. Mortality without treatment: 50–100% for massive haemoptysis. RT effective for haemostasis in 70–95% of cases.',
    regimens: [
      { dose: '8.5 Gy', fx: '1 (HDR-BT)', bed10: '15.5 Gy₁₀', indication: 'Endobronchial HDR brachytherapy: endobronchial/peribronchial tumour with accessible airway. Highly localised haemostasis.', evidence: 'Mallick (2020): HDR-BT 8.5 Gy×1–3 effective for haemoptysis' },
      { dose: '20 Gy', fx: '5', bed10: '28 Gy₁₀', indication: 'Standard short-course EBRT: PS ≥60, ongoing haemoptysis, airway obstruction. Most commonly used.' },
      { dose: '30 Gy', fx: '10', bed10: '39 Gy₁₀', indication: 'Better prognosis, acceptable PS, good lung function. More durable haemostasis.' },
      { dose: '17 Gy', fx: '2 (1 week apart)', bed10: '31.5 Gy₁₀', indication: 'Two-fraction regimen (RTOG 8502 schedule): convenient, effective for palliation.' },
      { dose: '10 Gy', fx: '1', bed10: '20 Gy₁₀', indication: 'Single fraction for very poor PS or very short prognosis. Rapid haemostasis in ≥65%.' },
    ],
    initialManagement: [
      'AIRWAY FIRST: Position patient — bleeding lung DOWN (dependent). Supplemental oxygen. Call anaesthetics/thoracic team.',
      'Rigid bronchoscopy: gold standard for active massive haemoptysis — suction, tamponade, endobronchial blocker, laser, APC (argon plasma coagulation), cryotherapy.',
      'Bronchial artery embolisation (BAE): interventional radiology — fastest definitive haemostasis. Effective in 70–90% short-term. First-line for massive haemoptysis if bronchoscopy not immediately available.',
      'Tranexamic acid IV (1g TDS) or nebulised — inhibits fibrinolysis. Useful adjunct.',
      'IV access ×2, type and crossmatch, FFP/platelets if coagulopathic.',
      'CT angiography: identifies bleeding vessel for BAE guidance.',
      'Cough suppressants (codeine): reduces haemoptysis exacerbation. Avoid in COPD.',
      'Thoracic surgery consult: resection rarely appropriate for emergency haemoptysis; consider for isolated focal disease with good reserves.',
    ],
    rtIndications: [
      'Central/endobronchial tumour causing haemoptysis or obstruction',
      'Failed bronchoscopic/endovascular haemostasis',
      'Subacute or recurrent haemoptysis (not immediately life-threatening)',
      'Post-obstructive pneumonia from endobronchial tumour',
      'Palliative dyspnoea from extrinsic compression',
    ],
    rtTechnique: 'AP/PA or 3D-CRT. Field: primary tumour + mediastinal nodes (if obstructive component from nodal disease). Consider 3D-CT planning for cord sparing. Cord Dmax <45 Gy (conventional 10fx). Endobronchial BT: flexible bronchoscopy-guided catheter placement, 5 mm reference isodose from catheter centre. HDR Ir-192 step-and-shoot. Treatment: outpatient, 10 min session.',
    prognosis: 'Haemoptysis control: EBRT 70–95% (complete/partial). Duration: median 3–6 months. Endobronchial BT: 85–90% initial haemostasis, suitable for re-treatment. Obstructive atelectasis: reopens in 60–80% with EBRT. Median survival of advanced lung cancer with haemoptysis: 3–6 months.',
    keyTrials: [
      'Macbeth FA et al. MRC Radiotherapy trial 1996: single-fraction vs multi-fraction — similar symptom control for palliation.',
      'Sundset R et al. Endobronchial BT review: 8.5–10 Gy×1 HDR effective for haemoptysis.',
      'SOCCAR trial (2016): two fractions (17 Gy/2) vs multi-fraction — similar palliative efficacy.',
      'RTOG 9311: dose escalation for lung (defines field borders and constraints used for palliative)',
    ],
    pitfall: 'Massive haemoptysis: do NOT lie patient flat — aspiration of blood into contralateral lung → bilateral flooding → death. Dependent position (bleeding side down) protects healthy lung. BAE is FASTER than setting up RT — use bronchoscopy/BAE first for active haemoptysis, RT for definitive control.'
  },

  {
    id: 'bonepain',
    title: 'Painful Bone Metastases',
    abbr: 'Bone Mets',
    category: 'Bone',
    urgency: 'Semi-urgent',
    definition: 'Most common indication for palliative RT. Osteolytic (RCC, lung, breast, myeloma) or osteoblastic (prostate, carcinoid) or mixed (breast). Mechanisms: periosteal stretch, cytokine-mediated pain (IL-1, TNF-α, prostaglandins), pathological fracture.',
    epidemiology: 'Bone mets in 30–70% of cancer patients (autopsy). Common primaries: Prostate (68%), Breast (60%), Thyroid (50%), Lung (36%), RCC (40%), Bladder (40%), Melanoma (15%). Most common sites: Lumbar spine, Thoracic spine, Pelvis, Ribs, Femur.',
    regimens: [
      { dose: '8 Gy', fx: '1', bed10: '14.4 Gy₁₀', indication: 'Pain palliation — ALL presentations (EBRT uncomplicated). NICE guideline first-line. Re-treatment possible.', evidence: 'ASTRO/ASCO/ARS guideline 2017: 8 Gy×1 = 30 Gy/10fx for pain response (Level 1A)' },
      { dose: '20 Gy', fx: '5', bed10: '28 Gy₁₀', indication: 'Multiple sites, frail patient, preferred by some for spinal metastases (longer durable response).' },
      { dose: '30 Gy', fx: '10', bed10: '39 Gy₁₀', indication: 'Good prognosis, expected longer survival, weight-bearing bone, nerve compression.' },
      { dose: '24 Gy', fx: '2 (12 Gy/fx, SBRT)', bed10: '52.8 Gy₁₀', indication: 'SBRT for spine oligomets: excellent LC, radiation-resistant histology (RCC, melanoma, sarcoma). ASTRO 2022 spine SBRT guideline.', evidence: 'RTOG 0631: single-fraction spine SBRT 16–18 Gy vs conventional 8 Gy×1.' },
      { dose: 'Sr-89 / Ra-223', fx: 'Systemic', bed10: 'N/A', indication: 'Widespread osteoblastic bone mets: Sr-89 (β−) for pain; Ra-223 (Xofigo, α) for mCRPC — OS benefit (ALSYMPCA 2013).' },
    ],
    initialManagement: [
      'WHO analgesic ladder: NSAID + opioid (titrate). Dexamethasone 4–8 mg for acute pain flare.',
      'Bisphosphonates (zoledronic acid 4 mg IV 3-weekly) or Denosumab 120 mg SC: skeletal-related event (SRE) prevention — NOT analgesic.',
      'Pathological fracture: orthopaedic surgical fixation FIRST, then adjuvant RT (within 2 weeks). RT alone insufficient for long bone fracture (impending or complete).',
      'Pain flare (transient worsening 24–72h post-RT): occurs in 30–40%. Dexamethasone 8 mg day of and day after RT reduces pain flare (randomised evidence: RTOG 1014).',
      'Impending fracture criteria (Mirels score ≥9): prophylactic surgery. Femoral neck lesion ≥50%: fix before RT.',
    ],
    rtIndications: [
      'Painful bone metastasis not controlled by analgesics',
      'Impending pathological fracture (post-fixation RT)',
      'Neurological compromise (MSCC — separate protocol)',
      'Re-irradiation for pain recurrence (8 Gy×1 re-treatment evidence: RTOG 0417)',
    ],
    rtTechnique: 'Single field (AP or lateral) or opposed fields. Field: tumour + 2 cm margin. Simple 2D or 3D CT-planned. For vertebral mets: CT planning mandatory (cord constraint). SBRT spine: see MSCC protocol. Dose to reference point: ICRU point, or isocentre.',
    prognosis: 'Mirels\' Score for impending fracture: Site (Upper=1, Lower=2, Peritrochanteric=3), Pain (Mild=1, Mod=2, Func=3), Lesion (Blastic=1, Mixed=2, Lytic=3), Size (<1/3=1, 1/3-2/3=2, >2/3=3). Score ≥8: consider prophylactic fixation before RT. Pain response rates: complete 33%, partial 67% (ASTRO meta-analysis). Onset: 2–4 weeks. Duration: 12–16 weeks (8 Gy×1), 24 weeks (30 Gy/10fx).',
    keyTrials: [
      'ASTRO/ASCO/ARS Evidence-Based Guideline 2017: 8 Gy×1 equivalent to multi-fraction for pain response — Grade A.',
      'van der Linden (2004): 8 Gy×1 vs 24 Gy/6fx — equivalent pain relief, higher re-treatment rate with single fraction.',
      'RTOG 0417 (Chow 2014): Re-irradiation 8 Gy×1 after initial 8 Gy×1 — safe and effective.',
      'RTOG 1014: Dexamethasone for pain flare prophylaxis — significantly reduces pain flare after single-fraction RT.',
      'ALSYMPCA (Parker 2013): Ra-223 vs placebo mCRPC — OS benefit 3.6 months (first RT agent with OS benefit in solid tumour).',
    ],
    pitfall: '8 Gy×1 and 30 Gy/10fx have EQUAL pain response rates — use 8 Gy×1 as default (less patient burden, equally effective, re-treatment possible). DO NOT use larger doses as default citing "better response." The only advantage of multi-fraction is longer duration of response and lower re-treatment rate — relevant for good-prognosis patients.'
  },

  {
    id: 'leptomeningeal',
    title: 'Leptomeningeal Disease (LCD)',
    abbr: 'LCD / LMD',
    category: 'Neuro',
    urgency: 'Urgent',
    definition: 'Diffuse seeding of cancer cells into the subarachnoid space and leptomeninges (pia + arachnoid). Also: carcinomatous meningitis, neoplastic meningitis. Carries very poor prognosis. Different from solid brain mets — requires different treatment approach.',
    epidemiology: 'Incidence: 5–8% solid tumours (autopsy higher). Most common: Breast (12–35% of advanced breast), Lung (NSCLC EGFR/ALK 10–20%), Melanoma (20%), GI (<5%), Lymphoma/leukaemia (common in haematological). Median survival: 6–8 weeks untreated, 3–6 months with treatment.',
    regimens: [
      { dose: '30 Gy', fx: '10 (WBRT)', bed10: '39 Gy₁₀', indication: 'WBRT: diffuse brain involvement, altered consciousness, multiple cranial nerve palsies, poor PS.' },
      { dose: '20–30 Gy', fx: '10 (focal)', bed10: '28–39 Gy₁₀', indication: 'Focal RT to symptomatic site (e.g., cauda equina, cranial nerve root): radicular pain, focal motor deficit.' },
      { dose: 'IT MTX 12 mg', fx: 'QOD ×5, then weekly', bed10: 'N/A', indication: 'Intrathecal chemotherapy (ITT): breast/solid tumours. Via lumbar puncture or Ommaya reservoir.' },
    ],
    initialManagement: [
      'MRI brain + full spine with gadolinium (FACT protocol): sulcal enhancement, leptomeningeal nodules, cauda equina nodularity.',
      'CSF cytology: lumbar puncture ×3 if MRI equivocal. Single LP sensitivity: 50%; ×3 LP: >80%.',
      'Dexamethasone 16 mg/day for symptomatic oedema (use cautiously — may mask improvement).',
      'Intrathecal chemotherapy (solid tumours): IT methotrexate (12 mg) or IT AraC (50 mg) — Ommaya reservoir for prolonged access. Note: not curative, palliative intent.',
      'Targeted therapy: EGFR-mutant NSCLC → osimertinib (excellent CNS penetration, FLAURA: LMD responses). ALK+ → lorlatinib. HER2+ breast → trastuzumab deruxtecan (T-DXd, DESTINY-Breast12).',
      'Haematological LCD: systemic chemotherapy + IT chemo + WBRT (leukemia/lymphoma — potentially curative).',
    ],
    rtIndications: [
      'WBRT: diffuse symptomatic cerebral involvement',
      'Focal RT: radicular pain, cranial nerve palsy, focal cord compression',
      'Adjuvant RT to ventricular system in haematological LCD (curative-intent)',
      'CSI (craniospinal irradiation): select cases (medulloblastoma with LMD, haematological — rarely in solid tumours)',
    ],
    rtTechnique: 'WBRT: see Brain Mets protocol. CSI (selected): PA spine field with cranial field match. Junction shift weekly to avoid dose overlap. Spine PTV: entire thecal sac. Dmax cord: inherent — this IS the cord.',
    prognosis: 'Median OS: 3–6 months (solid tumours). Better prognosis: breast > lung > melanoma. Haematological LCD (lymphoma, ALL): potentially curable with IT chemo + WBRT. Functional status at diagnosis most important predictor. EGFR-mutant NSCLC with LCD: osimertinib alone → median PFS 8.6 mo (BLOOM study).',
    keyTrials: [
      'BLOOM study (Yang 2020): Osimertinib for EGFR-mutant NSCLC LMD — ORR 62%, median OS 11 mo.',
      'LORLATINIB for ALK+ LMD: ORR 75% (CNS). Phase II data.',
      'IT vs IV chemo for LMD: no RCT data. IT chemo standard practice for solid tumour LMD.',
    ],
    pitfall: 'LMD is NOT the same as brain metastases — requires CSF evaluation (MRI + LP). IT chemotherapy is NOT appropriate for patients with spinal block (risk of tonsillar herniation). WBRT controls symptoms but does NOT address spinal disease — combine with focal spinal RT or IT chemo for cord/cauda equina involvement.'
  },
  {
    id: 'hypercalcaemia',
    title: 'Hypercalcaemia of Malignancy',
    abbr: 'HCM',
    category: 'Hematologic',
    urgency: 'Urgent',
    definition: 'Corrected Calcium >10.5 mg/dL (2.6 mmol/L). Most common metabolic emergency in oncology (20–30% of patients). Mechanisms: (1) Humoral (PTHrP 80%), (2) Local osteolysis (20%), (3) Vitamin D (lymphoma), (4) Ectopic PTH.',
    epidemiology: 'Common in Breast, Lung (Squamous), Myeloma, RCC. Poor prognostic sign (median survival <3 mo). Symptoms: "Stones, bones, abdominal moans, psychic groans".',
    regimens: [
      { dose: 'Mild', fx: '<12 mg/dL', bed10: '-', indication: 'Asymptomatic. Oral hydration + observation.' },
      { dose: 'Moderate', fx: '12–14 mg/dL', bed10: '-', indication: 'Symptomatic. IV hydration + Bisphosphonates.' },
      { dose: 'Severe', fx: '>14 mg/dL', bed10: '-', indication: 'STAT IV hydration + Calcitonin + Bisphosphonates.' },
    ],
    initialManagement: [
      'Hydration: Normal Saline 3–6 L/24h. Goal: urine output 100–150 mL/h. Avoid over-hydration in elderly/heart failure.',
      'Bisphosphonates: Zoledronic acid 4 mg IV (over 15 min) or Pamidronate 60–90 mg IV. Onset 2–4 days, peak 7 days. Dose adjustment for renal impairment.',
      'Denosumab: 120 mg SC (days 1, 8, 15, 29). Preferred in severe renal failure (CrCl <30 mL/min).',
      'Calcitonin: 4–8 IU/kg SC/IM Q6–12h. Rapid onset (hours) but tachyphylaxis after 48h. Use for bridging until bisphosphonates work.',
      'Glucocorticoids: Dexamethasone 4–8 mg QID. Effective for lymphoma, myeloma, breast cancer (inhibits 1-α-hydroxylase).',
      'Loop Diuretics (Furosemide): Use ONLY after rehydration if fluid overload occurs. Not for primary calcium lowering.',
      'Dialysis: Consider for severe hypercalcaemia (>4.5 mmol/L) with renal failure or heart failure.',
    ],
    rtIndications: [
      'Bulky bone metastases contributing to local osteolysis',
      'Painful bone mets (analgesic + metabolic benefit)',
    ],
    rtTechnique: 'Focal RT to bulky bone lesions (8 Gy×1 or 20 Gy/5fx). Systemic RT (Sr-89/Ra-223) if widespread osteoblastic disease.',
    prognosis: 'Poor prognostic marker. 50% mortality at 30 days if untreated. Successful management of HCM improves QoL but rarely OS.',
    keyTrials: [
      'ASCO Clinical Practice Guideline (2022): Management of Hypercalcaemia of Malignancy.',
      'Major P et al. Zoledronic acid vs Pamidronate in HCM. JCO 2001.'
    ],
    pitfall: 'Do NOT use bisphosphonates in severe renal failure (CrCl <30) without dose adjustment or switching to Denosumab. Avoid over-hydration in elderly/cardiac patients.'
  },
  {
    id: 'neutropenia',
    title: 'Neutropenic Sepsis',
    abbr: 'NS',
    category: 'Hematologic',
    urgency: 'STAT',
    definition: 'Neutrophil count <0.5 × 10⁹/L (or <1.0 and falling) + Temperature >38.0°C (or signs of sepsis). Life-threatening emergency.',
    epidemiology: 'Occurs in 10–50% of patients receiving chemotherapy for solid tumours; >80% for haematological. Mortality 2–20% depending on MASCC score.',
    regimens: [
      { dose: 'MASCC ≥21', fx: 'Low Risk', bed10: '-', indication: 'Potential for outpatient oral antibiotics (Ciprofloxacin + Co-amoxiclav).' },
      { dose: 'MASCC <21', fx: 'High Risk', bed10: '-', indication: 'Inpatient IV antibiotics (Piperacillin/Tazobactam or Meropenem).' },
    ],
    initialManagement: [
      'Door-to-Antibiotic Time <1 hour: Mandatory. Empirical broad-spectrum IV antibiotics (e.g., Piperacillin/Tazobactam or Meropenem).',
      'MASCC Risk Index: Score ≥21 (Low Risk — outpatient management possible); Score <21 (High Risk — mandatory inpatient IV antibiotics).',
      'Sepsis-6 Bundle: (1) Oxygen, (2) Blood cultures, (3) IV antibiotics, (4) IV fluids, (5) Lactate measurement, (6) Urine output monitoring.',
      'G-CSF (Filgrastim): Consider if high risk of complications (age >65, pneumonia, hypotension, multi-organ failure).',
      'Aminoglycosides (Gentamicin): Add if septic shock or suspected resistant Gram-negative infection.',
      'Vancomycin: Add if suspected MRSA, catheter-related infection, or skin/soft tissue infection.',
    ],
    rtIndications: [
      'RT usually CONTRAINDICATED or DELAYED during active neutropenic sepsis.',
      'Exception: STAT RT for life-threatening emergency (e.g., airway obstruction) if patient stable enough.',
    ],
    rtTechnique: 'N/A. Focus on medical stabilisation.',
    prognosis: 'MASCC Score ≥21: low risk of complications (<5%). MASCC <21: high risk. Mortality significantly reduced by early antibiotics.',
    keyTrials: [
      'NICE CG151: Neutropenic sepsis: prevention and management in people with cancer.',
      'Klastersky J et al. MASCC score. JCO 2000.'
    ],
    pitfall: 'Do NOT wait for cultures or blood results before starting antibiotics if neutropenic sepsis is suspected. DOOR-TO-NEEDLE <1 HOUR is the gold standard.'
  }
];

const URGENCY_STYLE = {
  STAT:       'bg-red-900/60 text-red-400 border-red-800/40',
  Urgent:     'bg-amber-900/60 text-amber-400 border-amber-800/40',
  'Semi-urgent': 'bg-blue-900/60 text-blue-400 border-blue-800/40',
};

const CAT_STYLE: Record<string, { dot: string; text: string }> = {
  Neuro:       { dot: 'bg-purple-500', text: 'text-purple-400' },
  Vascular:    { dot: 'bg-blue-500', text: 'text-blue-400' },
  Airway:      { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  Bone:        { dot: 'bg-amber-500', text: 'text-amber-400' },
  Hematologic: { dot: 'bg-rose-500', text: 'text-rose-400' },
  GI:          { dot: 'bg-teal-500', text: 'text-teal-400' },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const ClinicalGuidelinesPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category,
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));
  const [activeId, setActiveId] = useState(EMERGENCIES[0].id);
  const [section, setSection] = useState<'regimens' | 'management' | 'technique' | 'trials'>('regimens');

  const em = EMERGENCIES.find(e => e.id === activeId)!;
  const cat = CAT_STYLE[em.category];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-red-900/60 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.961-.833-2.732 0L4.082 16.5C3.312 18.333 4.274 19 5.814 19z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Oncologic Emergencies & RT Guidelines</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{EMERGENCIES.length} emergencies · BED₁₀ calculated · Trial-referenced · ASTRO/NICE/ASCO</p>
          </div>
        </div>

        {/* Emergency selector */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {EMERGENCIES.map(e => (
            <button key={e.id} onClick={() => { setActiveId(e.id); setSection('regimens'); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-black uppercase tracking-wider transition-all ${
                activeId === e.id
                  ? 'bg-gray-700 border-gray-500 text-white'
                  : 'bg-gray-800/60 border-gray-700/40 text-gray-500 hover:text-gray-300'}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CAT_STYLE[e.category].dot}`}></div>
              {e.abbr}
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${URGENCY_STYLE[e.urgency]}`}>{e.urgency}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3 space-y-3">
        {/* Title block */}
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-2.5">
            <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider border ${URGENCY_STYLE[em.urgency]}`}>{em.urgency}</span>
            <span className={`text-xs font-black uppercase tracking-wider ${cat.text}`}>{em.category}</span>
          </div>
          <h2 className="text-base font-black text-white mb-1.5">{em.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-2">{em.definition}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{em.epidemiology}</p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1">
          {(['regimens','management','technique','trials'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg border transition-all ${
                section === s ? 'bg-gray-700 border-gray-500 text-white' : 'bg-gray-800/60 border-gray-700/40 text-gray-500'}`}>
              {s === 'regimens' ? '📋 RT Regimens' : s === 'management' ? '🚨 Management' : s === 'technique' ? '⚙️ Technique' : '📚 Trials'}
            </button>
          ))}
        </div>

        {/* ── RT REGIMENS ── */}
        {section === 'regimens' && (
          <div className="space-y-2.5">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-black">Standard RT Regimens + BED₁₀ (α/β = 10 Gy)</p>
            {em.regimens.map((r, i) => (
              <div key={i} className="bg-gray-800/60 border border-gray-700/40 rounded-xl overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-shrink-0 bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-center min-w-[90px]">
                    <div className="text-base font-black text-white">{r.dose}</div>
                    <div className="text-xs text-gray-500">{r.fx} Fr</div>
                    <div className="text-xs text-yellow-500 font-bold mt-1">{r.bed10}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 leading-relaxed mb-1.5">{r.indication}</p>
                    {r.evidence && <p className="text-xs text-blue-400 italic">{r.evidence}</p>}
                  </div>
                </div>
              </div>
            ))}

            {/* Pitfall */}
            <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1.5">⚠️ Critical Pitfall</p>
              <p className="text-sm text-red-200 leading-relaxed">{em.pitfall}</p>
            </div>
          </div>
        )}

        {/* ── INITIAL MANAGEMENT ── */}
        {section === 'management' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-black mb-2.5">Initial Management Steps (Chronological)</p>
            {em.initialManagement.map((step, i) => (
              <div key={i} className="flex gap-3 bg-gray-800/60 border border-gray-700/30 rounded-xl p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-black text-gray-300">{i+1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
              </div>
            ))}
            <div className="mt-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">✅ RT Indications</p>
              {em.rtIndications.map((ind, i) => (
                <div key={i} className="flex gap-2 items-start mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-emerald-200 leading-relaxed">{ind}</p>
                </div>
              ))}
            </div>
            {em.rtContraindications && (
              <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">❌ RT Contraindications / Cautions</p>
                {em.rtContraindications.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                    <p className="text-sm text-red-200 leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RT TECHNIQUE ── */}
        {section === 'technique' && (
          <div className="space-y-3">
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4">
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2.5">⚙️ RT Technique & Contouring</p>
              <p className="text-sm text-gray-300 leading-relaxed">{em.rtTechnique}</p>
            </div>
            <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">📊 Prognosis</p>
              <p className="text-sm text-blue-200 leading-relaxed">{em.prognosis}</p>
            </div>
          </div>
        )}

        {/* ── KEY TRIALS ── */}
        {section === 'trials' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-black mb-2.5">Key Evidence & Guidelines</p>
            {em.keyTrials.map((trial, i) => (
              <div key={i} className="bg-gray-800/60 border border-gray-700/30 rounded-xl p-3 flex gap-3">
                <span className="flex-shrink-0 text-xs font-black text-yellow-500">{i+1}.</span>
                <p className="text-sm text-gray-300 leading-relaxed">{trial}</p>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-3 pb-2 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Rad-Calc Pro · RNT Medical College · Dr. Narendra Rathore</p>
          <p className="text-[10px] text-gray-700 mt-0.5">ASTRO · NICE NG127 · ASCO · QUANTEC · EORTC Guidelines</p>
        </div>
      </div>

      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      >
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-[13px] text-gray-500 leading-relaxed italic">
            *Oncologic emergencies require immediate clinical assessment and multidisciplinary management.
          </p>
        </div>
      </KeyFactsSidebar>
    </div>
  );
};

export default ClinicalGuidelinesPage;