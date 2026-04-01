import { Section } from "../../types/brachytherapy";

export const analData: Section[] = [
  {
    id: "a1", icon: "🎯", title: "Indications & Patient Selection",
    subs: [
      {
        id: "a1a", title: "When to Use Anal Brachytherapy?",
        body: `PRIMARY TREATMENT (T1-T2 SCC):
• Small lesions (<2 cm) without nodal involvement (N0)
• High local control rates (90%+) with sphincter preservation
• Alternative to EBRT for very early stage disease

BOOST AFTER EBRT (T2-T3):
• Standard of care in many European centres (Paris System)
• Typically 45-50.4 Gy EBRT + 15-20 Gy Brachytherapy boost
• Improved local control compared to EBRT alone in some series
• ACT II trial context: Standard chemo-RT (5-FU/MMC) is base

SALVAGE / RECURRENCE:
• Carefully selected local recurrences without distant spread
• Must consider previous dose to OARs (rectum, small bowel)
• Often requires specialized interstitial expertise

PALLIATIVE:
• Bleeding or pain control in advanced disease
• Recurrent disease after previous EBRT (salvage)`
      },
      {
        id: "a1b", title: "Contraindications & Limitations",
        body: `ABSOLUTE:
• T4 disease (invasion of prostate, vagina, or bone)
• Extensive nodal involvement (N1-N3) — requires EBRT
• Poor performance status (unable to tolerate anaesthesia/procedure)
• Active inflammatory bowel disease (IBD)

RELATIVE:
• Large T3 lesions (>5 cm) — risk of necrosis
• Circumferential involvement (>50% of circumference)
• Significant sphincter dysfunction pre-treatment`
      }
    ]
  },
  {
    id: "a2", icon: "🛠️", title: "Applicator Systems & Technique",
    subs: [
      {
        id: "a2a", title: "Interstitial Brachytherapy (Paris System)",
        body: `TECHNIQUE:
• Performed under general or spinal anaesthesia
• Patient in lithotomy position
• Plastic tubes or stainless steel needles inserted into the tumor
• 10-15 mm spacing between needles (Paris System rules)
• Template-based (e.g., MUPIT) or free-hand insertion
• MUPIT (Martínez Universal Perineal Interstitial Template):
  - Allows for fixed geometry and reproducible dosimetry
  - Useful for larger tumors or those with vaginal extension

GEOMETRY:
• Parallel needles forming a volume or plane
• Active length covers the tumor + 1-2 cm margins
• Rectal finger used to guide insertion and protect the opposite wall`
      },
      {
        id: "a2b", title: "Planning & Dosimetry",
        body: `PLANNING:
• CT or MRI-based planning is now standard
• GTV: Gross tumor volume at the time of brachytherapy
• CTV: GTV + 5-10 mm margin
• PTV: Typically same as CTV (no setup margin needed for brachy)

DOSE SPECIFICATION:
• Prescribed to the 85% isodose (Paris System)
• HDR: 15-20 Gy in 3-4 fractions (boost)
• LDR: 15-20 Gy (rarely used now)`
      }
    ]
  },
  {
    id: "a3", icon: "📈", title: "Dose Schedules & Toxicity",
    subs: [
      {
        id: "a3a", title: "Standard Dose Schedules",
        body: `BOOST AFTER EBRT (45-50 Gy):
• HDR: 15 Gy in 3 fractions (5 Gy/fx)
• HDR: 20 Gy in 4 fractions (5 Gy/fx)
• LDR: 15-20 Gy at 0.4-0.6 Gy/hr

PRIMARY TREATMENT (T1-T2):
• HDR: 30-35 Gy in 6-7 fractions
• LDR: 60-65 Gy total dose`
      },
      {
        id: "a3b", title: "Toxicity & OAR Constraints",
        body: `ACUTE TOXICITY:
• Perianal skin reaction (moist desquamation)
• Pain, tenesmus, urgency
• Dysuria (if needles near urethra)

LATE TOXICITY:
• Anal stenosis (risk increases with circumferential dose)
• Sphincter dysfunction (incontinence)
• Rectal / Anal necrosis (rare if Paris rules followed)
• Telangiectasia and bleeding

OAR CONSTRAINTS:
• Rectal wall: D2cc < 70-75 Gy (EQD2)
• Sphincter: Minimize high-dose volume`
      }
    ]
  },
  {
    id: "a4", icon: "🔢", title: "Key Numbers & Viva Prep",
    subs: [
      {
        id: "a4a", title: "Essential Numbers for Viva",
        body: `• Needle Spacing: 10-15 mm (Paris System)
• Rx Isodose: 85% of basal dose
• Boost Dose: 15-20 Gy
• Local Control (T1-T2): ~90%
• Sphincter Preservation: >80%
• Margin: 1-2 cm longitudinal, 5-10 mm radial
• Paris System Rules:
  1. Sources must be parallel
  2. Sources must be equidistant
  3. Source centers must be in the same plane
  4. Linear activity must be uniform
  5. Dose specified at 85% of basal dose (mean of mid-point doses)`
      },
      {
        id: "a4b", title: "Common Viva Questions",
        body: `Q: What are the Paris System rules for anal brachytherapy?
A: Parallel needles, equidistant spacing, linear source distribution, and dose specified at 85% of basal dose.

Q: How do you manage a patient with T3 anal SCC?
A: Usually EBRT + Concurrent Chemotherapy (Mitomycin C + 5-FU). Brachytherapy boost can be considered if the tumor shrinks significantly (<5 cm).

Q: What is the risk of circumferential brachytherapy?
A: High risk of anal stenosis and stricture formation. Limit dose to <50% of the circumference if possible.`
      }
    ]
  }
];
