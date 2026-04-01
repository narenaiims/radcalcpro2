import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronDown, Info, ExternalLink, Search, Filter } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from "../components/KeyFactsSidebar";

// ─── TRIAL DATABASE ──────────────────────────────────────────────────────────

const TRIALS = [
  // ── BREAST ──
  {
    id: "b1", site: "Breast", subsite: "Early Breast",
    name: "CALGB 9343", sponsor: "CALGB", year: 2004,
    question: "Can RT be omitted in low-risk elderly breast cancer post-lumpectomy?",
    arms: ["Tamoxifen alone", "Tamoxifen + RT (45 Gy)"],
    result: "RT reduced local recurrence (1% vs 4% at 5y), but no OS difference. RT omission acceptable in women ≥70, ER+, T1N0.",
    impact: "Practice-changing: standard of care for omitting RT in selected elderly patients.",
    keyNumber: "4% vs 1%", keyLabel: "5y LR (no RT vs RT)",
    pmid: "14702468", tags: ["omission", "elderly", "ER+"]
  },
  {
    id: "b2", site: "Breast", subsite: "Early Breast",
    name: "START B", sponsor: "UK START", year: 2008,
    question: "Is 40 Gy/15# hypofractionation equivalent to 50 Gy/25#?",
    arms: ["50 Gy / 25 fractions", "40 Gy / 15 fractions"],
    result: "40 Gy/15# non-inferior for local control with improved cosmesis and toxicity at 10 years.",
    impact: "Established hypofractionation as global standard for whole breast RT.",
    keyNumber: "40 Gy/15#", keyLabel: "Now global standard",
    pmid: "18440193", tags: ["hypofractionation", "standard", "toxicity"]
  },
  {
    id: "b3", site: "Breast", subsite: "Early Breast",
    name: "FAST-Forward", sponsor: "ICR/RMH", year: 2020,
    question: "Is 26 Gy/5# ultra-hypofractionation non-inferior to 40 Gy/15#?",
    arms: ["40 Gy / 15 fractions (3 weeks)", "27 Gy / 5 fractions (1 week)", "26 Gy / 5 fractions (1 week)"],
    result: "26 Gy/5# non-inferior; no significant difference in late adverse effects at 5 years.",
    impact: "Enabled 1-week breast RT — major convenience and healthcare resource benefit.",
    keyNumber: "26 Gy/5#", keyLabel: "1-week breast RT validated",
    pmid: "32580883", tags: ["ultra-hypo", "5-fraction", "convenience"]
  },
  {
    id: "b4", site: "Breast", subsite: "Nodal",
    name: "MA.20 (NCIC)", sponsor: "NCIC", year: 2015,
    question: "Does regional nodal irradiation (RNI) improve outcomes post-lumpectomy?",
    arms: ["Whole breast RT alone", "Whole breast + RNI (IMN + SCV nodes)"],
    result: "RNI improved DFS (82% vs 77%) and DMFS; no OS benefit at 10y. More pneumonitis with RNI.",
    impact: "Supported use of RNI in node-positive or high-risk node-negative breast cancer.",
    keyNumber: "82% vs 77%", keyLabel: "10y DFS (RNI vs no RNI)",
    pmid: "25671254", tags: ["nodal", "RNI", "DFS"]
  },
  {
    id: "b5", site: "Breast", subsite: "Post-Mastectomy",
    name: "PMRT Meta-Analysis (EBCTCG)", sponsor: "EBCTCG", year: 2014,
    question: "What is the benefit of post-mastectomy RT in node-positive breast cancer?",
    arms: ["Surgery alone", "Surgery + post-mastectomy RT"],
    result: "PMRT reduced LRR (20y: 13% vs 26%) and improved OS in 1–3 positive nodes.",
    impact: "Established PMRT benefit even in 1–3 node-positive disease — changed guidelines.",
    keyNumber: "13% vs 26%", keyLabel: "20y LRR (PMRT vs no PMRT)",
    pmid: "25104271", tags: ["PMRT", "nodes", "meta-analysis"]
  },
  {
    id: "l1", site: "Lung", subsite: "NSCLC Stage III",
    name: "RTOG 9410", sponsor: "RTOG", year: 2011,
    question: "Concurrent vs sequential chemoRT in unresectable Stage III NSCLC?",
    arms: ["Sequential: chemo → RT", "Concurrent: cisplatin/vinblastine + RT 63 Gy", "Concurrent: cisplatin/etoposide + hyperfractionated RT"],
    result: "Concurrent arm 2 superior: median OS 17 vs 14.6 months; 5y OS 16% vs 10%.",
    impact: "Established concurrent chemoRT as standard of care for Stage III NSCLC.",
    keyNumber: "17 vs 14.6 mo", keyLabel: "Median OS (concurrent vs sequential)",
    pmid: "21903745", tags: ["concurrent", "stage-III", "chemoRT"]
  },
  {
    id: "l2", site: "Lung", subsite: "NSCLC Stage III",
    name: "PACIFIC", sponsor: "AstraZeneca", year: 2017,
    question: "Does durvalumab consolidation after chemoRT improve outcomes in Stage III NSCLC?",
    arms: ["ChemoRT → Placebo", "ChemoRT → Durvalumab (12 months)"],
    result: "Durvalumab: PFS 16.8 vs 5.6 months; OS 47.5 vs 29.1 months at 5y.",
    impact: "Transformed Stage III NSCLC management — durvalumab now mandatory post-chemoRT.",
    keyNumber: "47.5 vs 29.1 mo", keyLabel: "5y OS (durvalumab vs placebo)",
    pmid: "28885881", tags: ["immunotherapy", "durvalumab", "consolidation", "landmark"]
  },
  {
    id: "l3", site: "Lung", subsite: "NSCLC Stage I",
    name: "RTOG 0236 (SBRT)", sponsor: "RTOG", year: 2010,
    question: "Can SBRT achieve durable local control in medically inoperable Stage I NSCLC?",
    arms: ["SBRT 54 Gy / 3 fractions"],
    result: "3y primary tumor control 97.6%; 3y OS 55.8%. Established SBRT safety and efficacy.",
    impact: "Practice-defining: SBRT standard of care for inoperable peripheral Stage I NSCLC.",
    keyNumber: "97.6%", keyLabel: "3y local tumor control",
    pmid: "20351327", tags: ["SBRT", "stage-I", "inoperable", "landmark"]
  },
  {
    id: "l4", site: "Lung", subsite: "NSCLC Stage III",
    name: "RTOG 0617", sponsor: "RTOG", year: 2015,
    question: "Does dose escalation (74 Gy vs 60 Gy) improve OS in Stage III NSCLC?",
    arms: ["60 Gy concurrent chemoRT", "74 Gy concurrent chemoRT"],
    result: "74 Gy arm WORSE: OS 20.3 vs 28.7 months (60 Gy superior). Dose escalation harmful.",
    impact: "Ended dose escalation in Stage III NSCLC — 60 Gy remains standard.",
    keyNumber: "20.3 vs 28.7 mo", keyLabel: "OS (74 Gy vs 60 Gy — dose esc. failed)",
    pmid: "25601342", tags: ["dose-escalation", "warning", "60Gy-standard"]
  },
  {
    id: "l5", site: "Lung", subsite: "SCLC",
    name: "Turrisi PCI (NEJM 1999)", sponsor: "Intergroup", year: 1999,
    question: "Does prophylactic cranial irradiation improve OS in limited-stage SCLC?",
    arms: ["No PCI after complete response", "PCI 25 Gy / 10 fractions"],
    result: "PCI improved 3y OS: 20.7% vs 15.3%; reduced brain metastases by 50%.",
    impact: "PCI standard of care in LS-SCLC after complete response.",
    keyNumber: "20.7% vs 15.3%", keyLabel: "3y OS (PCI vs no PCI)",
    pmid: "10490038", tags: ["PCI", "SCLC", "brain-mets", "OS"]
  },
  {
    id: "p1", site: "Prostate", subsite: "Localised",
    name: "ProtecT", sponsor: "UK MRC", year: 2016,
    question: "RT vs surgery vs active surveillance in localised prostate cancer?",
    arms: ["Active surveillance", "Radical prostatectomy", "RT 74 Gy + 3–6m ADT"],
    result: "No OS difference at 10y. RT and surgery equivalently reduce metastases vs AS. Side effect profiles differ.",
    impact: "Supported shared decision-making; RT and surgery equivalent oncologically.",
    keyNumber: "~90%", keyLabel: "10y OS all three arms",
    pmid: "27626136", tags: ["localised", "surveillance", "equivalence"]
  },
  {
    id: "p2", site: "Prostate", subsite: "Localised High-Risk",
    name: "RTOG 8531", sponsor: "RTOG", year: 1997,
    question: "Does adjuvant ADT after RT improve OS in locally advanced prostate cancer?",
    arms: ["RT alone", "RT + lifelong LHRH agonist"],
    result: "ADT + RT: 10y OS 49% vs 39%; significant reduction in metastases and disease-specific mortality.",
    impact: "Established long-term ADT + RT as standard for locally advanced prostate cancer.",
    keyNumber: "49% vs 39%", keyLabel: "10y OS (ADT+RT vs RT alone)",
    pmid: "9323207", tags: ["ADT", "locally-advanced", "OS", "landmark"]
  },
  {
    id: "p3", site: "Prostate", subsite: "Localised",
    name: "CHHiP", sponsor: "ICR", year: 2016,
    question: "Is 60 Gy/20# hypofractionation non-inferior to 74 Gy/37# for prostate RT?",
    arms: ["74 Gy / 37 fractions", "60 Gy / 20 fractions", "57 Gy / 19 fractions"],
    result: "60 Gy/20# non-inferior at 5 years (biochemical/clinical failure); toxicity comparable.",
    impact: "60 Gy/20# became UK standard for prostate RT (4 vs 7.5 weeks).",
    keyNumber: "60 Gy/20#", keyLabel: "Non-inferior, now UK standard",
    pmid: "27226371", tags: ["hypofractionation", "prostate", "standard"]
  },
  {
    id: "p4", site: "Prostate", subsite: "Oligometastatic",
    name: "STAMPEDE RT Arm (Parker)", sponsor: "MRC STAMPEDE", year: 2018,
    question: "Does prostate RT improve OS in newly diagnosed metastatic prostate cancer?",
    arms: ["Standard systemic therapy", "Standard systemic therapy + prostate RT"],
    result: "RT benefit in low metastatic burden (≤4 mets): 3y failure-free survival 32% vs 23%.",
    impact: "Established prostate RT benefit in low-burden metastatic disease — practice-changing.",
    keyNumber: "32% vs 23%", keyLabel: "3y FFS (RT vs no RT, low burden)",
    pmid: "30355464", tags: ["metastatic", "oligometastatic", "primary-RT"]
  },
  {
    id: "hn1", site: "Head & Neck", subsite: "Locally Advanced",
    name: "MACH-NC Meta-Analysis", sponsor: "Meta-analysis", year: 2000,
    question: "What is the benefit of chemotherapy added to RT in locally advanced H&N cancer?",
    arms: ["RT alone", "RT + concomitant chemotherapy"],
    result: "Concomitant chemoRT: absolute OS benefit 8% at 5y (HR 0.81). Induction and adjuvant less beneficial.",
    impact: "Established concurrent cisplatin-based chemoRT as standard for locally advanced H&N cancer.",
    keyNumber: "8%", keyLabel: "Absolute 5y OS benefit (concurrent chemo)",
    pmid: "10866450", tags: ["chemoRT", "cisplatin", "meta-analysis", "landmark"]
  },
  {
    id: "hn2", site: "Head & Neck", subsite: "Nasopharynx",
    name: "Intergroup 0099", sponsor: "Intergroup", year: 1998,
    question: "Does cisplatin chemoRT improve OS vs RT alone in nasopharyngeal carcinoma?",
    arms: ["RT 70 Gy alone", "Cisplatin chemoRT → adjuvant cisplatin/5-FU x3"],
    result: "ChemoRT: 5y OS 67% vs 37%; EFS 58% vs 29%. Trial stopped early for benefit.",
    impact: "Transformed NPC management — cisplatin chemoRT universally adopted.",
    keyNumber: "67% vs 37%", keyLabel: "5y OS (chemoRT vs RT alone)",
    pmid: "9816918", tags: ["NPC", "cisplatin", "landmark", "OS"]
  },
  {
    id: "hn3", site: "Head & Neck", subsite: "Larynx",
    name: "VA Larynx (NEJM 1991)", sponsor: "Veterans Affairs", year: 1991,
    question: "Can induction chemo + RT preserve the larynx vs total laryngectomy?",
    arms: ["Total laryngectomy + RT", "Induction cisplatin/5-FU x3 → RT (if CR)"],
    result: "No OS difference; larynx preserved in 64% of chemo-RT arm at 2 years.",
    impact: "Established organ preservation as oncologically equivalent — paradigm shift.",
    keyNumber: "64%", keyLabel: "Larynx preservation rate",
    pmid: "1840526", tags: ["larynx", "organ-preservation", "induction", "landmark"]
  },
  {
    id: "hn4", site: "Head & Neck", subsite: "Oropharynx",
    name: "RTOG 0129 (HPV)", sponsor: "RTOG", year: 2010,
    question: "Does HPV status predict outcomes in oropharyngeal cancer with chemoRT?",
    arms: ["Standard chemoRT (all patients) — retrospective biomarker analysis"],
    result: "HPV+ OPC: 3y OS 82% vs 57% (HPV-). HPV+ independently associated with better outcomes.",
    impact: "Established HPV as critical biomarker; launched de-escalation era for HPV+ OPC.",
    keyNumber: "82% vs 57%", keyLabel: "3y OS (HPV+ vs HPV-)",
    pmid: "20530316", tags: ["HPV", "oropharynx", "biomarker", "de-escalation"]
  },
  {
    id: "r1", site: "Colorectal", subsite: "Rectal Cancer",
    name: "Swedish Rectal Trial", sponsor: "Swedish", year: 1997,
    question: "Does short-course pre-op RT (5×5 Gy) improve local control in rectal cancer?",
    arms: ["Surgery alone (TME)", "Short-course RT 25 Gy/5# → Surgery"],
    result: "Pre-op SCRT: 5y LR 11% vs 27%; 5y OS 58% vs 48%.",
    impact: "Established pre-operative short-course RT as a standard option for rectal cancer.",
    keyNumber: "11% vs 27%", keyLabel: "5y LR (SCRT vs surgery alone)",
    pmid: "9042045", tags: ["SCRT", "rectal", "preoperative", "landmark"]
  },
  {
    id: "r2", site: "Colorectal", subsite: "Rectal Cancer",
    name: "CAO/ARO/AIO-94 (Sauer)", sponsor: "German Rectal Group", year: 2004,
    question: "Pre-op vs post-op chemoRT in locally advanced rectal cancer?",
    arms: ["Post-op chemoRT 54 Gy + 5-FU", "Pre-op chemoRT 50.4 Gy + 5-FU → surgery"],
    result: "Pre-op: LR 6% vs 13%; sphincter preservation 39% vs 19%; less toxicity. No OS difference.",
    impact: "Established pre-operative long-course chemoRT as preferred approach.",
    keyNumber: "6% vs 13%", keyLabel: "5y LR (pre-op vs post-op CRT)",
    pmid: "15496622", tags: ["preoperative", "chemoRT", "sphincter", "landmark"]
  },
  {
    id: "r3", site: "Colorectal", subsite: "Rectal Cancer",
    name: "RAPIDO", sponsor: "Netherlands", year: 2021,
    question: "Does SCRT + systemic chemo (TNT) reduce distant metastases vs standard CRT?",
    arms: ["Standard long-course CRT → surgery → adj chemo", "SCRT 25 Gy → CAPOX x6 → surgery (TNT)"],
    result: "TNT: 3y disease-related treatment failure 23% vs 30%; improved pCR (28% vs 14%).",
    impact: "Total neoadjuvant therapy (TNT) increasingly adopted — improves systemic control.",
    keyNumber: "28% vs 14%", keyLabel: "pCR rate (TNT vs standard CRT)",
    pmid: "33296616", tags: ["TNT", "SCRT", "systemic", "pCR"]
  },
  {
    id: "c1", site: "CNS", subsite: "GBM",
    name: "Stupp (EORTC 22981)", sponsor: "EORTC", year: 2005,
    question: "Does concurrent + adjuvant temozolomide with RT improve OS in GBM?",
    arms: ["RT 60 Gy alone", "RT 60 Gy + concurrent TMZ → adjuvant TMZ x6"],
    result: "RT+TMZ: median OS 14.6 vs 12.1 months; 2y OS 26.5% vs 10.4%.",
    impact: "Defined standard of care for GBM for nearly 20 years — Stupp protocol.",
    keyNumber: "14.6 vs 12.1 mo", keyLabel: "Median OS (RT+TMZ vs RT alone)",
    pmid: "15758009", tags: ["GBM", "temozolomide", "TMZ", "landmark", "standard"]
  },
  {
    id: "c2", site: "CNS", subsite: "GBM",
    name: "EORTC 26101 (TTFields)", sponsor: "Novocure/EORTC", year: 2017,
    question: "Do Tumor Treating Fields (TTF) added to TMZ improve OS in GBM?",
    arms: ["TMZ maintenance alone", "TTFields + TMZ"],
    result: "TTFields + TMZ: median OS 20.9 vs 16.0 months; 5y OS 13% vs 5%.",
    impact: "TTFields approved for GBM; OS benefit confirmed — added to standard.",
    keyNumber: "20.9 vs 16.0 mo", keyLabel: "Median OS (TTF+TMZ vs TMZ alone)",
    pmid: "28258565", tags: ["TTFields", "GBM", "recurrent", "OS"]
  },
  {
    id: "c3", site: "CNS", subsite: "Brain Mets",
    name: "QUARTZ (NCRI)", sponsor: "UK NCRI", year: 2016,
    question: "WBRT vs optimal supportive care (OSC) in poor-prognosis brain mets from NSCLC?",
    arms: ["OSC + dexamethasone", "WBRT 20 Gy/5# + OSC"],
    result: "No significant OS or QoL benefit from WBRT in poor prognosis patients (NSCLC brain mets).",
    impact: "WBRT not recommended in poor-prognosis NSCLC brain mets — WBRT use declining.",
    keyNumber: "No benefit", keyLabel: "WBRT vs BSC in poor-prognosis NSCLC",
    pmid: "27604504", tags: ["WBRT", "brain-mets", "NSCLC", "QoL", "omission"]
  },
  {
    id: "c4", site: "CNS", subsite: "Brain Mets",
    name: "Brown JAMA 2016 (SRS±WBRT)", sponsor: "NRG/NCCTG", year: 2016,
    question: "SRS alone vs SRS + WBRT for 1–3 brain metastases — cognitive outcomes?",
    arms: ["SRS + WBRT 37.5 Gy/15#", "SRS alone"],
    result: "SRS alone: better cognitive function at 3 months; no OS difference. WBRT harms cognition.",
    impact: "SRS alone preferred over SRS+WBRT for ≤4 brain mets — protects cognition.",
    keyNumber: "Better cognition", keyLabel: "SRS alone vs SRS+WBRT (no OS diff)",
    pmid: "26978590", tags: ["SRS", "WBRT", "cognition", "brain-mets", "omission"]
  },
  {
    id: "cv1", site: "Gynaecology", subsite: "Cervix",
    name: "Rose / Keys (GOG) 1999", sponsor: "GOG", year: 1999,
    question: "Does concurrent cisplatin with RT improve OS in locally advanced cervical cancer?",
    arms: ["RT + hydroxyurea", "RT + weekly cisplatin", "RT + cisplatin/5-FU/hydroxyurea"],
    result: "Cisplatin arm: OS benefit, RR 0.57; 3y PFS 67% vs 47%.",
    impact: "Concurrent cisplatin became standard of care for locally advanced cervical cancer.",
    keyNumber: "67% vs 47%", keyLabel: "3y PFS (cisplatin CRT vs HU)",
    pmid: "10203163", tags: ["cervix", "cisplatin", "standard", "landmark"]
  },
  {
    id: "cv2", site: "Gynaecology", subsite: "Endometrium",
    name: "PORTEC-2", sponsor: "Dutch PORTEC", year: 2010,
    question: "Vaginal brachytherapy (VBT) vs EBRT in high-intermediate risk endometrial cancer?",
    arms: ["EBRT 46 Gy/23#", "VBT (21 Gy / 3 fractions HDR)"],
    result: "VBT non-inferior to EBRT for vaginal relapse; significantly less GI toxicity; better QoL.",
    impact: "VBT replaced EBRT as standard adjuvant RT for high-intermediate risk endometrial cancer.",
    keyNumber: "Non-inferior", keyLabel: "VBT vs EBRT vaginal control",
    pmid: "20223991", tags: ["endometrium", "brachytherapy", "VBT", "EBRT", "standard"]
  },
  {
    id: "ps1", site: "Prostate", subsite: "SBRT",
    name: "HYPO-RT-PC", sponsor: "Swedish", year: 2019,
    question: "Ultra-hypofractionated SBRT (42.7 Gy/7#) vs conventional RT in prostate cancer?",
    arms: ["78 Gy / 39 fractions", "42.7 Gy / 7 fractions (SBRT)"],
    result: "SBRT non-inferior for biochemical failure-free survival at 5 years; toxicity comparable.",
    impact: "Validated prostate SBRT as standard option — 7-fraction prostate RT.",
    keyNumber: "84% vs 84%", keyLabel: "5y bFFS (SBRT vs conventional)",
    pmid: "31227373", tags: ["SBRT", "prostate", "ultra-hypo", "7-fraction"]
  },
  {
    id: "pal1", site: "Palliative", subsite: "Bone Mets",
    name: "RTOG 9714", sponsor: "RTOG", year: 2005,
    question: "8 Gy single fraction vs 30 Gy/10# for painful bone metastases?",
    arms: ["8 Gy / 1 fraction", "30 Gy / 10 fractions"],
    result: "Equivalent pain response (33% complete, 66% overall); 8 Gy re-treatment rate higher (18% vs 9%).",
    impact: "Single fraction 8 Gy validated as equivalent — gold standard for bone met palliation.",
    keyNumber: "8 Gy = 30 Gy/10#", keyLabel: "Pain response equivalent",
    pmid: "15896083", tags: ["bone-mets", "single-fraction", "palliation", "standard"]
  },
  {
    id: "pal2", site: "Palliative", subsite: "SVC Syndrome",
    name: "ASCO Guideline Evidence", sponsor: "Multiple", year: 2015,
    question: "RT vs stenting for SVC syndrome in lung cancer?",
    arms: ["Endovascular stenting", "RT 20–30 Gy palliative"],
    result: "Stenting: faster symptom relief (24–72h vs days); RT still preferred if stenting unavailable or chemo-sensitive histology.",
    impact: "Stenting first-line for rapid relief; RT as adjunct or primary in SCLC.",
    keyNumber: "24–72h", keyLabel: "Symptom relief with stenting",
    pmid: "", tags: ["SVC", "palliation", "stenting"]
  },
  {
    id: "pal3", site: "Palliative", subsite: "Spinal Cord Compression",
    name: "Patchell MSSCC (Lancet 2005)", sponsor: "Lancet", year: 2005,
    question: "Surgery + RT vs RT alone for metastatic spinal cord compression?",
    arms: ["RT 30 Gy/10# alone", "Surgical decompression + RT 30 Gy/10#"],
    result: "Surgery + RT: 84% retained/regained ambulation vs 57% RT alone; longer ambulation duration.",
    impact: "Surgery + RT standard for single-level MSCC in operable candidates.",
    keyNumber: "84% vs 57%", keyLabel: "Ambulation retained (surgery+RT vs RT)",
    pmid: "15939062", tags: ["MSCC", "surgery", "spinal", "ambulation"]
  },
  {
    id: "e1", site: "Esophagus", subsite: "Locally Advanced",
    name: "CROSS", sponsor: "Dutch", year: 2012,
    question: "Does pre-operative chemoRT improve OS in resectable esophageal cancer?",
    arms: ["Surgery alone", "Pre-op Carboplatin/Paclitaxel + RT (41.4 Gy) → Surgery"],
    result: "Pre-op chemoRT improved median OS (49.4 vs 24 months) and pCR rate (29%).",
    impact: "Established trimodality therapy as the global standard for resectable esophageal cancer.",
    keyNumber: "49.4 vs 24 mo", keyLabel: "Median OS (CRT+S vs S)",
    pmid: "22646630", tags: ["esophagus", "preoperative", "trimodality"]
  },
  {
    id: "om1", site: "Oligometastatic", subsite: "Multiple Sites",
    name: "SABR-COMET", sponsor: "International", year: 2019,
    question: "Does SABR improve OS in patients with 1–5 metastatic lesions?",
    arms: ["Standard of care (SOC) palliative therapy", "SOC + SABR to all metastatic lesions"],
    result: "SABR improved median OS from 28 to 41 months. 5y OS 42.3% vs 17.7%.",
    impact: "Proof-of-concept for oligometastatic state; established SABR as a standard option for low-volume mets.",
    keyNumber: "41 vs 28 mo", keyLabel: "Median OS (SABR vs SOC)",
    pmid: "30982687", tags: ["SBRT", "SABR", "oligometastatic", "landmark"]
  },
  {
    id: "p5", site: "Prostate", subsite: "Localised High-Risk",
    name: "FLAME", sponsor: "Dutch", year: 2021,
    question: "Does a focal boost to the intraprostatic lesion (IPL) improve bFFS?",
    arms: ["77 Gy to whole prostate", "77 Gy to whole prostate + focal boost up to 95 Gy to IPL"],
    result: "Focal boost improved 5y bFFS (92% vs 85%) without increasing significant toxicity.",
    impact: "Validated the use of MRI-guided focal boosting in high-risk prostate cancer.",
    keyNumber: "92% vs 85%", keyLabel: "5y bFFS (Boost vs No Boost)",
    pmid: "33471548", tags: ["prostate", "focal-boost", "MRI", "bFFS"]
  },
  {
    id: "cv3", site: "Gynaecology", subsite: "Endometrium",
    name: "PORTEC-3", sponsor: "Dutch PORTEC", year: 2018,
    question: "Does adjuvant chemoRT improve OS vs RT alone in high-risk endometrial cancer?",
    arms: ["RT alone (48.6 Gy)", "ChemoRT (2x Cisplatin during RT → 4x Carboplatin/Paclitaxel)"],
    result: "ChemoRT improved 5y OS (81.4% vs 76.1%) and DFS, especially in Stage III and serous histology.",
    impact: "Established adjuvant chemoRT as standard for high-risk and Stage III endometrial cancer.",
    keyNumber: "81.4% vs 76.1%", keyLabel: "5y OS (CRT vs RT)",
    pmid: "29449189", tags: ["endometrium", "chemoRT", "high-risk", "Stage-III"]
  },
  {
    id: "c5", site: "CNS", subsite: "Brain Mets",
    name: "RTOG 0614 (Memantine)", sponsor: "RTOG", year: 2013,
    question: "Does memantine protect cognitive function during WBRT?",
    arms: ["WBRT + Placebo", "WBRT + Memantine (20mg/day for 24 weeks)"],
    result: "Memantine delayed time to cognitive decline; improved executive function and memory at 24 weeks.",
    impact: "Memantine became standard supportive care for patients receiving WBRT.",
    keyNumber: "Delayed decline", keyLabel: "Cognitive preservation with Memantine",
    pmid: "23959912", tags: ["WBRT", "brain-mets", "supportive", "cognition"]
  },
  {
    id: "b6", site: "Breast", subsite: "Early Breast",
    name: "EORTC 22881 (Boost)", sponsor: "EORTC", year: 2001,
    question: "Does a 16 Gy boost improve local control after 50 Gy WBI?",
    arms: ["WBI 50 Gy alone", "WBI 50 Gy + 16 Gy boost to tumor bed"],
    result: "Boost reduced 10y local recurrence (6.2% vs 10.2%), especially in patients <40 years.",
    impact: "Established the benefit of tumor bed boost for local control in breast-conserving therapy.",
    keyNumber: "6.2% vs 10.2%", keyLabel: "10y LR (Boost vs No Boost)",
    pmid: "11698690", tags: ["breast", "boost", "local-control"]
  },
  {
    id: "l6", site: "Lung", subsite: "NSCLC Stage I",
    name: "RTOG 0813 (Central SBRT)", sponsor: "RTOG", year: 2019,
    question: "What is the maximum tolerated dose (MTD) for central SBRT?",
    arms: ["Dose escalation: 50 Gy to 60 Gy in 5 fractions"],
    result: "MTD was 60 Gy in 5 fractions; 2y local control 88%; Grade 3+ toxicity 7.2%.",
    impact: "Established safety and efficacy of 5-fraction SBRT for central/ultra-central lung tumors.",
    keyNumber: "60 Gy / 5#", keyLabel: "Safe for central tumors",
    pmid: "30939095", tags: ["SBRT", "central-lung", "safety", "MTD"]
  },
  {
    id: "p6", site: "Prostate", subsite: "Localised Low-Risk",
    name: "RTOG 0415", sponsor: "RTOG", year: 2016,
    question: "Is hypofractionation (70 Gy/28#) non-inferior to conventional (73.8 Gy/41#)?",
    arms: ["73.8 Gy / 41 fractions", "70 Gy / 28 fractions"],
    result: "Hypofractionation non-inferior for DFS; slightly higher late GI/GU toxicity.",
    impact: "Supported hypofractionation as a standard option for low-risk prostate cancer.",
    keyNumber: "Non-inferior", keyLabel: "Hypofractionation validated",
    pmid: "27044935", tags: ["prostate", "hypofractionation", "low-risk"]
  },
  {
    id: "b7", site: "Breast", subsite: "Nodal",
    name: "EORTC 22922 (IMN)", sponsor: "EORTC", year: 2015,
    question: "Does internal mammary and medial supraclavicular (IM-MS) RT improve OS?",
    arms: ["WBI/PMRT alone", "WBI/PMRT + IM-MS nodal irradiation"],
    result: "IM-MS RT improved DFS and DMFS; trend toward improved OS (p=0.06) at 10 years.",
    impact: "Supported inclusion of IMN in regional nodal irradiation for high-risk patients.",
    keyNumber: "Improved DFS", keyLabel: "Nodal RT benefit",
    pmid: "26200978", tags: ["breast", "IMN", "nodal", "DFS"]
  },
  {
    id: "e2", site: "Esophagus", subsite: "Locally Advanced",
    name: "CheckMate 577", sponsor: "BMS", year: 2021,
    question: "Does adjuvant Nivolumab improve DFS after trimodality therapy?",
    arms: ["Placebo", "Nivolumab for 1 year (after R0 resection post-CRT)"],
    result: "Nivolumab doubled median DFS (22.4 vs 11 months).",
    impact: "Established adjuvant Nivolumab as standard of care for patients with residual disease post-CRT.",
    keyNumber: "22.4 vs 11 mo", keyLabel: "Median DFS (Nivo vs Placebo)",
    pmid: "33789010", tags: ["esophagus", "immunotherapy", "adjuvant", "landmark"]
  },
];

const SITES = Array.from(new Set(TRIALS.map(t => t.site)));

const SITE_META: Record<string, { color: string; bg: string }> = {
  "Breast":       { color: "#F472B6", bg: "rgba(244,114,182,0.1)" },
  "Lung":         { color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  "Prostate":     { color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  "Head & Neck":  { color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  "Colorectal":   { color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  "CNS":          { color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  "Gynaecology":  { color: "#FB7185", bg: "rgba(251,113,133,0.1)" },
  "Palliative":   { color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  "Esophagus":    { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  "Oligometastatic": { color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TrialCard({ trial, expanded, onToggle }: { trial: typeof TRIALS[0]; expanded: boolean; onToggle: () => void }) {
  const meta = SITE_META[trial.site] || { color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.03)",
      borderRadius: "12px",
      border: `1px solid ${expanded ? meta.color + "44" : "rgba(255,255,255,0.08)"}`,
      overflow: "hidden",
      marginBottom: "12px",
      transition: "all 0.2s ease"
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: "none",
          border: "none",
          textAlign: "left",
          cursor: "pointer"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{
              fontSize: "10px",
              fontWeight: 800,
              color: meta.color,
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: meta.bg,
              padding: "2px 6px",
              borderRadius: "4px"
            }}>{trial.year}</span>
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>{trial.site}</span>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: "#475569", 
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.3s ease"
            }} 
          />
        </div>
        
        <h3 style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#F1F5F9",
          lineHeight: 1.3
        }}>{trial.name}</h3>
        
        <p style={{
          fontSize: "12px",
          color: "#94A3B8",
          lineHeight: 1.4,
          display: expanded ? "none" : "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>{trial.question}</p>

        {!expanded && (
          <div style={{
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 700,
              color: meta.color,
              fontFamily: "'JetBrains Mono', monospace"
            }}>{trial.keyNumber}</div>
            <div style={{ fontSize: "10px", color: "#475569" }}>{trial.keyLabel}</div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ marginTop: "12px" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#475569", letterSpacing: "0.1em", marginBottom: "6px" }}>QUESTION</h4>
                <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>{trial.question}</p>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: "#475569", letterSpacing: "0.1em", marginBottom: "6px" }}>ARMS</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {trial.arms.map((arm, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <div style={{ 
                        width: "16px", height: "16px", borderRadius: "50%", 
                        backgroundColor: meta.bg, border: `1px solid ${meta.color}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 700, color: meta.color, flexShrink: 0, marginTop: "2px"
                      }}>{i + 1}</div>
                      <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.4 }}>{arm}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", border: `1px solid ${meta.color}22` }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: meta.color, letterSpacing: "0.1em", marginBottom: "4px" }}>RESULT</h4>
                <p style={{ fontSize: "12px", color: "#F1F5F9", lineHeight: 1.5 }}>{trial.result}</p>
              </div>

              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: meta.bg, borderRadius: "8px", border: `1px solid ${meta.color}33` }}>
                <h4 style={{ fontSize: "10px", fontWeight: 800, color: meta.color, letterSpacing: "0.1em", marginBottom: "4px" }}>IMPACT</h4>
                <p style={{ fontSize: "12px", color: "#F1F5F9", lineHeight: 1.5, fontWeight: 500 }}>{trial.impact}</p>
              </div>

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {trial.tags.map(tag => (
                    <span key={tag} style={{ fontSize: "9px", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>#{tag}</span>
                  ))}
                </div>
                {trial.pmid && (
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/${trial.pmid}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", alignItems: "center", gap: "4px", 
                      fontSize: "10px", color: "#3B82F6", textDecoration: "none",
                      backgroundColor: "rgba(59,130,246,0.1)", padding: "4px 8px", borderRadius: "4px"
                    }}
                  >
                    PMID {trial.pmid} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'Breast Trials',
    emoji: '🎀',
    accent: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.4)',
    rows: [
      { k: 'START B', v: '40Gy/15# non-inferior', mono: true },
      { k: 'FAST-Forward', v: '26Gy/5# non-inferior', mono: true },
      { k: 'MA.20', v: 'RNI improves DFS', mono: true },
      { k: 'CALGB 9343', v: 'RT omission in elderly', mono: true },
      { k: 'EBCTCG PMRT', v: 'Benefit in 1-3 nodes', mono: true },
      { k: 'AMAROS', v: 'Axillary RT vs Surgery', mono: true },
      { k: 'EORTC 22881', v: 'Boost benefit in <50y', mono: true },
      { k: 'PRIME II', v: 'Omission in low-risk', mono: true },
    ]
  },
  {
    title: 'Lung Trials',
    emoji: '🫁',
    accent: '#38bdf8',
    bg: 'rgba(56,189,232,0.08)',
    border: 'rgba(56,189,232,0.4)',
    rows: [
      { k: 'PACIFIC', v: 'Durvalumab post-CRT', mono: true },
      { k: 'RTOG 0617', v: '60Gy > 74Gy in Stage III', mono: true },
      { k: 'RTOG 0236', v: 'SBRT 54Gy/3# for Stage I', mono: true },
      { k: 'RTOG 9410', v: 'Concurrent > Sequential', mono: true },
      { k: 'CHART', v: 'Continuous Hyperfrac', mono: true },
      { k: 'STAMPEDE', v: 'Oligometastatic RT', mono: true },
      { k: 'COMET', v: 'SABR in oligomets', mono: true },
      { k: 'LUKAS', v: 'PCI in SCLC benefit', mono: true },
    ]
  },
  {
    title: 'Prostate Trials',
    emoji: '💎',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.4)',
    rows: [
      { k: 'CHHiP', v: '60Gy/20# non-inferior', mono: true },
      { k: 'PROFIT', v: 'Hypofractionation standard', mono: true },
      { k: 'PROTECT', v: 'Active surveillance vs RT', mono: true },
      { k: 'STAMPEDE', v: 'M1 prostate RT benefit', mono: true },
      { k: 'RADICALS-RT', v: 'Adjuvant vs Salvage', mono: true },
      { k: 'HYPO-RT-PC', v: 'Ultra-hypofractionation', mono: true },
      { k: 'ASCENDE-RT', v: 'LDR boost benefit', mono: true },
    ]
  },
  {
    title: 'H&N Trials',
    emoji: '🗣️',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.4)',
    rows: [
      { k: 'MACH-NC', v: 'Concurrent CRT benefit', mono: true },
      { k: 'DAHANCA', v: 'Nimorazole benefit', mono: true },
      { k: 'ARTSCAN', v: 'Dose escalation failed', mono: true },
      { k: 'RTOG 0129', v: 'HPV+ prognosis better', mono: true },
      { k: 'De-ESCALATE', v: 'Cisplatin > Cetuximab', mono: true },
    ]
  }
];

export default function ClinicalTrials() {
  const [activeSite, setActiveSite] = useState(SITES[0] || "");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let t = TRIALS;
    if (search.trim()) {
      const s = search.toLowerCase();
      t = t.filter(x => 
        x.name.toLowerCase().includes(s) || 
        x.question.toLowerCase().includes(s) ||
        x.tags.some(tag => tag.includes(s)) ||
        x.site.toLowerCase().includes(s)
      );
    } else {
      t = t.filter(x => x.site === activeSite);
    }
    return t.sort((a, b) => b.year - a.year);
  }, [activeSite, search]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#060B14",
      color: "#F1F5F9",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "40px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: "sticky", top: "44px", zIndex: 40,
        backgroundColor: "rgba(6,11,20,0.8)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "10px", 
              backgroundColor: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" 
            }}>
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}>Landmark Trials</h1>
              <p style={{ fontSize: "10px", color: "#475569", fontWeight: 500 }}>Evidence Database</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        {/* ── SEARCH ── */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trials, sites, keywords..."
            style={{
              width: "100%", padding: "12px 12px 12px 38px",
              backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px", color: "white", fontSize: "14px", outline: "none"
            }}
          />
        </div>

        {/* ── SITE FILTER ── */}
        {!search && (
          <div className="no-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "20px", paddingBottom: "4px" }}>
            {SITES.map(site => {
              const active = activeSite === site;
              const meta = SITE_META[site];
              return (
                <button
                  key={site}
                  onClick={() => setActiveSite(site)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", whiteSpace: "nowrap",
                    backgroundColor: active ? meta.color : "rgba(255,255,255,0.04)",
                    color: active ? "#060B14" : "#64748B",
                    border: `1px solid ${active ? meta.color : "rgba(255,255,255,0.08)"}`,
                    fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {site}
                </button>
              );
            })}
          </div>
        )}

        {/* ── STATS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={12} />
            <span>Showing <b>{filtered.length}</b> studies</span>
          </div>
          {search && (
            <button 
              onClick={() => setSearch("")}
              style={{ fontSize: "11px", color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear Search
            </button>
          )}
        </div>

        {/* ── TRIAL LIST ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.length > 0 ? (
            filtered.map(trial => (
              <TrialCard 
                key={trial.id} 
                trial={trial} 
                expanded={expandedId === trial.id}
                onToggle={() => setExpandedId(expandedId === trial.id ? null : trial.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
              <p style={{ fontSize: "14px" }}>No trials found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      />
    </div>
  );
}
