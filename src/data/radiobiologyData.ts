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
  k?: number;
  abSource?: string;
  repopNote?: string;
  clinicalContext?: string;
}

export const MASTER_RADIOBIOLOGY_TABLE: RadiobiologyData[] = [
  // ── Head & Neck ──
  { id: 'hn-larynx', site: 'Head & Neck', subsite: 'Larynx', tumour: 'SCC', alphaBeta: 10 },
  { id: 'hn-naso', site: 'Head & Neck', subsite: 'Nasopharynx', tumour: 'SCC', alphaBeta: 10 },
  { id: 'hn-oro-hpv-neg', site: 'Head & Neck', subsite: 'Oropharynx', tumour: 'SCC HPV-', alphaBeta: 10 },
  { id: 'hn-oro-hpv-pos', site: 'Head & Neck', subsite: 'Oropharynx', tumour: 'SCC HPV+', alphaBeta: 10, abSource: 'Ang et al RTOG 0129' },
  { id: 'hn-oral-cavity', site: 'Head & Neck', subsite: 'Oral Cavity', tumour: 'SCC', alphaBeta: 10 },
  { id: 'hn-hypopharynx', site: 'Head & Neck', subsite: 'Hypopharynx', tumour: 'SCC', alphaBeta: 10 },
  { id: 'hn-salivary-adeno', site: 'Head & Neck', subsite: 'Salivary Gland', tumour: 'Adenocarcinoma', alphaBeta: 8 },
  { id: 'hn-salivary-acc', site: 'Head & Neck', subsite: 'Salivary Gland', tumour: 'Adenoid Cystic', alphaBeta: 8 },
  { id: 'hn-thyroid-ana', site: 'Head & Neck', subsite: 'Thyroid', tumour: 'Anaplastic', alphaBeta: 10 },
  { id: 'hn-thyroid-diff', site: 'Head & Neck', subsite: 'Thyroid', tumour: 'Differentiated', alphaBeta: 10 },
  { id: 'hn-sinus', site: 'Head & Neck', subsite: 'Paranasal Sinus', tumour: 'SCC/Adeno', alphaBeta: 10 },
  { id: 'hn-cup', site: 'Head & Neck', subsite: 'Unknown Primary', tumour: 'SCC', alphaBeta: 10 },
  { id: 'hn-glomus', site: 'Head & Neck', subsite: 'Glomus Tumour', tumour: 'Paraganglioma', alphaBeta: 2 },
  { id: 'hn-chordoma', site: 'Head & Neck', subsite: 'Base of Skull', tumour: 'Chordoma', alphaBeta: 2 },
  { id: 'hn-chondrosarcoma', site: 'Head & Neck', subsite: 'Base of Skull', tumour: 'Chondrosarcoma', alphaBeta: 2 },

  // ── Thoracic ──
  { id: 'thor-nsclc-adeno', site: 'Thoracic', subsite: 'Lung', tumour: 'NSCLC Adeno', alphaBeta: 10 },
  { id: 'thor-nsclc-scc', site: 'Thoracic', subsite: 'Lung', tumour: 'NSCLC SCC', alphaBeta: 10 },
  { id: 'thor-sclc', site: 'Thoracic', subsite: 'Lung', tumour: 'SCLC', alphaBeta: 10 },
  { id: 'thor-meso', site: 'Thoracic', subsite: 'Mesothelioma', tumour: 'Pleural', alphaBeta: 10 },
  { id: 'thor-thymoma', site: 'Thoracic', subsite: 'Thymoma', tumour: 'Epithelial', alphaBeta: 10 },
  { id: 'thor-thymic-ca', site: 'Thoracic', subsite: 'Thymic Carcinoma', tumour: 'SCC', alphaBeta: 10 },
  { id: 'thor-oes-scc', site: 'Thoracic', subsite: 'Oesophagus', tumour: 'SCC', alphaBeta: 10 },
  { id: 'thor-oes-adeno', site: 'Thoracic', subsite: 'Oesophagus', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'thor-chest-wall', site: 'Thoracic', subsite: 'Chest Wall', tumour: 'Recurrence', alphaBeta: 4 },
  { id: 'thor-trachea', site: 'Thoracic', subsite: 'Trachea', tumour: 'SCC', alphaBeta: 10 },

  // ── Gastrointestinal ──
  { id: 'gi-stomach', site: 'Gastrointestinal', subsite: 'Stomach', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-pancreas', site: 'Gastrointestinal', subsite: 'Pancreas', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-liver-hcc', site: 'Gastrointestinal', subsite: 'Liver', tumour: 'HCC', alphaBeta: 10 },
  { id: 'gi-liver-chol', site: 'Gastrointestinal', subsite: 'Liver', tumour: 'Cholangiocarcinoma', alphaBeta: 10 },
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
  { id: 'gu-pros-low', site: 'Genitourinary', subsite: 'Prostate', tumour: 'Low risk', alphaBeta: 1.5, abLow: 1.0, abHigh: 1.85, uncertaintyFlag: true, abSource: 'Brenner & Hall 1999; Dasu 2007; CHHiP Dearnaley 2016' },
  { id: 'gu-pros-int', site: 'Genitourinary', subsite: 'Prostate', tumour: 'Intermediate', alphaBeta: 1.5, abLow: 1.0, abHigh: 1.85, uncertaintyFlag: true, abSource: 'Brenner & Hall 1999; Dasu 2007; CHHiP Dearnaley 2016' },
  { id: 'gu-pros-high', site: 'Genitourinary', subsite: 'Prostate', tumour: 'High risk', alphaBeta: 1.5, abLow: 1.0, abHigh: 1.85, uncertaintyFlag: true, abSource: 'Brenner & Hall 1999; Dasu 2007; CHHiP Dearnaley 2016' },
  { id: 'gu-bladder', site: 'Genitourinary', subsite: 'Bladder', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-renal-clear', site: 'Genitourinary', subsite: 'Renal Cell', tumour: 'Clear cell', alphaBeta: 10 },
  { id: 'gu-renal-nonclear', site: 'Genitourinary', subsite: 'Renal Cell', tumour: 'Non-clear', alphaBeta: 10 },
  { id: 'gu-testis-semi', site: 'Genitourinary', subsite: 'Testis', tumour: 'Seminoma', alphaBeta: 10 },
  { id: 'gu-testis-nonsemi', site: 'Genitourinary', subsite: 'Testis', tumour: 'Non-seminoma', alphaBeta: 10 },
  { id: 'gu-penile', site: 'Genitourinary', subsite: 'Penile', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gu-ureter', site: 'Genitourinary', subsite: 'Ureter', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-urethra', site: 'Genitourinary', subsite: 'Urethra', tumour: 'SCC', alphaBeta: 10 },

  // ── Gynaecological ──
  { id: 'gyn-cervix-scc', site: 'Gynaecological', subsite: 'Cervix', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gyn-cervix-adeno', site: 'Gynaecological', subsite: 'Cervix', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gyn-endo-adeno', site: 'Gynaecological', subsite: 'Endometrium', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gyn-endo-serous', site: 'Gynaecological', subsite: 'Endometrium', tumour: 'Serous', alphaBeta: 10 },
  { id: 'gyn-vulva', site: 'Gynaecological', subsite: 'Vulva', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gyn-vagina', site: 'Gynaecological', subsite: 'Vagina', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gyn-ovary-epi', site: 'Gynaecological', subsite: 'Ovary', tumour: 'Epithelial', alphaBeta: 10 },
  { id: 'gyn-ovary-germ', site: 'Gynaecological', subsite: 'Ovary', tumour: 'Germ cell', alphaBeta: 10 },
  { id: 'gyn-fallopian', site: 'Gynaecological', subsite: 'Fallopian Tube', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gyn-chorioca', site: 'Gynaecological', subsite: 'Choriocarcinoma', tumour: 'Germ cell', alphaBeta: 10 },
  { id: 'gyn-gtn', site: 'Gynaecological', subsite: 'GTN', tumour: 'Trophoblastic', alphaBeta: 10 },
  { id: 'gyn-bartholin', site: 'Gynaecological', subsite: 'Bartholin Gland', tumour: 'Adeno/SCC', alphaBeta: 10 },
  { id: 'gyn-uterine-sarc', site: 'Gynaecological', subsite: 'Uterus', tumour: 'LMS/Carcinosarcoma', alphaBeta: 4, uncertaintyFlag: true, notes: 'Sarcomatous uterine tumours; distinct from endometrial adenocarcinoma' },

  // ── Breast ──
  { id: 'breast-whole', site: 'Breast', subsite: 'Whole Breast', tumour: 'Adjuvant', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-partial', site: 'Breast', subsite: 'Partial Breast', tumour: 'APBI', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-chest-wall', site: 'Breast', subsite: 'Chest Wall', tumour: 'Post-mastectomy', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-dcis', site: 'Breast', subsite: 'DCIS', tumour: 'Intraductal', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-inflammatory', site: 'Breast', subsite: 'Inflammatory', tumour: 'Adenocarcinoma', alphaBeta: 4, uncertaintyFlag: true, abSource: 'START trials/Haviland et al' },
  { id: 'breast-recurrent', site: 'Breast', subsite: 'Recurrent', tumour: 'Adenocarcinoma', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-male', site: 'Breast', subsite: 'Male Breast', tumour: 'Adenocarcinoma', alphaBeta: 4, abSource: 'START trials/Haviland et al' },
  { id: 'breast-paget', site: 'Breast', subsite: 'Paget Disease', tumour: 'Nipple', alphaBeta: 10, abSource: 'START trials/Haviland et al' },
  { id: 'breast-tnbc', site: 'Breast', subsite: 'TNBC', tumour: 'Triple Negative', alphaBeta: 10, abSource: 'START trials/Haviland et al', notes: 'High Ki-67; rapidly proliferating. Gap compensation needed. Based on START trials and Haviland et al.' },
  { id: 'breast-her2', site: 'Breast', subsite: 'HER2-enriched', tumour: 'HER2+', alphaBeta: 5, abLow: 4, abHigh: 6, uncertaintyFlag: true, abSource: 'START trials/Haviland et al', notes: 'High proliferation index. Limited direct data. Based on START trials and Haviland et al.' },
  { id: 'breast-luminal-a', site: 'Breast', subsite: 'Luminal A', tumour: 'Low proliferative', alphaBeta: 3.5, abLow: 3, abHigh: 4, abSource: 'START trials/Haviland et al', notes: 'Low Ki-67; minimal repopulation. Based on START trials and Haviland et al.' },
  { id: 'breast-luminal-b', site: 'Breast', subsite: 'Luminal B', tumour: 'Intermediate/High proliferative', alphaBeta: 5, abLow: 4, abHigh: 6, uncertaintyFlag: true, abSource: 'START trials/Haviland et al', notes: 'Intermediate Ki-67; moderate repopulation. Based on START trials and Haviland et al.' },

  // ── CNS ──
  { id: 'cns-gbm', site: 'CNS', subsite: 'Brain', tumour: 'Glioblastoma', alphaBeta: 10 },
  { id: 'cns-aa', site: 'CNS', subsite: 'Brain', tumour: 'Anaplastic Astrocytoma', alphaBeta: 10 },
  { id: 'cns-lgg', site: 'CNS', subsite: 'Brain', tumour: 'Low-grade glioma', alphaBeta: 2 },
  { id: 'cns-meningioma-1', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade I', alphaBeta: 2 },
  { id: 'cns-meningioma-2', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade II/III', alphaBeta: 10 },
  { id: 'cns-acoustic', site: 'CNS', subsite: 'Acoustic Neuroma', tumour: 'Schwannoma', alphaBeta: 2 },
  { id: 'cns-ependymoma', site: 'CNS', subsite: 'Ependymoma', tumour: 'Glial', alphaBeta: 2 },
  { id: 'cns-medullo-adult', site: 'CNS', subsite: 'Medulloblastoma', tumour: 'PNET', alphaBeta: 10 },
  { id: 'cns-pineoblastoma', site: 'CNS', subsite: 'Pineoblastoma', tumour: 'Pineal', alphaBeta: 10 },
  { id: 'cns-mets', site: 'CNS', subsite: 'Brain Metastasis', tumour: 'Secondary', alphaBeta: 10, uncertaintyFlag: true, notes: 'α/β reflects most common histology; varies by primary. Use primary site k value for gap calculation.' },
  { id: 'cns-oligo-2', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade II', alphaBeta: 2 },
  { id: 'cns-oligo-3', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade III', alphaBeta: 10 },
  { id: 'cns-pilocytic', site: 'CNS', subsite: 'Astrocytoma', tumour: 'Pilocytic (Gr I)', alphaBeta: 2 },
  { id: 'cns-hemangio', site: 'CNS', subsite: 'Hemangioblastoma', tumour: 'Vascular', alphaBeta: 2 },
  { id: 'cns-craniopharyngioma', site: 'CNS', subsite: 'Craniopharyngioma', tumour: 'Craniopharyngioma', alphaBeta: 2, notes: 'Two histological subtypes: Adamantinomatous (commonest, children) and Papillary (adults). Both α/β ≈ 2 Gy.' },

  // ── Skin ──
  { id: 'skin-bcc', site: 'Skin', subsite: 'BCC', tumour: 'Basal Cell', alphaBeta: 10 },
  { id: 'skin-scc', site: 'Skin', subsite: 'SCC', tumour: 'Squamous Cell', alphaBeta: 10 },
  { id: 'skin-melanoma', site: 'Skin', subsite: 'Melanoma', tumour: 'Malignant', alphaBeta: 2.5, abLow: 0.57, abHigh: 2.5, uncertaintyFlag: true, notes: 'Wide uncertainty range. Low α/β supports hypofractionation. Bentzen & Overgaard 1994.' },
  { id: 'skin-merkel', site: 'Skin', subsite: 'Merkel Cell', tumour: 'Neuroendocrine', alphaBeta: 10 },
  { id: 'skin-mf', site: 'Skin', subsite: 'Mycosis Fungoides', tumour: 'T-cell Lymphoma', alphaBeta: 10 },
  { id: 'skin-kaposi', site: 'Skin', subsite: 'Kaposi Sarcoma', tumour: 'Vascular', alphaBeta: 10 },
  { id: 'skin-dfsp', site: 'Skin', subsite: 'DFSP', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'skin-sebaceous', site: 'Skin', subsite: 'Sebaceous Ca', tumour: 'Adnexal', alphaBeta: 10 },

  // ── Sarcoma ──
  { id: 'sarc-sts-high', site: 'Sarcoma', subsite: 'Soft Tissue', tumour: 'High grade', alphaBeta: 4 },
  { id: 'sarc-sts-low', site: 'Sarcoma', subsite: 'Soft Tissue', tumour: 'Low grade', alphaBeta: 4 },
  { id: 'sarc-lipo-well', site: 'Sarcoma', subsite: 'Liposarcoma', tumour: 'Well-diff', alphaBeta: 2 },
  { id: 'sarc-lipo-pleo', site: 'Sarcoma', subsite: 'Liposarcoma', tumour: 'Pleomorphic', alphaBeta: 4 },
  { id: 'sarc-angio', site: 'Sarcoma', subsite: 'Angiosarcoma', tumour: 'Vascular', alphaBeta: 4 },
  { id: 'sarc-leiomyo', site: 'Sarcoma', subsite: 'Leiomyosarcoma', tumour: 'Smooth Muscle', alphaBeta: 4 },
  { id: 'sarc-rhabdo', site: 'Sarcoma', subsite: 'Rhabdomyosarcoma', tumour: 'Skeletal Muscle', alphaBeta: 10 },
  { id: 'sarc-synovial', site: 'Sarcoma', subsite: 'Synovial Sarcoma', tumour: 'Translocation', alphaBeta: 4 },
  { id: 'sarc-mfh', site: 'Sarcoma', subsite: 'MFH / UPS', tumour: 'Pleomorphic', alphaBeta: 4 },
  { id: 'sarc-fibrosarc', site: 'Sarcoma', subsite: 'Fibrosarcoma', tumour: 'Fibroblastic', alphaBeta: 4 },

  // ── Lymphoma ──
  { id: 'lym-hodgkin', site: 'Lymphoma', subsite: 'Hodgkin', tumour: 'HL', alphaBeta: 10 },
  { id: 'lym-dlbcl', site: 'Lymphoma', subsite: 'DLBCL', tumour: 'NHL', alphaBeta: 10 },
  { id: 'lym-follicular', site: 'Lymphoma', subsite: 'Follicular', tumour: 'NHL', alphaBeta: 10 },
  { id: 'lym-mantle', site: 'Lymphoma', subsite: 'Mantle Cell', tumour: 'NHL', alphaBeta: 10 },
  { id: 'lym-tcell', site: 'Lymphoma', subsite: 'T-cell', tumour: 'NHL', alphaBeta: 10 },
  { id: 'lym-myeloma', site: 'Lymphoma', subsite: 'Multiple Myeloma', tumour: 'Plasma Cell', alphaBeta: 10 },
  { id: 'lym-plasmacytoma', site: 'Lymphoma', subsite: 'Plasmacytoma', tumour: 'Plasma Cell', alphaBeta: 10 },
  { id: 'lym-cll', site: 'Lymphoma', subsite: 'CLL/SLL', tumour: 'NHL', alphaBeta: 10 },

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
  { id: 'endo-thyroid-pap', site: 'Endocrine', subsite: 'Thyroid', tumour: 'Papillary', alphaBeta: 10 },
  { id: 'endo-thyroid-fol', site: 'Endocrine', subsite: 'Thyroid', tumour: 'Follicular', alphaBeta: 10 },
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

  // ─────────────────────────────────────────────────────────────────────────
  // ID-BASED REPOPULATION LOOKUP TABLE
  // Priority 1: exact entry-id overrides (safest — avoids substring bugs)
  // Reference: Withers 1988; Mauguen 2012 meta-analysis; Kim 2018; Ang 2010
  // ─────────────────────────────────────────────────────────────────────────
  const ID_REPOP: Record<string, { k: number; tk: number; repopNote: string }> = {

    // ── Head & Neck ──────────────────────────────────────────────────────
    // Withers HR et al. Acta Oncol 1988; Hendry JH et al. Radiother Oncol 1993
    'hn-larynx':         { k: 0.6, tk: 21, repopNote: 'SCC larynx: accelerated repopulation begins ~day 21. Withers 1988.' },
    'hn-naso':           { k: 0.7, tk: 21, repopNote: 'NPC: higher k than typical SCC. Chan IJROBP 2004; Yau 2008.' },
    'hn-oro-hpv-neg':    { k: 0.6, tk: 21, repopNote: 'HPV− oropharynx SCC: standard high repopulation. Withers 1988.' },
    'hn-oro-hpv-pos':    { k: 0.3, tk: 28, repopNote: 'HPV+ oropharynx: slower repopulation than HPV−. Ang NEJM 2010; Lassen IJROBP 2010.' },
    'hn-oral-cavity':    { k: 0.6, tk: 21, repopNote: 'Oral cavity SCC: standard SCC repopulation.' },
    'hn-hypopharynx':    { k: 0.6, tk: 21, repopNote: 'Hypopharynx SCC: standard SCC repopulation.' },
    'hn-salivary-adeno': { k: 0.3, tk: 28, repopNote: 'Salivary adenocarcinoma: slower than SCC.' },
    'hn-salivary-acc':   { k: 0.1, tk: 0,  repopNote: 'Adenoid Cystic Carcinoma: very slow growth; near-negligible repopulation. Licitra 2013.' },
    'hn-thyroid-ana':    { k: 0.5, tk: 21, repopNote: 'Anaplastic thyroid: rapidly growing; treat urgently.' },
    'hn-thyroid-diff':   { k: 0.1, tk: 0,  repopNote: 'Differentiated thyroid: very slow; primarily I-131 treated.' },
    'hn-sinus':          { k: 0.6, tk: 21, repopNote: 'Paranasal SCC: standard SCC repopulation.' },
    'hn-cup':            { k: 0.6, tk: 21, repopNote: 'CUP SCC: treat as H&N SCC.' },
    'hn-glomus':         { k: 0.0, tk: 0,  repopNote: 'Paraganglioma: very slow growth; negligible repopulation.' },
    'hn-chordoma':       { k: 0.0, tk: 0,  repopNote: 'Chordoma: extremely slow; no meaningful repopulation.' },
    'hn-chondrosarcoma': { k: 0.0, tk: 0,  repopNote: 'Chondrosarcoma: very slow; no meaningful repopulation.' },

    // ── Thoracic ────────────────────────────────────────────────────────
    // CRITICAL FIX: NSCLC must be matched by ID not tumour string
    // (tumour string 'NSCLC Adeno' contains substring 'sclc' — old code gave k=1.0 by mistake)
    // Mauguen A et al. J Clin Oncol 2012 (meta-analysis OTT in lung)
    'thor-nsclc-adeno':  { k: 0.4, tk: 28, repopNote: 'NSCLC Adenocarcinoma: moderate repopulation. Mauguen JCO 2012 meta-analysis.' },
    'thor-nsclc-scc':    { k: 0.6, tk: 21, repopNote: 'NSCLC SCC: higher repopulation than adenocarcinoma. Mauguen JCO 2012.' },
    'thor-sclc':         { k: 1.0, tk: 14, repopNote: 'SCLC: very rapid repopulation; OTT critically important. Saunders 1997.' },
    'thor-meso':         { k: 0.2, tk: 28, repopNote: 'Mesothelioma: slow-growing; low repopulation rate.' },
    'thor-thymoma':      { k: 0.1, tk: 0,  repopNote: 'Thymoma: slow-growing; minimal repopulation.' },
    'thor-thymic-ca':    { k: 0.4, tk: 28, repopNote: 'Thymic carcinoma: moderate repopulation.' },
    'thor-oes-scc':      { k: 0.6, tk: 21, repopNote: 'Oesophagus SCC: high repopulation; gap clinically important. Geh 2006.' },
    'thor-oes-adeno':    { k: 0.4, tk: 28, repopNote: 'Oesophagus adenocarcinoma: moderate repopulation. Geh 2006.' },
    'thor-chest-wall':   { k: 0.2, tk: 28, repopNote: 'Chest wall recurrence: slow repopulation.' },
    'thor-trachea':      { k: 0.6, tk: 21, repopNote: 'Tracheal SCC: standard SCC repopulation.' },

    // ── Gastrointestinal ─────────────────────────────────────────────────
    'gi-stomach':        { k: 0.4, tk: 28, repopNote: 'Gastric adenocarcinoma: moderate repopulation.' },
    'gi-pancreas':       { k: 0.2, tk: 28, repopNote: 'Pancreatic adenocarcinoma: slow repopulation; stroma-dominant biology.' },
    'gi-liver-hcc':      { k: 0.3, tk: 28, repopNote: 'HCC: moderate-slow repopulation. Choi 2008.' },
    'gi-liver-chol':     { k: 0.2, tk: 28, repopNote: 'Cholangiocarcinoma: slow repopulation.' },
    'gi-rectum':         { k: 0.4, tk: 28, repopNote: 'Rectal adenocarcinoma: moderate repopulation.' },
    'gi-anal':           { k: 0.6, tk: 21, repopNote: 'Anal SCC: high repopulation; standard SCC behaviour. Ben-Josef; Cummings.' },
    'gi-colon':          { k: 0.3, tk: 28, repopNote: 'Colon adenocarcinoma: moderate-slow repopulation.' },
    'gi-small-bowel':    { k: 0.3, tk: 28, repopNote: 'Small bowel adenocarcinoma: moderate-slow repopulation.' },
    'gi-gist':           { k: 0.0, tk: 0,  repopNote: 'GIST: poorly radiosensitive; no meaningful repopulation.' },
    'gi-net':            { k: 0.1, tk: 0,  repopNote: 'NET: very slow growth; negligible repopulation.' },
    'gi-gallbladder':    { k: 0.3, tk: 28, repopNote: 'Gallbladder adenocarcinoma: moderate-slow.' },
    'gi-biliary':        { k: 0.2, tk: 28, repopNote: 'Biliary adenocarcinoma: slow.' },
    'gi-retro-sarcoma':  { k: 0.2, tk: 28, repopNote: 'Retroperitoneal sarcoma: moderate-slow.' },
    'gi-perit-meso':     { k: 0.2, tk: 28, repopNote: 'Peritoneal mesothelioma: slow.' },
    'gi-omental':        { k: 0.3, tk: 28, repopNote: 'Omental metastasis: variable; use primary histology.' },

    // ── Genitourinary ────────────────────────────────────────────────────
    'gu-pros-low':       { k: 0.0, tk: 0,  repopNote: 'Prostate low risk: negligible repopulation (very low α/β). Brenner & Hall 1999.' },
    'gu-pros-int':       { k: 0.0, tk: 0,  repopNote: 'Prostate intermediate: negligible repopulation. CHHiP Dearnaley 2016.' },
    'gu-pros-high':      { k: 0.0, tk: 0,  repopNote: 'Prostate high risk: negligible repopulation even high-risk disease.' },
    'gu-bladder':        { k: 0.35, tk: 21, repopNote: 'Bladder TCC: intermediate repopulation. Bentzen & Joiner.' },
    'gu-renal-clear':    { k: 0.2, tk: 28, repopNote: 'Renal clear cell: slow repopulation; often uses SBRT.' },
    'gu-renal-nonclear': { k: 0.2, tk: 28, repopNote: 'Renal non-clear cell: slow repopulation.' },
    'gu-testis-semi':    { k: 0.0, tk: 0,  repopNote: 'Seminoma: exquisitely radiosensitive; negligible repopulation issue.' },
    'gu-testis-nonsemi': { k: 0.2, tk: 28, repopNote: 'Non-seminoma GCT: slow.' },
    'gu-penile':         { k: 0.6, tk: 21, repopNote: 'Penile SCC: standard SCC repopulation.' },
    'gu-ureter':         { k: 0.35, tk: 21, repopNote: 'Ureteric TCC: similar to bladder TCC.' },
    'gu-urethra':        { k: 0.6, tk: 21, repopNote: 'Urethral SCC: standard SCC repopulation.' },

    // ── Gynaecological ───────────────────────────────────────────────────
    // Fyles AW et al. IJROBP 1992; Perez CA et al. IJROBP 2004
    'gyn-cervix-scc':    { k: 0.6, tk: 21, repopNote: 'Cervix SCC: OTT critically important. ≤8 weeks total. Fyles 1992; Perez 2004.' },
    'gyn-cervix-adeno':  { k: 0.4, tk: 28, repopNote: 'Cervix adenocarcinoma: moderate repopulation; less OTT-sensitive than SCC.' },
    'gyn-endo-adeno':    { k: 0.3, tk: 28, repopNote: 'Endometrial adenocarcinoma: slow repopulation. Kim 2012.' },
    'gyn-endo-serous':   { k: 0.4, tk: 21, repopNote: 'Serous endometrial: higher grade; more repopulation.' },
    'gyn-vulva':         { k: 0.6, tk: 21, repopNote: 'Vulval SCC: standard SCC repopulation.' },
    'gyn-vagina':        { k: 0.6, tk: 21, repopNote: 'Vaginal SCC: standard SCC repopulation.' },
    'gyn-ovary-epi':     { k: 0.2, tk: 28, repopNote: 'Epithelial ovarian: slow repopulation; chemo-dominated.' },
    'gyn-ovary-germ':    { k: 0.3, tk: 21, repopNote: 'Germ cell ovarian: moderate.' },
    'gyn-fallopian':     { k: 0.2, tk: 28, repopNote: 'Fallopian tube adenocarcinoma: slow.' },
    'gyn-chorioca':      { k: 0.3, tk: 14, repopNote: 'Choriocarcinoma: rapidly proliferating germ cell.' },
    'gyn-gtn':           { k: 0.2, tk: 21, repopNote: 'GTN: moderate.' },
    'gyn-bartholin':     { k: 0.5, tk: 21, repopNote: 'Bartholin gland: treat as SCC/adeno.' },
    'gyn-uterine-sarc':  { k: 0.2, tk: 28, repopNote: 'Uterine LMS/carcinosarcoma: sarcoma-type; moderate.' },

    // ── Breast ──────────────────────────────────────────────────────────
    // CRITICAL FIX: each subtype has different proliferative biology
    // Kim JJ et al. Breast Cancer Res 2018; Yarnold J START; Haviland 2013
    'breast-whole':        { k: 0.0, tk: 0,  repopNote: 'Luminal adjuvant breast: negligible repopulation in adjuvant setting. START trials.' },
    'breast-partial':      { k: 0.0, tk: 0,  repopNote: 'APBI: short course; repopulation minimal.' },
    'breast-chest-wall':   { k: 0.1, tk: 28, repopNote: 'Post-mastectomy chest wall: low repopulation.' },
    'breast-dcis':         { k: 0.0, tk: 0,  repopNote: 'DCIS: non-invasive; no meaningful repopulation.' },
    'breast-inflammatory': { k: 0.5, tk: 14, repopNote: 'Inflammatory breast cancer (IBC): rapid repopulation — treat gaps urgently. Kim 2018.' },
    'breast-recurrent':    { k: 0.3, tk: 21, repopNote: 'Recurrent breast: re-proliferation after prior RT; treat as moderate.' },
    'breast-male':         { k: 0.1, tk: 28, repopNote: 'Male breast: typically ER+/luminal; low repopulation.' },
    'breast-paget':        { k: 0.1, tk: 28, repopNote: 'Paget disease: slow surface disease.' },
    'breast-tnbc':         { k: 0.5, tk: 14, repopNote: 'TNBC: high Ki-67; rapid repopulation comparable to SCC. Kim JJ Breast Cancer Res 2018.' },
    'breast-her2':         { k: 0.4, tk: 21, repopNote: 'HER2-enriched: high proliferation index; moderate-high repopulation.' },
    'breast-luminal-a':    { k: 0.1, tk: 0,  repopNote: 'Luminal A: low Ki-67; minimal repopulation.' },
    'breast-luminal-b':    { k: 0.3, tk: 21, repopNote: 'Luminal B: intermediate Ki-67; moderate repopulation.' },

    // ── CNS ─────────────────────────────────────────────────────────────
    'cns-gbm':             { k: 0.4, tk: 21, repopNote: 'GBM: significant repopulation; Stupp 60Gy/6wks designed around this. Liang 2006.' },
    'cns-aa':              { k: 0.4, tk: 21, repopNote: 'Anaplastic astrocytoma: moderate-high repopulation.' },
    'cns-lgg':             { k: 0.0, tk: 0,  repopNote: 'Low-grade glioma: very slow growth; negligible repopulation.' },
    'cns-meningioma-1':    { k: 0.0, tk: 0,  repopNote: 'Grade I meningioma: very slow; no repopulation concern.' },
    'cns-meningioma-2':    { k: 0.2, tk: 28, repopNote: 'Grade II/III meningioma: some proliferation.' },
    'cns-acoustic':        { k: 0.0, tk: 0,  repopNote: 'Acoustic neuroma/schwannoma: very slow; no repopulation.' },
    'cns-ependymoma':      { k: 0.1, tk: 0,  repopNote: 'Ependymoma: slow; minimal repopulation.' },
    'cns-medullo-adult':   { k: 0.4, tk: 21, repopNote: 'Adult medulloblastoma/PNET: moderate-high repopulation.' },
    'cns-pineoblastoma':   { k: 0.4, tk: 21, repopNote: 'Pineoblastoma: rapidly proliferating pineal PNET.' },
    'cns-mets':            { k: 0.6, tk: 21, repopNote: 'Brain mets: k reflects most common SCC/adenocarcinoma primaries. Use primary-site value for accuracy.' },
    'cns-oligo-2':         { k: 0.0, tk: 0,  repopNote: 'Oligodendroglioma Grade II: slow; minimal repopulation.' },
    'cns-oligo-3':         { k: 0.3, tk: 21, repopNote: 'Oligodendroglioma Grade III: moderate repopulation.' },
    'cns-pilocytic':       { k: 0.0, tk: 0,  repopNote: 'Pilocytic astrocytoma: very slow; negligible repopulation.' },
    'cns-hemangio':        { k: 0.0, tk: 0,  repopNote: 'Hemangioblastoma: very slow vascular tumour.' },
    'cns-craniopharyngioma': { k: 0.0, tk: 0, repopNote: 'Craniopharyngioma: slow; no meaningful repopulation.' },

    // ── Skin ────────────────────────────────────────────────────────────
    'skin-bcc':            { k: 0.2, tk: 28, repopNote: 'BCC: slow-growing; low repopulation.' },
    'skin-scc':            { k: 0.5, tk: 21, repopNote: 'Skin SCC: moderate-high repopulation.' },
    'skin-melanoma':       { k: 0.2, tk: 21, repopNote: 'Cutaneous melanoma: slow repopulation. Bentzen & Overgaard 1994.' },
    'skin-merkel':         { k: 0.5, tk: 14, repopNote: 'Merkel cell carcinoma: fast-growing neuroendocrine; higher repopulation.' },
    'skin-mf':             { k: 0.0, tk: 0,  repopNote: 'Mycosis fungoides: exquisitely radiosensitive; negligible repopulation.' },
    'skin-kaposi':         { k: 0.3, tk: 21, repopNote: 'Kaposi sarcoma: moderate.' },
    'skin-dfsp':           { k: 0.2, tk: 28, repopNote: 'DFSP: slow-growing sarcoma.' },
    'skin-sebaceous':      { k: 0.3, tk: 28, repopNote: 'Sebaceous carcinoma: moderate.' },

    // ── Sarcoma ─────────────────────────────────────────────────────────
    // CRITICAL FIX: sarc-rhabdo tumour='Skeletal Muscle' — string match fails; use ID
    'sarc-sts-high':       { k: 0.3, tk: 28, repopNote: 'High-grade STS: some repopulation; overall time moderately important.' },
    'sarc-sts-low':        { k: 0.1, tk: 28, repopNote: 'Low-grade STS: minimal repopulation.' },
    'sarc-lipo-well':      { k: 0.0, tk: 0,  repopNote: 'Well-differentiated liposarcoma: negligible repopulation.' },
    'sarc-lipo-pleo':      { k: 0.2, tk: 28, repopNote: 'Pleomorphic liposarcoma: low-moderate.' },
    'sarc-angio':          { k: 0.3, tk: 21, repopNote: 'Angiosarcoma: moderately proliferative.' },
    'sarc-leiomyo':        { k: 0.1, tk: 0,  repopNote: 'Leiomyosarcoma: slow smooth muscle origin; minimal repopulation.' },
    'sarc-rhabdo':         { k: 0.5, tk: 14, repopNote: 'Rhabdomyosarcoma: rapid proliferation; gap compensation important.' },
    'sarc-synovial':       { k: 0.2, tk: 28, repopNote: 'Synovial sarcoma: moderate.' },
    'sarc-mfh':            { k: 0.3, tk: 28, repopNote: 'MFH/UPS: moderate repopulation.' },
    'sarc-fibrosarc':      { k: 0.2, tk: 28, repopNote: 'Fibrosarcoma: moderate-low.' },

    // ── Lymphoma ────────────────────────────────────────────────────────
    'lym-hodgkin':         { k: 0.0, tk: 0,  repopNote: 'Hodgkin lymphoma: exquisitely radiosensitive; repopulation not a clinical issue.' },
    'lym-dlbcl':           { k: 0.3, tk: 14, repopNote: 'DLBCL: aggressive; some repopulation concern with prolonged gaps.' },
    'lym-follicular':      { k: 0.0, tk: 0,  repopNote: 'Follicular NHL: indolent; no significant repopulation.' },
    'lym-mantle':          { k: 0.3, tk: 14, repopNote: 'Mantle cell: aggressive NHL; moderate repopulation.' },
    'lym-tcell':           { k: 0.1, tk: 0,  repopNote: 'T-cell NHL: generally radiosensitive; low repopulation.' },
    'lym-myeloma':         { k: 0.0, tk: 0,  repopNote: 'Multiple myeloma: palliative RT; repopulation not typically relevant.' },
    'lym-plasmacytoma':    { k: 0.0, tk: 0,  repopNote: 'Plasmacytoma: highly radiosensitive; negligible repopulation.' },
    'lym-cll':             { k: 0.0, tk: 0,  repopNote: 'CLL/SLL: indolent; exquisitely radiosensitive.' },

    // ── Paediatric ──────────────────────────────────────────────────────
    // CRITICAL FIX: peds-rhabdo tumour='Soft Tissue', peds-neuro tumour='Sympathetic'
    // — these did NOT match the tumour-string rhabdo/sclc checks in old code
    'peds-medullo':        { k: 0.5, tk: 21, repopNote: 'Paediatric medulloblastoma: moderately rapid proliferation. Bouffet E.' },
    'peds-wilms':          { k: 0.4, tk: 21, repopNote: 'Wilms tumour: moderate repopulation; OTT matters. Kellie & Tait.' },
    'peds-neuro':          { k: 0.8, tk: 7,  repopNote: 'Neuroblastoma: extremely rapid repopulation; one of the fastest among paediatric tumours. Pearson 1997.' },
    'peds-rhabdo':         { k: 0.5, tk: 14, repopNote: 'Paediatric rhabdomyosarcoma: rapid proliferation; gaps significantly impact outcome.' },
    'peds-retino':         { k: 0.3, tk: 21, repopNote: 'Retinoblastoma: moderate repopulation.' },
    'peds-osteo':          { k: 0.2, tk: 28, repopNote: 'Paediatric osteosarcoma: low repopulation; chemo-dominant biology.' },
    'peds-ewing':          { k: 0.7, tk: 14, repopNote: 'Ewing sarcoma: highly proliferative small-round-cell tumour; gap compensation important.' },
    'peds-germ':           { k: 0.3, tk: 21, repopNote: 'Paediatric GCT: moderate repopulation.' },
    'peds-cranio':         { k: 0.0, tk: 0,  repopNote: 'Craniopharyngioma: very slow; no repopulation.' },
    'peds-dipg':           { k: 0.4, tk: 21, repopNote: 'DIPG: moderate repopulation; OTT important given poor prognosis.' },

    // ── Bone ────────────────────────────────────────────────────────────
    'bone-chordoma':       { k: 0.0, tk: 0,  repopNote: 'Chordoma: notochordal remnant; extremely slow growth.' },
    'bone-chondrosarcoma': { k: 0.0, tk: 0,  repopNote: 'Chondrosarcoma: very slow; negligible repopulation.' },
    'bone-osteosarcoma':   { k: 0.2, tk: 28, repopNote: 'Osteosarcoma: moderate repopulation; chemo-dominant.' },
    'bone-ewing':          { k: 0.7, tk: 14, repopNote: 'Ewing sarcoma (bone): highly proliferative; same as soft-tissue Ewing.' },
    'bone-giant-cell':     { k: 0.1, tk: 28, repopNote: 'Giant cell tumour: slow; minimal repopulation.' },
    'bone-spine-mets':     { k: 0.5, tk: 21, repopNote: 'Spinal metastasis: use primary histology k for accuracy. Default assumes moderate.' },

    // ── Endocrine ────────────────────────────────────────────────────────
    'endo-thyroid-pap':    { k: 0.1, tk: 0,  repopNote: 'Papillary thyroid: slow; primarily managed with I-131.' },
    'endo-thyroid-fol':    { k: 0.1, tk: 0,  repopNote: 'Follicular thyroid: slow; primarily managed with I-131.' },
    'endo-adrenal-cort':   { k: 0.2, tk: 28, repopNote: 'Adrenocortical carcinoma: moderate-slow.' },
    'endo-pituitary-non':  { k: 0.0, tk: 0,  repopNote: 'Pituitary adenoma: very slow; negligible repopulation.' },
    'endo-parathyroid':    { k: 0.0, tk: 0,  repopNote: 'Parathyroid adenoma: very slow.' },

    // ── OAR Reference ────────────────────────────────────────────────────
    'oar-cord':            { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-brain':           { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-brainstem':       { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-optic':           { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-cochlea':         { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-lens':            { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-parotid':         { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-rectum':          { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-bladder':         { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-kidney':          { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-liver':           { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-lung':            { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-heart':           { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-small-bowel':     { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-stomach':         { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-esophagus':       { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-trachea':         { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-brachial':        { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-mandible':        { k: 0.0, tk: 0,  repopNote: 'Late-responding normal tissue: no repopulation.' },
    'oar-skin':            { k: 0.0, tk: 0,  repopNote: 'Skin OAR: late effect context; no repopulation.' },

    // ── Eye ─────────────────────────────────────────────────────────────
    'eye-uveal-melanoma':  { k: 0.1, tk: 28, repopNote: 'Uveal melanoma: very slow repopulation. Gragoudas et al.' },
  };

  // ── Apply ID-based lookup first (priority) ─────────────────────────────
  const repop = ID_REPOP[entry.id];

  // ── Safe α/β alias ─────────────────────────────────────────────────────
  const safeAb = entry.alphaBeta;

  if (repop) {
    return {
      ...entry,
      ab: safeAb,
      abLow: entry.abLow ?? Math.max(0.5, safeAb - (safeAb > 5 ? 2 : 0.5)),
      abHigh: entry.abHigh ?? (safeAb + (safeAb > 5 ? 2 : 0.5)),
      tk: repop.tk,
      k: repop.k,
      uncertaintyFlag: entry.uncertaintyFlag ?? false,
      histology: entry.tumour,
      abSource: entry.abSource ?? 'Standard Literature (Joiner & van der Kogel)',
      repopNote: repop.repopNote,
      clinicalContext: entry.clinicalContext ?? `Radiobiological parameters for ${entry.tumour} of the ${entry.subsite}.`,
    };
  }

  // ── Fallback for any entry not in ID_REPOP (should not occur) ──────────
  // Conservative SCC-like defaults; logs warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[radiobiologyData] No ID_REPOP entry for: ${entry.id} — using SCC defaults`);
  }
  return {
    ...entry,
    ab: safeAb,
    abLow: entry.abLow ?? Math.max(0.5, safeAb - (safeAb > 5 ? 2 : 0.5)),
    abHigh: entry.abHigh ?? (safeAb + (safeAb > 5 ? 2 : 0.5)),
    tk: 21,
    k: 0.6,
    uncertaintyFlag: entry.uncertaintyFlag ?? false,
    histology: entry.tumour,
    abSource: entry.abSource ?? 'Standard Literature (Joiner & van der Kogel)',
    repopNote: 'Default SCC-like repopulation (verify for this tumour type).',
    clinicalContext: entry.clinicalContext ?? `Radiobiological parameters for ${entry.tumour} of the ${entry.subsite}.`,
  };
});

export const uniqueSites: string[] = Array.from(
  new Set(MASTER_RADIOBIOLOGY_TABLE.map(t => t.site))
);
export const getSubsites = (site: string): RadiobiologyData[] =>
  MASTER_RADIOBIOLOGY_TABLE.filter(t => t.site === site);

export const getInterpretation = (k: number): { level: string; color: string; description: string } => {
  if (k <= 0)    return { level: 'None',      color: 'text-slate-500',  description: 'No repopulation effect — gap does not require dose compensation' };
  if (k <= 0.20) return { level: 'Minimal',   color: 'text-green-600',  description: 'Minimal OTT sensitivity — compensation rarely needed for short gaps' };
  if (k <= 0.40) return { level: 'Moderate',  color: 'text-yellow-600', description: 'Moderate OTT sensitivity — compensation recommended for gaps >3 days' };
  if (k <= 0.60) return { level: 'High',      color: 'text-orange-600', description: 'High OTT sensitivity — compensate all gaps; urgently reschedule' };
  return           { level: 'Very High',  color: 'text-red-600',    description: 'Very high accelerated repopulation — every missed day significantly reduces tumour control. Urgent compensation mandatory.' };
};
