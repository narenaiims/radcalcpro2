import { Section } from "../../types/brachytherapy";

export const bronchusData: Section[] = [
  {
    id: "br1", icon: "🫁", title: "Indications & Technique",
    subs: [
      { id: "br1a", title: "Role of Endobronchial BT — Palliative & Boost",
        body: `ENDOBRONCHIAL BRACHYTHERAPY (EBBT) — INDICATIONS:
        
        1. PALLIATIVE (Primary Role):
           • Rapid relief of symptoms in advanced/obstructive lung cancer.
           • Haemoptysis (80-90% success rate).
           • Dyspnoea/Cough from large airway obstruction.
           • Post-obstructive pneumonia (re-opening the airway).
        
        2. DEFINITIVE BOOST:
           • After EBRT (45-60 Gy) for small, localized endobronchial tumours (T1-T2) to improve local control.
           • Curative intent in patients unfit for surgery or SBRT.
        
        3. RECURRENT DISEASE:
           • Salvage for endobronchial recurrence in previously irradiated areas.
        
        CONTRAINDICATIONS:
        • Extrinsic compression without endobronchial component (EBBT won't help).
        • Tumor involving the pulmonary artery (extremely high risk of fatal haemorrhage).
        • Complete collapse of a lung (unless airway can be re-opened).
        • Tracheoesophageal fistula.` },
      { id: "br1b", title: "Technique & Physics",
        body: `PROCEDURE & DOSE DISTRIBUTION:
        
        APPLICATOR:
        • Flexible 6F or 10F catheter.
        • Passed through the working channel of a flexible bronchoscope.
        • Positioned across the tumour under direct visualization and fluoroscopy.
        
        LOCALIZATION:
        • Radio-opaque markers (e.g., dummy sources) used to identify the tumour extent on X-ray/CT.
        • Treatment Length: Tumour + 1-2 cm margins.
        
        CENTERING:
        • Critical to maintain the catheter in the center of the airway.
        • Eccentricity leads to mucosal "hot spots" (Inverse Square Law), increasing the risk of bronchial wall necrosis and fatal haemorrhage.` },
      { id: "br1c", title: "Dose Schedules & Prescription",
        body: `HDR DOSE SCHEDULES:
        
        PALLIATIVE (Standalone):
        • 7.5 Gy × 2-3 fractions (weekly).
        • 10 Gy × 1 fraction (single-shot palliation).
        
        BOOST (Post-EBRT):
        • 5 Gy × 2-3 fractions (weekly).
        
        PRESCRIPTION POINT:
        • Standard: 10 mm (1 cm) from the source axis.
        • Note: For smaller airways (e.g., segmental bronchi), prescription may be at 5-7 mm.
        
        RADIOBIOLOGY (α/β):
        • Lung Cancer: 10 Gy.
        • Late Bronchial Damage: 3 Gy.` },
      { id: "br1d", title: "Toxicity & Complications",
        body: `ACUTE TOXICITY:
        • Bronchitis/Cough: Increased mucus production.
        • Transient Dyspnoea: Due to procedural trauma or edema.
        
        LATE TOXICITY:
        1. FATAL HAEMOPTYSIS: The most feared complication (5-10% risk). Occurs due to bronchial wall necrosis and erosion into the pulmonary artery. Higher risk with: 1. Central/Hilar tumours, 2. Prior EBRT, 3. High dose per fraction.
        2. BRONCHIAL STENOSIS: Fibrotic narrowing of the airway.
        3. RADIATION PNEUMONITIS: Rare with EBBT alone due to rapid dose fall-off.
        
        CLINICAL OUTCOMES:
        • Dyspnoea relief: 60-70%.
        • Haemoptysis relief: 80-90%.
        • Median duration of relief: 3-6 months.` },
    ]
  },
  {
    id: "br2", icon: "🎯", title: "Key Numbers & Viva",
    subs: [
      { id: "br2a", title: "Essential Numbers — Bronchus BT",
        body: `MUST-KNOW NUMBERS:
        • Palliative Dose: 7.5 Gy × 2-3 (at 1 cm).
        • Boost Dose: 5 Gy × 2-3 (after EBRT).
        • Prescription Point: 10 mm from source axis.
        • Margins: 1-2 cm proximal/distal.
        • Fatal Haemoptysis Risk: ~5-10%.
        • α/β (Tumor): 10 Gy | α/β (Late): 3 Gy.` },
      { id: "br2b", title: "Viva Questions — Bronchus BT",
        body: `Q: What is the primary risk of endobronchial brachytherapy and how do you minimize it?
        A: The primary risk is fatal haemoptysis (5-10%) due to bronchial wall necrosis. It is minimized by: 1. Careful patient selection (avoiding tumours involving major vessels), 2. Ensuring the catheter is centered in the airway, 3. Limiting the dose per fraction (≤7.5 Gy), and 4. Avoiding excessive total EQD2 when combined with EBRT.
        
        Q: Why is EBBT often preferred over stenting for haemoptysis?
        A: EBBT is highly effective for mucosal bleeding (haemoptysis) and provides a more durable response than stenting, which is primarily a mechanical solution for obstruction and can sometimes worsen bleeding through irritation.
        
        Q: How do you determine the treatment length for EBBT?
        A: The treatment length is determined by the visible endobronchial tumour extent (via bronchoscopy) plus a 1-2 cm margin both proximally and distally to account for microscopic spread and setup uncertainty.
        
        Q: What is the significance of the "Inverse Square Law" in EBBT?
        A: Because the source is very close to the bronchial wall, small changes in distance lead to large changes in dose. If the catheter is not centered, the side closer to the wall receives a significantly higher dose, increasing the risk of necrosis and fistula.` },
    ]
  }
];
