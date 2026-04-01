import { Section } from "../../types/brachytherapy";

export const rectumData: Section[] = [
  {
    id: "r1", icon: "🎯", title: "Indications & Patient Selection",
    subs: [
      {
        id: "r1a", title: "When to Use Rectal Brachytherapy?",
        body: `PRIMARY TREATMENT (T1-T2 N0):
• Small, well-differentiated tumors (<3 cm)
• Distal or mid-rectum (within 10-12 cm of anal verge)
• High local control (90%+) with organ preservation
• Alternative to radical surgery (APR / LAR)
• Papillon Technique (Contact X-ray):
  - 50 kV X-rays, 3 cm SSD
  - 30 Gy per fraction, 3-4 fractions
  - Excellent for T1-T2 distal tumors

BOOST AFTER EBRT (T3):
• Pre-operative EBRT (45-50.4 Gy) + Brachytherapy boost
• Improved pathological complete response (pCR) rates
• Facilitates sphincter-preserving surgery

PALLIATIVE:
• Bleeding or obstruction control in advanced disease
• Recurrent disease after previous EBRT (salvage)`
      },
      {
        id: "r1b", title: "Contraindications & Limitations",
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
    id: "r2", icon: "🛠️", title: "Applicator Systems & Technique",
    subs: [
      {
        id: "r2a", title: "Endorectal HDR Applicator",
        body: `TECHNIQUE:
• Performed under general or spinal anaesthesia
• Patient in lithotomy or prone position
• Endorectal applicator (e.g., Papillon or HDR applicator) inserted
• Source steps along central channel or multiple channels
• Papillon (Contact X-ray) vs HDR:
  - Papillon: Low energy (50 kV), very rapid fall-off, no shielding needed
  - HDR: Ir-192, requires shielding, more flexible dosimetry

GEOMETRY:
• Active length covers the tumor + 1-2 cm margins
• Centering bougie or balloon used to ensure lumen centering`
      },
      {
        id: "r2b", title: "Planning & Dosimetry",
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
    id: "r3", icon: "📈", title: "Dose Schedules & Toxicity",
    subs: [
      {
        id: "r3a", title: "Standard Dose Schedules",
        body: `BOOST AFTER EBRT (45-50 Gy):
• HDR: 15 Gy in 3 fractions (5 Gy/fx)
• HDR: 20 Gy in 4 fractions (5 Gy/fx)
• LDR: 15-20 Gy at 0.4-0.6 Gy/hr

PRIMARY TREATMENT (T1-T2):
• HDR: 30-35 Gy in 6-7 fractions
• LDR: 60-65 Gy total dose`
      },
      {
        id: "r3b", title: "Toxicity & OAR Constraints",
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
    id: "r4", icon: "🔢", title: "Key Numbers & Viva Prep",
    subs: [
      {
        id: "r4a", title: "Essential Numbers for Viva",
        body: `• Needle Spacing: 10-15 mm (Paris System)
• Rx Isodose: 85% of basal dose
• Boost Dose: 15-20 Gy
• Local Control (T1-T2): ~90%
• Sphincter Preservation: >80%
• Margin: 1-2 cm longitudinal, 5-10 mm radial
• Papillon Dose: 30 Gy x 3-4 fractions (Contact X-ray)
• HDR Boost: 15-20 Gy after 45-50 Gy EBRT`
      },
      {
        id: "r4b", title: "Common Viva Questions",
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
