import React, { useState, useMemo, useRef, useEffect } from "react";
// @ts-ignore
import * as reactWindow from "react-window";
// @ts-ignore
import { AutoSizer } from "react-virtualized-auto-sizer";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, BarChart3, Info, Calculator, ArrowRightLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import KeyFactsSidebar, { KeyFactSection } from "../components/KeyFactsSidebar";

import { NumberInput } from '../src/components/NumberInput';

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

  // ── LUNG ──
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

  // ── PROSTATE ──
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

  // ── HEAD & NECK ──
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

  // ── RECTAL ──
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

  // ── CNS ──
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

  // ── CERVIX ──
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

  // ── PROSTATE SBRT ──
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

  // ── PALLIATIVE ──
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
];

const REFERENCE_ARMS = [
  { id: "ff", name: "FAST-Forward", arm: "26 Gy / 5#", dose: 26, fractions: 5, abTumour: 4.0, abLate: 3.0, site: "Breast" },
  { id: "chhip", name: "CHHiP", arm: "60 Gy / 20#", dose: 60, fractions: 20, abTumour: 1.5, abLate: 3.0, site: "Prostate" },
  { id: "rtog0617", name: "RTOG 0617", arm: "60 Gy / 30#", dose: 60, fractions: 30, abTumour: 10.0, abLate: 3.0, site: "Lung" },
  { id: "startb", name: "START-B", arm: "40 Gy / 15#", dose: 40, fractions: 15, abTumour: 4.0, abLate: 3.0, site: "Breast" },
  { id: "sabr3", name: "RTOG 0236 (SABR)", arm: "54 Gy / 3#", dose: 54, fractions: 3, abTumour: 10.0, abLate: 3.0, site: "Lung" },
  { id: "stupp", name: "Stupp Protocol", arm: "60 Gy / 30#", dose: 60, fractions: 30, abTumour: 10.0, abLate: 3.0, site: "CNS" },
];

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const SITES = ["All", ...Array.from(new Set(TRIALS.map(t => t.site)))];

const SITE_META: Record<string, { color: string; bg: string }> = {
  "All":          { color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  "Breast":       { color: "#F472B6", bg: "rgba(244,114,182,0.08)" },
  "Lung":         { color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  "Prostate":     { color: "#34D399", bg: "rgba(52,211,153,0.08)" },
  "Head & Neck":  { color: "#FBBF24", bg: "rgba(251,191,36,0.08)" },
  "Colorectal":   { color: "#F97316", bg: "rgba(249,115,22,0.08)" },
  "CNS":          { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  "Gynaecology":  { color: "#FB7185", bg: "rgba(251,113,133,0.08)" },
  "Palliative":   { color: "#94A3B8", bg: "rgba(148,163,184,0.08)" },
};

const SPONSOR_COLORS: Record<string, string> = {
  "RTOG": "#60A5FA", "EORTC": "#FBBF24", "NCIC": "#34D399",
  "GOG": "#FB7185", "UK": "#A78BFA", "Swedish": "#F472B6",
  "Dutch": "#F97316", "Meta-analysis": "#94A3B8",
};

function sponsorColor(s: string) {
  for (const [k, v] of Object.entries(SPONSOR_COLORS)) {
    if (s.includes(k)) return v;
  }
  return "#64748B";
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SiteChip({ site, active, onClick }: { site: string; active: boolean; onClick: () => void }) {
  const meta = SITE_META[site] || SITE_META["All"];
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "30px",
      backgroundColor: active ? meta.color : "rgba(255,255,255,0.04)",
      border: `1px solid ${active ? meta.color : "rgba(255,255,255,0.08)"}`,
      color: active ? "#0A0F1A" : "#64748B",
      fontSize: "11px", fontWeight: 700, cursor: "pointer",
      whiteSpace: "nowrap", transition: "all 0.2s ease",
      fontFamily: "'Syne', sans-serif", letterSpacing: "0.04em"
    }}>
      {site}
    </button>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "20px",
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "9px", color: "#475569",
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.06em"
    }}>#{tag}</span>
  );
}

function TrialCard({ trial, index, expanded, onToggle }: { trial: typeof TRIALS[0]; index: number; expanded: boolean; onToggle: () => void }) {
  const siteColor = SITE_META[trial.site]?.color || "#94A3B8";
  const siteBg    = SITE_META[trial.site]?.bg    || "rgba(255,255,255,0.04)";

  return (
    <div
      className="trial-card"
      style={{
        borderRadius: "16px", overflow: "hidden",
        border: `1px solid rgba(255,255,255,0.07)`,
        backgroundColor: "#0D1420",
        marginBottom: "12px",
        animationDelay: `${index * 0.05}s`,
        transition: "border-color 0.25s ease, box-shadow 0.25s ease"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = siteColor + "55";
        e.currentTarget.style.boxShadow = `0 0 24px ${siteColor}15`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── Card Header ── */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", gap: "12px",
          padding: "16px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", alignItems: "flex-start"
        }}
      >
        {/* Year column */}
        <div style={{
          flexShrink: 0, width: "42px", textAlign: "center",
          paddingTop: "2px"
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: siteColor,
            fontFamily: "'JetBrains Mono', monospace"
          }}>{trial.year}</div>
          <div style={{
            marginTop: "6px", width: "2px", height: "100%",
            backgroundColor: siteColor + "33", margin: "4px auto 0"
          }} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div>
              <div style={{
                fontSize: "14px", fontWeight: 800, color: "#F1F5F9",
                fontFamily: "'Syne', sans-serif", lineHeight: 1.2, marginBottom: "3px"
              }}>{trial.name}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 8px",
                  borderRadius: "20px", backgroundColor: siteBg,
                  color: siteColor, border: `1px solid ${siteColor}44`,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>{trial.site} · {trial.subsite}</span>
                <span style={{
                  fontSize: "9px", padding: "2px 8px", borderRadius: "20px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: sponsorColor(trial.sponsor),
                  border: `1px solid ${sponsorColor(trial.sponsor)}44`,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>{trial.sponsor}</span>
              </div>
            </div>
            <span style={{
              color: siteColor, fontSize: "14px",
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.25s", flexShrink: 0, marginTop: "2px"
            }}>▾</span>
          </div>

          <div style={{
            fontSize: "12px", color: "#94A3B8", lineHeight: 1.5,
            marginBottom: "10px"
          }}>{trial.question}</div>

          {/* Key number banner */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 12px", borderRadius: "8px",
            backgroundColor: siteBg, border: `1px solid ${siteColor}33`
          }}>
            <span style={{
              fontSize: "13px", fontWeight: 900, color: siteColor,
              fontFamily: "'JetBrains Mono', monospace"
            }}>{trial.keyNumber}</span>
            <span style={{ fontSize: "10px", color: "#64748B" }}>{trial.keyLabel}</span>
          </div>
        </div>
      </button>

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{
          padding: "0 16px 16px",
          borderTop: `1px solid rgba(255,255,255,0.05)`
        }}>
          {/* Arms */}
          <div style={{ marginTop: "14px", marginBottom: "12px" }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: "#475569",
              letterSpacing: "0.1em", marginBottom: "8px",
              fontFamily: "'JetBrains Mono', monospace"
            }}>TRIAL ARMS</div>
            {trial.arms.map((arm, i) => (
              <div key={i} style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                marginBottom: "5px"
              }}>
                <span style={{
                  flexShrink: 0, width: "18px", height: "18px",
                  borderRadius: "50%", backgroundColor: `${siteColor}22`,
                  border: `1px solid ${siteColor}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 700, color: siteColor,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>{i + 1}</span>
                <span style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.5 }}>{arm}</span>
              </div>
            ))}
          </div>

          {/* Result */}
          <div style={{
            padding: "12px 14px", borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: `1px solid ${siteColor}22`, marginBottom: "10px"
          }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: siteColor,
              letterSpacing: "0.1em", marginBottom: "6px",
              fontFamily: "'JetBrains Mono', monospace"
            }}>📊 RESULT</div>
            <div style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.6 }}>{trial.result}</div>
          </div>

          {/* Impact */}
          <div style={{
            padding: "12px 14px", borderRadius: "10px",
            backgroundColor: `${siteColor}0D`,
            border: `1px solid ${siteColor}33`, marginBottom: "12px"
          }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: siteColor,
              letterSpacing: "0.1em", marginBottom: "6px",
              fontFamily: "'JetBrains Mono', monospace"
            }}>⚡ CLINICAL IMPACT</div>
            <div style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: 1.6, fontWeight: 500 }}>{trial.impact}</div>
          </div>

          {/* Tags + PMID */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {trial.tags.map(tag => <TagPill key={tag} tag={tag} />)}
            </div>
            {trial.pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${trial.pmid}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: "10px", color: "#3B82F6",
                  textDecoration: "none", fontFamily: "'JetBrains Mono', monospace",
                  padding: "4px 10px", borderRadius: "6px",
                  backgroundColor: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)"
                }}
              >
                PMID {trial.pmid} ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function StatsBar({ filtered }: { filtered: typeof TRIALS }) {
  const bySite = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(t => { map[t.site] = (map[t.site] || 0) + 1; });
    return map;
  }, [filtered]);

  return (
    <div style={{
      display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px",
      marginBottom: "16px"
    }}>
      {[
        { label: "Trials", value: filtered.length },
        { label: "Sites", value: Object.keys(bySite).length },
        { label: "Oldest", value: filtered.length ? Math.min(...filtered.map(t => t.year)) : "—" },
        { label: "Newest", value: filtered.length ? Math.max(...filtered.map(t => t.year)) : "—" },
      ].map(stat => (
        <div key={stat.label} style={{
          flexShrink: 0, padding: "10px 16px",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center", minWidth: "64px"
        }}>
          <div style={{
            fontSize: "18px", fontWeight: 900, color: "#F1F5F9",
            fontFamily: "'Syne', sans-serif", lineHeight: 1
          }}>{stat.value}</div>
          <div style={{ fontSize: "9px", color: "#475569", marginTop: "3px", letterSpacing: "0.08em" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

// ─── SIDEBAR DATA ─────────────────────────────────────────────────────────────
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
    ]
  },
  {
    title: 'Prostate Trials',
    emoji: '💧',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.4)',
    rows: [
      { k: 'CHHiP', v: '60Gy/20# non-inferior', mono: true },
      { k: 'PACE-B', v: 'SBRT vs Mod Hypo', mono: true },
      { k: 'STAMPEDE', v: 'RT to primary in M1', mono: true },
    ]
  }
];

export default function ClinicalTrials() {
  const [view, setView] = useState<"database" | "comparison">("database");
  const [activeSite, setActiveSite] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("year");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let t = TRIALS;
    if (activeSite !== "All") t = t.filter(x => x.site === activeSite);
    if (search.trim()) {
      const s = search.toLowerCase();
      t = t.filter(x =>
        x.name.toLowerCase().includes(s) ||
        x.question.toLowerCase().includes(s) ||
        x.result.toLowerCase().includes(s) ||
        x.impact.toLowerCase().includes(s) ||
        x.tags.some(tag => tag.includes(s)) ||
        x.subsite.toLowerCase().includes(s)
      );
    }
    if (sortBy === "year") return [...t].sort((a, b) => b.year - a.year);
    if (sortBy === "site") return [...t].sort((a, b) => a.site.localeCompare(b.site));
    if (sortBy === "name") return [...t].sort((a, b) => a.name.localeCompare(b.name));
    return t;
  }, [activeSite, search, sortBy]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedIds, filtered]);

  const getItemSize = (index: number) => {
    const trial = filtered[index];
    if (expandedIds.has(trial.id)) {
      // Estimate expanded height based on content
      const baseHeight = 180;
      const armHeight = trial.arms.length * 25;
      const resultHeight = trial.result.length * 0.5;
      const impactHeight = trial.impact.length * 0.5;
      return baseHeight + armHeight + resultHeight + impactHeight + 100;
    }
    return 160; // Collapsed height
  };

  // Comparison Tool State
  const [selectedRefId, setSelectedRefId] = useState(REFERENCE_ARMS[0].id);
  const [customDose, setCustomDose] = useState(50);
  const [customFracs, setCustomFracs] = useState(25);
  const [customABTumour, setCustomABTumour] = useState(10.0);
  const [customABLate, setCustomABLate] = useState(3.0);

  const selectedRef = useMemo(() => 
    REFERENCE_ARMS.find(a => a.id === selectedRefId) || REFERENCE_ARMS[0],
  [selectedRefId]);

  const comparisonData = useMemo(() => {
    const ref = selectedRef;
    const dRef = ref.dose / ref.fractions;
    const bedTumourRef = ref.dose * (1 + dRef / ref.abTumour);
    const bedLateRef = ref.dose * (1 + dRef / ref.abLate);

    const dCust = customDose / customFracs;
    const bedTumourCust = customDose * (1 + dCust / customABTumour);
    const bedLateCust = customDose * (1 + dCust / customABLate);

    return [
      {
        name: 'Tumour BED',
        Reference: parseFloat(bedTumourRef.toFixed(1)),
        Custom: parseFloat(bedTumourCust.toFixed(1)),
        unit: 'Gy₁₀'
      },
      {
        name: 'Late Tissue BED',
        Reference: parseFloat(bedLateRef.toFixed(1)),
        Custom: parseFloat(bedLateCust.toFixed(1)),
        unit: 'Gy₃'
      }
    ];
  }, [selectedRef, customDose, customFracs, customABTumour, customABLate]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const trial = filtered[index];
    return (
      <div style={{ ...style, paddingRight: "8px" }}>
        <TrialCard 
          trial={trial} 
          index={index} 
          expanded={expandedIds.has(trial.id)}
          onToggle={() => toggleExpand(trial.id)}
        />
      </div>
    );
  };

  const AutoSizerAny = AutoSizer as any;
  const VariableSizeListAny = (reactWindow as any).VariableSizeList;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(175deg, #060B14 0%, #0A1322 60%, #060B14 100%)",
      fontFamily: "'DM Sans', sans-serif", color: "#F1F5F9"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap'); ::-webkit-scrollbar { height: 3px; width: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; } @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } } .trial-card { animation: fadeUp 0.4s ease both; } .chip-scroll { -ms-overflow-style: none; scrollbar-width: none; } .chip-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: "sticky", top: "44px", zIndex: 40,
        background: "rgba(6,11,20,0.94)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
              background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 0 24px rgba(245,158,11,0.35)"
            }}>⚗</div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: "17px", fontWeight: 900, color: "#F8FAFC",
                fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em", lineHeight: 1
              }}>Clinical Trials Reference</h1>
              <div style={{
                fontSize: "10px", color: "#475569", marginTop: "3px",
                fontFamily: "'JetBrains Mono', monospace"
              }}>Landmark RT trials · RTOG · EORTC · NCI · {TRIALS.length} studies</div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button 
                onClick={() => setView("database")}
                style={{
                  padding: "6px 10px", borderRadius: "8px",
                  backgroundColor: view === "database" ? "#F59E0B" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${view === "database" ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
                  color: view === "database" ? "#0A0F1A" : "#64748B",
                  fontSize: "9px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                }}
              >DATABASE</button>
              <button 
                onClick={() => setView("comparison")}
                style={{
                  padding: "6px 10px", borderRadius: "8px",
                  backgroundColor: view === "comparison" ? "#F59E0B" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${view === "comparison" ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
                  color: view === "comparison" ? "#0A0F1A" : "#64748B",
                  fontSize: "9px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s"
                }}
              >COMPARE</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px" }}>
        {view === "database" ? (
          <>
            {/* ── SEARCH ── */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
          <span style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)", fontSize: "14px",
            color: "#475569", pointerEvents: "none"
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trial name, keyword, result…"
            style={{
              width: "100%", padding: "12px 14px 12px 42px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px", color: "#F1F5F9",
              fontSize: "13px", outline: "none",
              fontFamily: "var(--font-sans)",
              transition: "border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "#F59E0B"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        {/* ── SITE CHIPS ── */}
        <div className="chip-scroll" style={{
          display: "flex", gap: "6px", overflowX: "auto",
          marginBottom: "16px", paddingBottom: "2px"
        }}>
          {SITES.map(site => (
            <SiteChip
              key={site} site={site}
              active={activeSite === site}
              onClick={() => setActiveSite(site)}
            />
          ))}
        </div>

        {/* ── SORT + STATS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", color: "#475569" }}>
            <span style={{ color: "#F59E0B", fontWeight: 700 }}>{filtered.length}</span> trials
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {["year", "site", "name"].map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: "5px 10px", borderRadius: "8px",
                backgroundColor: sortBy === s ? "#F59E0B" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sortBy === s ? "#F59E0B" : "rgba(255,255,255,0.08)"}`,
                color: sortBy === s ? "#0A0F1A" : "#64748B",
                fontSize: "10px", fontWeight: 700, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.2s"
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <StatsBar filtered={filtered} />

        {/* ── TRIAL LIST ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            color: "#475569", fontSize: "13px"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔬</div>
            No trials found for "{search}"
          </div>
        ) : (
          <div style={{ height: "calc(100vh - 350px)", width: "100%" }}>
            <AutoSizerAny>
              {({ height, width }: any) => (
                <VariableSizeListAny
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={filtered.length}
                  itemSize={getItemSize}
                  itemData={filtered}
                  className="chip-scroll"
                >
                  {Row}
                </VariableSizeListAny>
              )}
            </AutoSizerAny>
          </div>
        )}
      </>
    ) : (
      <div className="space-y-6">
            {/* Reference Arm Selector */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Dose Comparison Tool</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Select Reference Trial Arm</label>
                  <select 
                    value={selectedRefId} 
                    onChange={e => setSelectedRefId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none transition-colors"
                  >
                    {REFERENCE_ARMS.map(arm => (
                      <option key={arm.id} value={arm.id}>{arm.name} ({arm.arm})</option>
                    ))}
                  </select>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-3">
                  <p className="text-[9px] text-slate-500 uppercase mb-1">Reference Parameters</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-300">{selectedRef.site} Protocol</span>
                    <span className="text-[11px] font-mono text-amber-400">α/β: {selectedRef.abTumour}/{selectedRef.abLate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Schedule Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Custom Schedule</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Total Dose (Gy)</label>
                      <NumberInput  value={customDose} onChange={e => setCustomDose(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400"
                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Fractions</label>
                      <NumberInput  value={customFracs} onChange={e => setCustomFracs(parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400"
                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">α/β Tumour</label>
                      <NumberInput  value={customABTumour} onChange={e => setCustomABTumour(parseFloat(e.target.value) || 0.1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400"
                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">α/β Late</label>
                      <NumberInput  value={customABLate} onChange={e => setCustomABLate(parseFloat(e.target.value) || 0.1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-400"
                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio-equivalence Summary */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Bio-equivalence (Tumour BED)</p>
                  {(() => {
                    const refBED = comparisonData[0].Reference;
                    const custBED = comparisonData[0].Custom;
                    const ratio = (custBED / refBED) * 100;
                    const diff = ratio - 100;
                    return (
                      <>
                        <div className="text-4xl font-black text-white font-mono tracking-tighter">
                          {ratio.toFixed(1)}%
                        </div>
                        <div className={`text-[11px] font-bold ${diff > 0 ? 'text-rose-400' : diff < 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {diff > 0 ? `+${diff.toFixed(1)}% higher dose` : diff < 0 ? `${diff.toFixed(1)}% lower dose` : 'Identical dose'}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">BED Comparison (Gy)</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Reference</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Custom</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '12px', fontSize: '11px' }}
                      itemStyle={{ padding: '2px 0' }}
                    />
                    <Bar dataKey="Reference" fill="#475569" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="Custom" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 bg-slate-950/50 border border-slate-800/50 rounded-xl p-3">
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    <p className="font-bold text-slate-300 mb-1">Interpretation</p>
                    Compare the <span className="text-amber-400">Custom</span> schedule against the <span className="text-slate-300">Reference</span> trial arm. Ensure the Late Tissue BED does not significantly exceed the reference to avoid increased toxicity. Bio-equivalence is calculated based on the Tumour α/β.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER NOTE ── */}
        <div style={{
          marginTop: "24px", padding: "16px", borderRadius: "12px",
          backgroundColor: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.18)"
        }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, color: "#F59E0B",
            letterSpacing: "0.1em", marginBottom: "6px",
            fontFamily: "'JetBrains Mono', monospace"
          }}>⚠️ DISCLAIMER</div>
          <div style={{ fontSize: "11px", color: "#78716C", lineHeight: 1.7 }}>
            Data summarised for educational/reference use. Results reflect primary endpoints at specified follow-up. Clinical application requires full original publications. PMID links open PubMed. Not a substitute for current institutional guidelines or protocol-specific practice.
          </div>
        </div>
        <div style={{ height: "32px" }} />
      </div>

      <KeyFactsSidebar data={SIDEBAR_DATA} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} />

    </div>
  );
}
