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
  { id: 'hn-oro-hpv-pos', site: 'Head & Neck', subsite: 'Oropharynx', tumour: 'SCC HPV+', alphaBeta: 10 },
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
  { id: 'gi-gist', site: 'Gastrointestinal', subsite: 'GIST', tumour: 'Stromal', alphaBeta: 10 },
  { id: 'gi-net', site: 'Gastrointestinal', subsite: 'Neuroendocrine', tumour: 'NET', alphaBeta: 10 },
  { id: 'gi-gallbladder', site: 'Gastrointestinal', subsite: 'Gallbladder', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-biliary', site: 'Gastrointestinal', subsite: 'Biliary Tree', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'gi-retro-sarcoma', site: 'Gastrointestinal', subsite: 'Retroperitoneal', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'gi-perit-meso', site: 'Gastrointestinal', subsite: 'Peritoneum', tumour: 'Mesothelioma', alphaBeta: 10 },
  { id: 'gi-omental', site: 'Gastrointestinal', subsite: 'Omentum', tumour: 'Omental Cake', alphaBeta: 10 },

  // ── Genitourinary ──
  { id: 'gu-pros-low', site: 'Genitourinary', subsite: 'Prostate', tumour: 'Low risk', alphaBeta: 1.5 },
  { id: 'gu-pros-int', site: 'Genitourinary', subsite: 'Prostate', tumour: 'Intermediate', alphaBeta: 1.5 },
  { id: 'gu-pros-high', site: 'Genitourinary', subsite: 'Prostate', tumour: 'High risk', alphaBeta: 1.5 },
  { id: 'gu-bladder', site: 'Genitourinary', subsite: 'Bladder', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-renal-clear', site: 'Genitourinary', subsite: 'Renal Cell', tumour: 'Clear cell', alphaBeta: 10 },
  { id: 'gu-renal-nonclear', site: 'Genitourinary', subsite: 'Renal Cell', tumour: 'Non-clear', alphaBeta: 10 },
  { id: 'gu-testis-semi', site: 'Genitourinary', subsite: 'Testis', tumour: 'Seminoma', alphaBeta: 10 },
  { id: 'gu-testis-nonsemi', site: 'Genitourinary', subsite: 'Testis', tumour: 'Non-seminoma', alphaBeta: 10 },
  { id: 'gu-penile', site: 'Genitourinary', subsite: 'Penile', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gu-ureter', site: 'Genitourinary', subsite: 'Ureter', tumour: 'TCC', alphaBeta: 10 },
  { id: 'gu-urethra', site: 'Genitourinary', subsite: 'Urethra', tumour: 'SCC', alphaBeta: 10 },
  { id: 'gu-adrenal', site: 'Genitourinary', subsite: 'Adrenal', tumour: 'Cortical Ca', alphaBeta: 10 },

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

  // ── Breast ──
  { id: 'breast-whole', site: 'Breast', subsite: 'Whole Breast', tumour: 'Adjuvant', alphaBeta: 4 },
  { id: 'breast-partial', site: 'Breast', subsite: 'Partial Breast', tumour: 'APBI', alphaBeta: 4 },
  { id: 'breast-chest-wall', site: 'Breast', subsite: 'Chest Wall', tumour: 'Post-mastectomy', alphaBeta: 4 },
  { id: 'breast-dcis', site: 'Breast', subsite: 'DCIS', tumour: 'Intraductal', alphaBeta: 4 },
  { id: 'breast-inflammatory', site: 'Breast', subsite: 'Inflammatory', tumour: 'Adenocarcinoma', alphaBeta: 10 },
  { id: 'breast-recurrent', site: 'Breast', subsite: 'Recurrent', tumour: 'Adenocarcinoma', alphaBeta: 4 },
  { id: 'breast-male', site: 'Breast', subsite: 'Male Breast', tumour: 'Adenocarcinoma', alphaBeta: 4 },
  { id: 'breast-paget', site: 'Breast', subsite: 'Paget Disease', tumour: 'Nipple', alphaBeta: 10 },

  // ── CNS ──
  { id: 'cns-gbm', site: 'CNS', subsite: 'Brain', tumour: 'Glioblastoma', alphaBeta: 10 },
  { id: 'cns-aa', site: 'CNS', subsite: 'Brain', tumour: 'Anaplastic Astrocytoma', alphaBeta: 10 },
  { id: 'cns-lgg', site: 'CNS', subsite: 'Brain', tumour: 'Low-grade glioma', alphaBeta: 2 },
  { id: 'cns-meningioma-1', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade I', alphaBeta: 2 },
  { id: 'cns-meningioma-2', site: 'CNS', subsite: 'Meningioma', tumour: 'Grade II/III', alphaBeta: 10 },
  { id: 'cns-acoustic', site: 'CNS', subsite: 'Acoustic Neuroma', tumour: 'Schwannoma', alphaBeta: 2 },
  { id: 'cns-pituitary', site: 'CNS', subsite: 'Pituitary', tumour: 'Adenoma', alphaBeta: 2 },
  { id: 'cns-cranio', site: 'CNS', subsite: 'Craniopharyngioma', tumour: 'Epithelial', alphaBeta: 2 },
  { id: 'cns-ependymoma', site: 'CNS', subsite: 'Ependymoma', tumour: 'Glial', alphaBeta: 2 },
  { id: 'cns-medullo-adult', site: 'CNS', subsite: 'Medulloblastoma', tumour: 'PNET', alphaBeta: 10 },
  { id: 'cns-pineoblastoma', site: 'CNS', subsite: 'Pineoblastoma', tumour: 'Pineal', alphaBeta: 10 },
  { id: 'cns-mets', site: 'CNS', subsite: 'Brain Metastasis', tumour: 'Secondary', alphaBeta: 10 },
  { id: 'cns-oligo-2', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade II', alphaBeta: 2 },
  { id: 'cns-oligo-3', site: 'CNS', subsite: 'Oligodendroglioma', tumour: 'Grade III', alphaBeta: 10 },
  { id: 'cns-pilocytic', site: 'CNS', subsite: 'Astrocytoma', tumour: 'Pilocytic (Gr I)', alphaBeta: 2 },
  { id: 'cns-hemangio', site: 'CNS', subsite: 'Hemangioblastoma', tumour: 'Vascular', alphaBeta: 2 },
  { id: 'cns-craniopharyngioma', site: 'CNS', subsite: 'Craniopharyngioma', tumour: 'Adamantinomatous', alphaBeta: 2 },

  // ── Skin ──
  { id: 'skin-bcc', site: 'Skin', subsite: 'BCC', tumour: 'Basal Cell', alphaBeta: 10 },
  { id: 'skin-scc', site: 'Skin', subsite: 'SCC', tumour: 'Squamous Cell', alphaBeta: 10 },
  { id: 'skin-melanoma', site: 'Skin', subsite: 'Melanoma', tumour: 'Malignant', alphaBeta: 2.5 },
  { id: 'skin-merkel', site: 'Skin', subsite: 'Merkel Cell', tumour: 'Neuroendocrine', alphaBeta: 10 },
  { id: 'skin-mf', site: 'Skin', subsite: 'Mycosis Fungoides', tumour: 'T-cell Lymphoma', alphaBeta: 10 },
  { id: 'skin-kaposi', site: 'Skin', subsite: 'Kaposi Sarcoma', tumour: 'Vascular', alphaBeta: 10 },
  { id: 'skin-dfsp', site: 'Skin', subsite: 'DFSP', tumour: 'Sarcoma', alphaBeta: 4 },
  { id: 'skin-sebaceous', site: 'Skin', subsite: 'Sebaceous Ca', tumour: 'Adnexal', alphaBeta: 10 },

  // ── Sarcoma ──
  { id: 'sarc-sts-high', site: 'Sarcoma', subsite: 'Soft Tissue', tumour: 'High grade', alphaBeta: 4 },
  { id: 'sarc-sts-low', site: 'Sarcoma', subsite: 'Soft Tissue', tumour: 'Low grade', alphaBeta: 4 },
  { id: 'sarc-osteo', site: 'Sarcoma', subsite: 'Osteosarcoma', tumour: 'Bone', alphaBeta: 4 },
  { id: 'sarc-ewing', site: 'Sarcoma', subsite: 'Ewing Sarcoma', tumour: 'Bone/ST', alphaBeta: 10 },
  { id: 'sarc-chondro', site: 'Sarcoma', subsite: 'Chondrosarcoma', tumour: 'Cartilage', alphaBeta: 2 },
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
  { id: 'peds-osteo', site: 'Paediatric', subsite: 'Osteosarcoma', tumour: 'Bone', alphaBeta: 4 },
  { id: 'peds-ewing', site: 'Paediatric', subsite: 'Ewing Sarcoma', tumour: 'Bone/ST', alphaBeta: 10 },
  { id: 'peds-germ', site: 'Paediatric', subsite: 'Germ Cell', tumour: 'GCT', alphaBeta: 10 },
  { id: 'peds-cranio', site: 'Paediatric', subsite: 'Craniopharyngioma', tumour: 'Epithelial', alphaBeta: 2 },
  { id: 'peds-dipg', site: 'Paediatric', subsite: 'Brainstem Glioma', tumour: 'DIPG', alphaBeta: 10 },

  // ── Bone ──
  { id: 'bone-chordoma', site: 'Bone', subsite: 'Chordoma', tumour: 'Notochordal', alphaBeta: 2 },
  { id: 'bone-chondrosarcoma', site: 'Bone', subsite: 'Chondrosarcoma', tumour: 'Cartilage', alphaBeta: 2 },
  { id: 'bone-osteosarcoma', site: 'Bone', subsite: 'Osteosarcoma', tumour: 'Osteoid', alphaBeta: 4 },
  { id: 'bone-ewing', site: 'Bone', subsite: 'Ewing Sarcoma', tumour: 'Small Blue Cell', alphaBeta: 10 },
  { id: 'bone-giant-cell', site: 'Bone', subsite: 'Giant Cell', tumour: 'Osteoclastoma', alphaBeta: 4 },

  // ── Endocrine ──
  { id: 'endo-thyroid-pap', site: 'Endocrine', subsite: 'Thyroid', tumour: 'Papillary', alphaBeta: 10 },
  { id: 'endo-thyroid-fol', site: 'Endocrine', subsite: 'Thyroid', tumour: 'Follicular', alphaBeta: 10 },
  { id: 'endo-adrenal-cort', site: 'Endocrine', subsite: 'Adrenal', tumour: 'Cortical', alphaBeta: 10 },
  { id: 'endo-pituitary-non', site: 'Endocrine', subsite: 'Pituitary', tumour: 'Non-functioning', alphaBeta: 2 },
  { id: 'endo-parathyroid', site: 'Endocrine', subsite: 'Parathyroid', tumour: 'Adenoma', alphaBeta: 10 },

  // ── OAR Reference ──
  { id: 'oar-cord', site: 'OAR', subsite: 'Spinal cord', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-brain', site: 'OAR', subsite: 'Brain', tumour: 'N/A', alphaBeta: 2 },
  { id: 'oar-brainstem', site: 'OAR', subsite: 'Brainstem', tumour: 'N/A', alphaBeta: 2.1 },
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
].map(entry => ({
  ...entry,
  ab: entry.alphaBeta,
  abLow: entry.alphaBeta - 1,
  abHigh: entry.alphaBeta + 1,
  tk: entry.site === 'CNS' || entry.site === 'OAR' || entry.site === 'Prostate' ? 0 : 28,
  k: entry.site === 'CNS' || entry.site === 'OAR' || entry.site === 'Prostate' ? 0 : 0.6,
  uncertaintyFlag: false,
  histology: entry.tumour,
  abSource: 'Standard Literature',
  repopNote: entry.site === 'CNS' || entry.site === 'OAR' || entry.site === 'Prostate' ? 'Minimal repopulation' : 'Standard repopulation',
  clinicalContext: 'Standard clinical context'
}));

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
