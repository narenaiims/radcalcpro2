import { Section } from "../../types/brachytherapy";

export const cervixData: Section[] = [
  {
    id:"c1", icon:"🫀", title:"Anatomy & Applicator Systems",
    subs:[
      { id:"c1a", title:"Relevant Anatomy for Cervix BT",
        body:`The uterus is an anteverted, anteflexed muscular organ lying between the bladder (anteriorly) and rectum (posteriorly). The cervix is the lower cylindrical portion, approximately 3–4 cm long and 2.5 cm wide.
        
        KEY ANATOMICAL RELATIONSHIPS:
        • Bladder: lies immediately anterior to the uterus — bladder trigone is at particular risk.
        • Rectum: lies 2–4 cm posterior to the posterior vaginal fornix.
        • Sigmoid colon: lies posterosuperiorly — important in high parametrial disease.
        • Ureters: pass within 1.5 cm of the lateral cervix — parametrial dose must not inadvertently include ureteric segment.
        • Vaginal Fornices: Anterior, posterior, and two lateral. Ovoids/Ring sit here.
        • Uterosacral Ligaments: Posterior support; common site of local extension.
        • Parametria: Lateral support; contains uterine artery and ureter.
        
        VAGINAL ANATOMY & PACKING:
        Vaginal packing (gauze or balloons) is critical to:
        1. Fix the applicator in position (prevent rotation/displacement).
        2. Increase the distance between the source and the bladder/rectum (inverse square law protection).
        3. Flatten the vaginal walls to ensure consistent dosimetry.` },
      { id:"c1b", title:"Types of Intracavitary Applicators",
        body:`Three fundamental applicator systems are used in cervix brachytherapy:
        
        1. TANDEM AND OVOIDS (T&O): The classic system (e.g., Fletcher-Suit-Delclos). A central tandem is flanked by two ovoids in the lateral vaginal fornices. Recreates the classical pear-shaped isodose distribution. Ovoids can have internal shielding (tungsten) to reduce bladder/rectal dose.
        
        2. TANDEM AND RING (T&R): A ring replaces the two ovoids. Advantage: more reproducible geometry, easier MRI-based planning. Used extensively in GEC-ESTRO MRI-guided protocols. Ring angles (30°, 45°, 60°) accommodate different vaginal/uterine tilts.
        
        3. INTERSTITIAL + INTRACAVITARY (Hybrid): Tandem + ring/ovoids PLUS perineal template needles (Utrecht, Venezia, Geneva applicators). Used for bulky, asymmetric or laterally extending disease where intracavitary alone cannot cover the target (HR-CTV D90 ≥85 Gy EQD2).
        
        4. VAGINAL CYLINDER: Used for post-hysterectomy vault (adjuvant) or primary vaginal cancer. Single central channel.
        
        APPLICATOR PHYSICS:
        • Tandem length: 2–8 cm active length.
        • Tandem curvature: 15°, 30°, 45° to match uterine flexion.
        • Ovoid size: Small (2cm), Medium (2.5cm), Large (3cm). Larger ovoids = better depth dose but harder to fit.` },
    ]
  },
  {
    id:"c2", icon:"📐", title:"Dose, Planning & GEC-ESTRO",
    subs:[
      { id:"c2a", title:"Point A vs Volumetric Planning (GEC-ESTRO)",
        body:`POINT A (Classical Dosimetry):
        Defined as 2 cm superior to the lateral vaginal fornix and 2 cm lateral to the uterine tandem. Represents the point where the uterine artery crosses the ureter. Historically the prescription point.
        • Point B: 3 cm lateral to Point A (pelvic wall dose).
        
        VOLUMETRIC PLANNING (Modern Standard - GEC-ESTRO):
        Based on MRI (gold standard) or CT.
        • GTV_BT: Gross tumour volume at time of brachytherapy (T2-weighted MRI).
        • HR-CTV (High-Risk CTV): GTV_BT + entire cervix + any suspicious grey zone on MRI + residual disease at diagnosis. Target D90 ≥ 85-90 Gy EQD2.
        • IR-CTV (Intermediate-Risk CTV): HR-CTV + 5-10 mm margin + initial GTV extent. Target D90 ≥ 60 Gy EQD2.
        
        PLANNING AIMS (EMBRACE II):
        • HR-CTV D90: > 85 Gy (90-95 Gy preferred for bulky T3/T4).
        • HR-CTV V100: > 95%.
        • IR-CTV D90: > 60 Gy.` },
      { id:"c2b", title:"Standard HDR Schedules & Radiobiology",
        body:`HDR SCHEDULES (after EBRT 45-50.4 Gy):
        • 7 Gy × 3 fractions (most common in US/UK).
        • 5.5 Gy × 5 fractions (common in Europe).
        • 6 Gy × 4 fractions.
        • 8 Gy × 2 fractions (rare, high late toxicity risk).
        
        OAR CONSTRAINTS (Combined EQD2 - α/β = 3 Gy):
        • Rectum D2cc: < 65-75 Gy (Fistula risk increases >75 Gy).
        • Sigmoid D2cc: < 70-75 Gy.
        • Bladder D2cc: < 80-90 Gy.
        • Bowel D2cc: < 70-75 Gy.
        
        RADIOBIOLOGY & EQD2:
        EQD2 = D × [(d + α/β) / (2 + α/β)]
        • For Tumor (HR-CTV): α/β = 10 Gy.
        • For OARs (Rectum/Bladder): α/β = 3 Gy.
        • Repair Half-life: ~1.5 hours (important for LDR/PDR).
        • Overall Treatment Time (OTT): Should be < 7-8 weeks total (EBRT + BT) to avoid repopulation loss (~0.5-1 Gy per day delay).` },
      { id:"c2c", title:"Clinical Pearls & Troubleshooting",
        body:`CLINICAL TIPS:
        • Bladder Filling: Empty bladder is preferred during planning to minimize D2cc, but consistent filling (e.g., 50cc) is used in some protocols.
        • Rectal Retractor: Can be used to push rectum away from ovoids.
        • MRI-CT Fusion: If MRI not available for every fraction, fuse Day 1 MRI with subsequent CTs.
        • Tandem Perforation: Suspect if patient has unusual pain or tandem goes "too deep" (>8cm). Stop, image, and consider antibiotics.
        • Bleeding: Usually minor; managed with packing or silver nitrate.
        
        EMBRACE II UPDATES:
        • Encourages use of interstitial needles for HR-CTV > 30cc.
        • Strict OTT control (<50 days).
        • Systematic use of MRI for every fraction if possible.` },
    ]
  },
  {
    id:"c3", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"c3a", title:"Essential Numbers — Cervix BT",
        body:`MUST-KNOW NUMBERS:
        • HR-CTV D90 Target: ≥ 85 Gy EQD2 (α/β=10)
        • Rectum D2cc Limit: < 65-75 Gy EQD2 (α/β=3)
        • Bladder D2cc Limit: < 80-90 Gy EQD2 (α/β=3)
        • Sigmoid D2cc Limit: < 70-75 Gy EQD2 (α/β=3)
        • Point A: 2 cm up, 2 cm lateral from fornix
        • HDR Source: Ir-192 (Half-life 74 days, Mean energy 380 keV)
        • OTT Limit: < 50-56 days
        • α/β (Tumor): 10 Gy | α/β (OAR): 3 Gy
        • Tandem Length: 4-6 cm typically
        • Ovoid Spacing: 0.5-1 cm between ovoids` },
      { id:"c3b", title:"Viva Questions — Cervix BT",
        body:`Q: Define Point A and its clinical significance.
        A: Point A is 2 cm superior to the lateral vaginal fornix and 2 cm lateral to the uterine tandem. It represents where the uterine artery crosses the ureter. Historically, it was the prescription point for Manchester dosimetry, ensuring adequate dose to the paracervical tissues while limiting dose to the ureters.
        
        Q: What are the GEC-ESTRO definitions for HR-CTV and IR-CTV?
        A: HR-CTV (High-Risk CTV) includes the GTV at the time of brachytherapy, the entire cervix, and any suspicious grey zone on T2-MRI. IR-CTV (Intermediate-Risk CTV) includes the HR-CTV plus a 5-10 mm margin and the initial GTV extent at diagnosis.
        
        Q: Why is Overall Treatment Time (OTT) critical in cervix cancer?
        A: Cervix cancer has a high repopulation rate. Delays in completing the combined EBRT and brachytherapy course (ideally <7-8 weeks) lead to a loss of local control, estimated at 0.5-1% per day of delay beyond 55 days.
        
        Q: How does vaginal packing affect OAR doses?
        A: Packing pushes the bladder anteriorly and the rectum posteriorly away from the radioactive sources. Due to the inverse square law, even a few millimetres of extra distance significantly reduces the dose (D2cc) to these critical structures.` },
    ]
  }
];
