export interface ClinicalSummary {
  tissue_category: string;
  clinical_context: string;
  comparison_standard: string;
  oar_note: string;
  flag: 'normal' | 'low' | 'high' | 'non_standard';
  references: string[];
}

export async function getClinicalSummary(prompt: string, systemInstruction?: string): Promise<ClinicalSummary> {
  return generateClinicalSummaryRuleBased();
}

function generateClinicalSummaryRuleBased(): ClinicalSummary {
  return {
    tissue_category: "General",
    clinical_context: "Calculation performed.",
    comparison_standard: "Compare to 2 Gy/fx.",
    oar_note: "Monitor OARs.",
    flag: "normal",
    references: ["Standard Practice"]
  };
}
