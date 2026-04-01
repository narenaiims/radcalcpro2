import { Section } from "../../types/brachytherapy";

export const breastData: Section[] = [
  {
    id:"b1", icon:"📋", title:"Indications & Selection (APBI)",
    subs:[
      { id:"b1a", title:"ASTRO/ESTRO Selection Criteria",
        body:`ACCELERATED PARTIAL BREAST IRRADIATION (APBI) SELECTION:
        
        SUITABLE GROUP (ASTRO 2017):
        • Age ≥ 50 years
        • Tumour size ≤ 2 cm (T1)
        • Negative margins (≥ 2 mm)
        • No LVSI
        • ER positive
        • Node negative (pN0)
        • Unifocal
        • Pure DCIS (low/intermediate grade, ≤ 2.5 cm)
        
        CAUTIONARY GROUP:
        • Age 40-49
        • Size 2.1 - 3.0 cm
        • Close margins (< 2 mm)
        • EIC (Extensive Intraductal Component)
        • Pure DCIS (high grade or > 2.5 cm)
        • Focal LVSI
        • Invasive Lobular Carcinoma (ILC)
        
        UNSUITABLE:
        • Age < 40
        • Size > 3 cm
        • Positive margins
        • Node positive (pN1+)
        • Multicentric/Multifocal
        • Extensive LVSI
        • Neoadjuvant chemotherapy (NACT) patients` },
      { id:"b1b", title:"Evidence Base — Key Trials",
        body:`APBI EVIDENCE SUMMARY:
        
        1. GEC-ESTRO (Strnad, Lancet 2016):
           • Multicatheter interstitial APBI vs WBI (50 Gy + boost).
           • 5-year LRR: 1.4% APBI vs 0.9% WBI (non-inferior).
           • Toxicity: significantly lower with APBI.
        
        2. IMPORT LOW (Coles, Lancet 2017):
           • Partial breast EBRT vs WBI.
           • Non-inferior local control; better cosmetic outcomes.
        
        3. NSABP B-39 / RTOG 0413 (Vicini, Lancet 2019):
           • APBI (various techniques) vs WBI.
           • 10-year LRR: 4.6% APBI vs 3.9% WBI.
           • Failed to meet strict non-inferiority criteria but absolute difference small.
        
        4. Florence Trial (Livi, JCO 2015):
           • IMRT-APBI (30 Gy/5#) vs WBI.
           • 5-year LRR: 1.5% in both arms.
           • Significantly better QoL and cosmesis with APBI.` },
    ]
  },
  {
    id:"b2", icon:"🔧", title:"Techniques & Dose",
    subs:[
      { id:"b2a", title:"Applicator Types — SAVI, MammoSite, Interstitial",
        body:`APBI TECHNIQUES & PHYSICS:
        
        1. MULTICATHETER INTERSTITIAL:
           • Gold standard for dose homogeneity.
           • 15-20 catheters placed in the lumpectomy bed (perineal template or freehand).
           • Allows dose shaping to spare skin and chest wall.
        
        2. BALLOON BRACHYTHERAPY (MammoSite):
           • Single-channel balloon inflated in the cavity.
           • Simple but less flexible dosimetry (symmetric dose).
           • Requires minimum 7mm skin distance to avoid necrosis.
        
        3. STRUT-BASED (SAVI):
           • Multi-channel expandable applicator (6, 8, or 10 struts).
           • Allows better OAR sparing (skin/chest wall) than single-channel balloons through differential loading.
        
        4. CONTURA:
           • Multi-lumen balloon (5 lumens).
           • Allows vacuum suction of seroma/air gaps.` },
      { id:"b2b", title:"Standard Dose Schedules & Constraints",
        body:`HDR APBI SCHEDULES:
        • 3.4 Gy × 10 fractions (BID, 6h gap) = 34 Gy in 5 days (Standard).
        • 4.0 Gy × 10 fractions (Common for SAVI/MammoSite).
        • 3.85 Gy × 10 fractions (RTOG 0413 schedule).
        • 6.0 Gy × 5 fractions (Daily or BID - emerging).
        
        OAR CONSTRAINTS (HDR):
        • Skin Surface: < 100% of prescription (Dmax < 125%).
        • Chest Wall / Ribs: < 100-125% of prescription.
        • Lung: V30 < 10%.
        • Heart: V5 < 5% (left-sided).
        
        PLANNING AIMS:
        • V100 (PTV): > 90-95%.
        • V150: < 50-60cc.
        • V200: < 10-20cc.
        • Symmetry Index: < 2.0 (for balloons).` },
      { id:"b2c", title:"Clinical Pearls & Troubleshooting",
        body:`CLINICAL TIPS:
        • Skin Distance: Measure skin-to-applicator distance with ultrasound or CT. < 7mm = high risk of skin telangiectasia/necrosis.
        • Seroma Management: Air or fluid (seroma) around the applicator causes "cold spots". Use vacuum suction (SAVI/Contura) or re-inflate balloon.
        • BID Timing: Minimum 6-hour gap between fractions is mandatory for normal tissue repair (α/β ≈ 3 Gy).
        • Infection: Prophylactic antibiotics (e.g., Cephalexin) often used during treatment.
        • Cosmetic Outcome: Correlates strongly with V150 and V200 volumes. Keep "hot spots" small and away from the skin.` },
    ]
  },
  {
    id:"b3", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"s3a", title:"Essential Numbers — Breast BT",
        body:`MUST-KNOW NUMBERS:
        • Standard APBI Dose: 3.4 Gy × 10 (34 Gy) BID.
        • Minimum Skin Distance: 7 mm (for balloons/SAVI).
        • BID Gap: ≥ 6 hours.
        • α/β (Breast Cancer): 4 Gy.
        • α/β (Late Fibrosis): 3 Gy.
        • GEC-ESTRO Suitable Age: ≥ 50 years.
        • Max Tumor Size: 2 cm (T1).
        • Margin Requirement: ≥ 2 mm.
        • OTT Limit: 5 days for 10-fraction APBI.` },
      { id:"s3b", title:"Viva Questions — Breast BT",
        body:`Q: What are the advantages of multicatheter interstitial APBI over balloon-based techniques?
        A: Multicatheter interstitial brachytherapy offers superior dose homogeneity and the ability to shape the dose distribution (IPSA) to spare critical structures like the skin and chest wall. It is the only technique with long-term (10+ year) non-inferiority data (GEC-ESTRO).
        
        Q: How do you manage an air gap of 3mm between the balloon and the lumpectomy cavity wall?
        A: An air gap > 10% of the PTV surface or > 3mm is generally unacceptable as it leads to significant underdosing of the target. Management includes: 1. Re-inflating the balloon, 2. Using vacuum suction (if available), or 3. Replacing the applicator.
        
        Q: Why is the 6-hour gap between BID fractions critical?
        A: The 6-hour gap allows for the repair of sublethal radiation damage in normal tissues (e.g., skin, chest wall, lung), which have a low α/β ratio (~3 Gy). Shortening this gap increases the risk of late toxicity (fibrosis, telangiectasia).
        
        Q: What did the GEC-ESTRO trial conclude?
        A: The GEC-ESTRO trial (Strnad et al.) showed that multicatheter interstitial APBI is non-inferior to whole breast irradiation (WBI) in terms of 5-year local recurrence rates (1.4% vs 0.9%) for low-risk patients, with significantly lower toxicity.` },
    ]
  }
];
