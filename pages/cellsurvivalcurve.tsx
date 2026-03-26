/**
 * CellSurvivalPage.tsx  ·  PRO LEVEL
 * Cell Survival Curves — Interactive Radiobiology Reference
 *
 * Sources:
 *  - Puck TT & Marcus PI (1956) — first clonogenic survival curves
 *  - Kellerer AM & Rossi HH (1972) — dual radiation action (theory of β component)
 *  - Fowler JF (1989) — The linear-quadratic formula and progress in fractionated RT
 *  - Thames HD & Hendry JH (1987) — Fractionation in Radiotherapy
 *  - Hall EJ & Giaccia AJ — Radiobiology for the Radiologist, 8th ed.
 *  - Steel GG — Basic Clinical Radiobiology, 4th ed.
 *  - Withers HR (1975) — The four R's of radiotherapy
 *  - ICRU Report 30 / 62 / 83
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, ChevronDown, ChevronUp, ChevronRight,
  AlertTriangle, CheckCircle, XCircle,
  GraduationCap, Activity, Zap, RefreshCw,
  BarChart2, Info, Target
} from 'lucide-react';
import KeyFactsSidebar from '../components/KeyFactsSidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'Curves' | 'LQ Model' | 'Shoulder' | 'Fractionation' | 'Clinical' | 'Quiz';

interface CellLine {
  id: string;
  name: string;
  shortName: string;
  alpha: number;   // Gy⁻¹
  beta: number;    // Gy⁻²
  get alphaBeta(): number;
  type: 'tumour' | 'early' | 'late' | 'high-let';
  color: string;
  glow: string;
  dash?: string;
  description: string;
  clinicalNote: string;
  sf2: number;     // surviving fraction at 2 Gy
}

interface QuizQ {
  q: string;
  opts: string[];
  correct: number;
  explanation: string;
  pearl: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

// ─── Cell Line Library ────────────────────────────────────────────────────────

const CELL_LINES: CellLine[] = [
  {
    id: 'hnscc',
    name: 'H&N Squamous Carcinoma',
    shortName: 'HNSCC',
    alpha: 0.35, beta: 0.035,
    get alphaBeta() { return this.alpha / this.beta; },
    type: 'tumour',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.35)',
    description: 'High α/β tumour — steep initial slope, narrow shoulder. Sensitive to fraction number rather than fraction size. Repopulation begins day 21–28.',
    clinicalNote: 'Standard 2 Gy/fx preferred. CHART (54 Gy/12 days) designed to outrun accelerated repopulation. α/β = 10–15 Gy.',
    get sf2() { return Math.exp(-(this.alpha * 2 + this.beta * 4)); },
  },
  {
    id: 'prostate',
    name: 'Prostate Adenocarcinoma',
    shortName: 'Prostate Ca',
    alpha: 0.15, beta: 0.10,
    get alphaBeta() { return this.alpha / this.beta; },
    type: 'tumour',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.35)',
    description: 'Unusually LOW α/β ≈ 1.5 Gy — behaves like late-responding tissue. Wide shoulder. Each Gy of dose/fraction causes disproportionate tumour killing.',
    clinicalNote: 'Rationale for SBRT (PACE-B: 36.25 Gy/5 fx) and moderate hypofractionation (CHHiP: 60 Gy/20 fx). EQD2 dramatically higher with SBRT.',
    get sf2() { return Math.exp(-(this.alpha * 2 + this.beta * 4)); },
  },
  {
    id: 'spinal_cord',
    name: 'Spinal Cord',
    shortName: 'Spinal Cord',
    alpha: 0.04, beta: 0.02,
    get alphaBeta() { return this.alpha / this.beta; },
    type: 'late',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.3)',
    dash: '7 3',
    description: 'Late-responding SERIAL tissue — α/β ≈ 2 Gy. Extremely sensitive to fraction size (large β). Wide shoulder. Dose limit drives clinical constraints.',
    clinicalNote: 'Dmax < 45–50 Gy (2 Gy/fx). At 3 Gy/fx: EQD2 = 45 × (3+2)/(2+2) = 56.25 Gy — well above tolerance. Defines BID interval (min 6h).',
    get sf2() { return Math.exp(-(this.alpha * 2 + this.beta * 4)); },
  },
  {
    id: 'mucosa',
    name: 'Oral Mucosa',
    shortName: 'Mucosa',
    alpha: 0.30, beta: 0.030,
    get alphaBeta() { return this.alpha / this.beta; },
    type: 'early',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.3)',
    dash: '4 2',
    description: 'Early-responding tissue — high α/β ≈ 10 Gy, similar to tumour. Limits accelerated fractionation through acute mucositis. Heals rapidly from crypt stem cells.',
    clinicalNote: 'Dose-limiting toxicity in BID RT. Full healing in 4–6 weeks. Mucosal tolerance does NOT predict late OAR tolerance (different α/β).',
    get sf2() { return Math.exp(-(this.alpha * 2 + this.beta * 4)); },
  },
  {
    id: 'highlet',
    name: 'Carbon Ion (High-LET)',
    shortName: 'High-LET (¹²C)',
    alpha: 0.70, beta: 0.003,
    get alphaBeta() { return this.alpha / this.beta; },
    type: 'high-let',
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.3)',
    description: 'High-LET survival curve: nearly straight on log scale (large α, negligible β). No repair between fractions. OER low (~1.3). RBE = 2–3.',
    clinicalNote: '¹²C ions: RBE applied in treatment planning. Straight curve means fractionation advantage is lost — but hypoxic cell killing is enhanced.',
    get sf2() { return Math.exp(-(this.alpha * 2 + this.beta * 4)); },
  },
];

// ─── Math Helpers ─────────────────────────────────────────────────────────────

function sf(dose: number, a: number, b: number): number {
  return Math.exp(-(a * dose + b * dose * dose));
}

function sfFrac(dpf: number, n: number, a: number, b: number): number {
  return Math.pow(sf(dpf, a, b), n);
}

function bed(totalD: number, dpf: number, ab: number): number {
  return totalD * (1 + dpf / ab);
}

function eqd2(b: number, ab: number): number {
  return b / (1 + 2 / ab);
}

// ─── SVG Constants & Helpers ──────────────────────────────────────────────────

const GW = 340, GH = 230;
const PAD = { l: 46, r: 18, t: 16, b: 38 };
const MAX_D = 14;    // Gy
const MIN_SF_LOG = -4.5;  // log10

function dx(dose: number) {
  return PAD.l + (dose / MAX_D) * (GW - PAD.l - PAD.r);
}
function dy(sfVal: number) {
  const log = Math.log10(Math.max(sfVal, 1e-6));
  const frac = log / MIN_SF_LOG;
  return PAD.t + frac * (GH - PAD.t - PAD.b);
}

function curvePath(a: number, b: number): string {
  const pts: string[] = [];
  for (let d = 0; d <= MAX_D; d += 0.1) {
    const sfv = sf(d, a, b);
    const y = dy(sfv);
    if (y < PAD.t - 2 || y > GH - PAD.b + 2) continue;
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${dx(d).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function alphaPath(a: number): string {
  const pts: string[] = [];
  for (let d = 0; d <= MAX_D; d += 0.15) {
    const y = dy(Math.exp(-a * d));
    if (y < PAD.t - 2 || y > GH - PAD.b + 2) continue;
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${dx(d).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function betaPath(b: number): string {
  const pts: string[] = [];
  for (let d = 0; d <= MAX_D; d += 0.15) {
    const y = dy(Math.exp(-b * d * d));
    if (y < PAD.t - 2 || y > GH - PAD.b + 2) continue;
    pts.push(`${pts.length === 0 ? 'M' : 'L'}${dx(d).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

const Y_TICKS = [
  { sfv: 1,      label: '1' },
  { sfv: 0.1,    label: '10⁻¹' },
  { sfv: 0.01,   label: '10⁻²' },
  { sfv: 0.001,  label: '10⁻³' },
  { sfv: 0.0001, label: '10⁻⁴' },
];

const X_TICKS = [0, 2, 4, 6, 8, 10, 12, 14];

// ─── Sidebar Data ─────────────────────────────────────────────────────────────

const SIDEBAR = [
  {
    title: 'LQ Formulae',
    emoji: '📐',
    accent: '#38bdf8',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(56,189,232,0.4)',
    rows: [
      { k: 'Survival',  v: 'S = e^−(αD + βD²)',     mono: true },
      { k: 'log S',     v: 'ln S = −αD − βD²',       mono: true },
      { k: 'BED',       v: 'D × (1 + d / α/β)',       mono: true },
      { k: 'EQD2',      v: 'BED / (1 + 2 / α/β)',     mono: true },
      { k: 'Frac SF',   v: '[e^−(αd+βd²)]ⁿ',         mono: true },
      { k: 'α/β cross', v: 'when αD = βD²  →  D = α/β', mono: false },
    ],
  },
  {
    title: 'Key α/β Values',
    emoji: '🔑',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.4)',
    rows: [
      { k: 'Lens',          v: '1.2 Gy  ← lowest', mono: true },
      { k: 'Prostate tumour', v: '1.5 Gy',  mono: true },
      { k: 'Spinal cord',   v: '2 Gy',    mono: true },
      { k: 'Brain/BS',      v: '2.1 Gy',  mono: true },
      { k: 'Bowel (wall)',  v: '3 Gy',    mono: true },
      { k: 'Breast tumour', v: '4 Gy',    mono: true },
      { k: 'Oral mucosa',   v: '10 Gy',   mono: true },
      { k: 'H&N SCC',       v: '10–15 Gy ← highest', mono: true },
    ],
  },
  {
    title: 'Must Remember',
    emoji: '⚠️',
    accent: '#f87171',
    bg: 'rgba(248,113,113,0.07)',
    border: 'rgba(248,113,113,0.4)',
    rows: [
      { k: 'Min BID gap',    v: '≥ 6 h  (3× repair T½)', mono: false },
      { k: 'Repair T½ cord', v: '1.5–2 h', mono: true },
      { k: 'LQ valid range', v: '1–8 Gy/fx only', mono: false },
      { k: 'D₀ (mean lethal)', v: 'dose killing 63% cells', mono: false },
      { k: 'Low dose rate',   v: 'straightens curve (β repair)', mono: false },
      { k: 'High LET',        v: 'straight curve (no shoulder)', mono: false },
      { k: 'SF at α=β point', v: 'e^−2α(α/β)', mono: true },
    ],
  },
  {
    title: 'Cell Cycle Sensitivity',
    emoji: '🔄',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.07)',
    border: 'rgba(167,139,250,0.4)',
    rows: [
      { k: 'M phase',      v: 'MOST sensitive', mono: false },
      { k: 'G2 phase',     v: 'Sensitive', mono: false },
      { k: 'G1 phase',     v: 'Intermediate', mono: false },
      { k: 'Early S',      v: 'Intermediate–resistant', mono: false },
      { k: 'Late S',       v: 'MOST resistant', mono: false },
      { k: 'Mechanism',    v: 'HR repair active in S/G2; NHEJ all phases', mono: false },
    ],
  },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZ: QuizQ[] = [
  {
    q: 'The LQ model describes cell survival as S = e^−(αD + βD²). The α component specifically represents:',
    opts: [
      'Two-hit lethal events requiring two independent ionisation tracks',
      'Single-hit lethal DNA double-strand breaks — dose-linear, unrepairable',
      'The quasi-threshold dose for sublethal damage accumulation',
      'The repair half-time between radiation fractions',
    ],
    correct: 1,
    explanation: 'α (linear term) = single-track lethal events. One ionisation cluster causes a lethal DSB directly. This produces the initial STEEP SLOPE of the survival curve. It is dose-proportional and CANNOT be repaired between fractions. High α tissues/tumours show steep initial slopes (H&N SCC: α = 0.3–0.4 Gy⁻¹).',
    pearl: 'Mnemonics: α = "one hit, always kills." β = "two hits, sometimes spared by fractionation." High-LET radiation has large α and negligible β → straight survival curve.',
    difficulty: 'basic',
  },
  {
    q: 'On a log-linear survival curve plot, the dose at which the α and β components contribute EQUALLY to cell killing is:',
    opts: [
      'D = α × β (Gy)',
      'D = α + β (Gy)',
      'D = α / β (Gy)',
      'D = 2 Gy (always, by convention)',
    ],
    correct: 2,
    explanation: 'Setting αD = βD²: divide both sides by D → α = βD → D = α/β. This is WHY the α/β ratio has units of Gy — it IS a dose. Below α/β: linear (α) term dominates. Above α/β: quadratic (β) term dominates (more curvature = more repair-sensitivity = more fractionation sensitivity).',
    pearl: 'The α/β ratio marks the "bending point" of the survival curve. Tissues with LOW α/β (prostate 1.5 Gy, cord 2 Gy) bend early and are exquisitely sensitive to fraction size. Tissues with HIGH α/β (H&N 10 Gy) have less bending — fraction size matters less.',
    difficulty: 'basic',
  },
  {
    q: 'Prostate cancer has α/β ≈ 1.5 Gy, while the surrounding rectum has α/β ≈ 3 Gy. The correct radiobiological interpretation for treatment planning is:',
    opts: [
      'Standard 2 Gy/fx is safest — tumour is more sensitive at all doses',
      'Hypofractionation (large d/fx) favours tumour over rectum — inverse therapeutic ratio',
      'The α/β difference is clinically irrelevant since both are below 5 Gy',
      'SBRT is contraindicated because prostate α/β is unusually low',
    ],
    correct: 1,
    explanation: 'When tumour α/β (1.5 Gy) < OAR α/β (3 Gy) — an INVERSE relationship — hypofractionation disproportionately kills tumour cells vs normal tissue. Mathematically: at large d/fx, EQD2 increases more for tumour (low α/β denominator) than rectum. This is the complete radiobiological rationale for PACE-B (7.25 Gy × 5) and CHHiP (3 Gy × 20).',
    pearl: 'Normally: tumour α/β > OAR α/β → standard fractionation protects OARs. Prostate reverses this. SBRT BED for prostate (36.25 Gy/5 fx): BED₁.₅ = 36.25 × (1 + 7.25/1.5) = 211 Gy! vs BED₃ rectum = 36.25 × (1 + 7.25/3) = 123 Gy — tumour BED far exceeds OAR BED.',
    difficulty: 'intermediate',
  },
  {
    q: 'Calculate SF after a single dose of 6 Gy for a cell line with α = 0.3 Gy⁻¹ and β = 0.03 Gy⁻². α/β = 10 Gy.',
    opts: [
      'e^−(0.3×6) = e^−1.8 ≈ 0.165 (α only)',
      'e^−(0.3×6 + 0.03×36) = e^−2.88 ≈ 0.056',
      'e^−(6/10) = e^−0.6 ≈ 0.549 (α/β only)',
      '1 − (0.3 × 0.03 × 6²) ≈ 0.675',
    ],
    correct: 1,
    explanation: 'S = e^−(αD + βD²) = e^−(0.3×6 + 0.03×36) = e^−(1.8 + 1.08) = e^−2.88 ≈ 0.056. α contributes −1.8, β contributes −1.08. At D = 6 Gy = α/β × 0.6, β is already significant. log₁₀ SF = −2.88/2.303 = −1.25 (about 1.25 decades of killing).',
    pearl: 'Always compute BOTH components separately: −αD and −βD². Never forget units — α in Gy⁻¹, β in Gy⁻², D in Gy. Common exam error: forgetting to square D for the β term. Shortcut: if D = α/β, then αD = βD² (equal contributions).',
    difficulty: 'intermediate',
  },
  {
    q: 'The BED (Biologically Effective Dose) formula is BED = D × (1 + d/[α/β]). For 60 Gy in 30 × 2 Gy fractions, α/β = 10 Gy — what is the BED?',
    opts: [
      '60 Gy (same as physical dose)',
      'BED = 60 × (1 + 2/10) = 72 Gy',
      'BED = 60 × 10 / (2 + 10) = 50 Gy',
      'BED = 30 × e^−(0.35 × 2) = 15.5 Gy',
    ],
    correct: 1,
    explanation: 'BED = D × (1 + d/(α/β)) = 60 × (1 + 2/10) = 60 × 1.2 = 72 Gy₁₀. The "10" subscript means α/β = 10 Gy was used. BED represents the dose needed to produce the same log cell kill if given in infinitely small fractions (d→0). EQD2 = BED / (1 + 2/α/β) = 72/1.2 = 60 Gy — matches the original dose since it IS at 2 Gy/fx.',
    pearl: 'EQD2 = BED normalised to 2 Gy fractions. If your schedule IS 2 Gy/fx, EQD2 = physical total dose. BED is always > EQD2 (since extra-fractionated schedules have higher BED). Units: Gy with subscript showing α/β used (Gy₁₀ or Gy₂ for OAR).',
    difficulty: 'basic',
  },
  {
    q: 'SBRT: 54 Gy / 3 fractions (18 Gy/fx) for peripheral NSCLC. The tumour BED₁₀ is:',
    opts: [
      '54 × (1 + 18/10) = 151.2 Gy₁₀',
      '54 × (1 + 2/10) = 64.8 Gy₁₀',
      '54 × (18/10) = 97.2 Gy₁₀',
      '18 × 3 + 10 = 64 Gy₁₀',
    ],
    correct: 0,
    explanation: 'BED₁₀ = 54 × (1 + 18/10) = 54 × 2.8 = 151.2 Gy₁₀. Compare with conventional 60 Gy/30 fx: BED₁₀ = 72 Gy. SBRT gives 2.1× higher tumour BED — explaining >90% local control vs ~70% with conventional RT. Local control vastly improved because tumour cell kill is exponentially greater.',
    pearl: 'SBRT OAR check is equally critical: spinal cord at 18 Gy/fx: BED₂ = 54 × (1 + 18/2) = 54 × 10 = 540 Gy₂ — catastrophic. This is why SBRT requires strict OAR constraints (TG-101/QUANTEC) and is only possible with precise delivery, CBCT, and respiratory management.',
    difficulty: 'intermediate',
  },
  {
    q: 'What is the effect of DECREASING dose rate (LDR brachytherapy vs HDR EBRT) on the cell survival curve?',
    opts: [
      'Curve becomes steeper — more killing at all doses',
      'Curve straightens toward the initial slope (α only) — β component eliminated by repair',
      'Shoulder disappears completely — no repair possible at low dose rates',
      'Dose rate has no effect on survival if total dose is equal',
    ],
    correct: 1,
    explanation: 'At low dose rates (LDR BT: 0.5–2 Gy/h): continuous SLD repair (T½ 0.5–2 h) during irradiation progressively eliminates the β (two-hit) component. The curve straightens toward the initial α slope. At very low DR: S ≈ e^−αD (purely linear). This is why LDR spares late-responding OARs (high β) far more than HDR at equivalent total dose.',
    pearl: 'Inverse dose rate effect (IDR): at intermediate dose rates (~0.3–1 Gy/h), cell killing paradoxically INCREASES in some cell lines because cells accumulate in radiosensitive G2/M phase. IDR effect is important in pulsed LDR brachytherapy design. Very low DR: repair dominates → sparing. Very high DR: acute killing like EBRT.',
    difficulty: 'advanced',
  },
  {
    q: 'The "shoulder" of a survival curve (Dq, quasi-threshold dose) represents:',
    opts: [
      'The dose at which 50% of cells are killed (LD50)',
      'Accumulated sublethal DNA damage that must be overcome before exponential killing',
      'The extrapolation number n₀ in Grays',
      'The maximum dose tolerated without any cell killing',
    ],
    correct: 1,
    explanation: 'The shoulder = region where SLD (sublethal damage) accumulates. Individual ionisation events cause sub-lethal hits — only when combined with further hits do they become lethal. In multi-target model: Dq = D₀ × ln(n₀). In LQ model: shoulder width ∝ β (higher β = wider shoulder = more repair-sensitive). Wide shoulder means the tissue is PROTECTED by fractionation.',
    pearl: 'Dq(spinal cord) >> Dq(H&N SCC tumour). This IS the therapeutic ratio: spinal cord has a wide shoulder (lots of SLD repair) while H&N tumour has a narrow shoulder (less repair). Fractionation allows cord to repair SLD between fractions while tumour cannot.',
    difficulty: 'basic',
  },
  {
    q: 'A patient has Ataxia-Telangiectasia (AT — ATM kinase deficiency). The correct approach to radiotherapy is:',
    opts: [
      'Standard doses are appropriate — AT only affects systemic immunity',
      'Reduce dose by 10% as precaution only',
      'Avoid RT or use markedly reduced doses — catastrophic normal tissue toxicity at standard doses',
      'Only proton therapy is safe in AT patients',
    ],
    correct: 2,
    explanation: 'ATM kinase is the master regulator of the DNA damage response (DSB sensing → checkpoint → NHEJ/HR). In AT patients (homozygous loss), cells cannot respond to DSBs → standard RT doses cause catastrophic normal tissue toxicity (severe fibrosis, ulceration, necrosis). The survival curve for AT cells shows NO shoulder (cannot repair SLD) and is very steep.',
    pearl: 'AT heterozygotes (ATM carriers, 0.5–1% of population) have ~2× normal radiosensitivity — clinical significance debated. Other radiosensitivity syndromes: Nijmegen Breakage Syndrome (NBS1 mutation), Fanconi Anaemia, BRCA1/2 homozygotes. Always take molecular genetics family history before RT.',
    difficulty: 'advanced',
  },
  {
    q: 'The "extrapolation number" n₀ in the multi-target cell survival model represents:',
    opts: [
      'The number of DNA repair enzymes activated per Gray',
      'The number of independent critical targets per cell that must ALL be hit to kill it',
      'The ratio of α to β at the shoulder dose',
      'The number of fractions needed for complete tumour sterilisation',
    ],
    correct: 1,
    explanation: 'n₀ = extrapolation number = number of critical, independent targets per cell. A cell dies only when ALL n₀ targets are hit at least once. The survival curve is: S = 1 − (1 − e^−D/D₀)^n₀. When extrapolated back to zero dose, the curve intercepts the y-axis at n₀. High n₀ (e.g. 10) = wide shoulder = high SLD repair capacity. The LQ model β component represents the same phenomenon.',
    pearl: 'Historical vs modern: Multi-target model (Puck & Marcus 1956) → parameters D₀, n₀, Dq. LQ model (Kellerer & Rossi 1972) → parameters α, β. LQ is now universal clinically. Exam tip: n₀ is the Y-INTERCEPT of the linear exponential portion extrapolated back to dose = 0 axis.',
    difficulty: 'advanced',
  },
];

// ─── Inline SVG Components ────────────────────────────────────────────────────

/** Animated DNA double helix break illustration */
const DNABreakArt: React.FC<{ type: 'alpha' | 'beta' }> = ({ type }) => {
  const breakAt = type === 'alpha' ? [3] : [3, 4];
  return (
    <svg viewBox="0 0 200 100" className="w-full" style={{ maxHeight: 80 }}>
      {/* Strand 1 */}
      {Array.from({ length: 9 }, (_, i) => {
        const x1 = 8 + i * 21, x2 = x1 + 21;
        const y1 = 22 + Math.sin(i * 0.85) * 13;
        const y2 = 22 + Math.sin((i + 1) * 0.85) * 13;
        const broken = breakAt.includes(i);
        return broken ? (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x1 + 8} y2={y1} stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <text x={x1 + 12} y={y1 + 4} fill="#ef4444" fontSize="10" fontWeight="bold">✕</text>
          </g>
        ) : (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        );
      })}
      {/* Strand 2 */}
      {Array.from({ length: 9 }, (_, i) => {
        const x1 = 8 + i * 21, x2 = x1 + 21;
        const y1 = 54 + Math.sin(i * 0.85 + Math.PI) * 13;
        const y2 = 54 + Math.sin((i + 1) * 0.85 + Math.PI) * 13;
        const broken = breakAt.includes(i);
        return broken ? (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x1 + 8} y2={y1} stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
        );
      })}
      {/* Base pairs (rungs) */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 19 + i * 21;
        const y1 = 22 + Math.sin((i + 0.5) * 0.85) * 13;
        const y2 = 54 + Math.sin((i + 0.5) * 0.85 + Math.PI) * 13;
        return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />;
      })}
      {/* Label */}
      <text x={100} y={94} textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="monospace">
        {type === 'alpha' ? 'Single-track DSB (α — unrepairable)' : 'Two-track DSB (β — repair possible)'}
      </text>
    </svg>
  );
};

/** Colony visualiser — animated dots */
const ColonyArt: React.FC<{ sfVal: number; dose: number }> = ({ sfVal, dose }) => {
  const total = 24;
  const alive = Math.max(0, Math.round(sfVal * total));
  return (
    <svg viewBox="0 0 200 70" className="w-full" style={{ maxHeight: 70 }}>
      {Array.from({ length: total }, (_, i) => {
        const col = i % 8, row = Math.floor(i / 8);
        const x = 14 + col * 24, y = 12 + row * 24;
        const isAlive = i < alive;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={8}
              fill={isAlive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.08)'}
              stroke={isAlive ? '#22c55e' : '#ef444440'}
              strokeWidth="1.5"
            />
            {isAlive ? (
              <>
                <circle cx={x - 2} cy={y - 2} r={3} fill="#4ade80" opacity="0.8" />
                <circle cx={x + 1} cy={y + 2} r={2} fill="#86efac" opacity="0.5" />
              </>
            ) : (
              <>
                <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
                <line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
              </>
            )}
          </g>
        );
      })}
      <text x={100} y={65} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
        {dose > 0 ? `${dose} Gy → SF = ${sfVal.toFixed(3)} (${alive}/${total} surviving)` : `Control (0 Gy) → SF = 1.0 (${total}/${total})`}
      </text>
    </svg>
  );
};

/** Cell cycle sensitivity wheel */
const CellCycleWheel: React.FC = () => {
  const phases = [
    { label: 'G1', start: 0, extent: 90, color: '#f59e0b', sens: 'Moderate', r: 50 },
    { label: 'S', start: 90, extent: 100, color: '#22c55e', sens: 'Resistant', r: 50 },
    { label: 'G2', start: 190, extent: 55, color: '#f97316', sens: 'Sensitive', r: 50 },
    { label: 'M', start: 245, extent: 45, color: '#ef4444', sens: 'Most sensitive', r: 50 },
    { label: 'G0', start: 290, extent: 70, color: '#94a3b8', sens: 'Variable', r: 50 },
  ];
  const cx = 80, cy = 80, R = 55, innerR = 28;
  function arcPath(startDeg: number, extentDeg: number, r: number) {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const a1 = toRad(startDeg), a2 = toRad(startDeg + extentDeg);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const xi1 = cx + innerR * Math.cos(a1), yi1 = cy + innerR * Math.sin(a1);
    const xi2 = cx + innerR * Math.cos(a2), yi2 = cy + innerR * Math.sin(a2);
    const large = extentDeg > 180 ? 1 : 0;
    return `M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large},0 ${xi1},${yi1} Z`;
  }
  function labelPos(startDeg: number, extentDeg: number) {
    const mid = startDeg + extentDeg / 2;
    const rad = ((mid - 90) * Math.PI) / 180;
    const lr = (R + innerR) / 2;
    return { x: cx + lr * Math.cos(rad), y: cy + lr * Math.sin(rad) };
  }
  return (
    <svg viewBox="0 0 200 165" className="w-full" style={{ maxHeight: 165 }}>
      {phases.map((p, i) => {
        const lp = labelPos(p.start, p.extent);
        return (
          <g key={i}>
            <path d={arcPath(p.start, p.extent, R)} fill={p.color} opacity="0.25" stroke={p.color} strokeWidth="1.5" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
              fill={p.color} fontSize="8.5" fontWeight="bold" fontFamily="monospace">{p.label}</text>
          </g>
        );
      })}
      {/* Center text */}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Cell</text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Cycle</text>

      {/* Legend */}
      {phases.map((p, i) => (
        <g key={i}>
          <circle cx={118} cy={18 + i * 28} r={5} fill={p.color} opacity="0.3" stroke={p.color} strokeWidth="1.2" />
          <text x={128} y={18 + i * 28 + 4} fill={p.color} fontSize="9" fontFamily="monospace" fontWeight="bold">{p.label}</text>
          <text x={142} y={18 + i * 28 + 4} fill="#64748b" fontSize="8" fontFamily="monospace"> {p.sens}</text>
        </g>
      ))}
      <text x={100} y={158} textAnchor="middle" fill="#475569" fontSize="7.5" fontFamily="monospace">
        Redistribution = 2nd R of radiobiology
      </text>
    </svg>
  );
};

// ─── Main Interactive Survival Curve SVG ──────────────────────────────────────

const SurvivalGraph: React.FC<{
  visible: Set<string>;
  showComponents: boolean;
  showCross: boolean;
  cursorDose: number;
}> = ({ visible, showComponents, showCross, cursorDose }) => {
  const primary = CELL_LINES.find(c => c.id === 'hnscc');

  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} className="w-full" style={{ maxHeight: 240 }}>
      <defs>
        {CELL_LINES.map(cl => (
          <filter key={cl.id} id={`glow-${cl.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {/* Grid */}
      {X_TICKS.map(d => (
        <line key={d} x1={dx(d)} y1={PAD.t} x2={dx(d)} y2={GH - PAD.b}
          stroke="#1e293b" strokeWidth={d === 0 ? 0 : 0.7} />
      ))}
      {Y_TICKS.map(({ sfv }) => (
        <line key={sfv} x1={PAD.l} y1={dy(sfv)} x2={GW - PAD.r} y2={dy(sfv)}
          stroke="#1e293b" strokeWidth="0.7" />
      ))}

      {/* Axes */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={GH - PAD.b} stroke="#334155" strokeWidth="1.5" />
      <line x1={PAD.l} y1={GH - PAD.b} x2={GW - PAD.r} y2={GH - PAD.b} stroke="#334155" strokeWidth="1.5" />

      {/* Y-axis tick labels */}
      {Y_TICKS.map(({ sfv, label }) => (
        <text key={sfv} x={PAD.l - 5} y={dy(sfv) + 3.5}
          textAnchor="end" fill="#475569" fontSize="7" fontFamily="monospace">{label}</text>
      ))}
      {/* X-axis tick labels */}
      {X_TICKS.map(d => (
        <text key={d} x={dx(d)} y={GH - PAD.b + 11}
          textAnchor="middle" fill="#475569" fontSize="7.5" fontFamily="monospace">{d}</text>
      ))}
      {/* Axis titles */}
      <text x={(GW + PAD.l) / 2 + 4} y={GH - 3}
        textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">Dose (Gy)</text>
      <text x={9} y={(GH + PAD.t) / 2}
        textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace"
        transform={`rotate(-90,9,${(GH + PAD.t) / 2})`}>log₁₀ SF</text>

      {/* α=β crossover dot (for first visible line) */}
      {showCross && CELL_LINES.find(c => visible.has(c.id)) && CELL_LINES.find(c => visible.has(c.id))!.alphaBeta <= MAX_D && (
        <g>
          <line x1={dx(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta)} y1={PAD.t} x2={dx(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta)} y2={GH - PAD.b}
            stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.7" />
          <circle cx={dx(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta)} cy={dy(sf(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta, CELL_LINES.find(c => visible.has(c.id))!.alpha, CELL_LINES.find(c => visible.has(c.id))!.beta))} r={5} fill="#fbbf24" opacity="0.25" />
          <circle cx={dx(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta)} cy={dy(sf(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta, CELL_LINES.find(c => visible.has(c.id))!.alpha, CELL_LINES.find(c => visible.has(c.id))!.beta))} r={3} fill="#fbbf24" />
          <text x={dx(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta) + 6} y={dy(sf(CELL_LINES.find(c => visible.has(c.id))!.alphaBeta, CELL_LINES.find(c => visible.has(c.id))!.alpha, CELL_LINES.find(c => visible.has(c.id))!.beta)) - 5} fill="#fbbf24" fontSize="7" fontFamily="monospace">
            α=β ({CELL_LINES.find(c => visible.has(c.id))!.alphaBeta.toFixed(1)} Gy)
          </text>
        </g>
      )}

      {/* Dose cursor */}
      {cursorDose > 0 && (
        <line x1={dx(cursorDose)} y1={PAD.t} x2={dx(cursorDose)} y2={GH - PAD.b}
          stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
      )}

      {/* Alpha / Beta component curves for first visible line */}
      {showComponents && CELL_LINES.find(c => visible.has(c.id)) && (
        <>
          <path d={alphaPath(CELL_LINES.find(c => visible.has(c.id))!.alpha)} fill="none" stroke="#38bdf8" strokeWidth="1.3"
            strokeDasharray="5 3" opacity="0.65" />
          <path d={betaPath(CELL_LINES.find(c => visible.has(c.id))!.beta)} fill="none" stroke="#a78bfa" strokeWidth="1.3"
            strokeDasharray="3 2" opacity="0.65" />
          <text x={dx(9)} y={dy(Math.exp(-CELL_LINES.find(c => visible.has(c.id))!.alpha * 9)) - 6} fill="#38bdf8" fontSize="6.5" fontFamily="monospace">α·D</text>
          <text x={dx(7)} y={dy(Math.exp(-CELL_LINES.find(c => visible.has(c.id))!.beta * 49)) + 9} fill="#a78bfa" fontSize="6.5" fontFamily="monospace">β·D²</text>
        </>
      )}

      {/* Survival curves */}
      {CELL_LINES.map(cl => {
        if (!visible.has(cl.id)) return null;
        return (
          <motion.path
            key={cl.id}
            d={curvePath(cl.alpha, cl.beta)}
            fill="none"
            stroke={cl.color}
            strokeWidth={2.4}
            strokeDasharray={cl.dash}
            filter={`url(#glow-${cl.id})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          />
        );
      })}

      {/* Cursor SF dots */}
      {cursorDose > 0 && CELL_LINES.filter(c => visible.has(c.id)).map(cl => {
        const sfv = sf(cursorDose, cl.alpha, cl.beta);
        const y = dy(sfv);
        if (y < PAD.t || y > GH - PAD.b) return null;
        return (
          <g key={cl.id}>
            <circle cx={dx(cursorDose)} cy={y} r={4.5} fill={cl.color} opacity="0.3" />
            <circle cx={dx(cursorDose)} cy={y} r={2.5} fill={cl.color} />
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const CellSurvivalPage: React.FC = () => {
  const [tab, setTab] = useState<TabType>('Curves');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visible, setVisible] = useState<Set<string>>(new Set(['hnscc', 'spinal_cord']));
  const [showComponents, setShowComponents] = useState(false);
  const [showCross, setShowCross] = useState(true);
  const [cursorDose, setCursorDose] = useState(0);
  const [expandedSec, setExpandedSec] = useState<number | null>(null);

  // LQ Calculator state
  const [cAlpha, setCAlpha] = useState(0.35);
  const [cBeta, setCBeta] = useState(0.035);
  const [cDpf, setCDpf] = useState(2.0);
  const [cN, setCN] = useState(30);

  // Fractionation comparison
  const [compDose, setCompDose] = useState(6);
  const [compAB, setCompAB] = useState(10);

  // Quiz state
  const [qDiff, setQDiff] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [qIdx, setQIdx] = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);

  const filteredQ = useMemo(() =>
    qDiff === 'all' ? QUIZ : QUIZ.filter(q => q.difficulty === qDiff), [qDiff]);
  const curQ = filteredQ[qIdx];

  // Derived calc values
  const cAB = cAlpha / cBeta;
  const sfSingle = sf(cDpf, cAlpha, cBeta);
  const sfTotal = sfFrac(cDpf, cN, cAlpha, cBeta);
  const bedVal = bed(cDpf * cN, cDpf, cAB);
  const eqd2Val = eqd2(bedVal, cAB);

  const toggleLine = React.useCallback((id: string) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }, []);

  const DIFF_STYLE: Record<string, string> = {
    basic:        'bg-emerald-900/60 text-emerald-300 border border-emerald-700',
    intermediate: 'bg-amber-900/60 text-amber-300 border border-amber-700',
    advanced:     'bg-red-900/60 text-red-300 border border-red-700',
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white relative pb-8">

      {/* ── Animated background dots ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 4),
              height: 2 + (i % 4),
              left: `${5 + i * 5.5}%`,
              top: `${10 + (i * 13) % 80}%`,
              background: ['#38bdf8','#a78bfa','#fb923c','#4ade80','#f87171'][i % 5],
              opacity: 0.12,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── SIDEBAR ───────────────────────────────────────────────── */}
      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR}
      >
        {/* Worked BED example */}
        <div className="rounded-xl border border-violet-800 bg-violet-900/10 px-3 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-violet-300 mb-2">
            💡 BED Worked Examples
          </p>
          <div className="font-mono text-[9px] space-y-1.5 text-slate-300">
            <p className="text-slate-500">Conventional:</p>
            <p>60 Gy/30 fx, α/β=10:</p>
            <p className="text-cyan-300">BED = 60×(1+2/10) = <strong>72 Gy₁₀</strong></p>
            <p className="text-slate-500 mt-2">SBRT:</p>
            <p>54 Gy/3 fx, α/β=10:</p>
            <p className="text-amber-300">BED = 54×(1+18/10) = <strong>151.2 Gy₁₀</strong></p>
            <p className="text-slate-500 mt-2">Prostate SBRT:</p>
            <p>36.25 Gy/5 fx, α/β=1.5:</p>
            <p className="text-violet-300">BED = 36.25×(1+7.25/1.5) = <strong>211 Gy₁.₅</strong></p>
          </div>
        </div>

        {/* LQ validity warning */}
        <div className="rounded-xl border border-red-800 bg-red-900/10 px-3 py-2.5">
          <div className="flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-black text-red-300 uppercase mb-1">LQ Model Validity</p>
              <p className="text-[9px] text-red-300/70 leading-relaxed">
                LQ model is reliable for <strong>1–8 Gy/fx</strong>. Above 8 Gy/fx (SBRT range), it may underestimate cell kill due to vascular effects, hyper-radiosensitivity, and non-LQ mechanisms. Use modified LQ or USC model for SBRT dose calculations.
              </p>
            </div>
          </div>
        </div>
      </KeyFactsSidebar>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="relative z-10 px-3 py-3"
        style={{ background: 'linear-gradient(135deg,#0d1929 0%,#0f2742 50%,#0a1828 100%)', borderBottom: '1px solid #1e3a5f' }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(56,189,232,0.15)', border: '1px solid rgba(56,189,232,0.3)' }}>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h1 className="text-sm font-black tracking-tight" style={{ fontFamily: 'monospace' }}>
                Cell Survival Curves
              </h1>
            </div>
            <p className="text-[10px] text-slate-400">
              Linear-Quadratic Model · Clonogenic Assay · Fractionation Biology
            </p>
            <p className="text-[9px] text-slate-700 mt-0.5">
              Hall & Giaccia · Puck & Marcus 1956 · Fowler 1989 · Thames & Hendry 1987
            </p>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex overflow-x-auto no-scrollbar"
        style={{ background: '#060c18', borderBottom: '1px solid #1e293b' }}>
        {(['Curves', 'LQ Model', 'Shoulder', 'Fractionation', 'Clinical', 'Quiz'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-shrink-0 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all"
            style={{
              borderBottomColor: tab === t ? '#38bdf8' : 'transparent',
              color: tab === t ? '#38bdf8' : '#475569',
              background: tab === t ? 'rgba(56,189,232,0.06)' : 'transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────── */}
      <div className="relative z-10 px-3 pt-3 space-y-3">

        {/* ══════════════════════════════════════════════════════════
            TAB: CURVES
        ══════════════════════════════════════════════════════════ */}
        {tab === 'Curves' && (
          <div className="space-y-3">
            {/* Hero graph */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(180deg,#0d1929 0%,#07111f 100%)', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800/60">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Clonogenic Survival Curves — Log₁₀ Scale
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setShowComponents(c => !c)}
                    className="text-[8px] px-2 py-0.5 rounded border font-bold transition"
                    style={{
                      background: showComponents ? 'rgba(56,189,232,0.15)' : 'rgba(255,255,255,0.04)',
                      borderColor: showComponents ? '#38bdf8' : '#334155',
                      color: showComponents ? '#38bdf8' : '#64748b',
                    }}>
                    α/β split
                  </button>
                  <button onClick={() => setShowCross(c => !c)}
                    className="text-[8px] px-2 py-0.5 rounded border font-bold transition"
                    style={{
                      background: showCross ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                      borderColor: showCross ? '#fbbf24' : '#334155',
                      color: showCross ? '#fbbf24' : '#64748b',
                    }}>
                    α=β mark
                  </button>
                </div>
              </div>
              <div className="px-2 pt-2">
                <SurvivalGraph visible={visible} showComponents={showComponents} showCross={showCross} cursorDose={cursorDose} />
              </div>
              {/* Dose cursor */}
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] text-slate-600 uppercase font-bold w-16">Dose cursor</span>
                  <input type="range" min="0" max="14" step="0.25"
                    value={cursorDose}
                    onChange={e => setCursorDose(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 accent-cyan-500" />
                  <span className="text-[10px] font-mono text-cyan-300 w-14 text-right">{cursorDose.toFixed(2)} Gy</span>
                </div>
                {cursorDose > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {CELL_LINES.filter(c => visible.has(c.id)).map(cl => {
                      const sfv = sf(cursorDose, cl.alpha, cl.beta);
                      return (
                        <div key={cl.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b' }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cl.color }} />
                          <span className="text-[9px] text-slate-500 flex-1 truncate">{cl.shortName}</span>
                          <span className="text-[10px] font-mono font-bold" style={{ color: cl.color }}>
                            {sfv < 0.001 ? sfv.toExponential(2) : sfv.toFixed(4)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cell line toggles */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Toggle Cell Lines</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {CELL_LINES.map(cl => {
                  const isOn = visible.has(cl.id);
                  return (
                    <button key={cl.id} onClick={() => toggleLine(cl.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all"
                      style={{ background: isOn ? `${cl.color}08` : 'transparent', opacity: isOn ? 1 : 0.4 }}>
                      {/* Curve swatch */}
                      <svg width="30" height="14" className="flex-shrink-0">
                        <line x1="2" y1="7" x2="28" y2="7"
                          stroke={cl.color} strokeWidth="2.5" strokeDasharray={cl.dash ?? 'none'} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-white">{cl.name}</span>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase"
                            style={{
                              background: `${cl.color}20`,
                              color: cl.color,
                              border: `1px solid ${cl.color}40`,
                            }}>
                            {cl.type}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-0.5 font-mono text-[9px]">
                          <span className="text-slate-500">α={cl.alpha}</span>
                          <span className="text-slate-500">β={cl.beta}</span>
                          <span className="font-bold" style={{ color: cl.color }}>α/β={cl.alphaBeta.toFixed(1)} Gy</span>
                          <span className="text-slate-600">SF₂={cl.sf2.toFixed(3)}</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all`}
                        style={{ borderColor: isOn ? cl.color : '#334155', background: isOn ? cl.color : 'transparent' }}>
                        {isOn && <div className="w-full h-full rounded-full bg-[#0d1929] scale-50" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick detail for visible lines */}
            {CELL_LINES.filter(c => visible.has(c.id)).map(cl => (
              <motion.div key={cl.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl px-3 py-2.5"
                style={{ background: `${cl.color}08`, border: `1px solid ${cl.color}30` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: cl.color }} />
                  <span className="text-[11px] font-black" style={{ color: cl.color }}>{cl.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-1">{cl.description}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: cl.color + 'cc' }}>{cl.clinicalNote}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: LQ MODEL
        ══════════════════════════════════════════════════════════ */}
        {tab === 'LQ Model' && (
          <div className="space-y-3">
            {/* DNA Break Art */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  DNA Double-Strand Break Mechanisms
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="rounded-xl px-2 py-2" style={{ background: 'rgba(56,189,232,0.06)', border: '1px solid rgba(56,189,232,0.2)' }}>
                  <p className="text-[9px] font-black text-cyan-300 text-center mb-1">α Component</p>
                  <DNABreakArt type="alpha" />
                  <p className="text-[9px] text-cyan-300/60 text-center">1 track → DSB → cell death</p>
                </div>
                <div className="rounded-xl px-2 py-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <p className="text-[9px] font-black text-violet-300 text-center mb-1">β Component</p>
                  <DNABreakArt type="beta" />
                  <p className="text-[9px] text-violet-300/60 text-center">2 tracks interact → DSB</p>
                </div>
              </div>
            </div>

            {/* Derivation steps */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">LQ Formula — Step-by-Step</p>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { n: '1', title: 'Mean lethal hits per cell', formula: 'E = αD + βD²', detail: 'α = probability/Gy of single-track lethal DSB. β = probability/Gy² of two-track interaction becoming lethal. E is the expected number of lethal events.', color: '#38bdf8' },
                  { n: '2', title: 'Poisson probability of NO lethal hit', formula: 'P(survive) = e^−E', detail: 'Lethal events follow Poisson distribution. Cell survives only if zero lethal events occurred. Probability of zero events = e^−(mean).', color: '#4ade80' },
                  { n: '3', title: 'Surviving fraction', formula: 'SF = e^−(αD + βD²)', detail: 'The fundamental LQ equation. On a log-linear plot: ln SF = −αD − βD² — a downward parabola with initial slope α and increasing curvature from β.', color: '#fbbf24' },
                  { n: '4', title: 'α = β crossover dose', formula: 'αD = βD²  →  D = α/β', detail: 'At this dose, single-hit and two-hit killing are EQUAL. Below α/β: linear (α) dominates. Above: quadratic (β, repair-sensitive) dominates.', color: '#f97316' },
                  { n: '5', title: 'Fractionated dose (n fractions)', formula: 'SF = [e^−(αd + βd²)]ⁿ = e^−n(αd+βd²)', detail: 'Per-fraction SF is raised to the power n. Equivalent to multiplying the exponents. This is valid ONLY if complete repair occurs between fractions (needs ≥6h gap).', color: '#a78bfa' },
                ].map(step => (
                  <div key={step.n}
                    className="rounded-xl px-3 py-2.5"
                    style={{ borderLeft: `3px solid ${step.color}`, background: `${step.color}08` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                        style={{ background: `${step.color}20`, color: step.color }}>
                        {step.n}
                      </div>
                      <p className="text-[10px] font-black text-slate-200">{step.title}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg mb-1.5 font-mono text-[11px]"
                      style={{ background: 'rgba(0,0,0,0.3)', color: step.color }}>
                      {step.formula}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live LQ Calculator */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">⚡ Live LQ Calculator</p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'α (Gy⁻¹)', val: cAlpha, set: setCAlpha, min: 0.01, max: 1.0, step: 0.01, color: '#38bdf8' },
                    { label: 'β (Gy⁻²)', val: cBeta, set: setCBeta, min: 0.001, max: 0.2, step: 0.001, color: '#a78bfa' },
                    { label: 'd (Gy/fx)', val: cDpf, set: setCDpf, min: 0.1, max: 20, step: 0.1, color: '#fbbf24' },
                    { label: 'n (fractions)', val: cN, set: (v: number) => setCN(Math.round(v)), min: 1, max: 60, step: 1, color: '#4ade80' },
                  ].map(({ label, val, set, min, max, step, color }) => (
                    <div key={label}>
                      <label className="text-[8px] uppercase font-bold block mb-1" style={{ color }}>{label}</label>
                      <input type="number" min={min} max={max} step={step} value={val}
                        onChange={e => set(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none transition"
                        style={{ background: '#060c18', border: `1px solid ${color}30`, color: '#e2e8f0', WebkitAppearance: 'none' }} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'α/β', value: `${cAB.toFixed(2)} Gy`, color: '#fbbf24' },
                    { label: `SF at ${cDpf.toFixed(1)}Gy`, value: sfSingle.toFixed(5), color: '#38bdf8' },
                    { label: `SF total (${cN}fx)`, value: sfTotal < 1e-6 ? sfTotal.toExponential(2) : sfTotal.toFixed(6), color: '#4ade80' },
                    { label: `Total dose`, value: `${(cDpf * cN).toFixed(1)} Gy`, color: '#94a3b8' },
                    { label: 'BED', value: `${bedVal.toFixed(1)} Gy`, color: '#a78bfa' },
                    { label: 'EQD2', value: `${eqd2Val.toFixed(1)} Gy`, color: '#fb923c' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl px-2 py-2 text-center"
                      style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                      <p className="text-[8px] text-slate-500 uppercase mb-0.5">{label}</p>
                      <p className="text-sm font-black font-mono" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Colony visualiser */}
                <div className="mt-3 rounded-xl p-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1e293b' }}>
                  <p className="text-[8px] text-slate-600 uppercase text-center font-bold mb-1">Colony Visualiser</p>
                  <ColonyArt sfVal={sfSingle} dose={cDpf} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: SHOULDER
        ══════════════════════════════════════════════════════════ */}
        {tab === 'Shoulder' && (
          <div className="space-y-3">
            {/* Historical context */}
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <p className="text-[10px] font-black text-amber-300 mb-0.5">Historical Context: Multi-Target → LQ Model</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Puck & Marcus (1956) first described HeLa cell survival curves with a characteristic shoulder. The multi-target single-hit model (D₀, n₀, Dq) dominated for 20 years. Kellerer & Rossi (1972) developed dual radiation action theory, leading to the LQ model now universally used. Both models describe the same radiobiology — repair of sublethal DNA damage.
              </p>
            </div>

            {/* Shoulder anatomy SVG */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Anatomy of the Survival Curve</p>
              </div>
              <div className="p-3">
                <svg viewBox="0 0 300 195" className="w-full" style={{ maxHeight: 195 }}>
                  {/* Grid */}
                  {[20, 75, 130].map((y, i) => (
                    <g key={i}>
                      <line x1="40" y1={y} x2="290" y2={y} stroke="#1e293b" strokeWidth="0.8" />
                      <text x="36" y={y + 3.5} textAnchor="end" fill="#475569" fontSize="7.5" fontFamily="monospace">
                        {['1', '10⁻¹', '10⁻²'][i]}
                      </text>
                    </g>
                  ))}
                  <line x1="40" y1="20" x2="40" y2="180" stroke="#334155" strokeWidth="1.5" />
                  <line x1="40" y1="180" x2="290" y2="180" stroke="#334155" strokeWidth="1.5" />

                  {/* Shoulder region highlight */}
                  <rect x="40" y="20" width="75" height="160" fill="#fbbf24" opacity="0.04" rx="4" />
                  <text x="77" y="90" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" opacity="0.7">SHOULDER</text>
                  <text x="77" y="100" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace" opacity="0.5">(SLD region)</text>

                  {/* High α/β curve (narrow shoulder) */}
                  <motion.path d="M40,22 C70,35 110,75 155,135 L190,180"
                    fill="none" stroke="#fb923c" strokeWidth="2.5" filter="url(#glo)"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }} />
                  <text x="194" y="175" fill="#fb923c" fontSize="8" fontFamily="monospace">High α/β</text>
                  <text x="194" y="185" fill="#fb923c" fontSize="7" fontFamily="monospace">(H&N, 10 Gy)</text>

                  {/* Low α/β curve (wide shoulder) */}
                  <motion.path d="M40,22 C95,24 160,35 200,80 L260,165"
                    fill="none" stroke="#f87171" strokeWidth="2.5" strokeDasharray="6 3"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.3 }} />
                  <text x="262" y="158" fill="#f87171" fontSize="8" fontFamily="monospace">Low α/β</text>
                  <text x="262" y="168" fill="#f87171" fontSize="7" fontFamily="monospace">(Cord, 2 Gy)</text>

                  {/* Dq arrow */}
                  <line x1="40" y1="18" x2="115" y2="18" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 2" />
                  <text x="77" y="14" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace">←  Dq (wider = more repair)  →</text>

                  {/* n₀ annotation */}
                  <line x1="40" y1="22" x2="40" y2="48" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
                  <text x="43" y="40" fill="#38bdf8" fontSize="7" fontFamily="monospace">n₀ (y-intercept)</text>

                  {/* Initial slope label */}
                  <text x="55" y="55" fill="#64748b" fontSize="7" fontFamily="monospace"
                    transform="rotate(-58,55,55)">Initial slope = α</text>

                  {/* Axis labels */}
                  <text x="165" y="192" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">Dose (Gy) →</text>
                  <text x="16" y="105" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace"
                    transform="rotate(-90,16,105)">log SF →</text>
                </svg>
              </div>
            </div>

            {/* Repair concepts */}
            {[
              {
                icon: '🔧', title: 'Sublethal Damage (SLD) Repair',
                color: '#38bdf8',
                body: 'SLD = DNA damage that is NOT immediately lethal but, when combined with subsequent damage, becomes lethal. The shoulder represents SLD accumulation in the cell. SLD IS REPAIRABLE — T½ varies: mucosa 0.5–1 h, spinal cord 1.5–2 h, brain 2 h. This is the fundamental basis for the 6-hour BID interval.',
                fact: 'T½ repair: mucosa ≈ 0.5–1 h · spinal cord ≈ 1.5–2 h · late CNS ≈ 2 h · tumours ≈ 0.5–1 h',
              },
              {
                icon: '🛡️', title: 'Potentially Lethal Damage (PLD) Repair',
                color: '#4ade80',
                body: 'PLD = damage that is lethal under normal post-irradiation conditions but can be repaired if the cell is held in a non-proliferating state (plateau phase, contact inhibition, hypoxia). More prominent in slowly proliferating cells — explains why plateau-phase cultures are more resistant than log-phase.',
                fact: 'PLD repair explains radioresistance of tumour cells in hypoxic/nutrient-poor cores — cells in pseudo-G0 state',
              },
              {
                icon: '🏥', title: 'Clinical Meaning of the Shoulder',
                color: '#fbbf24',
                body: 'Wide shoulder (low α/β) = large SLD repair capacity = tissue PROTECTED by fractionation (spinal cord, brain, kidney). Narrow shoulder (high α/β) = little SLD repair (tumours, mucosa). This differential IS the therapeutic ratio: 30 × 2 Gy fractions give cord enormous repair advantage over tumour.',
                fact: 'Dq (spinal cord) >> Dq (H&N SCC) → fractionation spares cord far more than tumour',
              },
              {
                icon: '📖', title: 'Multi-Target Model Parameters',
                color: '#a78bfa',
                body: 'Historical but still in exams. D₀ = mean lethal dose (dose killing 63% of cells = 1 − 1/e). n₀ = extrapolation number (y-intercept). Dq = D₀ × ln(n₀) = quasi-threshold (shoulder width). Typical mammalian cells: D₀ = 1.5–2 Gy, n₀ = 2–10, Dq = 1–3 Gy.',
                fact: 'LQ ↔ multi-target: α ≈ inverse of D₀ at high doses; shoulder width ↔ β component',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl px-3 py-2.5"
                style={{ borderLeft: `3px solid ${item.color}`, background: `${item.color}07` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-[10px] font-black" style={{ color: item.color }}>{item.title}</p>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{item.body}</p>
                <div className="rounded-lg px-2.5 py-1.5 font-mono text-[9px]"
                  style={{ background: 'rgba(0,0,0,0.3)', color: item.color + 'cc' }}>
                  {item.fact}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: FRACTIONATION
        ══════════════════════════════════════════════════════════ */}
        {tab === 'Fractionation' && (
          <div className="space-y-3">

            {/* BED comparison tool */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  BED Comparison: Single dose vs Fractionated
                </p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[8px] text-amber-400 uppercase font-bold block mb-1">Single dose (Gy)</label>
                    <input type="number" min={1} max={14} step={0.5} value={compDose}
                      onChange={e => setCompDose(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none"
                      style={{ background: '#060c18', border: '1px solid rgba(251,191,36,0.3)', color: '#e2e8f0' }} />
                  </div>
                  <div>
                    <label className="text-[8px] text-amber-400 uppercase font-bold block mb-1">α/β (Gy)</label>
                    <input type="number" min={0.5} max={20} step={0.5} value={compAB}
                      onChange={e => setCompAB(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none"
                      style={{ background: '#060c18', border: '1px solid rgba(251,191,36,0.3)', color: '#e2e8f0' }} />
                  </div>
                </div>
                {/* Comparison cards */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: `${compDose} Gy × 1 fx`, sf: sf(compDose, 0.35, 0.35 / compAB), bedV: bed(compDose, compDose, compAB), color: '#ef4444', desc: 'Single large dose' },
                    { label: `2 Gy × ${Math.round(compDose / 2)} fx`, sf: sfFrac(2, Math.round(compDose / 2), 0.35, 0.35 / compAB), bedV: bed(2 * Math.round(compDose / 2), 2, compAB), color: '#22c55e', desc: 'Equivalent fractionated' },
                  ].map(({ label, sf: sfv, bedV, color, desc }) => (
                    <div key={label} className="rounded-xl px-3 py-3 text-center"
                      style={{ background: `${color}08`, border: `1px solid ${color}30` }}>
                      <p className="text-[9px] font-bold mb-2" style={{ color }}>{label}</p>
                      <p className="text-xs text-slate-500 mb-2">{desc}</p>
                      <p className="text-[8px] text-slate-500 uppercase">Surviving Fraction</p>
                      <p className="text-lg font-black font-mono mb-1" style={{ color }}>
                        {sfv < 0.001 ? sfv.toExponential(2) : sfv.toFixed(4)}
                      </p>
                      <p className="text-[8px] text-slate-500 uppercase">BED (α/β={compAB})</p>
                      <p className="text-sm font-black font-mono" style={{ color }}>{bedV.toFixed(1)} Gy</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical schedule BED table */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Clinical Schedules — BED & EQD2 (Tumour α/β indicated)
                </p>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { name: 'Conventional', dose: '60 Gy/30 fx', d: 2.0, n: 30, ab: 10, colour: '#38bdf8', note: 'HNSCC gold standard' },
                  { name: 'CHART', dose: '54 Gy/36 fx', d: 1.5, n: 36, ab: 10, colour: '#22d3ee', note: 'Accelerated — anti-repopulation' },
                  { name: 'Breast START-B', dose: '40 Gy/15 fx', d: 2.67, n: 15, ab: 4, colour: '#a78bfa', note: 'α/β breast = 4 Gy' },
                  { name: 'Prostate CHHiP', dose: '60 Gy/20 fx', d: 3.0, n: 20, ab: 1.5, colour: '#fb923c', note: 'Moderate hypofractionation' },
                  { name: 'Prostate SBRT', dose: '36.25 Gy/5 fx', d: 7.25, n: 5, ab: 1.5, colour: '#f97316', note: 'PACE-B — extreme hypo' },
                  { name: 'SBRT Lung', dose: '54 Gy/3 fx', d: 18, n: 3, ab: 10, colour: '#fbbf24', note: 'Peripheral NSCLC' },
                  { name: 'SRS Brain', dose: '20 Gy/1 fx', d: 20, n: 1, ab: 10, colour: '#4ade80', note: 'Single-fraction SRS ≤2 cm' },
                ].map((s, i) => {
                  const totalD = s.d * s.n;
                  const bedV = bed(totalD, s.d, s.ab);
                  const eqd2V = eqd2(bedV, s.ab);
                  const barW = Math.min((bedV / 220) * 100, 100);
                  return (
                    <div key={i} className="rounded-xl px-3 py-2.5"
                      style={{ background: `${s.colour}07`, border: `1px solid ${s.colour}25` }}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div>
                          <p className="text-[11px] font-bold text-white">{s.name}</p>
                          <p className="text-[9px] text-slate-500">{s.dose} · α/β={s.ab} · {s.note}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-black font-mono" style={{ color: s.colour }}>BED={bedV.toFixed(1)}</p>
                          <p className="text-[9px] font-mono text-slate-400">EQD2={eqd2V.toFixed(1)} Gy</p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barW}%` }}
                          transition={{ duration: 0.7, delay: i * 0.06 }}
                          className="h-full rounded-full"
                          style={{ background: s.colour }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 Rs quick reference */}
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                The 5 Rs — Why Fractionation Works
              </p>
              {[
                { r: 'Repair', emoji: '🔧', detail: 'SLD repaired between fractions (T½ 0.5–2h). Late OARs (wide shoulder) benefit more than tumours.' },
                { r: 'Redistribution', emoji: '🔄', detail: 'Cells cycle into sensitive M/G2 phase between fractions. Tumours redistributed into sensitive phases.' },
                { r: 'Reoxygenation', emoji: '🫁', detail: 'Hypoxic cells reoxygenate as oxygenated cells die. Each fraction kills the newly oxygenated fraction.' },
                { r: 'Repopulation', emoji: '📈', detail: 'Tumour AP onset day 21–28 (HNSCC). Limits treatment prolongation — each extra day ≈ 0.6 Gy lost.' },
                { r: 'Radiosensitivity', emoji: '🎯', detail: 'Intrinsic α/β ratio determines optimal schedule. Prostate: low α/β → hypofractionation. H&N: high α/β → conventional.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  <div>
                    <span className="text-[10px] font-black text-white">{item.r}: </span>
                    <span className="text-[10px] text-slate-400">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CLINICAL
        ══════════════════════════════════════════════════════════ */}
        {tab === 'Clinical' && (
          <div className="space-y-3">

            {/* Clonogenic assay */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Clonogenic Assay — Puck & Marcus (1956)
                </p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[0, 2, 6].map(dose => {
                    const sfv = dose === 0 ? 1 : sf(dose, 0.35, 0.035);
                    return (
                      <div key={dose} className="rounded-xl p-2"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b' }}>
                        <p className="text-[9px] font-bold text-center text-slate-500 mb-1">{dose} Gy</p>
                        <ColonyArt sfVal={sfv} dose={dose} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed space-y-1">
                  <p className="font-bold text-slate-300">Assay method:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[9px]">
                    <li>Irradiate cells in flasks at graded doses</li>
                    <li>Plate known number (e.g. 1,000) per dish</li>
                    <li>Incubate 10–14 days until macroscopic colonies form</li>
                    <li>Fix, stain, count colonies ≥50 cells (= 1 surviving clone)</li>
                    <li>SF = colonies counted / (cells plated × plating efficiency)</li>
                  </ol>
                  <p className="text-[9px] italic text-slate-600 mt-1">Plating efficiency (PE) corrects for background suboptimal growth.</p>
                </div>
              </div>
            </div>

            {/* Cell cycle wheel */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Cell Cycle Radiosensitivity (2nd R: Redistribution)
                </p>
              </div>
              <div className="px-3 py-2">
                <CellCycleWheel />
              </div>
              <div className="px-3 pb-3 text-[10px] text-slate-400 leading-relaxed">
                Between fractions, cells redistribute: resistant S-phase cells cycle into sensitive M/G2 phases. This is especially relevant in rapidly proliferating tumours. Taxanes (paclitaxel) synchronise cells in G2/M — maximum radiosensitisation when combined with concurrent RT.
              </div>
            </div>

            {/* Dose rate SVG */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dose Rate Effect</p>
              </div>
              <div className="px-3 py-2">
                <svg viewBox="0 0 300 150" className="w-full" style={{ maxHeight: 150 }}>
                  <line x1="30" y1="10" x2="30" y2="135" stroke="#334155" strokeWidth="1.5" />
                  <line x1="30" y1="135" x2="290" y2="135" stroke="#334155" strokeWidth="1.5" />
                  {/* HDR — shouldered */}
                  <motion.path d="M30,12 C65,28 110,72 155,120 L200,145"
                    fill="none" stroke="#fb923c" strokeWidth="2.5"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
                  <text x="205" y="140" fill="#fb923c" fontSize="8" fontFamily="monospace">HDR EBRT</text>
                  {/* LDR — straighter */}
                  <motion.path d="M30,12 C125,18 200,55 260,130"
                    fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="7 3"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
                  <text x="262" y="124" fill="#22c55e" fontSize="8" fontFamily="monospace">LDR BT</text>
                  {/* IDR zone */}
                  <rect x="55" y="10" width="55" height="125" fill="#ef4444" opacity="0.04" />
                  <text x="82" y="65" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontFamily="monospace" opacity="0.7">Inverse</text>
                  <text x="82" y="75" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontFamily="monospace" opacity="0.7">DR zone</text>
                  <text x="160" y="148" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">Dose →</text>
                  <text x="15" y="75" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace"
                    transform="rotate(-90,15,75)">log SF →</text>
                </svg>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  LDR brachytherapy (~0.5–2 Gy/h): continuous SLD repair during irradiation → β component eliminated → curve straightens. Late OARs (high β) spared far more than HDR. Inverse dose rate effect: at ~0.3–1 Gy/h, some cells accumulate in G2/M → paradoxical ↑ cell kill (important for pLDR BT design).
                </p>
              </div>
            </div>

            {/* High LET comparison */}
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
              <p className="text-[10px] font-black text-emerald-300 mb-1.5">High-LET vs Low-LET Survival Curves</p>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                <p className="mb-1"><strong className="text-white">High-LET (¹²C, neutrons, α particles):</strong> Nearly straight on log scale. Large α, negligible β → high α/β (~200–300 Gy). No shoulder = no SLD repair. OER ≈ 1.0–1.5 (hypoxic cells NOT protected). RBE = 2–3.</p>
                <p><strong className="text-white">Clinical implication:</strong> Carbon ions produce the same killing regardless of fractionation — the shoulder cannot be exploited. BUT hypoxic tumour cells (e.g. salivary gland, pancreas) are killed equally well, which is the key clinical advantage over photons.</p>
              </div>
            </div>

            {/* SF₂ clinical tool */}
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">SF₂ as Clinical Predictor</p>
              <div className="space-y-1.5 text-[10px]">
                {[
                  { entity: 'Radiosensitive tumours', sf2: '<0.25', eg: 'Lymphoma, myeloma, germ cell', color: '#4ade80' },
                  { entity: 'Typical epithelial tumours', sf2: '0.25–0.50', eg: 'H&N, cervix, breast', color: '#fbbf24' },
                  { entity: 'Radioresistant tumours', sf2: '0.50–0.70', eg: 'GBM, melanoma, renal cell, sarcoma', color: '#f97316' },
                  { entity: 'Extreme radioresistance', sf2: '>0.70', eg: 'Some GBMs, pancreatic Ca', color: '#ef4444' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-16 text-right font-mono font-bold flex-shrink-0" style={{ color: row.color }}>{row.sf2}</div>
                    <div>
                      <p className="font-bold text-white">{row.entity}</p>
                      <p className="text-[9px] text-slate-500">{row.eg}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-2 italic">SF₂ = surviving fraction at 2 Gy. Clinical predictive value limited by tumour heterogeneity and technical challenges of the assay.</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: QUIZ
        ══════════════════════════════════════════════════════════ */}
        {tab === 'Quiz' && (
          <div className="space-y-3">
            {!qDone && (
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'basic', 'intermediate', 'advanced'] as const).map(d => (
                  <button key={d}
                    onClick={() => { setQDiff(d); setQIdx(0); setQScore(0); setQAnswered(null); }}
                    className="text-[9px] font-bold px-2.5 py-1 rounded-lg border transition"
                    style={{
                      background: qDiff === d ? 'rgba(56,189,232,0.15)' : 'rgba(255,255,255,0.03)',
                      borderColor: qDiff === d ? '#38bdf8' : '#1e3a5f',
                      color: qDiff === d ? '#38bdf8' : '#475569',
                    }}>
                    {d === 'all' ? `All (${QUIZ.length})` : `${d} (${QUIZ.filter(q => q.difficulty === d).length})`}
                  </button>
                ))}
              </div>
            )}

            {filteredQ.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No questions for this filter.</p>
            ) : qDone ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl text-center px-4 py-10 space-y-4"
                style={{ background: 'linear-gradient(135deg,#0d1929,#0f2742)', border: '1px solid #1e4a7f' }}>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">Session Complete</p>
                <div>
                  <p className="text-6xl font-black font-mono text-white">{qScore}</p>
                  <p className="text-slate-600 text-xl font-mono">/ {filteredQ.length}</p>
                </div>
                <p className="text-2xl font-black" style={{ color: qScore / filteredQ.length >= 0.75 ? '#4ade80' : qScore / filteredQ.length >= 0.5 ? '#fbbf24' : '#f87171' }}>
                  {Math.round(qScore / filteredQ.length * 100)}%
                </p>
                <div className="inline-block px-4 py-2 rounded-full text-xs font-black border"
                  style={{
                    background: qScore / filteredQ.length >= 0.75 ? 'rgba(74,222,128,0.1)' : qScore / filteredQ.length >= 0.5 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                    borderColor: qScore / filteredQ.length >= 0.75 ? '#4ade80' : qScore / filteredQ.length >= 0.5 ? '#fbbf24' : '#f87171',
                    color: qScore / filteredQ.length >= 0.75 ? '#4ade80' : qScore / filteredQ.length >= 0.5 ? '#fbbf24' : '#f87171',
                  }}>
                  {qScore / filteredQ.length >= 0.75
                    ? '✓ Cell Survival Mastery — FRCR/ABR Ready'
                    : qScore / filteredQ.length >= 0.5
                    ? 'Review LQ model and BED calculations'
                    : 'Revisit Curves and LQ Model tabs first'}
                </div>
                <button onClick={() => { setQIdx(0); setQScore(0); setQDone(false); setQAnswered(null); }}
                  className="block w-full py-3 rounded-xl text-sm font-black transition"
                  style={{ background: 'rgba(56,189,232,0.15)', border: '1px solid #38bdf8', color: '#38bdf8' }}>
                  ↺ Restart Quiz
                </button>
              </motion.div>
            ) : curQ ? (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-[9px]" style={{ color: '#475569' }}>
                  <span>Q {qIdx + 1} / {filteredQ.length}</span>
                  <span className="font-black" style={{ color: '#38bdf8' }}>Score: {qScore} / {qIdx}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                  <motion.div className="h-full rounded-full" style={{ background: '#38bdf8' }}
                    animate={{ width: `${(qIdx / filteredQ.length) * 100}%` }} />
                </div>

                <div>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase"
                    style={
                      curQ.difficulty === 'basic'
                        ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
                        : curQ.difficulty === 'intermediate'
                        ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                        : { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }
                    }>
                    {curQ.difficulty}
                  </span>
                </div>

                {/* Question */}
                <div className="rounded-2xl px-4 py-3"
                  style={{ background: '#0d1929', border: '1px solid #1e3a5f' }}>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">{curQ.q}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {curQ.opts.map((opt, i) => {
                    const isCorrect = i === curQ.correct;
                    const isChosen = i === qAnswered;
                    let bg = 'rgba(255,255,255,0.02)', border = '#1e3a5f', color = '#94a3b8';
                    if (qAnswered !== null) {
                      if (isCorrect) { bg = 'rgba(74,222,128,0.08)'; border = '#4ade80'; color = '#4ade80'; }
                      else if (isChosen) { bg = 'rgba(248,113,113,0.08)'; border = '#f87171'; color = '#f87171'; }
                      else { color = '#334155'; }
                    }
                    return (
                      <button key={i} disabled={qAnswered !== null}
                        onClick={() => { setQAnswered(i); if (isCorrect) setQScore(s => s + 1); }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition"
                        style={{ background: bg, border: `1px solid ${border}`, color }}>
                        <span className="font-black mr-2 font-mono">{String.fromCharCode(65 + i)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {qAnswered !== null && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="space-y-2">
                      <div className="rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)' }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {qAnswered === curQ.correct
                            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />}
                          <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">
                            {qAnswered === curQ.correct ? 'Correct' : `Incorrect — Answer: ${String.fromCharCode(65 + curQ.correct)}`}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{curQ.explanation}</p>
                      </div>
                      <div className="rounded-xl px-3 py-2"
                        style={{ background: 'rgba(56,189,232,0.07)', border: '1px solid rgba(56,189,232,0.25)' }}>
                        <span className="text-[9px] font-black text-cyan-400 uppercase">Pearl: </span>
                        <span className="text-[10px] text-cyan-200/80">{curQ.pearl}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {qAnswered !== null && (
                  <button
                    onClick={() => { setQAnswered(null); if (qIdx + 1 >= filteredQ.length) setQDone(true); else setQIdx(i => i + 1); }}
                    className="w-full py-3 rounded-xl text-sm font-black transition"
                    style={{ background: 'rgba(56,189,232,0.12)', border: '1px solid #38bdf8', color: '#38bdf8' }}>
                    {qIdx + 1 >= filteredQ.length ? '→ Final Score' : 'Next Question →'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="text-[8.5px] pt-3 border-t space-y-0.5" style={{ borderColor: '#1e293b', color: '#2d3f55' }}>
          <p>Puck & Marcus (1956) · Kellerer & Rossi (1972) · Chadwick & Leenhouts (1973)</p>
          <p>Fowler JF (1989) · Thames & Hendry (1987) · Withers HR (1975, 1988)</p>
          <p>Hall EJ & Giaccia AJ — Radiobiology 8th ed. · Steel GG — Basic Clinical Radiobiology 4th ed.</p>
          <p style={{ color: '#1e3040' }}>LQ model is valid for 1–8 Gy/fx. BED/EQD2 are radiobiological constructs — not physical dose units. For SBRT &gt;8 Gy/fx consider modified LQ/USC. Not for individual clinical decisions without protocol review.</p>
        </div>
      </div>
    </div>
  );
};

export default CellSurvivalPage;