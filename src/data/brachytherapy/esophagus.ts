import { Section } from "../../types/brachytherapy";

export const esophagusData: Section[] = [
  {
    id:"e1", icon:"🥖", title:"Indications & Technique",
    subs:[
      { id:"e1a", title:"Role of Esophageal BT — Palliative & Boost",
        body:`ESOPHAGEAL BRACHYTHERAPY (EBT) — INDICATIONS:
        
        1. PALLIATIVE (Primary Role):
           • Rapid relief of dysphagia in advanced/metastatic disease.
           • Superior to stenting for long-term (3-6 month) dysphagia relief (less overgrowth/migration).
           • Often used after failed EBRT or as a standalone palliative procedure.
        
        2. DEFINITIVE BOOST:
           • After EBRT (50-50.4 Gy) to improve local control in T1-T3 lesions.
           • RTOG 9207: EBRT 50 Gy + EBT boost (5 Gy × 3).
           • Caution: High fistula risk if combined with chemotherapy.
        
        CONTRAINDICATIONS:
        • Tracheoesophageal (TE) fistula (absolute).
        • Tumor involving the aorta (high risk of fatal hemorrhage).
        • Complete obstruction (unable to pass guidewire).
        • Cervical esophagus (poor tolerance).` },
      { id:"e1b", title:"Technique & Applicator Systems",
        body:`PROCEDURE & PHYSICS:
        
        APPLICATOR (Bougie):
        • Flexible intraluminal tube (diameter 6-10 mm).
        • Passed over a guidewire under fluoroscopic or endoscopic guidance.
        • Centering: Critical to ensure the source is in the center of the lumen. Eccentricity causes mucosal "hot spots" and increases fistula risk.
        • Length: Treats tumor + 2 cm proximal/distal margins.
        
        PROCEDURE STEPS:
        1. Endoscopy to identify tumor extent and pass guidewire.
        2. Applicator insertion over guidewire.
        3. Verification of position (radio-opaque markers on X-ray/Fluoroscopy).
        4. Connection to HDR afterloader.
        5. Treatment (5-10 minutes).
        6. Removal of applicator.` },
      { id:"e1c", title:"Dose Schedules & Radiobiology",
        body:`HDR DOSE SCHEDULES:
        
        PALLIATIVE (Standalone):
        • 10-12 Gy × 1 fraction (prescribed at 1 cm from source axis).
        • 7 Gy × 2-3 fractions (weekly).
        
        BOOST (Post-EBRT 50 Gy):
        • 5 Gy × 2-3 fractions (weekly).
        • Total EQD2 (Tumor): ~70-75 Gy.
        
        PRESCRIPTION POINT:
        • Standard: 10 mm (1 cm) from the source axis.
        • Note: This is NOT the surface. Surface dose is much higher (Inverse Square Law).
        
        RADIOBIOLOGY (α/β):
        • Esophageal Cancer: 10 Gy.
        • Late Stricture/Fistula: 3 Gy.` },
      { id:"e1d", title:"Toxicity & Complications",
        body:`ACUTE TOXICITY:
        • Esophagitis: Pain/burning during swallowing (Grade 1-2).
        • Transient Dysphagia: Due to edema immediately post-procedure.
        
        LATE TOXICITY (The "Big Three"):
        1. ESOPHAGEAL FISTULA: Most serious (5-12% risk). Can be TE fistula or aorto-esophageal (fatal). Risk factors: bulky tumor, prior chemo, high dose per fraction.
        2. STRICTURE: Fibrotic narrowing (10-20%). May require repeated dilations.
        3. ULCERATION: Persistent mucosal defect.
        
        RTOG 9207 RESULTS:
        • 5-year local control: 56%.
        • Fistula rate: 12% (unacceptably high when combined with chemo).
        • Conclusion: EBT boost should be used with caution in combined modality settings.` },
    ]
  },
  {
    id:"e2", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"s2a", title:"Essential Numbers — Esophagus BT",
        body:`MUST-KNOW NUMBERS:
        • Palliative Dose: 10-12 Gy × 1 (at 1 cm).
        • Boost Dose: 5 Gy × 2-3 (after 50 Gy EBRT).
        • Prescription Point: 10 mm from source axis.
        • Applicator Diameter: 6-10 mm.
        • Margins: 2 cm proximal/distal.
        • Fistula Risk: ~10%.
        • α/β (Tumor): 10 Gy.
        • α/β (Late): 3 Gy.` },
      { id:"s2b", title:"Viva Questions — Esophagus BT",
        body:`Q: Why is the prescription point at 10mm from the source axis rather than the surface?
        A: Prescribing at 10mm ensures a more consistent dose to the tumor volume which often extends beyond the immediate mucosal surface. It also helps standardize reporting across different applicator diameters.
        
        Q: What are the risk factors for esophageal fistula after brachytherapy?
        A: Key risk factors include: 1. Bulky or circumferential tumors, 2. Tumor involving the aorta or trachea, 3. Concurrent or prior chemotherapy, 4. High dose per fraction (>7-10 Gy), and 5. Poor applicator centering (eccentricity).
        
        Q: Compare EBT to esophageal stenting for palliation.
        A: Stenting provides immediate relief but has higher rates of late complications (migration, tumor overgrowth). EBT provides slower relief (1-2 weeks) but more durable dysphagia-free survival (3-6 months) and better quality of life.
        
        Q: What did RTOG 9207 show regarding the EBT boost?
        A: RTOG 9207 showed a high rate of esophageal fistula (12%) when an EBT boost (5 Gy × 3) was added to definitive chemo-RT (50 Gy + Cisplatin/5-FU). This led to a more cautious approach to using EBT in the curative setting.` },
    ]
  }
];
