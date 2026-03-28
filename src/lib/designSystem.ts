export const CLINICAL_COLORS = {
  pass: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'PASS' },
  warn: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'WARN' },
  fail: { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'FAIL' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'INFO' },
  neutral: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'REF' },
};

export const formatGy = (val: number) => val.toFixed(1);
export const formatBED = (val: number) => val.toFixed(2);
export const formatFx = (val: number) => Math.round(val).toString();

export const NAV_CATEGORIES = [
  { id: 'radio', label: 'Radiobiology', icon: '📐', color: 'text-cyan-400' },
  { id: 'planning', label: 'Clinical Planning', icon: '🎯', color: 'text-rose-400' },
  { id: 'brachy', label: 'Brachytherapy', icon: '💊', color: 'text-amber-400' },
  { id: 'special', label: 'Special Procedures', icon: '☢️', color: 'text-indigo-400' },
  { id: 'reference', label: 'Reference', icon: '📚', color: 'text-emerald-400' },
  { id: 'education', label: 'Education', icon: '🎓', color: 'text-blue-400' },
];
