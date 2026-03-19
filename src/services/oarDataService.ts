/**
 * OAR Constraint Reference - Data Architecture & Clinical Engine
 * Flagship Page: Residency Training App
 */

// --- SECTION A: EXPANDED INTERFACES ---

export type FractionationRegime = 
  | 'conventional'    // 1.8–2.0 Gy/fx
  | 'moderate_hypo'   // 2.5–3.5 Gy/fx (breast, prostate)
  | 'extreme_hypo'    // 4–8 Gy/fx (CHRT lung, cervix)
  | 'SBRT_lung'       // 3–5 fx (RTOG 0236, 0813, 0915)
  | 'SBRT_spine'      // 1–5 fx (RTOG 0631)
  | 'SBRT_liver'      // 3–6 fx
  | 'SBRT_prostate'   // 5 fx (PACE-B, HYPO-RT)
  | 'SRS'             // single fraction
  | 'SRS_fractionated'; // 3–5 fx

export type Region = 'Thorax' | 'Pelvis' | 'CNS' | 'HeadAndNeck' | 'Abdomen' | 'Spine_SBRT';

export type EvidenceLevel = 
  | 'Level_1A'   // RCT meta-analysis (QUANTEC, EBCTCG, PARSPORT)
  | 'Level_1B'   // Single RCT (RTOG 0933, PACE-B)
  | 'Level_2A'   // Systematic review of cohorts
  | 'Level_2B'   // Single prospective cohort
  | 'Level_3'    // Retrospective / consensus (most SBRT constraints)
  | 'Expert';    // Expert consensus (AAPM TG guidelines)

export interface Constraint {
  metric: string;           // e.g. "V20Gy", "Dmax", "Dmean", "D2cc"
  metricType: 'Dmax' | 'Dmean' | 'Vxx' | 'Dxx' | 'D2cc' | 'absolute_volume';
  limit: number;            // numeric value
  unit: 'Gy' | 'cGy' | '%' | 'cc';
  regime: FractionationRegime[];  // which regimes this applies to
  alphaBeta: number;        // Gy, for EQD2 scaling
  priority: 'Absolute' | 'Hard' | 'Soft' | 'Goal';
  evidenceLevel: EvidenceLevel;
  toxicityEndpoint?: string;
  toxicityGrade?: 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 2';
  tdxx?: { td5: number; td50: number };  // Emami TD5/5 and TD50/5 where known
  ntcpAtLimit?: number;     // % NTCP at the stated limit
  source?: string[];         // e.g. ["QUANTEC 2010", "RTOG 0826", "AAPM TG-101"]
  notes?: string;           // clinical caveats
  chemoModifier?: string;   // e.g. "Reduce by 30% with concurrent cisplatin"
  reirradiation?: string;   // specific guidance for re-RT cumulative dose
  pediatric?: string;       // modification for pediatric patients
}

export interface OARData {
  id: string;
  name: string;
  region: Region;
  subregion?: string;       // e.g. 'Cardiac Substructures' under Thorax
  type: 'Serial' | 'Parallel' | 'Mixed';
  serialUnits?: string;     // e.g. "Functional units arranged end-to-end"
  parallelUnits?: string;
  fsvd?: number;            // Functional Sub-unit volume (cc) where known
  organFunction: string;    // what it does clinically
  whyItMatters: string;     // why radiation oncologists care
  constraints: Constraint[];
  ntcpModel?: {
    type: 'LKB' | 'logistic' | 'relative_seriality';
    n: number; m: number; TD50: number;  // LKB parameters
  };
  clinicalPearls: string[];   // 2–3 high-yield teaching points
  imagingTips?: string;       // how to contour on CT/MRI
  prvExpansion?: string;      // standard PRV margin
}

// --- SECTION B: COMPLETE OAR DATABASE ---

export const OAR_DATABASE: OARData[] = [
  {
    id: 'brainstem',
    name: 'Brainstem',
    region: 'CNS',
    type: 'Serial',
    organFunction: 'Connects brain to spinal cord; controls autonomic functions (breathing, HR).',
    whyItMatters: 'Critical for life; damage leads to cranial nerve palsy or death.',
    constraints: [
      {
        metric: 'Dmax < 54 Gy',
        metricType: 'Dmax',
        limit: 54,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.1,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Cranial nerve palsy, necrosis',
        toxicityGrade: 'Grade 4',
        source: ['QUANTEC 2010'],
        notes: 'Dmax < 54 Gy is standard; D1cc < 60 Gy is often used as a soft limit.'
      },
      {
        metric: 'Dmax < 50 Gy',
        metricType: 'Dmax',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.1,
        priority: 'Goal',
        evidenceLevel: 'Expert',
        notes: 'Goal constraint for safer planning.'
      },
      {
        metric: 'Dmax < 15 Gy',
        metricType: 'Dmax',
        limit: 15,
        unit: 'Gy',
        regime: ['SRS'],
        alphaBeta: 2.1,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        toxicityEndpoint: 'Brainstem necrosis',
        toxicityGrade: 'Grade 4',
        source: ['AAPM TG-101']
      },
      {
        metric: 'V23.1 < 1cc',
        metricType: 'absolute_volume',
        limit: 1,
        unit: 'cc',
        regime: ['SRS_fractionated'],
        alphaBeta: 2.1,
        priority: 'Soft',
        evidenceLevel: 'Level_3',
        toxicityEndpoint: 'Necrosis',
        toxicityGrade: 'Grade 4',
        source: ['HyTEC']
      }
    ],
    clinicalPearls: [
      'The surface of the brainstem is slightly more tolerant than the center.',
      'Always use a 3mm PRV expansion for planning.'
    ],
    prvExpansion: '3mm'
  },
  {
    id: 'spinal_cord',
    name: 'Spinal Cord',
    region: 'CNS',
    type: 'Serial',
    organFunction: 'Main pathway for information connecting brain and peripheral nervous system.',
    whyItMatters: 'Damage leads to irreversible myelopathy and paralysis.',
    constraints: [
      {
        metric: 'Dmax < 45 Gy',
        metricType: 'Dmax',
        limit: 45,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Myelopathy',
        toxicityGrade: 'Grade 4',
        tdxx: { td5: 45, td50: 70 },
        source: ['Emami 1991', 'QUANTEC 2010']
      },
      {
        metric: 'Dmax < 50 Gy',
        metricType: 'Dmax',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Absolute',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Myelopathy',
        toxicityGrade: 'Grade 5',
        notes: 'Requires 5mm PRV if approaching 50 Gy.'
      },
      {
        metric: 'D0.35cc < 22.5 Gy',
        metricType: 'Dxx',
        limit: 22.5,
        unit: 'Gy',
        regime: ['SRS'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        source: ['RTOG 0631'],
        notes: 'Single fraction SBRT limit.'
      },
      {
        metric: 'Dmax < 30 Gy',
        metricType: 'Dmax',
        limit: 30,
        unit: 'Gy',
        regime: ['SBRT_spine'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        toxicityEndpoint: 'Myelopathy',
        toxicityGrade: 'Grade 4',
        source: ['RTOG 0631'],
        notes: '3-fraction SBRT limit.'
      }
    ],
    clinicalPearls: [
      'Myelopathy risk is <1% at 45 Gy but increases steeply after 50-54 Gy.',
      'Re-irradiation tolerance depends on the time interval (typically >6 months).',
      'For SBRT, the dose-per-fraction is the dominant factor in myelopathy risk.'
    ],
    prvExpansion: '5mm'
  },
  {
    id: 'optic_chiasm',
    name: 'Optic Chiasm & Nerves',
    region: 'CNS',
    type: 'Serial',
    organFunction: 'Transmission of visual information from eyes to brain.',
    whyItMatters: 'Radiation Optic Neuropathy (RON) leads to permanent blindness.',
    constraints: [
      {
        metric: 'Dmax < 54 Gy',
        metricType: 'Dmax',
        limit: 54,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Blindness',
        toxicityGrade: 'Grade 4',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Dmax < 50 Gy',
        metricType: 'Dmax',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Goal',
        evidenceLevel: 'Expert',
        notes: 'Goal constraint for safer planning.'
      },
      {
        metric: 'Dmax < 8 Gy',
        metricType: 'Dmax',
        limit: 8,
        unit: 'Gy',
        regime: ['SRS'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Expert',
        source: ['AAPM TG-101']
      }
    ],
    clinicalPearls: [
      'Concurrent chemotherapy or pituitary dysfunction may lower tolerance.',
      'Contouring should include the entire optic apparatus from globe to chiasm.'
    ],
    prvExpansion: '3mm'
  },
  {
    id: 'cochlea',
    name: 'Cochlea',
    region: 'CNS',
    type: 'Parallel',
    organFunction: 'Auditory sensory organ.',
    whyItMatters: 'Sensorineural hearing loss significantly impacts QoL.',
    constraints: [
      {
        metric: 'Mean < 45 Gy',
        metricType: 'Dmean',
        limit: 45,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Hearing Loss',
        toxicityGrade: 'Grade 2',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Mean < 25 Gy',
        metricType: 'Dmean',
        limit: 25,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Expert',
        chemoModifier: 'Reduce to 25 Gy with concurrent cisplatin',
        source: ['AAPM TG-158']
      }
    ],
    clinicalPearls: [
      'Cochlear stem cells in children are more vulnerable.',
      'High-frequency hearing is usually lost first.'
    ]
  },
  {
    id: 'pituitary',
    name: 'Pituitary Gland',
    region: 'CNS',
    type: 'Mixed',
    organFunction: 'Master endocrine gland.',
    whyItMatters: 'Hypopituitarism requires lifelong hormone replacement.',
    constraints: [
      {
        metric: 'Mean < 45 Gy',
        metricType: 'Dmean',
        limit: 45,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Panhypopituitarism',
        toxicityGrade: 'Grade 3',
        source: ['QUANTEC 2010']
      }
    ],
    clinicalPearls: [
      'Growth hormone (GH) deficiency is often the first sign of failure.',
      'Craniopharyngioma cases may require exceeding this limit for coverage.'
    ]
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    region: 'CNS',
    type: 'Parallel',
    organFunction: 'Memory consolidation and spatial navigation.',
    whyItMatters: 'Sparing reduces neurocognitive decline in whole brain RT.',
    constraints: [
      {
        metric: 'D100% < 9 Gy',
        metricType: 'Dxx',
        limit: 9,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Goal',
        evidenceLevel: 'Level_1B',
        toxicityEndpoint: 'Cognitive decline',
        toxicityGrade: 'Grade 2',
        source: ['RTOG 0933', 'NRG CC001']
      }
    ],
    clinicalPearls: [
      'Hippocampal avoidance is now standard for many WBRT patients.',
      'Contouring requires T1-weighted MRI fusion.'
    ]
  },
  {
    id: 'lens',
    name: 'Lens',
    region: 'CNS',
    type: 'Serial',
    organFunction: 'Focuses light onto the retina.',
    whyItMatters: 'Cataracts occur at very low doses.',
    constraints: [
      {
        metric: 'Dmax < 5 Gy',
        metricType: 'Dmax',
        limit: 5,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 1.2,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Cataract',
        toxicityGrade: 'Grade 2',
        source: ['ICRP 103']
      }
    ],
    clinicalPearls: [
      'Extremely low alpha/beta ratio makes it highly sensitive to fraction size.',
      'Lead shields or specialized planning can effectively spare the lens.'
    ]
  },
  {
    id: 'brain_whole',
    name: 'Brain (Whole)',
    region: 'CNS',
    type: 'Parallel',
    organFunction: 'Central processing unit of the body.',
    whyItMatters: 'Necrosis and cognitive decline are late effects.',
    constraints: [
      {
        metric: 'V12Gy < 10cc',
        metricType: 'Vxx',
        limit: 10,
        unit: 'cc',
        regime: ['SRS'],
        alphaBeta: 2.0,
        priority: 'Soft',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Necrosis',
        toxicityGrade: 'Grade 3',
        source: ['QUANTEC 2010']
      }
    ],
    clinicalPearls: [
      'Necrosis risk increases with the volume of normal brain receiving >12 Gy.',
      'Palliative WBRT (30 Gy/10 fx) is well-tolerated acutely.'
    ]
  },
  {
    id: 'parotid',
    name: 'Parotid Glands',
    region: 'HeadAndNeck',
    type: 'Parallel',
    organFunction: 'Saliva production (serous).',
    whyItMatters: 'Xerostomia leads to dental decay and poor QoL.',
    constraints: [
      {
        metric: 'Mean < 26 Gy',
        metricType: 'Dmean',
        limit: 26,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Xerostomia',
        toxicityGrade: 'Grade 2',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'V30 < 50%',
        metricType: 'Vxx',
        limit: 50,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of xerostomia.'
      }
    ],
    clinicalPearls: [
      'Contralateral mean < 24 Gy is the goal for significant QoL benefit.',
      'Sparing even one gland can significantly reduce xerostomia.'
    ]
  },
  {
    id: 'submandibular',
    name: 'Submandibular Glands',
    region: 'HeadAndNeck',
    type: 'Parallel',
    organFunction: 'Saliva production (mixed).',
    whyItMatters: 'Contributes 70% of unstimulated salivary flow.',
    constraints: [
      {
        metric: 'Mean < 35 Gy',
        metricType: 'Dmean',
        limit: 35,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Xerostomia',
        toxicityGrade: 'Grade 2'
      }
    ],
    clinicalPearls: [
      'Often difficult to spare if level Ib nodes are targeted.',
      'Submandibular saliva is more viscous than parotid saliva.'
    ]
  },
  {
    id: 'oral_cavity',
    name: 'Oral Cavity',
    region: 'HeadAndNeck',
    type: 'Parallel',
    organFunction: 'Speech, mastication, taste.',
    whyItMatters: 'Mucositis and loss of taste are common acute toxicities.',
    constraints: [
      {
        metric: 'Mean < 30 Gy',
        metricType: 'Dmean',
        limit: 30,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Goal',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Mucositis',
        toxicityGrade: 'Grade 3'
      }
    ],
    clinicalPearls: [
      'ALARA principle applies to minimize mucositis.',
      'Contour should exclude the GTV.'
    ]
  },
  {
    id: 'pcm',
    name: 'Pharyngeal Constrictors',
    region: 'HeadAndNeck',
    type: 'Mixed',
    organFunction: 'Swallowing mechanism.',
    whyItMatters: 'Damage leads to dysphagia and PEG-tube dependence.',
    constraints: [
      {
        metric: 'Mean < 50 Gy',
        metricType: 'Dmean',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Dysphagia',
        toxicityGrade: 'Grade 3',
        source: ['Eisbruch et al.']
      },
      {
        metric: 'V50 < 30%',
        metricType: 'Vxx',
        limit: 30,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of dysphagia.'
      }
    ],
    clinicalPearls: [
      'Superior constrictor is often the most critical for swallowing.',
      'Aspiration pneumonia is a serious late complication.'
    ]
  },
  {
    id: 'larynx',
    name: 'Larynx',
    region: 'HeadAndNeck',
    type: 'Mixed',
    organFunction: 'Voice production and airway protection.',
    whyItMatters: 'Edema and stenosis can lead to voice loss or tracheostomy.',
    constraints: [
      {
        metric: 'Mean < 44 Gy',
        metricType: 'Dmean',
        limit: 44,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Edema',
        toxicityGrade: 'Grade 2'
      },
      {
        metric: 'V50 < 25%',
        metricType: 'Vxx',
        limit: 25,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of chronic laryngeal edema.'
      }
    ],
    clinicalPearls: [
      'V50 < 25% helps minimize chronic laryngeal edema.',
      'Chondronecrosis is rare but catastrophic.'
    ]
  },
  {
    id: 'mandible',
    name: 'Mandible',
    region: 'HeadAndNeck',
    type: 'Serial',
    organFunction: 'Structural support for teeth and jaw movement.',
    whyItMatters: 'Osteoradionecrosis (ORN) is a severe late complication.',
    constraints: [
      {
        metric: 'Dmax < 70 Gy',
        metricType: 'Dmax',
        limit: 70,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'ORN',
        toxicityGrade: 'Grade 3'
      },
      {
        metric: 'Dmax < 60 Gy',
        metricType: 'Dmax',
        limit: 60,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of ORN.'
      }
    ],
    clinicalPearls: [
      'ORN risk increases significantly above 60-65 Gy.',
      'Dental evaluation before RT is mandatory.'
    ]
  },
  {
    id: 'brachial_plexus',
    name: 'Brachial Plexus',
    region: 'HeadAndNeck',
    type: 'Serial',
    organFunction: 'Nerve network for arm sensation and movement.',
    whyItMatters: 'Plexopathy leads to permanent arm paralysis.',
    constraints: [
      {
        metric: 'Dmax < 66 Gy',
        metricType: 'Dmax',
        limit: 66,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Dmax < 26 Gy',
        metricType: 'Dmax',
        limit: 26,
        unit: 'Gy',
        regime: ['SBRT_lung'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        source: ['RTOG 0813']
      }
    ],
    clinicalPearls: [
      'Contour from C5 to T1 nerve roots.',
      'SBRT for apical lung tumors requires careful plexus sparing.'
    ]
  },
  {
    id: 'carotid',
    name: 'Carotid Arteries',
    region: 'HeadAndNeck',
    type: 'Serial',
    organFunction: 'Blood supply to the brain.',
    whyItMatters: 'Radiation increases stroke and stenosis risk.',
    constraints: [
      {
        metric: 'Mean < 35 Gy',
        metricType: 'Dmean',
        limit: 35,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Goal',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Stroke',
        toxicityGrade: 'Grade 4'
      }
    ],
    clinicalPearls: [
      'Every 10 Gy mean increases stroke risk by ~35%.',
      'Long-term follow-up for carotid stenosis is recommended.'
    ]
  },
  {
    id: 'heart',
    name: 'Heart (Whole)',
    region: 'Thorax',
    type: 'Parallel',
    organFunction: 'Pumps blood throughout the body.',
    whyItMatters: 'Cardiac mortality is a major concern in long-term survivors.',
    constraints: [
      {
        metric: 'Mean < 20 Gy',
        metricType: 'Dmean',
        limit: 20,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.5,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Pericarditis, MACE',
        toxicityGrade: 'Grade 4',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'V30 < 46%',
        metricType: 'Vxx',
        limit: 46,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 2.5,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of cardiac events.'
      },
      {
        metric: 'Mean < 4 Gy',
        metricType: 'Dmean',
        limit: 4,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.5,
        priority: 'Goal',
        evidenceLevel: 'Level_1A',
        notes: 'Specific for Breast RT.',
        source: ['EBCTCG']
      }
    ],
    clinicalPearls: [
      'V25 < 10% is a common goal in breast and lung planning.',
      'Deep Inspiration Breath Hold (DIBH) is effective for heart sparing.'
    ]
  },
  {
    id: 'cardiac_sub',
    name: 'Cardiac Substructures',
    region: 'Thorax',
    subregion: 'Cardiac Substructures',
    type: 'Mixed',
    organFunction: 'Specific components like LAD, valves, and ventricles.',
    whyItMatters: 'LAD dose is strongly linked to myocardial infarction.',
    constraints: [
      {
        metric: 'LAD Mean < 10 Gy',
        metricType: 'Dmean',
        limit: 10,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.5,
        priority: 'Goal',
        evidenceLevel: 'Level_2B',
        notes: 'Breast RT goal.'
      }
    ],
    clinicalPearls: [
      'The LAD is often the most critical substructure in left-sided breast RT.',
      'Contouring requires specialized atlases.'
    ]
  },
  {
    id: 'lung',
    name: 'Lung (Total)',
    region: 'Thorax',
    type: 'Parallel',
    organFunction: 'Gas exchange.',
    whyItMatters: 'Radiation pneumonitis can be fatal.',
    constraints: [
      {
        metric: 'V20 < 30%',
        metricType: 'Vxx',
        limit: 30,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Pneumonitis',
        toxicityGrade: 'Grade 2',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Mean < 20 Gy',
        metricType: 'Dmean',
        limit: 20,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A'
      },
      {
        metric: 'V20 < 10%',
        metricType: 'Vxx',
        limit: 10,
        unit: '%',
        regime: ['SBRT_lung'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        toxicityEndpoint: 'Pneumonitis',
        toxicityGrade: 'Grade 2',
        source: ['RTOG 0236']
      }
    ],
    clinicalPearls: [
      'V20 is the strongest predictor of pneumonitis.',
      'Total lung minus GTV is the standard volume for evaluation.',
      'For SBRT, the V20Gy is less predictive than the MLD (Mean Lung Dose).'
    ]
  },
  {
    id: 'esophagus',
    name: 'Esophagus',
    region: 'Thorax',
    type: 'Serial',
    organFunction: 'Transports food from pharynx to stomach.',
    whyItMatters: 'Esophagitis is a common acute toxicity; strictures are late.',
    constraints: [
      {
        metric: 'Mean < 34 Gy',
        metricType: 'Dmean',
        limit: 34,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Esophagitis',
        toxicityGrade: 'Grade 2'
      },
      {
        metric: 'V60 < 17%',
        metricType: 'Vxx',
        limit: 17,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of late stricture.'
      }
    ],
    clinicalPearls: [
      'V60 < 17% helps reduce late stricture risk.',
      'Fistula risk increases significantly above 70 Gy.'
    ]
  },
  {
    id: 'trachea',
    name: 'Trachea & Bronchial Tree',
    region: 'Thorax',
    type: 'Serial',
    organFunction: 'Airway passage.',
    whyItMatters: 'Stenosis or fistula can lead to respiratory failure.',
    constraints: [
      {
        metric: 'Dmax < 60 Gy',
        metricType: 'Dmax',
        limit: 60,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A'
      },
      {
        metric: 'Dmax < 20.2 Gy',
        metricType: 'Dmax',
        limit: 20.2,
        unit: 'Gy',
        regime: ['SBRT_lung'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        notes: 'Single fraction SBRT limit for "no-fly zone".',
        source: ['RTOG 0236']
      }
    ],
    clinicalPearls: [
      'The "no-fly zone" refers to central tumors near the bronchial tree.',
      'Stenosis can occur years after treatment.'
    ]
  },
  {
    id: 'liver',
    name: 'Liver (Total)',
    region: 'Abdomen',
    type: 'Parallel',
    organFunction: 'Metabolism, detoxification, bile production.',
    whyItMatters: 'Radiation-Induced Liver Disease (RILD) is often fatal.',
    constraints: [
      {
        metric: 'Mean < 30 Gy',
        metricType: 'Dmean',
        limit: 30,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        notes: 'For Child-Pugh A patients.',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Mean < 6 Gy',
        metricType: 'Dmean',
        limit: 6,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        notes: 'For Child-Pugh B patients.'
      }
    ],
    clinicalPearls: [
      'Liver tolerance depends heavily on baseline function (Child-Pugh score).',
      'Sparing at least 700cc of normal liver is a common SBRT goal.'
    ]
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    region: 'Abdomen',
    type: 'Parallel',
    organFunction: 'Blood filtration and urine production.',
    whyItMatters: 'Damage leads to chronic kidney disease and dialysis.',
    constraints: [
      {
        metric: 'Mean < 18 Gy',
        metricType: 'Dmean',
        limit: 18,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'V20 < 32%',
        metricType: 'Vxx',
        limit: 32,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Combined for both kidneys.'
      }
    ],
    clinicalPearls: [
      'V20 < 32% for both kidneys combined is a standard goal.',
      'If only one kidney is present, it must be spared aggressively.'
    ]
  },
  {
    id: 'stomach',
    name: 'Stomach',
    region: 'Abdomen',
    type: 'Serial',
    organFunction: 'Digestion of food.',
    whyItMatters: 'Ulceration and perforation are serious risks.',
    constraints: [
      {
        metric: 'Dmax < 54 Gy',
        metricType: 'Dmax',
        limit: 54,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Ulceration',
        toxicityGrade: 'Grade 3'
      },
      {
        metric: 'V45 < 30%',
        metricType: 'Vxx',
        limit: 30,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Gastritis',
        toxicityGrade: 'Grade 2',
        notes: 'V45 < 30% helps minimize acute gastritis.'
      }
    ],
    clinicalPearls: [
      'V45 < 30% helps minimize acute gastritis.',
      'Tolerance is lower post-gastrectomy.',
      'Always consider patient\'s baseline stomach health.'
    ]
  },
  {
    id: 'duodenum',
    name: 'Duodenum',
    region: 'Abdomen',
    type: 'Serial',
    organFunction: 'First part of small intestine; chemical digestion.',
    whyItMatters: 'Most radiosensitive abdominal organ in SBRT.',
    constraints: [
      {
        metric: 'Dmax < 55 Gy',
        metricType: 'Dmax',
        limit: 55,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Ulceration',
        toxicityGrade: 'Grade 3'
      },
      {
        metric: 'D0.5cc < 22.2 Gy',
        metricType: 'Dxx',
        limit: 22.2,
        unit: 'Gy',
        regime: ['SRS'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        toxicityEndpoint: 'Hemorrhage',
        toxicityGrade: 'Grade 4'
      }
    ],
    clinicalPearls: [
      'Duodenal ulceration can lead to life-threatening hemorrhage.',
      'Often the limiting structure for pancreatic SBRT.',
      'Dose constraints are very strict for SBRT due to high risk.'
    ]
  },
  {
    id: 'small_bowel',
    name: 'Small Bowel',
    region: 'Abdomen',
    type: 'Serial',
    organFunction: 'Nutrient absorption.',
    whyItMatters: 'Obstruction and perforation are late complications.',
    constraints: [
      {
        metric: 'V45 < 195cc',
        metricType: 'Vxx',
        limit: 195,
        unit: 'cc',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Obstruction',
        toxicityGrade: 'Grade 3',
        notes: 'Bowel bag constraint.',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'Dmax < 50 Gy',
        metricType: 'Dmax',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Perforation',
        toxicityGrade: 'Grade 4',
        notes: 'Reduces risk of perforation.'
      },
      {
        metric: 'V30 < 200cc',
        metricType: 'Vxx',
        limit: 200,
        unit: 'cc',
        regime: ['moderate_hypo'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2B',
        notes: 'Constraint for pelvic RT.'
      }
    ],
    clinicalPearls: [
      'Individual loops are more sensitive than the "bowel bag".',
      'V15 < 120cc is a common goal for pelvic RT.',
      'Small bowel mobility can lead to significant dose variation.'
    ]
  },
  {
    id: 'spinal_cord_lumbar',
    name: 'Spinal Cord (Lumbar)',
    region: 'Abdomen',
    type: 'Serial',
    organFunction: 'Lower spinal cord and cauda equina.',
    whyItMatters: 'Damage leads to lower limb paralysis and bowel/bladder dysfunction.',
    constraints: [
      {
        metric: 'Dmax < 45 Gy',
        metricType: 'Dmax',
        limit: 45,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A'
      }
    ],
    clinicalPearls: [
      'Cauda equina is slightly more tolerant than the spinal cord.',
      'SBRT Dmax < 32 Gy (5fx) is often used for cauda.'
    ]
  },
  {
    id: 'rectum',
    name: 'Rectum',
    region: 'Pelvis',
    type: 'Parallel',
    organFunction: 'Storage of feces.',
    whyItMatters: 'Proctitis and bleeding impact QoL significantly.',
    constraints: [
      {
        metric: 'V70 < 20%',
        metricType: 'Vxx',
        limit: 20,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Proctitis',
        toxicityGrade: 'Grade 3',
        source: ['QUANTEC 2010']
      },
      {
        metric: 'V60 < 50%',
        metricType: 'Vxx',
        limit: 50,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Proctitis',
        toxicityGrade: 'Grade 2',
        source: ['QUANTEC 2010'],
        notes: 'Reduces risk of Grade 2+ proctitis.'
      },
      {
        metric: 'V40 < 35%',
        metricType: 'Vxx',
        limit: 35,
        unit: '%',
        regime: ['moderate_hypo'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2B',
        notes: 'Constraint for hypofractionated prostate RT (e.g., 60Gy/20fx).'
      }
    ],
    clinicalPearls: [
      'V70 < 20% is the most common prostate RT constraint.',
      'SpaceOAR hydrogel can significantly reduce rectal dose.',
      'Rectal wall contouring is preferred over whole rectum for SBRT.'
    ]
  },
  {
    id: 'bladder',
    name: 'Bladder',
    region: 'Pelvis',
    type: 'Parallel',
    organFunction: 'Storage of urine.',
    whyItMatters: 'Contracture and hematuria are late effects.',
    constraints: [
      {
        metric: 'V80 < 15%',
        metricType: 'Vxx',
        limit: 15,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Hematuria',
        toxicityGrade: 'Grade 3'
      },
      {
        metric: 'V65 < 50%',
        metricType: 'Vxx',
        limit: 50,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        toxicityEndpoint: 'Contracture',
        toxicityGrade: 'Grade 2',
        notes: 'Reduces risk of late bladder contracture.'
      },
      {
        metric: 'V70 < 30%',
        metricType: 'Vxx',
        limit: 30,
        unit: '%',
        regime: ['moderate_hypo'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_2B',
        notes: 'Constraint for hypofractionated prostate RT.'
      }
    ],
    clinicalPearls: [
      'Bladder filling during treatment helps spare the dome.',
      'D2cc < 90 Gy EQD2 is the goal for cervix brachytherapy.',
      'Bladder volume consistency is key to avoiding dose variation.'
    ]
  },
  {
    id: 'femoral_heads',
    name: 'Femoral Heads',
    region: 'Pelvis',
    type: 'Serial',
    organFunction: 'Hip joint mobility.',
    whyItMatters: 'Avascular necrosis (AVN) leads to hip replacement.',
    constraints: [
      {
        metric: 'Dmax < 50 Gy',
        metricType: 'Dmax',
        limit: 50,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 1.8,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'AVN',
        toxicityGrade: 'Grade 3'
      },
      {
        metric: 'V30 < 15%',
        metricType: 'Vxx',
        limit: 15,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 1.8,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Reduces risk of AVN.'
      }
    ],
    clinicalPearls: [
      'Very low alpha/beta ratio makes it sensitive to fraction size.',
      'Growth plate sparing is critical in pediatric patients.',
      'Avoid high dose to the femoral neck to reduce fracture risk.'
    ]
  },
  {
    id: 'penile_bulb',
    name: 'Penile Bulb',
    region: 'Pelvis',
    type: 'Parallel',
    organFunction: 'Erectile function.',
    whyItMatters: 'Dose is linked to radiation-induced impotence.',
    constraints: [
      {
        metric: 'Mean < 52.5 Gy',
        metricType: 'Dmean',
        limit: 52.5,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Goal',
        evidenceLevel: 'Level_1A',
        toxicityEndpoint: 'Impotence',
        toxicityGrade: 'Grade 2',
        source: ['RTOG 0126']
      },
      {
        metric: 'V50 < 50%',
        metricType: 'Vxx',
        limit: 50,
        unit: '%',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Soft',
        evidenceLevel: 'Level_2A',
        notes: 'Optimization goal for erectile function.'
      }
    ],
    clinicalPearls: [
      'V50 < 50% is a common optimization goal.',
      'Sparing is often prioritized in younger patients.',
      'Erectile function is multifactorial; RT is only one component.'
    ]
  },
  {
    id: 'ovaries',
    name: 'Ovaries',
    region: 'Pelvis',
    type: 'Serial',
    organFunction: 'Egg production and hormone secretion.',
    whyItMatters: 'Extremely radiosensitive; damage leads to infertility.',
    constraints: [
      {
        metric: 'Dmax < 2 Gy',
        metricType: 'Dmax',
        limit: 2,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        notes: 'Threshold for premature ovarian failure.'
      }
    ],
    clinicalPearls: [
      'Oophoropexy can move ovaries out of the radiation field.',
      'Infertility can occur at doses as low as 5-7 Gy.'
    ]
  },
  {
    id: 'uterus',
    name: 'Uterus',
    region: 'Pelvis',
    type: 'Mixed',
    organFunction: 'Gestation.',
    whyItMatters: 'Necrosis and infertility are risks.',
    constraints: [
      {
        metric: 'D2cc < 75 Gy',
        metricType: 'D2cc',
        limit: 75,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Hard',
        evidenceLevel: 'Level_1A',
        notes: 'Combined EBRT and brachytherapy EQD2.',
        source: ['GEC-ESTRO']
      }
    ],
    clinicalPearls: [
      'Uterine tolerance is generally high but varies with age.',
      'Contouring for brachytherapy is specialized.'
    ]
  },
  {
    id: 'pelvic_floor',
    name: 'Pelvic Floor Muscles',
    region: 'Pelvis',
    type: 'Parallel',
    organFunction: 'Support for pelvic organs and continence.',
    whyItMatters: 'Damage leads to fecal or urinary incontinence.',
    constraints: [
      {
        metric: 'Mean < 30 Gy',
        metricType: 'Dmean',
        limit: 30,
        unit: 'Gy',
        regime: ['conventional'],
        alphaBeta: 3.0,
        priority: 'Goal',
        evidenceLevel: 'Level_2B',
        source: ['MSK Guidelines']
      }
    ],
    clinicalPearls: [
      'Often overlooked in standard pelvic planning.',
      'Contouring includes the levator ani and sphincter complex.'
    ]
  },
  {
    id: 'spinal_cord_sbrt',
    name: 'Spinal Cord (SBRT Specific)',
    region: 'Spine_SBRT',
    type: 'Serial',
    organFunction: 'Spinal cord in high-dose SBRT context.',
    whyItMatters: 'SBRT requires much tighter constraints due to high dose per fx.',
    constraints: [
      {
        metric: 'Dmax < 14 Gy',
        metricType: 'Dmax',
        limit: 14,
        unit: 'Gy',
        regime: ['SRS'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        source: ['RTOG 0631']
      },
      {
        metric: 'Dmax < 30 Gy',
        metricType: 'Dmax',
        limit: 30,
        unit: 'Gy',
        regime: ['SRS_fractionated'],
        alphaBeta: 2.0,
        priority: 'Hard',
        evidenceLevel: 'Level_3',
        notes: 'For 5 fraction SBRT.',
        source: ['Sahgal et al.']
      }
    ],
    clinicalPearls: [
      'D0.35cc is often used as a surrogate for Dmax.',
      'The Sahgal limits are widely used in clinical practice.'
    ]
  }
];

// --- SECTION C: FRACTIONATION PRESET LIBRARY ---

export const FRACTIONATION_PRESETS = {
  'Std 2Gy': { dosePerFx: 2.0, nFx: 30, totalDose: 60, regime: 'conventional' as FractionationRegime, site: 'General', protocol: 'Standard' },
  'Std 1.8Gy': { dosePerFx: 1.8, nFx: 28, totalDose: 50.4, regime: 'conventional' as FractionationRegime, site: 'General', protocol: 'Standard' },
  'Breast FAST-F': { dosePerFx: 5.2, nFx: 5, totalDose: 26.0, regime: 'extreme_hypo' as FractionationRegime, site: 'Breast', protocol: 'FAST-Forward Trial' },
  'Breast Hypo': { dosePerFx: 2.67, nFx: 15, totalDose: 40.05, regime: 'moderate_hypo' as FractionationRegime, site: 'Breast', protocol: 'START-B / OCOG' },
  'Prostate Conv': { dosePerFx: 2.0, nFx: 39, totalDose: 78, regime: 'conventional' as FractionationRegime, site: 'Prostate', protocol: 'RTOG 0126' },
  'Prostate Hypo': { dosePerFx: 3.0, nFx: 20, totalDose: 60, regime: 'moderate_hypo' as FractionationRegime, site: 'Prostate', protocol: 'CHHiP / RTOG 0415' },
  'Prostate SBRT': { dosePerFx: 7.25, nFx: 5, totalDose: 36.25, regime: 'SBRT_prostate' as FractionationRegime, site: 'Prostate', protocol: 'PACE-B / HYPO-RT-PC' },
  'Lung SBRT 3fx': { dosePerFx: 18.0, nFx: 3, totalDose: 54, regime: 'SBRT_lung' as FractionationRegime, site: 'Lung (peripheral)', protocol: 'RTOG 0236' },
  'Lung SBRT 5fx': { dosePerFx: 10.0, nFx: 5, totalDose: 50, regime: 'SBRT_lung' as FractionationRegime, site: 'Lung (central)', protocol: 'RTOG 0813' },
  'Lung SBRT 4fx': { dosePerFx: 12.5, nFx: 4, totalDose: 50, regime: 'SBRT_lung' as FractionationRegime, site: 'Lung (peripheral)', protocol: 'RTOG 0915' },
  'Spine SBRT 1fx': { dosePerFx: 24.0, nFx: 1, totalDose: 24, regime: 'SBRT_spine' as FractionationRegime, site: 'Spine', protocol: 'RTOG 0631' },
  'Spine SBRT 3fx': { dosePerFx: 9.0, nFx: 3, totalDose: 27, regime: 'SBRT_spine' as FractionationRegime, site: 'Spine', protocol: 'Sahgal et al.' },
  'Cervix EBRT': { dosePerFx: 1.8, nFx: 25, totalDose: 45, regime: 'conventional' as FractionationRegime, site: 'Cervix (pelvis)', protocol: 'GOG/RTOG standard + brachy' },
  'Liver SBRT 6fx': { dosePerFx: 8.0, nFx: 6, totalDose: 48, regime: 'SBRT_liver' as FractionationRegime, site: 'Liver', protocol: 'AAPM TG-101' },
  'HN Conv': { dosePerFx: 2.0, nFx: 35, totalDose: 70, regime: 'conventional' as FractionationRegime, site: 'H&N (definitive)', protocol: 'RTOG standard' },
  'HN Post-op': { dosePerFx: 2.0, nFx: 30, totalDose: 60, regime: 'conventional' as FractionationRegime, site: 'H&N (post-op)', protocol: 'RTOG PORT' },
};

// --- SECTION D: CALCULATION ENGINE ---

/**
 * Core EQD2 scaling function
 */
export function scaleConstraintToRegime(
  limit_ref: number,          // constraint at reference fractionation (total dose)
  ab: number,                 // alpha/beta
  d_ref: number = 2.0,        // reference dose/fx (usually 2 Gy)
  d_new: number               // new dose/fx
): { scaledLimit: number; BED_ref: number; BED_new_at_limit: number; warning?: string } {
  const BED_ref = limit_ref * (1 + (d_ref / ab));
  const scaledLimit = BED_ref / (1 + (d_new / ab));
  const BED_new_at_limit = scaledLimit * (1 + (d_new / ab));
  
  let warning;
  if (d_new > 5) {
    warning = "High dose per fraction: LQ model may overestimate tolerance.";
  }

  return { scaledLimit, BED_ref, BED_new_at_limit, warning };
}

export interface PlanMetric {
  oarId: string;
  metricType: Constraint['metricType'];
  value: number;
  unit: 'Gy' | '%' | 'cc';
}

/**
 * DVH Check Engine
 */
export function checkConstraints(metrics: PlanMetric[], regime: FractionationRegime): {
  oarId: string;
  metric: string;
  planValue: number;
  limit: number;
  status: 'pass' | 'caution' | 'violation' | 'absolute_violation';
  margin: number;
  priority: Constraint['priority'];
}[] {
  const results: any[] = [];

  metrics.forEach(m => {
    const oar = OAR_DATABASE.find(o => o.id === m.oarId);
    if (!oar) return;

    const relevantConstraints = oar.constraints.filter(c => c.regime.includes(regime) && c.metricType === m.metricType);

    relevantConstraints.forEach(c => {
      let status: 'pass' | 'caution' | 'violation' | 'absolute_violation' = 'pass';
      const margin = c.limit - m.value;

      if (m.value > c.limit) {
        status = c.priority === 'Absolute' ? 'absolute_violation' : 'violation';
      } else if (m.value > c.limit * 0.9) {
        status = 'caution';
      }

      results.push({
        oarId: m.oarId,
        metric: c.metric,
        planValue: m.value,
        limit: c.limit,
        status,
        margin,
        priority: c.priority
      });
    });
  });

  return results;
}

/**
 * NTCP Lyman-Kutcher-Burman model
 */
export function calculateLKB_NTCP(
  Dmean: number,
  n: number,    // volume effect parameter
  m: number,    // slope
  TD50: number  // dose for 50% complication probability
): number {
  // Simplified LKB for mean dose
  const t = (Dmean - TD50) / (m * TD50);
  
  // Normal distribution approximation (ERF)
  const erf = (x: number) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const sign = (x < 0) ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  };

  return 0.5 * (1 + erf(t / Math.sqrt(2)));
}

/**
 * Re-irradiation cumulative dose calculator
 */
export function calculateReIrradiationCumulativeDose(
  previousDose_EQD2: number,
  newDose_EQD2: number,
  recoveryFactor: number,   // 0–1, time-dependent
  organLimit_EQD2: number
): {
  cumulativeDose: number;
  remainingTolerance: number;
  safe: boolean;
  recommendation: string;
} {
  const effectivePrevDose = previousDose_EQD2 * (1 - recoveryFactor);
  const cumulativeDose = effectivePrevDose + newDose_EQD2;
  const remainingTolerance = organLimit_EQD2 - cumulativeDose;
  const safe = cumulativeDose <= organLimit_EQD2;

  let recommendation = safe 
    ? "Cumulative dose within tolerance limits." 
    : "Cumulative dose exceeds tolerance. High risk of toxicity.";
  
  if (recoveryFactor < 0.1) {
    recommendation += " Warning: Short interval between courses minimizes biological recovery.";
  }

  return { cumulativeDose, remainingTolerance, safe, recommendation };
}

// --- SECTION E: QUIZ QUESTIONS ---

export interface OARQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clinicalPearl: string;
  difficulty: 'intern' | 'resident' | 'fellow';
  oarId?: string;
  source: string;
}

export const OAR_QUIZ_QUESTIONS: OARQuizQuestion[] = [
  {
    question: "What is the standard Dmax constraint for the spinal cord in conventional fractionation to minimize myelopathy risk?",
    options: ["30 Gy", "45 Gy", "60 Gy", "70 Gy"],
    correctIndex: 1,
    explanation: "45 Gy is the widely accepted hard limit (TD5/5) for the spinal cord in conventional fractionation.",
    clinicalPearl: "Myelopathy risk is <1% at 45 Gy but increases steeply after 50 Gy.",
    difficulty: "intern",
    oarId: "spinal_cord",
    source: "QUANTEC 2010"
  },
  {
    question: "Which OAR is considered the most radiosensitive abdominal organ in the context of SBRT?",
    options: ["Liver", "Kidney", "Duodenum", "Stomach"],
    correctIndex: 2,
    explanation: "The duodenum is highly sensitive to high point doses, with SBRT limits often being the primary constraint for pancreatic or biliary cases.",
    clinicalPearl: "Duodenal ulceration can lead to life-threatening hemorrhage.",
    difficulty: "resident",
    oarId: "duodenum",
    source: "AAPM TG-101"
  },
  {
    question: "How does concurrent cisplatin affect the cochlear mean dose constraint?",
    options: ["No effect", "Increases tolerance to 50 Gy", "Decreases tolerance to 25 Gy", "Decreases tolerance to 10 Gy"],
    correctIndex: 2,
    explanation: "Cisplatin is ototoxic and synergizes with radiation, requiring a lower mean dose (25 Gy vs 45 Gy) to prevent hearing loss.",
    clinicalPearl: "High-frequency hearing is usually lost first.",
    difficulty: "resident",
    oarId: "cochlea",
    source: "AAPM TG-158"
  },
  {
    question: "In the LKB model, what does the parameter 'n' represent?",
    options: ["The slope of the dose-response curve", "The volume effect (serial vs parallel)", "The dose for 50% complication probability", "The number of fractions"],
    correctIndex: 1,
    explanation: "The 'n' parameter describes the volume effect: n close to 1 indicates a parallel organ (like lung), while n close to 0 indicates a serial organ (like cord).",
    clinicalPearl: "Serial organs are sensitive to point max doses; parallel organs are sensitive to mean doses.",
    difficulty: "fellow",
    source: "Lyman 1985"
  },
  {
    question: "What is the primary rationale for hippocampal sparing during whole brain radiotherapy (WBRT)?",
    options: ["To reduce hair loss", "To prevent radiation necrosis", "To mitigate neurocognitive decline and memory impairment", "To improve overall survival"],
    correctIndex: 2,
    explanation: "The hippocampus contains neural stem cells critical for memory; sparing them reduces cognitive decline (RTOG 0933).",
    clinicalPearl: "Contouring requires T1-weighted MRI fusion for accuracy.",
    difficulty: "resident",
    oarId: "hippocampus",
    source: "NRG CC001"
  },
  {
    question: "For a patient with Child-Pugh B liver function, what is the recommended mean liver dose limit?",
    options: ["< 30 Gy", "< 20 Gy", "< 15 Gy", "< 6 Gy"],
    correctIndex: 3,
    explanation: "Baseline liver function is critical; Child-Pugh B patients have severely limited tolerance, often cited as < 6 Gy.",
    clinicalPearl: "RILD is often fatal; always check baseline LFTs and Child-Pugh score.",
    difficulty: "fellow",
    oarId: "liver",
    source: "QUANTEC 2010"
  },
  {
    question: "What is the cataract threshold for the lens according to ICRP 103?",
    options: ["0.5 Gy", "2 Gy", "5 Gy", "10 Gy"],
    correctIndex: 2,
    explanation: "ICRP 103 identifies 5 Gy as the threshold for detectable cataracts, though some studies suggest even lower thresholds.",
    clinicalPearl: "The lens has a very low alpha/beta ratio (~1.2).",
    difficulty: "intern",
    oarId: "lens",
    source: "ICRP 103"
  },
  {
    question: "Which rectal constraint is most commonly used in prostate radiotherapy planning?",
    options: ["V70 < 20%", "V40 < 80%", "Mean < 50 Gy", "Dmax < 80 Gy"],
    correctIndex: 0,
    explanation: "V70 < 20% is a standard QUANTEC constraint to minimize late rectal bleeding.",
    clinicalPearl: "SpaceOAR hydrogel can significantly reduce rectal dose.",
    difficulty: "intern",
    oarId: "rectum",
    source: "QUANTEC 2010"
  },
  {
    question: "What is the recommended D2cc limit for the bladder in cervix brachytherapy (EQD2)?",
    options: ["< 45 Gy", "< 70 Gy", "< 80 Gy", "< 90 Gy"],
    correctIndex: 3,
    explanation: "GEC-ESTRO guidelines recommend keeping the bladder D2cc < 80-90 Gy EQD2 to prevent late complications.",
    clinicalPearl: "Bladder filling during treatment helps spare the dome.",
    difficulty: "fellow",
    oarId: "bladder",
    source: "GEC-ESTRO"
  },
  {
    question: "In SBRT for spinal metastases, what is the Sahgal Dmax limit for the spinal cord in 5 fractions?",
    options: ["14 Gy", "20 Gy", "30 Gy", "50 Gy"],
    correctIndex: 2,
    explanation: "Sahgal et al. established 30 Gy as a safe Dmax for the spinal cord in 5-fraction SBRT.",
    clinicalPearl: "D0.35cc is often used as a surrogate for Dmax in SBRT.",
    difficulty: "fellow",
    oarId: "spinal_cord_sbrt",
    source: "Sahgal et al. 2019"
  },
  {
    question: "Which OAR has the lowest alpha/beta ratio, making it most sensitive to fraction size?",
    options: ["Brainstem", "Parotid", "Femoral Head", "Lens"],
    correctIndex: 3,
    explanation: "The lens has an alpha/beta ratio of approximately 1.2 Gy, one of the lowest in the body.",
    clinicalPearl: "Low alpha/beta tissues are 'late-responding' and highly sensitive to large fraction sizes.",
    difficulty: "resident",
    oarId: "lens",
    source: "ICRP 103"
  },
  {
    question: "What is the primary toxicity endpoint for the pharyngeal constrictor muscles?",
    options: ["Xerostomia", "Dysphagia", "Laryngeal edema", "Osteoradionecrosis"],
    correctIndex: 1,
    explanation: "Damage to the PCMs leads to dysphagia, aspiration, and potential PEG-tube dependence.",
    clinicalPearl: "Superior constrictor is often the most critical for swallowing.",
    difficulty: "intern",
    oarId: "pcm",
    source: "Eisbruch et al."
  },
  {
    question: "For re-irradiation of the spinal cord, what is a typical recovery factor used at 6 months?",
    options: ["0%", "25%", "75%", "100%"],
    correctIndex: 1,
    explanation: "A recovery factor of 25% (meaning 75% of the initial damage remains) is often used for the spinal cord after 6 months.",
    clinicalPearl: "Cumulative Dmax should generally stay below 60 Gy EQD2.",
    difficulty: "fellow",
    oarId: "spinal_cord",
    source: "Nieder et al."
  },
  {
    question: "What is the V20 threshold for the lung to minimize Grade 2+ pneumonitis risk?",
    options: ["< 10%", "< 20%", "< 30-35%", "< 50%"],
    correctIndex: 2,
    explanation: "QUANTEC suggests keeping V20 < 30-35% to keep pneumonitis risk below 20%.",
    clinicalPearl: "V20 is the strongest predictor of radiation pneumonitis.",
    difficulty: "intern",
    oarId: "lung",
    source: "QUANTEC 2010"
  },
  {
    question: "Which cardiac substructure dose is most strongly linked to myocardial infarction in breast RT?",
    options: ["Right Atrium", "Left Ventricle", "Left Anterior Descending Artery (LAD)", "Mitral Valve"],
    correctIndex: 2,
    explanation: "The LAD artery dose is a critical predictor of major adverse cardiac events in left-sided breast cancer patients.",
    clinicalPearl: "DIBH is highly effective for LAD sparing.",
    difficulty: "resident",
    oarId: "cardiac_sub",
    source: "Darby et al. 2013"
  },
  {
    question: "What is the 'no-fly zone' in lung SBRT?",
    options: ["The area within 2cm of the proximal bronchial tree", "The apex of the lung", "The area near the chest wall", "The contralateral lung"],
    correctIndex: 0,
    explanation: "The 'no-fly zone' refers to central tumors within 2cm of the proximal bronchial tree, where SBRT carries higher risks of airway toxicity.",
    clinicalPearl: "RTOG 0813 provides guidance for central lung SBRT.",
    difficulty: "resident",
    oarId: "trachea",
    source: "RTOG 0236"
  },
  {
    question: "Which OAR sparing is prioritized to prevent erectile dysfunction in prostate RT?",
    options: ["Bladder", "Rectum", "Penile Bulb", "Femoral Heads"],
    correctIndex: 2,
    explanation: "Sparing the penile bulb (Mean < 52.5 Gy) is associated with better preservation of erectile function.",
    clinicalPearl: "V50 < 50% is a common optimization goal.",
    difficulty: "resident",
    oarId: "penile_bulb",
    source: "RTOG 0126"
  },
  {
    question: "What is the TD5/5 for the spinal cord (whole organ) according to Emami?",
    options: ["45 Gy", "50 Gy", "55 Gy", "60 Gy"],
    correctIndex: 0,
    explanation: "Emami's classic 1991 paper defined 45 Gy as the TD5/5 (5% complication rate at 5 years) for the spinal cord.",
    clinicalPearl: "Modern practice often uses 50 Gy as a hard limit with PRV.",
    difficulty: "intern",
    oarId: "spinal_cord",
    source: "Emami 1991"
  },
  {
    question: "In the context of parotid sparing, what was the primary finding of the PARSPORT trial?",
    options: ["Improved overall survival", "Reduced xerostomia and improved QoL", "Reduced mucositis", "Improved local control"],
    correctIndex: 1,
    explanation: "The PARSPORT trial demonstrated that IMRT sparing of the parotid glands significantly reduced xerostomia and improved patient quality of life.",
    clinicalPearl: "Contralateral mean < 24 Gy is a key goal.",
    difficulty: "resident",
    oarId: "parotid",
    source: "Nutting et al. 2011"
  },
  {
    question: "What is the premature ovarian failure threshold for the ovaries?",
    options: ["< 2 Gy", "< 5 Gy", "< 10 Gy", "< 20 Gy"],
    correctIndex: 0,
    explanation: "The ovaries are extremely sensitive; doses as low as 2 Gy can cause premature ovarian failure in some women.",
    clinicalPearl: "Oophoropexy should be considered if > 2 Gy is unavoidable.",
    difficulty: "fellow",
    oarId: "ovaries",
    source: "ICRP 103"
  }
];
