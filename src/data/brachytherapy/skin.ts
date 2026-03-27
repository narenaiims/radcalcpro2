import { Section } from "../../types/brachytherapy";

export const skinData: Section[] = [
  {
    id:"s1", icon:"🎯", title:"Indications & Patient Selection",
    subs:[
      { id:"s1a", title:"Indications for Skin BT",
        body:`SKIN BRACHYTHERAPY INDICATIONS

• Curative intent: Small, superficial, non-melanoma skin cancers (BCC, SCC) where surgery is difficult or cosmetically unacceptable.
• Palliative intent: Symptomatic skin metastases (e.g., painful, bleeding, fungating lesions).
• Benign conditions: Keloids (post-excision), pterygium (eye).

KEY CONSIDERATIONS FOR PATIENT SELECTION:
• Tumour size and depth: Ideal for superficial lesions (<5 mm depth).
• Location: Face (nose, ears, eyelids), scalp, trunk, extremities. Avoidance of critical structures (eye, cartilage).
• Tumour histology: Basal Cell Carcinoma (BCC), Squamous Cell Carcinoma (SCC), Actinic Keratosis (AK), superficial metastases.
• Patient factors: Co-morbidities, ability to tolerate procedure, cosmetic outcome expectations.
• Previous treatment: Prior RT to the area may limit dose or preclude re-treatment.` },
      { id:"s1b", title:"Contraindications",
        body:`CONTRAINDICATIONS FOR SKIN BRACHYTHERAPY:

• Deep tumours (>5 mm depth): require interstitial or EBRT.
• Melanoma: BT generally not indicated due to risk of incomplete coverage and poor outcomes.
• Nodular BCC/SCC: may require higher doses or different techniques.
• Extensive tumours: large surface area or multiple lesions may be better treated with surgery or systemic therapy.
• Critical structure proximity: tumours very close to the eye globe, optic nerve, or major salivary glands may require alternative approaches.
• Poor patient compliance: inability to attend fractionated treatment sessions.
• Active infection at the treatment site.` },
    ]
  },
  {
    id:"s2", icon:"🔧", title:"Applicators & Techniques",
    subs:[
      { id:"s2a", title:"Valencia vs. Leipzig Applicators",
        body:`APPLICATOR SELECTION IS CRITICAL FOR DOSE HOMOGENEITY:

1. VALENCIA APPLICATOR:
   • Design: Flat, circular, with a central groove for the Ir-192 source.
   • Dose distribution: Produces a uniform, flat isodose surface parallel to the applicator face.
   • Ideal for: Flat or gently curved surfaces (e.g., cheek, forehead, trunk, scalp).
   • Field sizes: Available in 2 cm and 3 cm diameters.

2. LEIPZIG APPLICATOR:
   • Design: Conical shape with angled source path.
   • Dose distribution: Asymmetric, conforming better to curved and concave surfaces.
   • Ideal for: Nasal ala, ear concha, inner canthus, other complex contours.
   • Field sizes: Available in 2 cm and 3 cm diameters.

CHOICE DEPENDS ON ANATOMY:
• Flat/convex surfaces → Valencia
• Concave/complex surfaces → Leipzig

BOLUS IS ESSENTIAL FOR CONCAVE SURFACES:
• An air gap between applicator and skin dramatically reduces surface dose (inverse square law).
• Use tissue-equivalent bolus (e.g., saline-filled glove, Aquaplast) to fill air gaps with Leipzig applicator on concave sites.` },
      { id:"s2b", title:"Surface Moulds & Other Techniques",
        body:`OTHER SKIN BRACHYTHERAPY TECHNIQUES:

1. CUSTOM MOULDS:
   • Used for irregular or large surface areas where standard applicators are insufficient.
   • Fabricated from thermoplastic materials (e.g., Aquaplast) or silicone.
   • Catheters are embedded within the mould to deliver dose precisely to the target volume.
   • Examples: Post-excision keloids, large facial lesions.

2. HAM APPLICATOR (Historical):
   • A rigid, custom-made applicator for specific sites like the ear.

3. INTERSTITIAL NEEDLES (Rare for skin):
   • May be used for very thick lesions or when combined with intracavitary components.

4. HDR MONOTHERAPY VS FRACTIONATED:
   • Most skin BT uses fractionated HDR (e.g., 6 Gy × 3, 3.5 Gy × 10).
   • Single fraction HDR (e.g., 15–20 Gy) may be used for very superficial palliative lesions.` },
    ]
  },
  {
    id:"s3", icon:"📐", title:"Dose, Planning & Toxicity",
    subs:[
      { id:"s3a", title:"Dose Schedules & Prescription",
        body:`STANDARD HDR DOSE SCHEDULES FOR SKIN BT:

• 6 Gy × 3 fractions (Total 18 Gy): Common for BCC, SCC, palliative lesions.
• 3.5 Gy × 10 fractions (Total 35 Gy): For more sensitive areas (e.g., ear, nose, eyelid) or higher risk lesions.
• 3 Gy × 15 fractions (Total 45 Gy): Alternative for sensitive areas.
• 7 Gy × 2 fractions: For palliative relief of bleeding/pain.

PRESCRIPTION DOSE:
• Typically prescribed to the skin surface (0 mm depth).
• For thicker lesions or lesions requiring dose at depth, prescription may be at 3 mm or 5 mm depth.
• Use of bolus material necessitates careful dose prescription and verification.

PLANNING CONSIDERATIONS:
• Accurate applicator placement and fixation are crucial.
• Use of CT or MRI for complex cases to define tumour depth and OARs.
• Dose homogeneity: Aim for V100 ≥ 90% of target volume.
• OAR Sparing: Critical for eye, cartilage, and cosmetic outcome.` },
      { id:"s3b", title:"Toxicity Profile & Management",
        body:`ACUTE TOXICITY (during and up to 6 weeks post-treatment):
• Erythema & Dry Desquamation: Common (Grade 1–2). Manage with emollients (e.g., Aquaphor, Vaseline).
• Moist Desquamation: Can occur with higher doses or sensitive sites. Manage with non-adherent dressings (e.g., Mepitel) and barrier creams.
• Pain/Discomfort: Usually mild, managed with analgesics.
• Oedema: Particularly around the eye or ear.

LATE TOXICITY:
• Telangiectasia: Dilated small blood vessels, common with higher doses. Manage cosmetically if bothersome.
• Hypopigmentation/Hyperpigmentation: Changes in skin colour.
• Fibrosis/Scarring: Can occur with higher doses or if moist desquamation is severe.
• Cartilage damage (ears, nose): Can lead to chondritis or necrosis if dose limits exceeded (>50 Gy EQD2).
• Cataract formation: If lens receives >5–10 Gy (risk with eyelid treatments).
• Alopecia: Hair loss if scalp is treated.

MANAGEMENT STRATEGIES:
• Patient education: Explain expected side effects and management.
• Topical care: Emollients, barrier creams, appropriate dressings.
• Analgesia: Paracetamol, NSAIDs, or stronger agents if needed.
• OAR Protection: Lead shields for eyes, careful applicator placement to spare cartilage.
• Dose constraints: Adhere to established dose limits for critical structures.` },
    ]
  },
  {
    id:"s4", icon:"🎯", title:"Key Numbers & Viva",
    subs:[
      { id:"s4a", title:"Essential Numbers — Skin BT",
        body:`MUST-KNOW NUMBERS:

• Valencia Schedule: 6 Gy × 3 fractions (18 Gy total) — common for BCC/SCC.
• Sensitive Site Schedule: 3.5 Gy × 10 fractions (35 Gy total) — for nose, ear, eyelid.
• Prescription Depth: Usually skin surface (0 mm).
• Max Dose to Cartilage: ~50 Gy EQD2 (risk of chondritis).
• Max Dose to Lens: >5–10 Gy (risk of cataract).
• Bolus Use: Essential for concave surfaces with Leipzig applicator to prevent surface dose fall-off.
• Tumour Depth: Ideal BT target <5 mm.` },
      { id:"s4b", title:"Viva Questions — Skin BT",
        body:`Q: When would you choose a Valencia applicator over a Leipzig applicator?
A: Valencia is for flat or gently curved surfaces (cheek, forehead). Leipzig is for concave or complex contours (nasal ala, ear concha).

Q: What is the main concern with treating the nose or ear, and how is it managed?
A: Cartilage damage. Use sensitive site schedules (e.g., 3.5 Gy × 10) and ensure applicator fits snugly, potentially with bolus, to deliver dose accurately without overdosing cartilage.

Q: Why is bolus important in skin brachytherapy?
A: It fills air gaps on curved/concave surfaces, ensuring the prescribed surface dose is delivered accurately. Without bolus, the inverse square law causes a significant dose fall-off on the skin surface.

Q: What are the key differences between Valencia and Leipzig applicators?
A: Valencia is flat and produces a uniform planar dose. Leipzig is conical and better conforms to curved/concave surfaces, allowing for asymmetric dose shaping.

Q: What is the typical dose for palliative skin palliation?
A: Often a single fraction of 15–20 Gy, or 7 Gy × 2 fractions.` },
    ]
  },
];
