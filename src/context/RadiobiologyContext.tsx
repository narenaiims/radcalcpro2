/**
 * RadiobiologyContext.tsx
 * ──────────────────────────────────────────────────────────────────────────
 * Global shared radiobiology state for radcalcpro2.
 *
 * Solves: each page previously re-initialised α/β, tissue type, and
 * fractionation independently. A trainee doing EBRT + brachy + re-RT had
 * to re-enter values on every tool.
 *
 * Provides:
 *  - Active patient label (anonymised — initials / MRN suffix)
 *  - Tumour α/β and tissue type (shared across all LQ calculators)
 *  - Current prescription: dose/fx, fractions, total dose, intent
 *  - EBRT component (for brachy + reirradiation composite calcs)
 *  - Calculation history log (IndexedDB-backed, 100-entry ring buffer)
 *  - Quick-set presets per tumour site
 *
 * All state persists to localStorage with versioned key. History log
 * uses a ring buffer in localStorage (no IndexedDB dependency for now).
 *
 * Usage:
 *   wrap <App> with <RadiobiologyProvider>
 *   consume with useRxContext() hook in any page
 *
 * Dr. Narendra Rathore · RNT Medical College · Udaipur
 */

import { RadiobiologyData } from '../data/radiobiologyData';
import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

export type TreatmentIntent = 'Radical' | 'Adjuvant' | 'Palliative' | 'SBRT' | 'SRS' | 'Brachytherapy';

export interface RxState {
  /** Anonymised label — initials, MRN suffix, or free text. Never full name. */
  patientLabel: string;
  /** Tumour site for α/β selection */
  tumourSite: string;
  /** Tumour subsite / histology */
  tumourSubsite: string;
  /** Selected tumour entry */
  selectedTumour: RadiobiologyData | null;
  /** α/β ratio for tumour (Gy) */
  tumourAB: number;
  /** α/β ratio for critical OAR (Gy) — used in composite calcs */
  oarAB: number;
  /** Dose per fraction (Gy) */
  dosePerFx: number;
  /** Number of fractions */
  fractions: number;
  /** Treatment intent */
  intent: TreatmentIntent;
  /** EBRT component — populated when brachy or re-RT tab is active */
  ebrt: {
    totalDose: number;
    dosePerFx: number;
    fractions: number;
  };
  /** Kick-off time for repopulation (days) */
  tk: number;
  /** Repopulation rate (Gy EQD2/day) */
  kValue: number;
}

export interface HistoryEntry {
  id: string;            // timestamp-based UUID
  ts: number;            // epoch ms
  tool: string;          // e.g. 'EQD2', 'HDR Brachy'
  patientLabel: string;
  summary: string;       // one-line result e.g. 'BED=72 Gy · EQD2=60 Gy (α/β=10)'
  detail: Record<string, string | number>; // full parameter snapshot
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_RX: RxState = {
  patientLabel: '',
  tumourSite: 'Head & Neck',
  tumourSubsite: 'HNSCC HPV-',
  selectedTumour: null,
  tumourAB: 10,
  oarAB: 3,
  dosePerFx: 2.0,
  fractions: 33,
  intent: 'Radical',
  ebrt: { totalDose: 0, dosePerFx: 0, fractions: 0 },
  tk: 28,
  kValue: 0.5,
};

// ─── Presets ─────────────────────────────────────────────────────────────────

export interface RxPreset {
  label: string;
  site: string;
  subsite: string;
  tumourAB: number;
  oarAB: number;
  dosePerFx: number;
  fractions: number;
  intent: TreatmentIntent;
  tk: number;
  kValue: number;
  source: string;
}

export const RX_PRESETS: RxPreset[] = [
  {
    label: 'H&N — Conv. (66 Gy / 33 fx)',
    site: 'Head & Neck', subsite: 'HNSCC HPV-',
    tumourAB: 10, oarAB: 3, dosePerFx: 2.0, fractions: 33, intent: 'Radical',
    tk: 28, kValue: 0.65, source: 'RTOG 9003 / Standard',
  },
  {
    label: 'H&N — Hypo (55 Gy / 20 fx)',
    site: 'Head & Neck', subsite: 'HNSCC HPV+',
    tumourAB: 10, oarAB: 3, dosePerFx: 2.75, fractions: 20, intent: 'Radical',
    tk: 21, kValue: 0.50, source: 'DAHANCA / Institutional',
  },
  {
    label: 'Cervix — EBRT (45 Gy / 25 fx)',
    site: 'Gynecological', subsite: 'Cervix SCC',
    tumourAB: 10, oarAB: 3, dosePerFx: 1.8, fractions: 25, intent: 'Radical',
    tk: 21, kValue: 0.50, source: 'GEC-ESTRO EMBRACE II',
  },
  {
    label: 'Prostate — CHHiP (60 Gy / 20 fx)',
    site: 'Genitourinary', subsite: 'Prostate',
    tumourAB: 1.5, oarAB: 3, dosePerFx: 3.0, fractions: 20, intent: 'Radical',
    tk: 0, kValue: 0.20, source: 'CHHiP Trial (Dearnaley 2016)',
  },
  {
    label: 'Prostate — PACE-B SBRT (36.25 Gy / 5 fx)',
    site: 'Genitourinary', subsite: 'Prostate',
    tumourAB: 1.5, oarAB: 3, dosePerFx: 7.25, fractions: 5, intent: 'SBRT',
    tk: 0, kValue: 0.20, source: 'PACE-B (Brand 2019)',
  },
  {
    label: 'Breast — FAST-Forward (26 Gy / 5 fx)',
    site: 'Breast', subsite: 'Breast Luminal',
    tumourAB: 4.0, oarAB: 3, dosePerFx: 5.2, fractions: 5, intent: 'Adjuvant',
    tk: 28, kValue: 0.25, source: 'FAST-Forward (Murray Brunt 2020)',
  },
  {
    label: 'Breast — START-B (40 Gy / 15 fx)',
    site: 'Breast', subsite: 'Breast Luminal',
    tumourAB: 4.0, oarAB: 3, dosePerFx: 2.67, fractions: 15, intent: 'Adjuvant',
    tk: 28, kValue: 0.25, source: 'START-B (Haviland 2013)',
  },
  {
    label: 'Lung SBRT (54 Gy / 3 fx)',
    site: 'Thoracic', subsite: 'NSCLC Adenocarcinoma',
    tumourAB: 10, oarAB: 3, dosePerFx: 18, fractions: 3, intent: 'SBRT',
    tk: 28, kValue: 0.40, source: 'RTOG 0236',
  },
  {
    label: 'Palliative Bone (20 Gy / 5 fx)',
    site: 'Bone', subsite: 'Bone Metastasis',
    tumourAB: 10, oarAB: 3, dosePerFx: 4.0, fractions: 5, intent: 'Palliative',
    tk: 21, kValue: 0.40, source: 'SCORAD III / RTOG 9714',
  },
  {
    label: 'Rectal — Short course (25 Gy / 5 fx)',
    site: 'Gastrointestinal', subsite: 'Rectal Adenocarcinoma',
    tumourAB: 10, oarAB: 3, dosePerFx: 5.0, fractions: 5, intent: 'Radical',
    tk: 21, kValue: 0.40, source: 'Swedish Rectal Trial / RAPIDO',
  },
  {
    label: 'Glioblastoma — Stupp (60 Gy / 30 fx)',
    site: 'CNS', subsite: 'Glioblastoma',
    tumourAB: 10, oarAB: 2, dosePerFx: 2.0, fractions: 30, intent: 'Radical',
    tk: 0, kValue: 0.30, source: 'Stupp (NEJM 2005)',
  },
];

// ─── Reducer ─────────────────────────────────────────────────────────────────

type RxAction =
  | { type: 'SET_PATIENT'; label: string }
  | { type: 'SET_TUMOUR_AB'; ab: number }
  | { type: 'SET_OAR_AB'; ab: number }
  | { type: 'SET_DOSE_PER_FX'; dose: number }
  | { type: 'SET_FRACTIONS'; n: number }
  | { type: 'SET_INTENT'; intent: TreatmentIntent }
  | { type: 'SET_TUMOUR_SITE'; site: string; subsite: string; entry: RadiobiologyData | null }
  | { type: 'SET_EBRT'; ebrt: RxState['ebrt'] }
  | { type: 'SET_REPOP'; tk: number; kValue: number }
  | { type: 'APPLY_PRESET'; preset: RxPreset }
  | { type: 'LOAD'; state: RxState }
  | { type: 'RESET' };

function rxReducer(state: RxState, action: RxAction): RxState {
  switch (action.type) {
    case 'SET_PATIENT':   return { ...state, patientLabel: action.label };
    case 'SET_TUMOUR_AB': return { ...state, tumourAB: action.ab };
    case 'SET_OAR_AB':    return { ...state, oarAB: action.ab };
    case 'SET_DOSE_PER_FX': return { ...state, dosePerFx: action.dose };
    case 'SET_FRACTIONS': return { ...state, fractions: action.n };
    case 'SET_INTENT':    return { ...state, intent: action.intent };
    case 'SET_TUMOUR_SITE': return { ...state, tumourSite: action.site, tumourSubsite: action.subsite, selectedTumour: action.entry };
    case 'SET_EBRT':      return { ...state, ebrt: action.ebrt };
    case 'SET_REPOP':     return { ...state, tk: action.tk, kValue: action.kValue };
    case 'APPLY_PRESET':  return {
      ...state,
      tumourSite: action.preset.site,
      tumourSubsite: action.preset.subsite,
      tumourAB: action.preset.tumourAB,
      oarAB: action.preset.oarAB,
      dosePerFx: action.preset.dosePerFx,
      fractions: action.preset.fractions,
      intent: action.preset.intent,
      tk: action.preset.tk,
      kValue: action.preset.kValue,
    };
    case 'LOAD':  return action.state;
    case 'RESET': return DEFAULT_RX;
    default:      return state;
  }
}

// ─── History helpers ────────────────────────────────────────────────────────

const HISTORY_KEY = 'radonco_calc_history_v1';
const HISTORY_MAX = 100;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
  } catch { /* storage full — silent */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface RadiobiologyContextValue {
  rx: RxState;

  // Derived values (memoised)
  totalDose: number;
  bed: number;
  eqd2: number;

  // Mutations
  setPatientLabel: (label: string) => void;
  setTumourAB: (ab: number) => void;
  setOarAB: (ab: number) => void;
  setDosePerFx: (dose: number) => void;
  setFractions: (n: number) => void;
  setIntent: (intent: TreatmentIntent) => void;
  setTumourSite: (site: string, subsite: string, entry: RadiobiologyData | null) => void;
  setEBRT: (ebrt: RxState['ebrt']) => void;
  setRepop: (tk: number, kValue: number) => void;
  applyPreset: (preset: RxPreset) => void;
  reset: () => void;

  // History
  history: HistoryEntry[];
  logCalculation: (tool: string, summary: string, detail: Record<string, string | number>) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

const RadiobiologyContext = createContext<RadiobiologyContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const RX_STORAGE_KEY = 'radonco_rx_context_v1';

export const RadiobiologyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rx, dispatch] = useReducer(rxReducer, DEFAULT_RX, () => {
    try {
      const raw = localStorage.getItem(RX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<RxState>;
        return { ...DEFAULT_RX, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_RX;
  });

  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Persist rx state on every change
  useEffect(() => {
    try {
      localStorage.setItem(RX_STORAGE_KEY, JSON.stringify(rx));
    } catch { /* storage full */ }
  }, [rx]);

  // ── Derived values ──────────────────────────────────────────────────────
  const totalDose = useMemo(() => rx.dosePerFx * rx.fractions, [rx.dosePerFx, rx.fractions]);

  const bed = useMemo(
    () => rx.tumourAB > 0 ? totalDose * (1 + rx.dosePerFx / rx.tumourAB) : 0,
    [totalDose, rx.dosePerFx, rx.tumourAB]
  );

  const eqd2 = useMemo(
    () => rx.tumourAB > 0 ? bed / (1 + 2 / rx.tumourAB) : 0,
    [bed, rx.tumourAB]
  );

  // ── Mutations ───────────────────────────────────────────────────────────
  const setPatientLabel = useCallback((label: string) => dispatch({ type: 'SET_PATIENT', label }), []);
  const setTumourAB     = useCallback((ab: number)    => dispatch({ type: 'SET_TUMOUR_AB', ab }), []);
  const setOarAB        = useCallback((ab: number)    => dispatch({ type: 'SET_OAR_AB', ab }), []);
  const setDosePerFx    = useCallback((dose: number)  => dispatch({ type: 'SET_DOSE_PER_FX', dose }), []);
  const setFractions    = useCallback((n: number)     => dispatch({ type: 'SET_FRACTIONS', n }), []);
  const setIntent       = useCallback((intent: TreatmentIntent) => dispatch({ type: 'SET_INTENT', intent }), []);
  const setTumourSite   = useCallback((site: string, subsite: string, entry: RadiobiologyData | null) => dispatch({ type: 'SET_TUMOUR_SITE', site, subsite, entry }), []);
  const setEBRT         = useCallback((ebrt: RxState['ebrt']) => dispatch({ type: 'SET_EBRT', ebrt }), []);
  const setRepop        = useCallback((tk: number, kValue: number) => dispatch({ type: 'SET_REPOP', tk, kValue }), []);
  const applyPreset     = useCallback((preset: RxPreset) => dispatch({ type: 'APPLY_PRESET', preset }), []);
  const reset           = useCallback(() => dispatch({ type: 'RESET' }), []);

  // ── History ─────────────────────────────────────────────────────────────
  const logCalculation = useCallback(
    (tool: string, summary: string, detail: Record<string, string | number>) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
        tool,
        patientLabel: rx.patientLabel,
        summary,
        detail,
      };
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, HISTORY_MAX);
        saveHistory(next);
        return next;
      });
    },
    [rx.patientLabel]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(entry => entry.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const value = useMemo<RadiobiologyContextValue>(() => ({
    rx,
    totalDose, bed, eqd2,
    setPatientLabel, setTumourAB, setOarAB, setDosePerFx,
    setFractions, setIntent, setTumourSite, setEBRT, setRepop,
    applyPreset, reset,
    history, logCalculation, clearHistory, removeFromHistory,
  }), [
    rx, totalDose, bed, eqd2,
    setPatientLabel, setTumourAB, setOarAB, setDosePerFx,
    setFractions, setIntent, setTumourSite, setEBRT, setRepop,
    applyPreset, reset,
    history, logCalculation, clearHistory, removeFromHistory,
  ]);

  return (
    <RadiobiologyContext.Provider value={value}>
      {children}
    </RadiobiologyContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRxContext(): RadiobiologyContextValue {
  const ctx = useContext(RadiobiologyContext);
  if (!ctx) throw new Error('useRxContext must be used inside <RadiobiologyProvider>');
  return ctx;
}

// ─── Convenience selector hooks ───────────────────────────────────────────────

/** Returns only the fields needed for a basic LQ calculation */
export function useRxLQ() {
  const { rx, totalDose, bed, eqd2 } = useRxContext();
  return {
    dosePerFx: rx.dosePerFx,
    fractions:  rx.fractions,
    tumourAB:   rx.tumourAB,
    oarAB:      rx.oarAB,
    totalDose,
    bed,
    eqd2,
  };
}

/** Returns patient + intent context */
export function useRxPatient() {
  const { rx, setPatientLabel, setIntent } = useRxContext();
  return {
    patientLabel: rx.patientLabel,
    intent:       rx.intent,
    tumourSite:   rx.tumourSite,
    tumourSubsite: rx.tumourSubsite,
    setPatientLabel,
    setIntent,
  };
}

/** Returns EBRT component for composite brachy / re-RT calcs */
export function useRxEBRT() {
  const { rx, setEBRT } = useRxContext();
  return { ebrt: rx.ebrt, setEBRT };
}
