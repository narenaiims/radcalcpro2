import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ChevronDown, ChevronUp, ExternalLink, BookOpen, 
  AlertTriangle, HelpCircle, Info, Layers, Map, Target, 
  Calendar, CheckCircle2, XCircle, ChevronRight, Shield,
  Activity, Zap, BarChart2
} from 'lucide-react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

// ── Types ──────────────────────────────────────────────────────────────────
interface Station {
  id: string;
  num: string;
  name: string;
  badge?: string;
  badgeClass?: string;
  accent: string;
  boundaries: {
    sup?: string;
    inf?: string;
    ant?: string;
    post?: string;
    lat?: string;
    med?: string;
  };
  clinical: string;
  fullNote?: string;
  consensus?: string;
  evidence?: string;
}

interface ErrorCase {
  id: string;
  title: string;
  site: string;
  error: string;
  fix: string;
  why: string;
  tip: string;
  evidence?: string;
}

interface Question {
  topic: string;
  diff: 'E' | 'M' | 'H';
  q: string;
  opts: string[];
  ans: number;
  explain: string;
}

interface DailyCase {
  id: string;
  title: string;
  site: string;
  scenario: string;
  options: {
    text: string;
    rationale: string;
    isGoldStandard: boolean;
  }[];
  consensus: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const HN_STATIONS: Station[] = [
  {
    id: 'ia', num: 'Ia', name: 'Submental', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--gold)',
    boundaries: { sup: 'Mylohyoid muscle', inf: 'Hyoid bone (body)', ant: 'Symphysis menti', post: 'Body of hyoid', lat: 'Medial border ant. digastric' },
    clinical: 'Drains floor of mouth, anterior oral tongue, lower lip, chin. Target when: oral cavity primaries (T2+), lower gum tumours. Bilateral coverage mandatory for midline oral cavity tumours.',
    fullNote: 'Draw between the two anterior bellies of digastric. Include the fatty lymphatic tissue. Do NOT include the mylohyoid muscle itself. Inferior border is the superior surface of the hyoid body. Medial to anterior digastric bellies — exclude the digastric muscle. Pitfall: omitting this level in floor-of-mouth SCC — it is the first echelon and often involved silently on imaging.',
    consensus: 'DAHANCA 2003 / Grégoire 2014: Level Ia defined above hyoid; contoured as single midline structure. RTOG 0920 atlas: mylohyoid = superior boundary — do not include the muscle belly itself.',
    evidence: 'Grade B'
  },
  {
    id: 'ib', num: 'Ib', name: 'Submandibular', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--gold)',
    boundaries: { sup: 'Mylohyoid / inferior border mandible', inf: 'Hyoid bone (body)', ant: 'Ant. belly of digastric', post: 'Post. border of submandibular gland', med: 'Lateral edge mylohyoid', lat: 'Medial surface mandible' },
    clinical: 'Drains oral cavity (tongue, floor of mouth, buccal mucosa, retromolar trigone), level Ia efferents. Contains submandibular gland (important OAR for xerostomia). Elective CTV in: oral cavity, oropharynx (N0 ipsilateral for lateral tumours). High-risk for FOM, mobile tongue T2+.',
    fullNote: 'The submandibular gland is INCLUDED in Level Ib (per RTOG/Grégoire consensus). It cannot be reliably spared when Ib requires treatment. Exception: consider omitting Ib electively in clinically N0 oropharynx lateral wall T1 tumours. Contralateral Ib: include if midline crossing or bilateral neck disease. Post border: stylohyoid muscle / posterior digastric.'
  },
  {
    id: 'iia', num: 'IIa', name: 'Upper Jugular (Ant. to CN XI)', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--teal)',
    boundaries: { sup: 'Skull base / C1 transverse process', inf: 'Hyoid bone (caudal body)', ant: 'Post. border submandibular gland / stylohyoid', post: 'Posterior edge internal jugular vein (to CN XI)', med: 'Medial edge sternocleidomastoid', lat: 'Medial edge SCM / parotid deep lobe' },
    clinical: 'First echelon for oropharynx, nasopharynx, parotid, hypopharynx. Most commonly involved level in H&N SCC. IIa anterior to spinal accessory nerve (CN XI); IIb posterior — clinically important distinction. Jugulo-digastric node is the largest node in IIa — palpable landmark.',
    fullNote: 'The spinal accessory nerve (CN XI) divides IIa (anterior) from IIb (posterior). On CT, use the posterior wall of the internal jugular vein at that level as a surrogate. IIb is more posterior and superior, nestled between SCM and splenius. IIb elective coverage: include in NPC, oropharynx (all T stages), parotid tumours. Consider omitting IIb (not IIa) in hypopharynx, larynx, thyroid if node-negative to spare CN XI region.',
    evidence: 'Grade A'
  },
  {
    id: 'iib', num: 'IIb', name: 'Upper Jugular (Post. to CN XI)', badge: 'Selective', badgeClass: 'badge-sel', accent: 'var(--teal)',
    boundaries: { sup: 'Skull base / C1 transverse process', inf: 'Caudal body of hyoid', ant: 'Posterior wall IJV / CN XI', post: 'Posterior edge SCM', med: 'CN XI (spinal accessory)', lat: 'Posterior border SCM' },
    clinical: 'Include: NPC (all stages), oropharynx T3-T4, major salivary gland, unknown primary. Consider omitting: Larynx N0, hypopharynx N0, thyroid — low yield, spares CN XI dose. N+ neck: Always include IIb on involved side. Involvement risk NPC: ~35%; oropharynx: ~15%.',
    fullNote: 'IIb contour is a wedge-shaped space posterior to the IJV / CN XI, medial to SCM. On axial CT at skull base level: the fatty triangle between SCM posterior and splenius capitis. Often very thin (1–3 mm depth). Do not over-contour into the parotid deep lobe or into splenius muscle. The jugulodigastric node (if present) usually falls in IIa, not IIb.'
  },
  {
    id: 'iii', num: 'III', name: 'Mid-Jugular', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--lime)',
    boundaries: { sup: 'Hyoid bone (caudal body)', inf: 'Inferior border cricoid cartilage', ant: 'Post. border sternohyoid / sternothyroid', post: 'Posterior edge SCM', med: 'Medial edge common carotid artery', lat: 'Lateral edge SCM' },
    clinical: 'Drains: hypopharynx, larynx, mid-oropharynx, thyroid. Key elective level for all H&N primaries with N+ neck. Contains the jugulo-omohyoid node at inferior extent. Closely related to common carotid artery — medial boundary.',
    fullNote: 'The division is the inferior border of the cricoid cartilage. Above cricoid = Level III; below = Level IV. This is a critical landmark — on axial imaging, identify cricoid ring and mark its inferior aspect. The carotid artery (common carotid) runs medially as a consistent vascular landmark throughout III and IV. Pitfall: confusing the cricoid shadow with thyroid cartilage (which is higher and marks the II/III transition in some older classifications).'
  },
  {
    id: 'iv', num: 'IV', name: 'Lower Jugular', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--violet)',
    boundaries: { sup: 'Inf. border cricoid cartilage', inf: 'Clavicle / 2 cm superior to clavicular head of SCM', ant: 'Posterior border sternothyroid', post: 'Anterior scalene muscle', med: 'Common carotid artery', lat: 'Lateral edge SCM' },
    clinical: 'Critical level for hypopharynx, cervical oesophagus, thyroid. Supraclavicular nodes (Virchow\'s) are within or adjacent to Level IV. IV nodes: ~15% risk electively for larynx/hypopharynx. Must include if known Level III disease (cascade drainage).',
    fullNote: 'The inferior boundary of Level IV is the clavicle. Do not truncate at the thoracic inlet — this misses supraclavicular nodes that are Level IV. For NPC and unknown primary: extend Level IV coverage to at least the sternoclavicular joint. The anterior scalene marks the posterior/lateral limit — do not go into the brachial plexus territory. IVb (mediastinal extension): relevant in cervical oesophagus and thyroid — refer to dedicated atlas.'
  },
  {
    id: 'v', num: 'V', name: 'Posterior Triangle (Va + Vb)', badge: 'Selective', badgeClass: 'badge-sel', accent: 'var(--coral)',
    boundaries: { sup: 'Skull base / C2 level', inf: 'Clavicle', ant: 'Posterior edge SCM', post: 'Anterior border trapezius', med: 'Levator scapulae' },
    clinical: 'Va contains the accessory chain nodes (along CN XI). Vb contains the transverse cervical and supraclavicular nodes. Indications for Level V: NPC (all T/N), skin primaries (scalp/posterior neck), unknown primary, N+ Level II disease. Generally omit Vb in larynx/hypopharynx N0. High dose to Va risks shoulder dysfunction (CN XI).',
    fullNote: 'The spinal accessory nerve (CN XI) traverses Level V — coursing from SCM to trapezius. NPC Level V Protocol (ESTRO 2022): For NPC: bilateral Va + Vb mandatory regardless of N stage. Evidence shows ~20% subclinical involvement. Grégoire 2022 ESTRO consensus: Level Vb (supraclavicular fossa) should be included in elective CTV for NPC T1-T4 N0-N3.',
    evidence: 'Grade A'
  },
  {
    id: 'vi', num: 'VI', name: 'Central Compartment (Anterior)', badge: 'Site-specific', badgeClass: 'badge-sel', accent: 'var(--sky)',
    boundaries: { sup: 'Hyoid bone', inf: 'Manubrium sterni (thoracic inlet)', ant: 'Strap muscles (sternothyroid/hyoid)', post: 'Trachea, oesophagus, prevertebral fascia', lat: 'Common carotid arteries' },
    clinical: 'Contains: pre- and paratracheal, pretracheal, prelaryngeal (Delphian), perithyroidal nodes. Mandatory for: thyroid carcinoma (all subtypes), subglottic larynx, cervical trachea, hypopharynx. Delphian node: single pretracheal node — involvement = adverse prognostic factor.',
    fullNote: 'The recurrent laryngeal nerve (RLN) lies in the tracheo-oesophageal groove within Level VI. High dose to this region risks bilateral RLN injury → bilateral vocal cord palsy → tracheostomy. In re-irradiation, avoid Dmax >60 Gy to central Level VI in previously irradiated patients. Parathyroids are within Level VI — post-RT hypoparathyroidism is documented after high-dose Level VI treatment for thyroid cancer.'
  },
  {
    id: 'rp', num: 'RP', name: 'Retropharyngeal Nodes', badge: 'NPC / Oropharynx', badgeClass: 'badge-sel', accent: 'var(--gold)',
    boundaries: { sup: 'Skull base (C1 upper margin)', inf: 'Cranial edge C2 body (medial RP) / hyoid (lateral RP)', ant: 'Posterior pharyngeal wall', post: 'Prevertebral musculature', lat: 'Medial edge internal carotid artery' },
    clinical: 'First echelon for NPC — bilateral RP nodes must ALWAYS be covered. Oropharynx: include RP electively (ipsilateral RP at minimum). Hypopharynx posterior wall: include bilateral RP. Often missed in non-specialist contouring — invisible clinically.',
    fullNote: 'The RP space is between the pharyngeal constrictors (anterior) and the prevertebral muscles (posterior), lateral to the midline, medial to the carotid. Contour bilaterally from skull base to C2 inferior. The medial RP node of Rouvière lies just caudal to skull base. Key error: stopping RP at C1 — extend to C2 level to cover the lateral RP node group.',
    evidence: 'Grade A'
  }
];

const PELVIS_STATIONS: Station[] = [
  {
    id: 'ci', num: 'CI', name: 'Common Iliac', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--gold)',
    boundaries: { sup: 'Aortic bifurcation (L4/L5 level)', inf: 'Bifurcation into external / internal iliac', post: 'Psoas / iliacus anterior surface' },
    clinical: 'Cervix (all stages), endometrium (high-risk), bladder (muscle-invasive), rectum (locally advanced), para-aortic nodal disease downward. Include bilaterally for all cervix ≥ IIB or N+ disease. RTOG 0418 protocol: mandatory for cervix.',
    fullNote: 'Per RTOG consensus (Small 2008): draw a 7 mm margin around the vessel wall of the common iliac artery, including the adjacent vein. Do not include bowel or psoas muscle. Superiorly, extend to the bifurcation of the aorta — typically at the L4/L5 intervertebral disc level.',
    evidence: 'Grade B'
  },
  {
    id: 'ei', num: 'EI', name: 'External Iliac', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--teal)',
    boundaries: { sup: 'Common iliac bifurcation', inf: 'Inguinal ligament / femoral canal entry' },
    clinical: 'Primary drainage for pelvic organs. Anterior group (lateral to artery) at risk in: cervix anterior/parametrial invasion, bladder anterior wall. Key: Include anterior EI — often a 2nd contour lateral to main vessel group.',
    fullNote: 'The EI nodal region contains three groups: (1) Lateral (to EIA), (2) Medial (between EIA and EIV — the obturator vein territory), (3) Anterior (ventral to EIA — Lacunar nodes). Medial group often missed. For cervix: include all 3 groups bilaterally. For prostate: EI coverage is debated — include if pelvic LN prophylaxis planned (NRG GU003 protocol).'
  },
  {
    id: 'ii', num: 'II', name: 'Internal Iliac (Hypogastric)', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--violet)',
    boundaries: { sup: 'CI bifurcation', inf: 'Upper border greater sciatic notch', med: 'Lateral wall of bladder/rectum', lat: 'Internal obturator muscle' },
    clinical: 'Mandatory for: cervix, vagina, vulva, prostate (N+), rectum, anal canal, endometrium (Stage III). Contains: obturator nerves, superior vesical, inferior vesical, middle rectal vascular territory nodes. High-risk drainage for posterior wall cervix tumours.',
    fullNote: 'The internal iliac artery branches extensively — anterior and posterior divisions. Contouring approach: follow the main IIA trunk from CI bifurcation, then include the fatty space between internal obturator (lateral), bladder/rectum (medial), and the greater sciatic notch (posterior). Use bony and muscular landmarks: medial to internal obturator, lateral to visceral structures.'
  },
  {
    id: 'ob', num: 'OB', name: 'Obturator', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--lime)',
    boundaries: { sup: 'Obturator internus origin', inf: 'Obturator canal (foramen)', med: 'Lateral pelvic wall (bladder/levator ani)', lat: 'Internal obturator muscle', post: 'Obturator internus' },
    clinical: 'First echelon for prostate — most commonly involved pelvic nodal station in prostate cancer. Also first echelon: cervix, endometrium, bladder. Contains obturator nerve — dose-limiting structure. Do NOT confuse with obturator foramen (bony opening).',
    fullNote: 'For prostate cancer pelvic nodal irradiation (RTOG 9413, STAMPEDE-RT): obturator nodes must be included. They lie in the obturator space — medial to the obturator internus muscle, lateral to the levator ani/bladder wall. On axial CT: contour the fatty space between the internal obturator muscle and the lateral bladder wall, above the obturator foramen.',
    evidence: 'Grade A'
  },
  {
    id: 'ps', num: 'PS', name: 'Presacral', badge: 'Rectum / Cervix', badgeClass: 'badge-sel', accent: 'var(--coral)',
    boundaries: { sup: 'Aortic bifurcation / S1 level', inf: 'S4/coccyx junction', ant: 'Posterior wall of rectum', post: 'Anterior surface of sacrum', lat: 'Lateral sacral foramina' },
    clinical: 'Mandatory: Rectal cancer, cervix (posterior wall invasion), vagina posterior, anal canal. Contains superior rectal / sacral nodes. Closely related to mesorectal fascia. S2-S4 sacral nerve roots medially.',
    fullNote: 'For rectal cancer: presacral space is the posterior mesorectal region that extends behind the rectum to the sacrum. ESTRO 2021 guidelines: include presacral nodes to S3/S4 level for T3-T4 or N+ rectal cancer. The anterior sacral foramina mark the lateral boundaries — do not include the foraminal contents.'
  },
  {
    id: 'ing', num: 'ING', name: 'Inguinal / Femoral', badge: 'Vulva / Anal / LRR', badgeClass: 'badge-sel', accent: 'var(--gold)',
    boundaries: { sup: 'Inguinal ligament', inf: '2 cm inferior to saphenofemoral junction', lat: 'Sartorius muscle (medial edge)', med: 'Adductor longus (lateral edge)', post: 'Femoral vessels (medial to deep fascia)' },
    clinical: 'Mandatory: Vulvar cancer (all stages), anal canal (T2+ or N+), distal vaginal cancer, penile cancer. Superficial + deep femoral groups — both must be included. Saphenous vein junction = key inferior landmark. Risk: leg lymphoedema in high-dose inguinal RT.',
    fullNote: 'Two distinct groups: Superficial inguinal nodes (above/around saphenofemoral junction, in Scarpa\'s triangle) and Deep inguinal / femoral nodes (within femoral sheath, medial to femoral vein). Both must be included for vulvar/anal cancer. The femoral sheath nodes lie under the fascia lata — include these explicitly.',
    evidence: 'Grade A'
  }
];

const THORAX_STATIONS: Station[] = [
  {
    id: '1-4', num: '1–4', name: 'Superior Mediastinum', badge: 'Bilateral', badgeClass: 'badge-bil', accent: 'var(--teal)',
    boundaries: {},
    clinical: 'Station 1: Highest mediastinal. Station 2R/2L: Upper paratracheal. Station 3a: Pre-vascular. Station 3p: Pre-vertebral. Station 4R/4L: Lower paratracheal.',
    fullNote: 'Station 1: Between clavicles. Station 2R/2L: Between apex lung and top of aortic arch. Station 3a: Anterior to great vessels. Station 3p: Posterior to oesophagus. Station 4R/4L: Between top of arch and azygos arch (right) or left pulmonary artery (left).'
  },
  {
    id: '5-9', num: '5–9', name: 'Aortopulmonary / Subcarinal / Inferior', badge: 'Lung / Oesophagus', badgeClass: 'badge-sel', accent: 'var(--lime)',
    boundaries: {},
    clinical: 'Station 5: Aortopulmonary window. Station 6: Pre-aortic. Station 7: Subcarinal. Station 8: Para-oesophageal. Station 9: Pulmonary ligament.',
    fullNote: 'Station 5: Between aortic arch and left PA. Station 7: Below carina between main bronchi. Bilateral drainage — high-yield station for all central tumours and oesophageal cancer. Station 8: Adjacent to oesophagus below carina.'
  },
  {
    id: '10-14', num: '10–14', name: 'Hilar / Lobar / Segmental', badge: 'Ipsilateral', badgeClass: 'badge-uni', accent: 'var(--coral)',
    boundaries: {},
    clinical: 'Station 10: Hilar. Stations 11–14: Lobar, segmental, subsegmental. Generally NOT included in RT CTV unless involved.',
    fullNote: 'Station 10: Along main bronchus from upper/lower margin of azygos (right) or upper margin of PA (left) to origin of lobar bronchus. Current practice: involved-field RT (IFRT) only. Include only stations with confirmed nodal involvement on FDG-PET/CT.',
    evidence: 'Grade A for IFRT'
  }
];

const ERROR_CASES: ErrorCase[] = [
  {
    id: 'e1', title: 'Missing Retropharyngeal Nodes in NPC', site: 'H&N / NPC',
    error: 'CTV-N elective contoured as bilateral II–V only. Retropharyngeal nodal space omitted entirely — no RP coverage cranially from skull base to C2.',
    fix: 'For NPC: bilateral RP nodes mandatory from skull base to lower border of C2 body (medial RP = Rouvière\'s node). Contour the space between posterior pharyngeal wall and prevertebral muscles, medial to internal carotid.',
    why: 'RP nodal involvement in NPC: 65% clinically, ~20% subclinically N0. Omitting RP coverage results in a geographic miss — highest-risk first-echelon nodes untreated.',
    tip: 'On axial CT at C1 level: the RP space is a triangular fatty region between the posterior pharyngeal mucosal space (anterior), prevertebral muscles (posterior), and medial carotid sheath (lateral).',
    evidence: 'Grade A'
  },
  {
    id: 'e2', title: 'Crossing the Midline in Unilateral Tonsil SCC', site: 'H&N / Oropharynx',
    error: 'T2N1 left tonsillar fossa SCC: contralateral neck irradiated to full dose (70 Gy). Bilateral parotids irradiated. No clear midline sparing strategy.',
    fix: 'Truly lateralised tonsil SCC: ipsilateral neck only is evidence-based. Contralateral risk <5% — does not justify bilateral high-dose RT and bilateral xerostomia.',
    why: 'Unnecessary bilateral parotid irradiation: severe xerostomia (NTCP >40%), dysphagia, reduced QOL.',
    tip: 'Always check: (1) Does tumour cross posterior tonsillar pillar to soft palate? (2) Does it extend to BOT midline? (3) Contralateral Level II nodes? If any YES → bilateral.',
    evidence: 'Grade B'
  },
  {
    id: 'e3', title: 'Over-Contouring Atelectasis as Lung GTV', site: 'Thorax / NSCLC',
    error: 'Right lower lobe NSCLC with complete lower lobe atelectasis: entire consolidated lobe included in GTV on CT.',
    fix: 'Separate atelectasis from tumour using: (1) FDG-PET; (2) CT density; (3) Post-bronchoscopic re-CT; (4) MRI (DWI). Contour true GTV within/adjacent to atelectasis — not the whole collapsed segment.',
    why: 'Massive lung V20 and MLD increase — may breach normal tissue constraints, forcing dose reduction.',
    tip: 'FDG-PET SUV threshold: tumour SUV typically >5; atelectatic lung SUV 1.5–2.5. Use SUV 2.5 as a soft threshold.',
    evidence: 'Grade B'
  },
  {
    id: 'e4', title: 'Omitting Obturator Nodes in Prostate WPRT', site: 'Pelvis / Prostate',
    error: 'Whole-pelvis RT for high-risk prostate: CTV-N drawn as external iliac + internal iliac only. Obturator space not contoured.',
    fix: 'Per RTOG 9413 protocol and NCCN guidelines: obturator nodes are a distinct contour in the obturator space — medial to internal obturator muscle, lateral to bladder/prostate, above obturator foramen.',
    why: 'Obturator nodes are the most commonly involved pelvic nodes in prostate cancer. Omitting them leaves the highest-risk first-echelon nodal station untreated.',
    tip: 'On axial CT at mid-pelvis: identify the obturator internus muscle — the obturator nodal space is medial to this muscle, posterolateral to the bladder.',
    evidence: 'Grade A'
  },
  {
    id: 'e5', title: 'Inadequate Spinal Cord PRV in H&N IMRT', site: 'H&N / OAR',
    error: 'Spinal cord contoured as the visible cord on T2 MRI without PRV expansion. Planning constraint applied to cord = 45 Gy. Actual delivered dose to cord PRV exceeded 50 Gy.',
    fix: 'Spinal cord: contour the true cord (thecal sac outline preferred). Add PRV = cord + 5 mm circumferential expansion. Apply dose constraint to PRV, not cord.',
    why: 'Radiation myelopathy — irreversible, catastrophic consequence. TD5/5 for spinal cord = 50 Gy (partial cord).',
    tip: 'The 5 mm PRV accounts for the residual set-up uncertainty after daily CBCT correction (~3 mm systematic + random).',
    evidence: 'Grade A'
  },
  {
    id: 'e6', title: 'Uterus Position Assumption in Cervix Contouring', site: 'Pelvis / Cervix',
    error: 'Cervix CTV drawn on sim CT with anteverted uterus. No account taken of uterine mobility between fractions.',
    fix: 'Two strategies: (1) Population-based CTV expansion — include uterine fundus with 2 cm superior margin; (2) Daily MRI-guided ART (MR-Linac).',
    why: 'Uterine fundus geographic miss is a failure pattern in cervix EBRT. Associated with central pelvic relapse.',
    tip: 'EMBRACE II protocol: contour HR-CTV on MRI at time of each brachytherapy insertion — gold standard.',
    evidence: 'Grade A'
  },
  {
    id: 'e7', title: 'GTV-CTV Expansion Across Fascial Planes', site: 'General Principle',
    error: 'Automatic isotropic 1 cm GTV-CTV expansion used without respecting anatomical barriers. CTV expands into intact bone, air-containing bowel lumen, or across intact fascial planes.',
    fix: 'Microscopic tumour spread does not cross intact anatomical barriers: (1) Intact cortical bone; (2) Air/bowel lumen; (3) Intact fascial compartments; (4) Periosteum.',
    why: 'Unnecessarily large CTVs from non-anatomical expansions → larger PTVs → higher OAR doses → increased toxicity.',
    tip: 'Always ask before finalising CTV: (1) Is there an intact fascial barrier here? (2) Is there bone/cartilage? (3) Is there air?',
    evidence: 'Grade A'
  }
];

const QUIZ_QUESTIONS: Question[] = [
  {
    topic: 'H&N — Level RP', diff: 'H',
    q: 'A T2N0 nasopharyngeal carcinoma is planned for definitive IMRT. Which statement about retropharyngeal (RP) node contouring is CORRECT?',
    opts: ['Bilateral RP nodes from skull base to C2 must be contoured regardless of N stage', 'RP nodes only need to be covered if there is visible nodal enlargement on MRI', 'Unilateral RP coverage is sufficient for lateralised NPC tumours', 'RP nodes should be contoured from C2 to the level of the hyoid bone'],
    ans: 0, explain: 'Bilateral RP node coverage from skull base to lower border of C2 is mandatory for ALL NPC cases regardless of N stage. RP nodal involvement occurs in ~65% clinically and ~20% subclinically N0. The medial RP node (Rouvière) lies just below skull base — stopping at C1 is insufficient. Unilateral coverage is never adequate for NPC. (Grégoire 2014, ESTRO NPC 2022 — Grade A)'
  },
  {
    topic: 'Pelvis — Prostate', diff: 'M',
    q: 'For whole-pelvis RT in high-risk prostate cancer, which nodal group is MOST COMMONLY omitted in suboptimal contouring?',
    opts: ['External iliac', 'Internal iliac', 'Obturator', 'Common iliac'],
    ans: 2, explain: 'The obturator nodal group is the most commonly omitted pelvic nodal station in prostate WPRT. It lies medial to the internal obturator muscle, lateral to the bladder/prostate — a distinct space not covered by standard EI or II expansions. Obturator nodes are the FIRST-ECHELON station for prostate cancer. Multi-institutional audit found omission in ~30% of WPRT plans. (RTOG 9413 protocol — Grade A)'
  },
  {
    topic: 'H&N — Level II', diff: 'M',
    q: 'What anatomical structure divides Level IIa from Level IIb in the neck?',
    opts: ['Internal jugular vein', 'Sternocleidomastoid muscle posterior border', 'Spinal accessory nerve (CN XI)', 'Posterior belly of digastric'],
    ans: 2, explain: 'The spinal accessory nerve (CN XI) is the dividing structure — IIa is anterior and medial to CN XI, IIb is posterior and lateral. On CT (where CN XI is not directly visible) use the posterior wall of the internal jugular vein as a surrogate landmark. IIb is relevant for NPC, oropharynx, parotid tumours. CN XI traverses from jugular foramen (skull base) through Level II to trapezius, also through Level V. High dose risks shoulder dysfunction.'
  },
  {
    topic: 'Lung — GTV', diff: 'H',
    q: 'A right lower lobe NSCLC presents with complete lobar atelectasis. The CT shows a consolidated lower lobe (250 cc). FDG-PET shows focal intense uptake (SUV 8) in the hilar region (30 cc) with lower uniform uptake (SUV 2.0) in the remainder. What is the CORRECT GTV?',
    opts: ['Full consolidated lobe (250 cc) — atelectasis cannot be separated', 'PET-based GTV using SUV 2.5 threshold (~30 cc in hilar region)', 'CT-based GTV using 200 HU threshold to separate tumour from atelectasis', 'No GTV possible — defer to post-bronchoscopy re-CT'],
    ans: 1, explain: 'FDG-PET is the best tool to separate tumour from atelectasis. SUV 2.5 is the validated threshold — tumour shows SUV ≥5 (here SUV 8), atelectatic lung shows SUV 1.5–2.5 (here SUV 2.0). Contouring the full consolidated lobe massively over-estimates GTV (250 vs 30 cc), increasing V20 and risking treatment plan infeasibility. Post-bronchoscopy CT is useful but delays treatment. PET-CT with SUV threshold is the standard approach per ESTRO guidelines. (Grade B)'
  },
  {
    topic: 'Pelvis — Inguinal', diff: 'M',
    q: 'For vulvar carcinoma requiring inguinal node irradiation, which statement is CORRECT regarding the inferior extent?',
    opts: ['The inferior extent is the inguinal ligament superiorly — do not go below it', 'Include superficial inguinal nodes only — deep femoral nodes do not require coverage', 'Extend 2 cm below the saphenofemoral junction to include deep femoral nodes', 'The inguinal ligament is the inferior, not superior, boundary of inguinal coverage'],
    ans: 2, explain: 'For vulvar/anal cancer, inguinal coverage must include BOTH superficial inguinal nodes (around saphenofemoral junction in Scarpa\'s triangle) AND deep femoral/inguinal nodes (within femoral sheath, under fascia lata). The inferior extent is 2 cm below the saphenofemoral junction. The inguinal ligament is the SUPERIOR boundary. Cloquet\'s node (most proximal deep inguinal node at femoral ring) is important — its involvement upstages vulvar cancer. (RTOG vulva protocol — Grade A)'
  },
  {
    topic: 'H&N — CTV expansion', diff: 'H',
    q: 'A GTV-CTV automatic 1 cm expansion is applied in the treatment planning system for an oral tongue SCC. The expansion encroaches 3 mm into the cortical surface of the mandible (which appears intact on CT). What is the CORRECT action?',
    opts: ['Accept the expansion — the 1 cm CTV must be maintained around all GTV surfaces', 'Reduce the expansion to 0–1 mm at the intact cortical bone surface (trim CTV)', 'Increase the CTV to 1.5 cm to account for potential sub-periosteal spread', 'Order MRI to confirm bone invasion before finalising CTV'],
    ans: 1, explain: 'Intact cortical bone is an anatomical barrier to microscopic tumour extension — CTV should be trimmed to 0–1 mm at the cortical surface. GTV-CTV expansion represents the risk of microscopic spread, which does not cross intact anatomical barriers including intact cortical bone, intact fascial planes, or air. If MRI/CT shows periosteal invasion or frank bone erosion, the CTV should extend through bone. This biological approach to CTV expansion is a core principle of target volume delineation (ICRU 83, Grégoire). (Grade A)'
  },
  {
    topic: 'H&N — Level Ib', diff: 'E',
    q: 'Which structure is INCLUDED within Level Ib (submandibular nodal region) per RTOG/Grégoire consensus?',
    opts: ['Parotid gland superficial lobe', 'Submandibular gland', 'Sublingual gland', 'Submental lymphatic tissue'],
    ans: 1, explain: 'The submandibular gland is included within Level Ib per RTOG and Grégoire 2014 consensus — it cannot be reliably spared when Level Ib treatment is required. The sublingual gland is more anterior (within Level Ia territory). The parotid is a separate OAR within the parotid/Level II region. The submental tissue is Level Ia. When Level Ib must be treated (oral cavity primaries, N+ submandibular), submandibular gland sparing is generally not feasible — document this in the treatment note.'
  },
  {
    topic: 'Pelvis — Boundaries', diff: 'M',
    q: 'For cervical cancer IMRT, at what vertebral level does the superior extent of the common iliac nodal CTV typically begin?',
    opts: ['L2/L3 intervertebral disc', 'L3/L4 intervertebral disc', 'L4/L5 intervertebral disc (aortic bifurcation)', 'T12/L1 (diaphragm)'],
    ans: 2, explain: 'The aortic bifurcation (where aorta divides into common iliac arteries) is typically at the L4/L5 intervertebral disc level. This marks the superior extent of the common iliac nodal CTV. The CTV is a 7 mm expansion around the common iliac artery from this level to its bifurcation into external and internal iliac arteries (at the sacral promontory). For para-aortic disease or high-risk cervix, extend coverage above L4/L5 to include para-aortic nodes. (Small 2008, RTOG consensus)'
  }
];

// ── Case of the Day Data ──────────────────────────────────────────────────
const DAILY_CASES: DailyCase[] = [
  {
    id: 'case-1',
    title: 'The Midline Floor of Mouth Dilemma',
    site: 'Head & Neck',
    scenario: 'A 58-year-old male presents with a T2N0M0 SCC of the anterior floor of mouth, 2mm from the midline. Imaging is negative for nodal involvement. What is the most appropriate elective nodal contouring strategy?',
    options: [
      {
        text: 'Ipsilateral Levels I-III only.',
        rationale: 'Insufficient. Midline floor of mouth tumours have a high risk of bilateral drainage even in N0 stage.',
        isGoldStandard: false
      },
      {
        text: 'Bilateral Levels Ia, Ib, and II-III.',
        rationale: 'Correct. Midline oral cavity tumours (within 1cm of midline) require bilateral neck treatment. Level Ia is the first echelon for FOM.',
        isGoldStandard: true
      },
      {
        text: 'Bilateral Levels Ib and II only (Skip Ia).',
        rationale: 'Incorrect. Level Ia is the primary drainage site for the anterior floor of mouth and must be included.',
        isGoldStandard: false
      }
    ],
    consensus: 'DAHANCA / RTOG Consensus: Midline oral cavity tumours require bilateral neck irradiation including Level Ia.'
  },
  {
    id: 'case-2',
    title: 'Supraglottic Larynx Extension',
    site: 'Head & Neck',
    scenario: 'T3N0 supraglottic larynx tumour with extension to the pre-epiglottic space. Which nodal levels must be included in the elective CTV?',
    options: [
      {
        text: 'Bilateral Levels II, III, and IV.',
        rationale: 'Correct. Supraglottic tumours have rich bilateral lymphatic drainage. Levels II-IV are the standard elective volumes.',
        isGoldStandard: true
      },
      {
        text: 'Ipsilateral Levels II-IV only.',
        rationale: 'Incorrect. Supraglottic larynx is a midline structure with high bilateral risk.',
        isGoldStandard: false
      },
      {
        text: 'Bilateral Levels II-V.',
        rationale: 'Level V is rarely involved in N0 larynx cancer and can often be safely omitted to spare CN XI.',
        isGoldStandard: false
      }
    ],
    consensus: 'ESTRO / ACROP Guidelines: Elective treatment of Levels II-IV bilaterally is standard for T3-4 N0 supraglottic cancer.'
  },
  {
    id: 'case-3',
    title: 'Cervical Oesophagus Boundaries',
    site: 'Thorax',
    scenario: 'A patient with cervical oesophageal cancer requires nodal irradiation. What is the standard superior boundary for the elective nodal volume in this case?',
    options: [
      {
        text: 'Cricoid cartilage (Level IV superior).',
        rationale: 'Incorrect. For cervical oesophagus, the risk extends higher into the paratracheal and lower jugular regions.',
        isGoldStandard: false
      },
      {
        text: 'Hyoid bone (Level III superior).',
        rationale: 'Correct. Consensus guidelines for cervical oesophagus often recommend starting elective nodal coverage at the hyoid bone level to include high paratracheal nodes.',
        isGoldStandard: true
      },
      {
        text: 'Skull base.',
        rationale: 'Excessive. Skull base coverage is not standard for cervical oesophagus unless there is specific high-level nodal involvement.',
        isGoldStandard: false
      }
    ],
    consensus: 'JCOG / ESTRO Consensus: Elective nodal volumes for cervical oesophageal cancer should typically extend from the hyoid bone to the carina.'
  }
];

// ── Constants ──────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: "Core Principles",
    emoji: "🎯",
    accent: "#2dd4bf",
    bg: "rgba(45, 212, 191, 0.05)",
    border: "rgba(45, 212, 191, 0.1)",
    rows: [
      { k: "Anatomical Barriers", v: "Bone, air, and intact fascia are barriers to microscopic spread." },
      { k: "CTV Expansion", v: "Typically 5-10mm, but must be trimmed at anatomical boundaries." },
      { k: "Nodal Levels", v: "Standardized by DAHANCA, RTOG, and ESTRO consensus." },
      { k: "GTV-to-CTV", v: "Accounts for sub-clinical microscopic disease (e.g., 5mm for SCC)." },
      { k: "CTV-to-PTV", v: "Accounts for setup error and organ motion (e.g., 3-5mm)." },
    ]
  },
  {
    title: "H&N Landmarks",
    emoji: "🧠",
    accent: "#e8c84a",
    bg: "rgba(232, 200, 74, 0.05)",
    border: "rgba(232, 200, 74, 0.1)",
    rows: [
      { k: "Level II/III", v: "Divided by the inferior border of the hyoid bone." },
      { k: "Level III/IV", v: "Divided by the inferior border of the cricoid cartilage." },
      { k: "RP Nodes", v: "Skull base to C2; mandatory for NPC." },
      { k: "Level VII", v: "Superior mediastinal nodes (below sternal notch)." },
      { k: "Level VI", v: "Anterior compartment (hyoid to suprasternal notch)." },
      { k: "Level V", v: "Posterior triangle (SCM to Trapezius)." },
    ]
  },
  {
    title: "Pelvic Landmarks",
    emoji: "🦴",
    accent: "#fb7185",
    bg: "rgba(251, 113, 133, 0.05)",
    border: "rgba(251, 113, 133, 0.1)",
    rows: [
      { k: "Common Iliac", v: "Aortic bifurcation (L4/L5) to CI bifurcation." },
      { k: "Inguinal", v: "Superior boundary is the inguinal ligament." },
      { k: "External Iliac", v: "CI bifurcation to inguinal ligament." },
      { k: "Internal Iliac", v: "CI bifurcation to greater sciatic foramen." },
      { k: "Obturator", v: "Anterior to internal iliac, along pelvic wall." },
      { k: "Presacral", v: "S1-S3 region, anterior to sacrum." },
    ]
  },
  {
    title: "Thoracic Landmarks",
    emoji: "🫁",
    accent: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.05)",
    border: "rgba(59, 130, 246, 0.1)",
    rows: [
      { k: "Station 1", v: "Highest mediastinal (above L brachiocephalic v)." },
      { k: "Station 2", v: "Upper paratracheal (above aortic arch)." },
      { k: "Station 4", v: "Lower paratracheal (aortic arch to azygos v)." },
      { k: "Station 7", v: "Subcarinal (below carina)." },
      { k: "Station 10", v: "Hilar (proximal to lobar bronchi)." },
    ]
  }
];

const ContouringAtlas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hn');
  const [searchQuery, setSearchQuery] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizState, setQuizState] = useState({ current: 0, score: 0, finished: false, showFeedback: false, selected: null as number | null });
  const [dailyCaseState, setDailyCaseState] = useState<{
    selectedOption: number | null;
    submitted: boolean;
  }>({ selectedOption: null, submitted: false });

  const selItem = useMemo(() => {
    if (!selId) return null;
    const allStations = [...HN_STATIONS, ...PELVIS_STATIONS, ...THORAX_STATIONS];
    const station = allStations.find(s => s.id === selId);
    if (station) return { type: 'station', data: station };
    const error = ERROR_CASES.find(e => e.id === selId);
    if (error) return { type: 'error', data: error };
    return null;
  }, [selId]);

  const currentDailyCase = useMemo(() => {
    const dayIndex = new Date().getDate() % DAILY_CASES.length;
    return DAILY_CASES[dayIndex];
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`daily-case-${currentDailyCase.id}-${new Date().toDateString()}`);
    if (saved) {
      setDailyCaseState(JSON.parse(saved));
    }
  }, [currentDailyCase.id]);

  const handleDailyCaseSubmit = () => {
    if (dailyCaseState.selectedOption === null) return;
    const newState = { ...dailyCaseState, submitted: true };
    setDailyCaseState(newState);
    localStorage.setItem(`daily-case-${currentDailyCase.id}-${new Date().toDateString()}`, JSON.stringify(newState));
  };

  const filteredHN = HN_STATIONS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.clinical.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPelvis = PELVIS_STATIONS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.clinical.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredThorax = THORAX_STATIONS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.clinical.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredErrors = ERROR_CASES.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.error.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleQuizAnswer = (index: number) => {
    if (quizState.showFeedback) return;
    setQuizState(prev => ({ ...prev, selected: index, showFeedback: true }));
    if (index === QUIZ_QUESTIONS[quizState.current].ans) {
      setQuizState(prev => ({ ...prev, score: prev.score + 1 }));
    }
  };

  const nextQuestion = () => {
    if (quizState.current < QUIZ_QUESTIONS.length - 1) {
      setQuizState(prev => ({ ...prev, current: prev.current + 1, showFeedback: false, selected: null }));
    } else {
      setQuizState(prev => ({ ...prev, finished: true }));
    }
  };

  const resetQuiz = () => {
    setQuizState({ current: 0, score: 0, finished: false, showFeedback: false, selected: null });
  };

  return (
    <div className="min-h-screen bg-[#060810] text-slate-300 font-body selection:bg-teal-500/30 overflow-x-hidden">
      <div className="atmosphere-bg" />
      <div className="mesh-grid" />

      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
        title="Contouring Atlas"
      />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-12 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Layers className="w-3 h-3" />
            Clinical Reference v2.0
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight"
          >
            RadOnc <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Pro Atlas</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-2xl text-lg font-light leading-relaxed font-serif italic"
          >
            A comprehensive guide for radiation oncology contouring, covering nodal stations, anatomical boundaries, and evidence-based recommendations.
          </motion.p>
        </div>
      </section>

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#060810]/80 backdrop-blur-md border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-8 h-16 min-w-max">
            {[
              { id: 'hn', label: 'H&N Nodes', icon: Target },
              { id: 'pelvis', label: 'Pelvis Nodes', icon: Map },
              { id: 'thorax', label: 'Thorax', icon: Layers },
              { id: 'errors', label: 'Error Atlas', icon: AlertTriangle },
              { id: 'daily', label: 'Daily Case', icon: Calendar },
              { id: 'links', label: 'Atlas Links', icon: BookOpen },
              { id: 'quiz', label: 'Quiz', icon: HelpCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelId(null); }}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] h-full px-2 transition-all relative ${
                    activeTab === tab.id ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12 relative">
        {/* Search Bar */}
        {['hn', 'pelvis', 'thorax', 'errors'].includes(activeTab) && (
          <div className="mb-12 relative group max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'hn' ? 'H&N stations' : activeTab === 'pelvis' ? 'pelvic stations' : activeTab === 'thorax' ? 'thoracic stations' : 'common errors'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-base text-white outline-none focus:border-teal-500/50 focus:ring-8 focus:ring-teal-500/5 transition-all font-body placeholder:text-slate-600"
            />
          </div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            {/* H&N Nodes */}
            {activeTab === 'hn' && (
              <motion.div
                key="hn"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredHN.map(station => (
                  <button
                    key={station.id}
                    onClick={() => setSelId(station.id)}
                    className={`text-left p-5 rounded-2xl border transition-all group flex flex-col justify-between h-32 ${
                      selId === station.id ? 'bg-teal/10 border-teal/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black px-2 py-0.5 rounded bg-white/5 border border-white/10 text-teal-400 font-mono">
                          {station.num}
                        </div>
                        {station.badge && (
                          <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border ${
                            station.badgeClass === 'badge-bil' ? 'border-teal/30 text-teal/70' : 'border-gold/30 text-gold/70'
                          }`}>
                            {station.badge}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white font-display group-hover:text-teal-400 transition-colors">{station.name}</h3>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] text-slate-500 font-serif italic line-clamp-1">{station.clinical}</span>
                      <ChevronRight className={`w-4 h-4 ${selId === station.id ? 'text-teal' : 'text-slate-600'}`} />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Pelvis Nodes */}
            {activeTab === 'pelvis' && (
              <motion.div
                key="pelvis"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredPelvis.map(station => (
                  <button
                    key={station.id}
                    onClick={() => setSelId(station.id)}
                    className={`text-left p-5 rounded-2xl border transition-all group flex flex-col justify-between h-32 ${
                      selId === station.id ? 'bg-teal/10 border-teal/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black px-2 py-0.5 rounded bg-white/5 border border-white/10 text-teal-400 font-mono">
                          {station.num}
                        </div>
                        {station.badge && (
                          <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border ${
                            station.badgeClass === 'badge-bil' ? 'border-teal/30 text-teal/70' : 'border-gold/30 text-gold/70'
                          }`}>
                            {station.badge}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white font-display group-hover:text-teal-400 transition-colors">{station.name}</h3>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] text-slate-500 font-serif italic line-clamp-1">{station.clinical}</span>
                      <ChevronRight className={`w-4 h-4 ${selId === station.id ? 'text-teal' : 'text-slate-600'}`} />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

          {/* Thorax */}
          {activeTab === 'thorax' && (
            <motion.div
              key="thorax"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Thorax Schematic SVG */}
              <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 aspect-square bg-white/5 rounded-xl flex items-center justify-center p-4 border border-white/10">
                  <svg viewBox="0 0 200 200" className="w-full h-full text-teal-400/50">
                    <path d="M100,20 L100,180" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="10" fill="currentColor" opacity="0.2" />
                    <path d="M100,100 L60,140 M100,100 L140,140" stroke="currentColor" strokeWidth="4" />
                    <g className="animate-pulse">
                      <circle cx="100" cy="40" r="6" fill="#fb7185" /> <text x="110" y="45" fill="white" fontSize="10">1</text>
                      <circle cx="115" cy="65" r="6" fill="#2dd4bf" /> <text x="125" y="70" fill="white" fontSize="10">2R/4R</text>
                      <circle cx="85" cy="65" r="6" fill="#2dd4bf" /> <text x="55" y="70" fill="white" fontSize="10">2L/4L</text>
                      <circle cx="100" cy="115" r="8" fill="#e8c84a" /> <text x="112" y="120" fill="white" fontSize="10">7</text>
                      <circle cx="120" cy="90" r="6" fill="#7dd3fc" /> <text x="130" y="95" fill="white" fontSize="10">5/6</text>
                    </g>
                  </svg>
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  <h2 className="text-xl font-bold text-white font-display">Thoracic Nodal Map</h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    The IASLC lymph node map is the international standard for lung cancer staging and radiation therapy planning.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Superior Mediastinal', 'Aortic Nodes', 'Inferior Mediastinal', 'N1 Nodes'].map(cat => (
                      <div key={cat} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thorax Stations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredThorax.map(station => (
                  <button
                    key={station.id}
                    onClick={() => setSelId(station.id)}
                    className={`text-left p-5 rounded-2xl border transition-all group flex flex-col justify-between h-32 ${
                      selId === station.id ? 'bg-teal/10 border-teal/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black px-2 py-0.5 rounded bg-white/5 border border-white/10 text-teal-400 font-mono">
                          {station.num}
                        </div>
                        {station.badge && (
                          <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border ${
                            station.badgeClass === 'badge-bil' ? 'border-teal/30 text-teal/70' : 'border-gold/30 text-gold/70'
                          }`}>
                            {station.badge}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white font-display group-hover:text-teal-400 transition-colors">{station.name}</h3>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] text-slate-500 font-serif italic line-clamp-1">{station.clinical}</span>
                      <ChevronRight className={`w-4 h-4 ${selId === station.id ? 'text-teal' : 'text-slate-600'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error Atlas */}
          {activeTab === 'errors' && (
            <motion.div
              key="errors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredErrors.map(err => (
                <button
                  key={err.id}
                  onClick={() => setSelId(err.id)}
                  className={`text-left p-6 rounded-2xl border transition-all group flex flex-col justify-between h-40 ${
                    selId === err.id ? 'bg-coral/10 border-coral/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-body">{err.site}</span>
                      <AlertTriangle className={`w-5 h-5 ${selId === err.id ? 'text-coral' : 'text-slate-600'}`} />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-snug font-display group-hover:text-coral transition-colors">{err.title}</h3>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] text-gold font-medium italic font-serif">{err.tip}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selId === err.id ? 'text-coral' : 'text-slate-600'}`} />
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Daily Case */}
          {activeTab === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-teal-500/5">
                <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-10 border-b border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 border border-teal-500/30">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 block mb-1 font-body">Case of the Day</span>
                        <h2 className="text-3xl font-bold text-white font-display">{currentDailyCase.title}</h2>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/10 font-body">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded border border-blue-400/20 font-body">
                      {currentDailyCase.site}
                    </span>
                    <span className="text-[10px] font-black text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded border border-gold/20 font-body">
                      Complex Scenario
                    </span>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed italic font-serif relative z-10">
                    "{currentDailyCase.scenario}"
                  </p>
                </div>

                <div className="p-10 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 font-body">Select your Strategy</h4>
                    {currentDailyCase.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => !dailyCaseState.submitted && setDailyCaseState(prev => ({ ...prev, selectedOption: idx }))}
                        disabled={dailyCaseState.submitted}
                        className={`
                          w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group
                          ${dailyCaseState.selectedOption === idx 
                            ? 'border-teal-500 bg-teal-500/5 text-teal-400' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-400'}
                          ${dailyCaseState.submitted && opt.isGoldStandard ? 'border-teal-500 bg-teal-500/10' : ''}
                          ${dailyCaseState.submitted && dailyCaseState.selectedOption === idx && !opt.isGoldStandard ? 'border-coral bg-coral/10' : ''}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-colors font-mono
                            ${dailyCaseState.selectedOption === idx ? 'bg-teal-500 border-teal-500 text-[#060810]' : 'border-white/10 group-hover:border-white/20'}
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-base font-medium font-body">{opt.text}</span>
                        </div>
                        {dailyCaseState.submitted && opt.isGoldStandard && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                      </button>
                    ))}
                  </div>

                  {!dailyCaseState.submitted ? (
                    <button
                      onClick={handleDailyCaseSubmit}
                      disabled={dailyCaseState.selectedOption === null}
                      className="w-full py-5 rounded-2xl bg-teal-500 text-[#060810] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-teal-500/20 font-body"
                    >
                      Submit Strategy
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-start gap-4 mb-6">
                          <Info className="w-5 h-5 text-teal-400 shrink-0 mt-1" />
                          <div className="space-y-3">
                            <span className="font-black text-slate-200 uppercase text-[10px] tracking-[0.2em] block font-body">Gold Standard Rationale</span>
                            <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
                              {currentDailyCase.options[dailyCaseState.selectedOption!].rationale}
                            </p>
                          </div>
                        </div>
                        <div className="pro-note font-serif">
                          <span className="font-black text-gold uppercase text-[10px] tracking-[0.2em] block mb-2 font-body">Consensus Guidelines</span>
                          <p className="text-xs text-slate-400 italic leading-relaxed">{currentDailyCase.consensus}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-body">Come back tomorrow for a new challenge</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Atlas Links */}
          {activeTab === 'links' && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { name: 'RTOG H&N Atlas', url: 'https://www.rtog.org/CoreLab/ContouringAtlases/HN.aspx', desc: 'The gold standard for H&N nodal stations.' },
                { name: 'ESTRO Pelvic Atlas', url: 'https://www.estro.org/', desc: 'Comprehensive pelvic nodal guidelines.' },
                { name: 'DAHANCA Guidelines', url: 'https://www.dahanca.dk/', desc: 'Danish H&N cancer group recommendations.' },
                { name: 'E-Anatomy', url: 'https://www.imaios.com/en/e-Anatomy', desc: 'Interactive radiological anatomy tool.' },
                { name: 'RadOncQuestions', url: 'https://www.radoncquestions.com/', desc: 'Educational resource for contouring.' },
                { name: 'Contouring.org', url: 'http://contouring.org/', desc: 'Community-driven contouring cases.' }
              ].map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-2xl p-6 hover:border-teal-500/50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-teal-500/10 transition-colors" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors font-display text-lg">{link.name}</h3>
                    <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-serif italic relative z-10">{link.desc}</p>
                </a>
              ))}
            </motion.div>
          )}

          {/* Quiz */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              {!quizState.finished ? (
                <div className="glass rounded-3xl p-10 shadow-2xl shadow-teal-500/5">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 font-body">Question {quizState.current + 1} of {QUIZ_QUESTIONS.length}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-body">{QUIZ_QUESTIONS[quizState.current].topic} · Diff: {QUIZ_QUESTIONS[quizState.current].diff}</span>
                    </div>
                    <div className="h-2 w-40 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-teal-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
                        style={{ width: `${((quizState.current + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-10 leading-tight font-display italic">
                    "{QUIZ_QUESTIONS[quizState.current].q}"
                  </h2>

                  <div className="space-y-4">
                    {QUIZ_QUESTIONS[quizState.current].opts.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={quizState.showFeedback}
                        className={`
                          w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group
                          ${!quizState.showFeedback 
                            ? 'border-white/10 hover:border-teal-500/50 hover:bg-white/5' 
                            : idx === QUIZ_QUESTIONS[quizState.current].ans
                              ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                              : idx === quizState.selected
                                ? 'border-coral bg-coral/10 text-coral'
                                : 'border-white/5 opacity-50'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-colors font-mono
                            ${quizState.selected === idx ? 'bg-teal-500 border-teal-500 text-[#060810]' : 'border-white/10 group-hover:border-white/20'}
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-base font-medium font-body">{opt}</span>
                        </div>
                        {quizState.showFeedback && idx === QUIZ_QUESTIONS[quizState.current].ans && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {quizState.showFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 p-8 rounded-3xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start gap-4 mb-6">
                          <Info className="w-5 h-5 text-teal-400 shrink-0 mt-1" />
                          <div className="space-y-3">
                            <span className="font-black text-slate-200 uppercase text-[10px] tracking-[0.2em] block font-body">Clinical Explanation</span>
                            <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
                              {QUIZ_QUESTIONS[quizState.current].explain}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={nextQuestion}
                          className="w-full py-5 rounded-2xl bg-teal-500 text-[#060810] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 font-body"
                        >
                          {quizState.current < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="glass rounded-3xl p-16 text-center shadow-2xl shadow-teal-500/5">
                  <div className="w-24 h-24 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-teal-500/20">
                    <CheckCircle2 className="w-12 h-12 text-teal-400" />
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-4 font-display">Quiz Complete!</h2>
                  <p className="text-slate-400 mb-12 font-serif italic text-xl">
                    You scored <span className="text-teal-400 font-bold font-mono">{quizState.score}</span> out of <span className="text-white font-bold font-mono">{QUIZ_QUESTIONS.length}</span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <button
                      onClick={resetQuiz}
                      className="px-12 py-5 rounded-2xl bg-teal-500 text-[#060810] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 font-body"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setActiveTab('hn')}
                      className="px-12 py-5 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all font-body"
                    >
                      Back to Atlas
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* ── Side Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selId && selItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelId(null)}
              className="fixed inset-0 bg-[#060810]/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#0a0c14] border-l border-white/10 z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                      {selItem.type === 'station' ? <Target className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 block mb-1 font-body">
                        {selItem.type === 'station' ? 'Contouring Station' : 'Error Case'}
                      </span>
                      <h2 className="text-3xl font-bold text-white font-display">
                        {selItem.type === 'station' ? (selItem.data as Station).name : (selItem.data as ErrorCase).title}
                      </h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelId(null)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {selItem.type === 'station' ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries((selItem.data as Station).boundaries).map(([key, val]) => (
                        <div key={key} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 block mb-2 font-body">{key}</span>
                          <p className="text-sm text-slate-300 font-serif italic">{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-3 font-body">Clinical Relevance</h4>
                        <p className="text-base text-slate-300 leading-relaxed font-serif italic">{(selItem.data as Station).clinical}</p>
                      </div>

                      {(selItem.data as Station).fullNote && (
                        <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gold mb-3 font-body">Detailed Note</h4>
                          <div className="text-sm text-slate-300 leading-relaxed font-serif italic">{(selItem.data as Station).fullNote}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-body">Consensus</span>
                          <span className="text-xs text-slate-400 italic font-serif">{(selItem.data as Station).consensus}</span>
                        </div>
                        {(selItem.data as Station).evidence && (
                          <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest">
                            {(selItem.data as Station).evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="p-8 rounded-3xl bg-coral/5 border border-coral/10">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-coral" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-coral font-body">Common Error</span>
                      </div>
                      <p className="text-lg text-slate-200 leading-relaxed font-serif italic">{(selItem.data as ErrorCase).error}</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-teal-500/5 border border-teal-500/10">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-teal-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 font-body">Corrective Action</span>
                      </div>
                      <p className="text-lg text-slate-200 leading-relaxed font-serif italic">{(selItem.data as ErrorCase).fix}</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 font-body">Clinical Consequence</h4>
                      <p className="text-sm text-slate-400 leading-relaxed font-serif italic">{(selItem.data as ErrorCase).why}</p>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-gold/5 border border-gold/10">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gold" />
                        <span className="text-sm text-gold font-bold italic font-serif">{(selItem.data as ErrorCase).tip}</span>
                      </div>
                      {(selItem.data as ErrorCase).evidence && (
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          {(selItem.data as ErrorCase).evidence}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <div className="mb-8 flex justify-center">
          <div className="h-px w-12 bg-gold/30" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 font-body">
          RadOnc Pro · Contouring Atlas v1.0
        </p>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed font-serif italic">
          This atlas is intended for educational purposes only. Always refer to institutional protocols and peer-reviewed guidelines for clinical practice.
        </p>
        <div className="mt-12 text-[9px] font-bold text-slate-700 uppercase tracking-widest font-body">
          © {new Date().getFullYear()} Radiation Oncology Professional Network
        </div>
      </footer>
    </div>
  );
};

export default ContouringAtlas;
