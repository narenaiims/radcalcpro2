import { Section } from "../../types/brachytherapy";

export const breastData: Section[] = [
  {
    id:"b1", icon:"📋", title:"Indications & Selection (APBI)",
    subs:[
      { id:"b1a", title:"ASTRO/ESTRO Selection Criteria",
        body:`ACCELERATED PARTIAL BREAST IRRADIATION (APBI) SELECTION:
        
        SUITABLE GROUP (ASTRO):
        • Age ≥ 50 years
        • Tumour size ≤ 2 cm (T1)
        • Negative margins (≥ 2 mm)
        • No LVSI
        • ER positive
        • Node negative (pN0)
        • Unifocal
        
        CAUTIONARY GROUP:
        • Age 40-49
        • Size 2.1 - 3.0 cm
        • Close margins (< 2 mm)
        • EIC (Extensive Intraductal Component)
        • Pure DCIS
        
        UNSUITABLE:
        • Age < 40
        • Size > 3 cm
        • Positive margins
        • Node positive
        • Multicentric/Multifocal` },
    ]
  },
  {
    id:"b2", icon:"🔧", title:"Techniques & Dose",
    subs:[
      { id:"b2a", title:"Applicator Types — SAVI, MammoSite, Interstitial",
        body:`APBI TECHNIQUES:
        
        1. MULTICATHETER INTERSTITIAL: Gold standard. 15-20 catheters placed in the lumpectomy bed. Best dose homogeneity.
        2. BALLOON BRACHYTHERAPY (MammoSite): Single-channel balloon inflated in the cavity. Simple but less flexible dosimetry.
        3. STRUT-BASED (SAVI): Multi-channel expandable applicator. Allows better OAR sparing (skin/chest wall) than single-channel balloons.` },
      { id:"b2b", title:"Standard Dose Schedules",
        body:`HDR APBI SCHEDULES:
        • 3.4 Gy × 10 fractions (BID, 6h gap) = 34 Gy in 5 days
        • 4.0 Gy × 10 fractions
        • 3.85 Gy × 10 fractions
        
        LDR APBI:
        • 45-50 Gy over 3-5 days (rarely used now)` },
    ]
  }
];
