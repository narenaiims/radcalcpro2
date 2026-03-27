import { Section } from "../../types/brachytherapy";

export const esophagusData: Section[] = [
  {
    id:"e1", icon:"🥖", title:"Indications & Technique",
    subs:[
      { id:"e1a", title:"Role of Esophageal BT",
        body:`INDICATIONS:
        • Palliative: Rapid relief of dysphagia in advanced disease.
        • Definitive Boost: After EBRT 50 Gy to improve local control.
        
        TECHNIQUE:
        • Intraluminal bougie (applicator) passed over a guidewire under fluoroscopy or endoscopy.
        • Diameter: 6-10 mm.
        • Centering: Critical to ensure the source is in the middle of the lumen to avoid mucosal "hot spots".` },
      { id:"e1b", title:"Dose & Toxicity",
        body:`DOSE SCHEDULES:
        • Palliative: 10-12 Gy × 1 or 7 Gy × 2-3
        • Boost: 5 Gy × 2-3
        
        TOXICITY:
        • Esophageal Fistula: Most serious (5-10% risk). Higher if tumour is bulky or involves the aorta.
        • Stricture: Late complication.
        • Esophagitis: Acute.` },
    ]
  }
];
