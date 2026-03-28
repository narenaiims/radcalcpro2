import { Section } from "../../types/brachytherapy";

export const bronchusData: Section[] = [
  {
    id: "br1", icon: "🫁", title: "Indications & Technique",
    subs: [
      { id: "br1a", title: "Role of Endobronchial BT",
        body: `INDICATIONS:
        • Palliative: Rapid relief of symptoms in advanced lung cancer (haemoptysis, cough, dyspnoea from airway obstruction).
        • Definitive Boost: After EBRT for small, localized endobronchial tumours to improve local control.
        
        TECHNIQUE:
        • Bronchoscopy-guided: A catheter is passed through the bronchoscope into the target airway.
        • Localization: Fluoroscopy or CT is used to confirm the catheter position relative to the tumour.
        • Centering: Critical to avoid mucosal "hot spots" which can lead to fatal haemoptysis.` },
      { id: "br1b", title: "Dose & Toxicity",
        body: `DOSE SCHEDULES:
        • Palliative: 7.5 Gy × 2-3 fractions at 1 cm from the source axis.
        • Boost: 5 Gy × 2-3 fractions after EBRT (e.g., 30-45 Gy).
        
        TOXICITY:
        • Fatal Haemoptysis: Most serious risk (up to 5-10%). Higher risk if tumour is central or involves major vessels.
        • Bronchial Stenosis: Late complication.
        • Bronchitis/Cough: Acute.` },
    ]
  },
  {
    id: "br2", icon: "🎯", title: "Key Numbers & Viva",
    subs: [
      { id: "br2a", title: "Essential Numbers — Bronchus BT",
        body: `MUST-KNOW NUMBERS:
        • Palliative Dose: 7.5 Gy × 2 at 1 cm.
        • Prescription Point: 1 cm from the catheter axis.
        • Risk of Fatal Haemoptysis: ~5-10%.
        • Combined EQD2: Aim for ~50-60 Gy total.` },
    ]
  }
];
