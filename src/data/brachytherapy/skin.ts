import { Section } from "../../types/brachytherapy";

export const skinData: Section[] = [
  {
    id:"s1", icon:"🎯", title:"Indications & Patient Selection",
    subs:[
      { id:"s1a", title:"Indications for Skin BT",
        body:`SKIN BRACHYTHERAPY INDICATIONS
        
        • Curative intent: Small, superficial, non-melanoma skin cancers (BCC, SCC) where surgery is difficult or cosmetically unacceptable (e.g., nose, eyelid, ear).
        • Adjuvant intent: Post-excision of high-risk lesions (close/positive margins, perineural invasion).
        • Palliative intent: Symptomatic skin metastases (e.g., painful, bleeding, fungating lesions from breast, lung, or melanoma).
        • Benign conditions: Keloids (post-excision within 24-48 hours), pterygium (eye).
        
        KEY CONSIDERATIONS FOR PATIENT SELECTION:
        • Tumour size and depth: Ideal for superficial lesions (<5 mm depth). Beyond 5mm, dose fall-off is too rapid for safe coverage without overdosing the surface.
        • Location: Face (nose, ears, eyelids), scalp, trunk, extremities. Avoidance of critical structures (eye, cartilage).
        • Tumour histology: Basal Cell Carcinoma (BCC), Squamous Cell Carcinoma (SCC), Actinic Keratosis (AK), superficial metastases.
        • Patient factors: Co-morbidities (anticoagulation makes surgery risky), ability to tolerate procedure, cosmetic outcome expectations.
        • Previous treatment: Prior RT to the area may limit dose or preclude re-treatment (re-irradiation possible with small fields).` },
      { id:"s1b", title:"Contraindications & Limitations",
        body:`CONTRAINDICATIONS FOR SKIN BRACHYTHERAPY:
        
        • Deep tumours (>5 mm depth): require interstitial needles or megavoltage EBRT/Electrons.
        • Bone/Cartilage Invasion: T3/T4 lesions usually require surgery or wider-field EBRT.
        • Melanoma: Primary treatment is surgical. BT only for palliation of metastases.
        • Morpheaform/Sclerosing BCC: High risk of subclinical extension; requires wider margins (EBRT/Surgery preferred).
        • Poorly defined borders: Difficult to ensure adequate coverage with small applicators.
        • Recurrent disease in prior RT field: Relative contraindication; requires specialist planning.
        
        LIMITATIONS:
        • Field size: Standard applicators (Valencia/Leipzig) limited to 2–3 cm diameter.
        • Surface curvature: Extreme curvature (e.g., tip of nose) may cause air gaps and "cold spots".` },
    ]
  },
  {
    id:"s2", icon:"🔧", title:"Applicators & Techniques",
    subs:[
      { id:"s2a", title:"Valencia vs. Leipzig Applicators",
        body:`APPLICATOR SELECTION IS CRITICAL FOR DOSE HOMOGENEITY:
        
        1. VALENCIA APPLICATOR:
           • Design: Flat, circular, with a central groove for the Ir-192 source. Includes a flattening filter (tungsten).
           • Dose distribution: Produces a uniform, flat isodose surface parallel to the applicator face.
           • Ideal for: Flat or gently curved surfaces (e.g., cheek, forehead, trunk, scalp).
           • Field sizes: Available in 2 cm and 3 cm diameters.
        
        2. LEIPZIG APPLICATOR:
           • Design: Conical shape with angled source path. No flattening filter.
           • Dose distribution: Asymmetric, higher dose centrally. Conforms better to curved and concave surfaces.
           • Ideal for: Nasal ala, ear concha, inner canthus, other complex contours.
           • Field sizes: Available in 1 cm, 2 cm, and 3 cm diameters.
        
        CHOICE DEPENDS ON ANATOMY:
        • Flat/convex surfaces → Valencia (better homogeneity).
        • Concave/complex surfaces → Leipzig (better fit).
        
        BOLUS & AIR GAPS:
        • An air gap between applicator and skin dramatically reduces surface dose (inverse square law).
        • 1mm air gap = ~10% dose reduction.
        • Use tissue-equivalent bolus (e.g., Superflab, saline-filled glove) to fill air gaps with Leipzig applicator on concave sites.` },
      { id:"s2b", title:"Surface Moulds & Interstitial",
        body:`OTHER SKIN BRACHYTHERAPY TECHNIQUES:
        
        1. CUSTOM MOULDS (Surface Brachytherapy):
           • Used for irregular or large surface areas (e.g., entire scalp, large facial lesions).
           • Fabricated from thermoplastic materials (Aquaplast) or silicone (Moulage).
           • Catheters are embedded within the mould (typically 1cm spacing).
           • Standoff (0.5–1cm) is often used to improve depth dose and surface homogeneity.
        
        2. INTERSTITIAL BRACHYTHERAPY:
           • Used for thick lesions (>5mm) or those involving deep structures.
           • Plastic catheters or stainless steel needles inserted directly into the tumor.
           • Paris System or IPSA (Inverse Planning) used for dosimetry.
        
        3. ELECTRONIC BRACHYTHERAPY (e.g., Xoft):
           • Uses miniature X-ray source (50 kV) instead of Ir-192.
           • No radioactive source handling; less shielding required.
           • Similar clinical outcomes to HDR for superficial lesions.` },
    ]
  },
  {
    id:"s3", icon:"📐", title:"Dose, Planning & Toxicity",
    subs:[
      { id:"s3a", title:"Dose Schedules & Prescription",
        body:`STANDARD HDR DOSE SCHEDULES FOR SKIN BT:
        
        • 6 Gy × 6 fractions (Total 36 Gy): Common for BCC/SCC (standard fractionation).
        • 7 Gy × 5 fractions (Total 35 Gy): Slightly more hypofractionated.
        • 4 Gy × 10 fractions (Total 40 Gy): For sensitive areas (e.g., ear, nose, eyelid) or large fields.
        • 3 Gy × 15 fractions (Total 45 Gy): Maximum fractionation for best cosmetic outcome.
        • 8 Gy × 1 fraction: Palliative for bleeding/pain.
        
        PRESCRIPTION DEPTH:
        • Standard: 3 mm or 5 mm depth (depending on tumor thickness on ultrasound/CT).
        • Surface prescription (0 mm) is rare as it underdoses the tumor base.
        
        PLANNING CONSTRAINTS:
        • V100 (Target): > 95%.
        • Dmax (Surface): < 125–140% of prescription.
        • Cartilage Dmax: < 100% of prescription (if possible).
        
        RADIOBIOLOGY (α/β):
        • Skin Cancer: 10 Gy.
        • Late Skin Effects (Telangiectasia/Fibrosis): 3 Gy.
        • Cartilage: 2 Gy.` },
      { id:"s3b", title:"Toxicity Profile & Management",
        body:`ACUTE TOXICITY (0–6 weeks):
        • Erythema & Dry Desquamation: Universal (Grade 1–2). Manage with aqueous cream or aloe vera.
        • Moist Desquamation: Occurs if surface dose > 40-50 Gy. Manage with non-adherent dressings (Mepitel) and saline soaks.
        • Pain: Usually mild; managed with paracetamol.
        
        LATE TOXICITY (6 months+):
        • Telangiectasia: Very common (30-50%). Cosmetic issue only.
        • Hypopigmentation: "White patch" at treatment site.
        • Fibrosis: Skin thickening/tightness.
        • Chondritis/Necrosis: Risk if cartilage dose > 50 Gy EQD2. Presents as painful, non-healing ulcer over ear/nose.
        • Ectropion: Eyelid pulling if treated near the lid margin.
        
        COSMETIC OUTCOME:
        • Excellent/Good in >90% of cases if fractionation is respected (dose per fraction < 6-7 Gy).
        • Poor outcomes associated with large fractions (>7 Gy) or large treatment areas.` },
    ]
  },
  {
    id:"s4", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"s4a", title:"Essential Numbers — Skin BT",
        body:`MUST-KNOW NUMBERS:
        • Prescription Depth: 3 mm (standard) or 5 mm.
        • Max Tumor Thickness: 5 mm for surface applicators.
        • Air Gap Penalty: 1 mm gap ≈ 10% dose loss.
        • Standard Schedule: 6 Gy × 6 (36 Gy) or 4 Gy × 10 (40 Gy).
        • α/β (Tumor): 10 Gy | α/β (Late Skin): 3 Gy.
        • Valencia Sizes: 2 cm, 3 cm.
        • Leipzig Sizes: 1 cm, 2 cm, 3 cm.
        • Keloid Dose: 6 Gy × 3 or 10-12 Gy × 1 (within 24h of surgery).` },
      { id:"s4b", title:"Viva Questions — Skin BT",
        body:`Q: Why is the Valencia applicator preferred over the Leipzig for flat lesions?
        A: The Valencia applicator contains a tungsten flattening filter that ensures a uniform dose distribution across the treatment field. The Leipzig applicator lacks this, resulting in a more "peaked" dose distribution that is less homogeneous for flat surfaces.
        
        Q: How do you manage a lesion that is 7 mm thick?
        A: A 7 mm lesion is too thick for standard surface applicators (Valencia/Leipzig) because the dose fall-off would result in either underdosing the base or severely overdosing the surface. Options include: 1. Interstitial brachytherapy (needles), 2. Electron beam therapy with appropriate bolus, or 3. Surgical excision.
        
        Q: What is the "Inverse Square Law" impact in skin brachytherapy?
        A: Because the source is very close to the skin (SSD ~2-3 cm), small changes in distance (air gaps) lead to large changes in dose. A 1 mm air gap can reduce the surface dose by ~10%. This is why firm applicator contact and/or bolus is critical.
        
        Q: When should keloids be treated with brachytherapy?
        A: Keloids should be treated as soon as possible after surgical excision, ideally within 24 hours (and no later than 48-72 hours), while the fibroblasts are most active and sensitive to radiation.` },
    ]
  },
];
