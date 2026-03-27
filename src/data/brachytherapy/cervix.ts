import { Section } from "../../types/brachytherapy";

export const cervixData: Section[] = [
  {
    id:"c1", icon:"🫀", title:"Anatomy & Applicator Systems",
    subs:[
      { id:"c1a", title:"Relevant Anatomy for Cervix BT",
        body:`The uterus is an anteverted, anteflexed muscular organ lying between the bladder (anteriorly) and rectum (posteriorly). The cervix is the lower cylindrical portion, approximately 3–4 cm long and 2.5 cm wide.
        
        KEY ANATOMICAL RELATIONSHIPS:
        • Bladder: lies immediately anterior to the uterus — bladder trigone is at particular risk
        • Rectum: lies 2–4 cm posterior to the posterior vaginal fornix
        • Sigmoid colon: lies posterosuperiorly — important in high parametrial disease
        • Ureters: pass within 1.5 cm of the lateral cervix — parametrial dose must not inadvertently include ureteric segment` },
      { id:"c1b", title:"Types of Intracavitary Applicators",
        body:`Three fundamental applicator systems are used in cervix brachytherapy:
        
        1. TANDEM AND OVOIDS (T&O): The classic system. A central tandem is flanked by two ovoids in the lateral vaginal fornices. Recreates the classical pear-shaped isodose distribution.
        2. TANDEM AND RING (T&R): A ring replaces the two ovoids. Advantage: more reproducible geometry, easier MRI-based planning. Used extensively in GEC-ESTRO MRI-guided protocols.
        3. INTERSTITIAL + INTRACAVITARY (Hybrid): Tandem + ring/ovoids PLUS perineal template needles (Utrecht, Venezia applicators). Used for bulky, asymmetric or laterally extending disease where intracavitary alone cannot cover the target (HR-CTV D90 ≥85 Gy EQD2).` },
    ]
  },
  {
    id:"c2", icon:"📐", title:"Dose, Planning & GEC-ESTRO",
    subs:[
      { id:"c2a", title:"Point A vs Volumetric Planning (GEC-ESTRO)",
        body:`POINT A (Classical Dosimetry):
        Defined as 2 cm superior to the lateral vaginal fornix and 2 cm lateral to the uterine tandem. Represents the point where the uterine artery crosses the ureter. Historically the prescription point.
        
        VOLUMETRIC PLANNING (Modern Standard):
        Based on MRI (gold standard) or CT.
        • GTV: Gross tumour volume at time of brachytherapy
        • HR-CTV (High-Risk CTV): GTV + entire cervix + any suspicious grey zone on MRI. Target D90 ≥ 85-90 Gy EQD2.
        • IR-CTV (Intermediate-Risk CTV): HR-CTV + 5-10 mm margin + initial GTV extent. Target D90 ≥ 60 Gy EQD2.` },
      { id:"c2b", title:"Standard HDR Schedules",
        body:`HDR SCHEDULES (after EBRT 45-50.4 Gy):
        • 7 Gy × 3 fractions (most common)
        • 7 Gy × 4 fractions
        • 5.5 Gy × 5 fractions
        • 6 Gy × 4 fractions
        
        OAR CONSTRAINTS (Combined EQD2):
        • Rectum D2cc: < 75 Gy
        • Sigmoid D2cc: < 75 Gy
        • Bladder D2cc: < 80-90 Gy` },
    ]
  },
  {
    id:"c3", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"c3a", title:"Essential Numbers — Cervix BT",
        body:`MUST-KNOW NUMBERS:
        • HR-CTV D90 Target: ≥ 85 Gy EQD2
        • Rectum D2cc Limit: < 75 Gy EQD2
        • Bladder D2cc Limit: < 80-90 Gy EQD2
        • Point A: 2 cm up, 2 cm lateral from fornix
        • HDR Source: Ir-192 (Half-life 74 days, Mean energy 380 keV)` },
    ]
  }
];
