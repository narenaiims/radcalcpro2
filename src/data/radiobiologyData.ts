export interface RadiobiologyData {
  id: string;
  site: string;
  subsite: string;
  tumour: string;
  alphaBeta: number;
  ab?: number;
  alphaGy?: number;
  betaGy2?: number;
  typicalDose?: string;
  typicalFractions?: number;
  notes?: string;
  references?: string[];
  uncertaintyFlag?: boolean;
  histology?: string;
  abLow?: number;
  abHigh?: number;
  tk?: number;
  k?: number; // Repopulation rate (Gy BED loss/day)
  repopFootnote?: string; // Footnote explaining derivation
  abSource?: string;
  repopNote?: string;
  clinicalContext?: string;
}

export const MASTER_RADIOBIOLOGY_TABLE: RadiobiologyData[] = [
  // ── Head & Neck ──
  { id: 'hn-larynx', site: 'Head & Neck', subsite: 'Larynx', tumour: 'SCC', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-naso', site: 'Head & Neck', subsite: 'Nasopharynx', tumour: 'SCC', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-oro', site: 'Head & Neck', subsite: 'Oropharynx', tumour: 'SCC (HPV+/-)', alphaBeta: 10, abSource: 'Ang et al RTOG 0129', repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-oral-cavity', site: 'Head & Neck', subsite: 'Oral Cavity', tumour: 'SCC', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-hypopharynx', site: 'Head & Neck', subsite: 'Hypopharynx', tumour: 'SCC', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-salivary', site: 'Head & Neck', subsite: 'Salivary Gland', tumour: 'Adeno/ACC', alphaBeta: 8, repopFootnote: 'Extrapolated from SCC' },
  { id: 'hn-thyroid', site: 'Head & Neck', subsite: 'Thyroid', tumour: 'Anaplastic/Differentiated', alphaBeta: 10, repopFootnote: 'Extrapolated from SCC' },
  { id: 'hn-sinus', site: 'Head & Neck', subsite: 'Paranasal Sinus', tumour: 'SCC/Adeno', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-cup', site: 'Head & Neck', subsite: 'Unknown Primary', tumour: 'SCC', alphaBeta: 10, repopFootnote: 'Withers HR et al. Acta Oncol 1988' },
  { id: 'hn-glomus', site: 'Head & Neck', subsite: 'Glomus Tumour', tumour: 'Paraganglioma', alphaBeta: 2, repopFootnote: 'Minimal repopulation' },
  { id: 'hn-skull-base', site: 'Head & Neck', subsite: 'Base of Skull', tumour: 'Chordoma/Chondrosarcoma', alphaBeta: 2, repopFootnote: 'Minimal repopulation' },

  // ── Thoracic ──
  { id: 'thor-lung', site: 'Thoracic', subsite: 'Lung', tumour: 'NSCLC/SCLC', alphaBeta: 10 },
  { id: 'thor-meso', site: 'Thoracic', subsite: 'Mesothelioma', tumour: 'Pleural', alphaBeta: 10 },
  { id: 'thor-thymoma', site: 'Thoracic', subsite: 'Thymoma', tumour: 'Epithelial', alphaBeta: 10 },
  { id: 'thor-thymic-ca', site: 'Thoracic', subsite: 'Thymic Carcinoma', tumour: 'SCC', alphaBeta: 10 },
  { id: 'thor-oes', site: 'Thoracic', subsite: 'Oesophagus', tumour: 'SCC/Adenocarcinoma', alphaBeta: 10 },
  { id: 'thor-chest-wall', site: 'Thoracic', subsite: 'Chest Wall', tumour: 'Recurrence', alphaBeta: 4 },
  { id: 'thor-trachea', site: 'Thoracic', subsite: 'Trachea', tumour: 'SCC', alphaBeta: 10 },

  // ── Gastrointestinal ──
  { id: 'gi-stomach', site: 'Gastrointestinal', subsite: 'Stomach', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-pancreas', site: 'Gastrointestinal', subsite: 'Pancreas', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-liver', site: 'Gastrointestinal', subsite: 'Liver', tumour: 'HCC/Cholangiocarcinoma', alphaBeta: 10 },
  { id: 'gi-rectum', site: 'Gastrointestinal', subsite: 'Rectum', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-anal', site: 'Gastrointestinal', subsite: 'Anal Canal', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gi-colon', site: 'Gastrointestinal', subsite: 'Colon', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-small-bowel', site: 'Gastrointestinal', subsite: 'Small Bowel', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-gist', site: 'Gastrointestinal', subsite: 'GIST', tumour: 'Stromal', alphaBeta: 3, abLow: 2, abHigh: 4, uncertaintyFlag: true, notes: 'GIST is poorly radiosensitive; α/β estimate based on limited data' },
  { id: 'gi-net', site: 'Gastrointestinal', subsite: 'Neuroendocrine', tumour: 'NET', alphaBeta: 10 },
  { id: 'gi-gallbladder', site: 'Gastrointestinal', subsite: 'Gallbladder', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-biliary', site: 'Gastrointestinal', subsite: 'Biliary Tree', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-retro-sarcoma', site: 'Gastrointestinal', subsite: 'Retroperitoneal', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'gi-perit-meso', site: 'Gastrointestinal', subsite: 'Peritoneum', tumour: 'Mesothelioma', alphaBeta: 10 },
  { id: 'gi-omental', site: 'Gastrointestinal', subsite: 'Omentum', tumour: 'Omental Cake', alphaBeta: 10 },

  // ── Genitourinary ──
  { id: 'gu-pros', site: 'Genitourinary', subsite: 'Prostate', tumour: 'Adenocarcinoma', alphaBeta: 1.5, abLow: 1.0, abHigh: 1.85, uncertaintyFlag: true, abSource: 'Brenner & Hall IJROBP 1999; Fowler et al Radiother Oncol 2001; CHHiP (Dearnaley, Lancet Oncol 2016); PACE-B (Brand, Lancet Oncol 2019)' },
  { id: 'gu-bladder', site: 'Genitourinary', subsite: 'Bladder', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-renal', site: 'Genitourinary', subsite: 'Renal Cell', tumour: 'Carcinoma', alphaBeta: 10 },
  { id: 'gu-testis', site: 'Genitourinary', subsite: 'Testis', tumour: 'Germ cell', alphaBeta: 10 },
  { id: 'gu-penile', site: 'Genitourinary', subsite: 'Penile', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gu-ureter', site: 'Genitourinary', subsite: 'Ureter', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-urethra', site: 'Genitourinary', subsite: 'Urethra', tumour: 'SCC', alphaBeta: 10 },

  // ── Gynaecological ──
  { id: 'gyn-cervix', site: 'Gynaecological', subsite: 'Cervix', tumour: 'SCC/Adenocarcinoma', alphaBeta: 10 },
  { id: 'gyn-endo', site: 'Gynaecological', subsite: 'Endometrium', tumour: 'Adenocarcinoma/Serous', alphaBeta: 10 },
  { id: 'gyn-vulva', site: 'Gynaecological', subsite: 'Vulva', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gyn-vagina', site: 'Gynaecological', subsite: 'Vagina', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gyn-ovary', site: 'Gynaecological', subsite: 'Ovary', tumour: 'Epithelial/Germ cell', alphaBeta: 10 },
  { id: 'gyn-fallopian', site: 'Gynaecological', subsite: 'Fallopian Tube', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gyn-chorioca', site: 'Gynaecological', subsite: 'Choriocarcinoma', tumour: 'Germ cell', alphaBeta: 10 },
  { id: 'gyn-gtn', site: 'Gynaecological', subsite: 'GTN', tumour: 'Trophoblastic', alphaBeta: 10 },
  { id: 'gyn-bartholin', site: 'Gynaecological', subsite: 'Bartholin Gland', tumour: 'Adeno/SCC', alphaBeta: 10 },
  { id: 'gyn-uterine-sarc', site: 'Gynaecological', subsite: 'Uterus', tumour: 'LMS/Carcinosarcoma', alphaBeta: 4, uncertaintyFlag: true, notes: 'Sarcomatous uterine tumours; distinct from endometrial adenocarcinoma' },

  // ── Breast ──
  { id: 'breast-general', site: 'Breast', subsite: 'Breast (General)', tumour: 'Adenocarcinoma/DCIS', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-paget', site: 'Breast', subsite: 'Paget Disease', tumour: 'Nipple', alphaBeta: 10, abSource: 'START trials/Haviland et al' },
  { id: 'breast-tnbc', site: 'Breast', subsite: 'TNBC', tumour: 'Triple Negative', alphaBeta: 10, abSource: 'START trials/Haviland et al', notes: 'Behaves more like high-grade rapidly proliferating tumour. Based on START trials and Haviland et al.' },
  { id: 'breast-her2', site: 'Breast', subsite: 'HER2-enriched', tumour: 'HER2+', alphaBeta: 5, abLow: 4, abHigh: 6, uncertaintyFlag: true, abSource: 'START trials/Haviland et al', notes: 'Limited direct data. Based on START trials and Haviland et al.' },
  { id: 'breast-luminal-a', site: 'Breast', subsite: 'Luminal A', tumour: 'Low proliferative', alphaBeta: 3.5, abLow: 3, abHigh: 4, abSource: 'START trials/Haviland et al', notes: 'Low proliferative. Based on START trials and Haviland et al.' },
  { id: 'breast-luminal-b', site: 'Breast', subsite: 'Luminal B', tumour: 'Intermediate/High proliferative', alphaBeta: 5, abLow: 4, abHigh: 6, uncertaintyFlag: true, abSource: 'START trials/Haviland et al', notes: 'Limited direct data. Based on START trials and Haviland et al.' },

  // ── CNS ──
  { id: 'cns-hgg', site: 'CNS', subsite: 'Brain', tumour: 'High-grade glioma (GBM/AA)', alphaBeta: 10 },
  { id: 'cns-lgg', site: 'CNS', subsite: 'Brain', tumour: 'Low-grade glioma', alphaBeta: 2, abLow: 1.8, abHigh: 5, uncertaintyFlag: true, abSource: 'Extrapolated from CNS late-tissue; direct LGG data sparse (Gao et al. Radiother Oncol 2018)', notes: 'Often treated with 1.8 Gy/fx or 2.0 Gy/fx; α/β=2 is pragmatic assumption.' },
  { id: 'cns-meningioma-1', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade I', alphaBeta: 2 },
  { id: 'cns-meningioma-2', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade II/III', alphaBeta: 10 },
  { id: 'cns-acoustic', site: 'CNS', subsite: 'Acoustic Neuroma', tumour: 'Schwannoma', alphaBeta: 2 },
  { id: 'cns-ependymoma', site: 'CNS', subsite: 'Ependymoma', tumour: 'Glial', alphaBeta: 2 },
  { id: 'cns-medullo-adult', site: 'CNS', subsite: 'Medulloblastoma', tumour: 'PNET', alphaBeta: 10 },
  { id: 'cns-pineoblastoma', site: 'CNS', subsite: 'Pineoblastoma', tumour: 'Pineal', alphaBeta: 10 },
  { id: 'cns-mets', site: 'CNS', subsite: 'Brain Metastasis', tumour: 'Secondary', alphaBeta: 10, uncertaintyFlag: true, notes: 'α/β reflects most common histology; varies by primary' },
  { id: 'cns-oligo-2', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade II', alphaBeta: 2 },
  { id: 'cns-oligo-3', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade III', alphaBeta: 10 },
  { id: 'cns-pilocytic', site: 'CNS', subsite: 'Astrocytoma', tumour: 'Pilocytic (Gr I)', alphaBeta: 2 },
  { id: 'cns-hemangio', site: 'CNS', subsite: 'Hemangioblastoma', tumour: 'Vascular', alphaBeta: 2 },
  { id: 'cns-craniopharyngioma', site: 'CNS', subsite: 'Craniopharyngioma', tumour: 'Craniopharyngioma', alphaBeta: 2, notes: 'Two histological subtypes: Adamantinomatous (commonest, children) and Papillary (adults). Both α/β ≈ 2 Gy.' },

  // ── Skin ──
  { id: 'skin-nmsc', site: 'Skin', subsite: 'Non-Melanoma', tumour: 'BCC/SCC', alphaBeta: 10 },
  { id: 'skin-melanoma', site: 'Skin', subsite: 'Melanoma', tumour: 'Malignant', alphaBeta: 0.6, abLow: 0.57, abHigh: 2.5, uncertaintyFlag: true, notes: 'Wide uncertainty. Historically considered radioresistant; α/β may be very low (0.57 Gy — Bentzen 1994) supporting hypofractionation.' },
  { id: 'skin-merkel', site: 'Skin', subsite: 'Merkel Cell', tumour: 'Neuroendocrine', alphaBeta: 10 },
  { id: 'skin-mf', site: 'Skin', subsite: 'Mycosis Fungoides', tumour: 'T-cell Lymphoma', alphaBeta: 10 },
  { id: 'skin-kaposi', site: 'Skin', subsite: 'Kaposi Sarcoma', tumour: 'Vascular', alphaBeta: 10 },
  { id: 'skin-dfsp', site: 'Skin', subsite: 'DFSP', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'skin-sebaceous', site: 'Skin', subsite: 'Sebaceous Ca', tumour: 'Adnexal', alphaBeta: 10 },

  // ── Sarcoma ──
  { id: 'sarc-sts', site: 'Sarcoma', subsite: 'Soft Tissue', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'sarc-lipo-well', site: 'Sarcoma', subsite: 'Liposarcoma', tumour: 'Well-diff', alphaBeta: 2 },
  { id: 'sarc-lipo-pleo', site: 'Sarcoma', subsite: 'Liposarcoma', tumour: 'Pleomorphic', alphaBeta: 4 },
  { id: 'sarc-angio', site: 'Sarcoma', subsite: 'Angiosarcoma', tumour: 'Vascular', alphaBeta: 4 },
  { id: 'sarc-leiomyo', site: 'Sarcoma', subsite: 'Leiomyosarcoma', tumour: 'Smooth Muscle', alphaBeta: 4 },
  { id: 'sarc-rhabdo', site: 'Sarcoma', subsite: 'Rhabdomyosarcoma', tumour: 'Skeletal Muscle', alphaBeta: 10 },
  { id: 'sarc-synovial', site: 'Sarcoma', subsite: 'Synovial Sarcoma', tumour: 'Translocation', alphaBeta: 4 },
  { id: 'sarc-mfh', site: 'Sarcoma', subsite: 'MFH / UPS', tumour: 'Pleomorphic', alphaBeta: 4 },
  { id: 'sarc-fibrosarc', site: 'Sarcoma', subsite: 'Fibrosarcoma', tumour: 'Fibroblastic', alphaBeta: 4 },

  // ── Lymphoma ──
  { id: 'lym-hl', site: 'Lymphoma', subsite: 'Hodgkin', tumour: 'HL', alphaBeta: 10 },
  { id: 'lym-nhl', site: 'Lymphoma', subsite: 'Non-Hodgkin', tumour: 'NHL (DLBCL/Follicular/Mantle/T-cell/CLL)', alphaBeta: 10 },
  { id: 'lym-plasma', site: 'Lymphoma', subsite: 'Plasma Cell', tumour: 'Myeloma/Plasmacytoma', alphaBeta: 10 },

  // ── Paediatric ──
  { id: 'peds-medullo', site: 'Paediatric', subsite: 'Medulloblastoma', tumour: 'PNET', alphaBeta: 10 },
  { id: 'peds-wilms', site: 'Paediatric', subsite: 'Wilms Tumour', tumour: 'Renal', alphaBeta: 10 },
  { id: 'peds-neuro', site: 'Paediatric', subsite: 'Neuroblastoma', tumour: 'Sympathetic', alphaBeta: 10 },
  { id: 'peds-rhabdo', site: 'Paediatric', subsite: 'Rhabdomyosarcoma', tumour: 'Soft Tissue', alphaBeta: 10 },
  { id: 'peds-retino', site: 'Paediatric', subsite: 'Retinoblastoma', tumour: 'Ocular', alphaBeta: 10 },
  { id: 'peds-osteo', site: 'Paediatric', subsite: 'Osteosarcoma', tumour: 'Bone', alphaBeta: 4, clinicalContext: 'Paediatric-specific protocols and age-dependent constraints.' },
  { id: 'peds-ewing', site: 'Paediatric', subsite: 'Ewing Sarcoma', tumour: 'Bone/ST', alphaBeta: 10, clinicalContext: 'Paediatric-specific protocols and age-dependent constraints.' },
  { id: 'peds-germ', site: 'Paediatric', subsite: 'Germ Cell', tumour: 'GCT', alphaBeta: 10 },
  { id: 'peds-cranio', site: 'Paediatric', subsite: 'Craniopharyngioma', tumour: 'Epithelial', alphaBeta: 2 },
  { id: 'peds-dipg', site: 'Paediatric', subsite: 'Brainstem Glioma', tumour: 'DIPG', alphaBeta: 10 },

  // ── Bone ──
  { id: 'bone-chordoma', site: 'Bone', subsite: 'Chordoma', tumour: 'Notochordal', alphaBeta: 2 },
  { id: 'bone-chondrosarcoma', site: 'Bone', subsite: 'Chondrosarcoma', tumour: 'Cartilage', alphaBeta: 2, notes: 'Canonical entry for adult/general cases. For paediatric-specific protocols, see the Paediatric group.', clinicalContext: 'Adult/General context' },
  { id: 'bone-osteosarcoma', site: 'Bone', subsite: 'Osteosarcoma', tumour: 'Osteoid', alphaBeta: 4, notes: 'Canonical entry for adult/general cases. For paediatric-specific protocols, see the Paediatric group.', clinicalContext: 'Adult/General context' },
  { id: 'bone-ewing', site: 'Bone', subsite: 'Ewing Sarcoma', tumour: 'Small Blue Cell', alphaBeta: 10, notes: 'Canonical entry for adult/general cases. For paediatric-specific protocols, see the Paediatric group.', clinicalContext: 'Adult/General context' },
  { id: 'bone-giant-cell', site: 'Bone', subsite: 'Giant Cell', tumour: 'Osteoclastoma', alphaBeta: 4 },
  { id: 'bone-spine-mets', site: 'Bone', subsite: 'Spine', tumour: 'Spinal Metastasis', alphaBeta: 10, notes: 'Generic spinal SBRT target; primary histology determines true α/β' },

  // ── Endocrine ──
  { id: 'endo-thyroid', site: 'Endocrine', subsite: 'Thyroid', tumour: 'Papillary/Follicular', alphaBeta: 10 },
  { id: 'endo-adrenal-cort', site: 'Endocrine', subsite: 'Adrenal', tumour: 'Cortical', alphaBeta: 10 },
  { id: 'endo-pituitary-non', site: 'Endocrine', subsite: 'Pituitary', tumour: 'Adenoma', alphaBeta: 2, notes: 'Covers both functioning and non-functioning adenomas' },
  { id: 'endo-parathyroid', site: 'Endocrine', subsite: 'Parathyroid', tumour: 'Adenoma', alphaBeta: 10 },

  // ── OAR Reference ──
  { id: 'oar-cord', site: 'OAR', subsite: 'Spinal cord', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-brain', site: 'OAR', subsite: 'Brain', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-brainstem', site: 'OAR', subsite: 'Brainstem', tumour: 'N/A', alphaBeta: 2.0 },
  { id: 'oar-optic', site: 'OAR', subsite: 'Optic chiasm', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-cochlea', site: 'OAR', subsite: 'Cochlea', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-lens', site: 'OAR', subsite: 'Lens', tumour: 'N/A', alphaBeta: 1.2 },
  { id: 'oar-parotid', site: 'OAR', subsite: 'Parotid', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-rectum', site: 'OAR', subsite: 'Rectum', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-bladder', site: 'OAR', subsite: 'Bladder', tumour: 'N/A', alphaBeta: 5 },
  { id: 'oar-kidney', site: 'OAR', subsite: 'Kidney', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-liver', site: 'OAR', subsite: 'Liver', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-lung', site: 'OAR', subsite: 'Lung', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-heart', site: 'OAR', subsite: 'Heart', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-small-bowel', site: 'OAR', subsite: 'Small Bowel', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-stomach', site: 'OAR', subsite: 'Stomach', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-esophagus', site: 'OAR', subsite: 'Esophagus', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-trachea', site: 'OAR', subsite: 'Trachea', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-brachial', site: 'OAR', subsite: 'Brachial plexus', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-mandible', site: 'OAR', subsite: 'Mandible', tumour: 'N/A', alphaBeta: 3 },
  { id: 'oar-skin', site: 'OAR', subsite: 'Skin', tumour: 'N/A', alphaBeta: 3 },

  // ── Eye ──
  { id: 'eye-uveal-melanoma', site: 'Eye', subsite: 'Uveal', tumour: 'Choroidal Melanoma', alphaBeta: 1.26, abLow: 1.0, abHigh: 1.5, uncertaintyFlag: true, abSource: 'Gragoudas et al; proton RT literature', notes: 'Treated primarily with proton therapy or brachytherapy; α/β lower than cutaneous melanoma' },
].map(entry => {
  const tumour = entry.tumour.toLowerCase();
  const site = entry.site;
  
  // Default repopulation parameters
  let tk = 28;
  let k = 0.6;
  let repopNote = 'Standard repopulation (SCC-like)';
  
  // OARs and Late Effects
  if (site === 'OAR') {
    tk = 0;
    k = 0;
    repopNote = 'Late responding tissue; no clinical repopulation';
  }
  // Prostate
  else if (site === 'Genitourinary' && entry.subsite === 'Prostate') {
    tk = 0;
    k = 0;
    repopNote = 'Minimal repopulation (low alpha/beta)';
  }
  // Breast
  else if (site === 'Breast') {
    tk = 0;
    k = 0;
    repopNote = 'Minimal repopulation in adjuvant setting';
  }
  // CNS
  else if (site === 'CNS') {
    if (tumour.includes('glioblastoma') || tumour.includes('anaplastic')) {
      tk = 21;
      k = 0.4;
      repopNote = 'High-grade glioma repopulation';
    } else {
      tk = 0;
      k = 0;
      repopNote = 'Slow-growing CNS tumour';
    }
  }
  // SCLC
  else if (tumour.includes('sclc')) {
    tk = 14;
    k = 1.0;
    repopNote = 'Rapidly repopulating small cell';
  }
  // Melanoma
  else if (tumour.includes('melanoma')) {
    tk = 21;
    k = 0.2;
    repopNote = 'Slow repopulation';
  }
  // Lymphoma
  else if (site === 'Lymphoma') {
    tk = 0;
    k = 0;
    repopNote = 'Highly sensitive; repopulation usually negligible';
  }
  // Adenocarcinomas (often slower than SCC)
  else if (tumour.includes('adeno')) {
    tk = 28;
    k = 0.4;
    repopNote = 'Standard Adenocarcinoma repopulation';
  }
  // Rhabdomyosarcoma
  else if (tumour.includes('rhabdo')) {
    tk = 14;
    k = 0.5;
    repopNote = 'Rapidly proliferating; treat like aggressive SCC';
  }
  // Bladder TCC
  else if (entry.subsite === 'Bladder') {
    tk = 21;
    k = 0.35;
    repopNote = 'TCC: intermediate repopulation';
  }
  // Paediatric Medulloblastoma
  else if (entry.id === 'peds-medullo') {
    tk = 21;
    k = 0.5;
    repopNote = 'Rapidly proliferating PNET';
  }
  // Sarcomas
  else if (site === 'Sarcoma') {
    tk = 0;
    k = 0;
    repopNote = 'Variable; often minimal clinical repopulation';
  }

  return {
    ...entry,
    ab: entry.alphaBeta,
    abLow: entry.abLow ?? Math.max(0.5, entry.alphaBeta - (entry.alphaBeta > 5 ? 2 : 0.5)),
    abHigh: entry.abHigh ?? (entry.alphaBeta + (entry.alphaBeta > 5 ? 2 : 0.5)),
    tk,
    k,
    uncertaintyFlag: entry.uncertaintyFlag ?? false,
    histology: entry.tumour,
    abSource: entry.abSource ?? 'Standard Literature (Joiner & van der Kogel)',
    repopNote,
    clinicalContext: entry.clinicalContext ?? `Radiobiological parameters for ${entry.tumour} of the ${entry.subsite}.`
  };
});

export const uniqueSites: string[] = Array.from(
  new Set(MASTER_RADIOBIOLOGY_TABLE.map(t => t.site))
);
export const getSubsites = (site: string): RadiobiologyData[] =>
  MASTER_RADIOBIOLOGY_TABLE.filter(t => t.site === site);

export const getInterpretation = (k: number): { level: string; color: string; description: string } => {
  if (k <= 0.20) return { level: 'Minimal', color: 'text-green-600', description: 'Minimal OTT sensitivity' };
  if (k <= 0.40) return { level: 'Moderate', color: 'text-yellow-600', description: 'Moderate sensitivity' };
  if (k <= 0.60) return { level: 'High', color: 'text-orange-600', description: 'High sensitivity' };
  return { level: 'Very High', color: 'text-red-600', description: 'Very high accelerated repopulation' };
};
