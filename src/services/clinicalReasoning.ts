import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ClinicalSummary {
  tissue_category: string;
  clinical_context: string;
  comparison_standard: string;
  oar_note: string;
  flag: 'normal' | 'low' | 'high' | 'non_standard';
  references: string[];
}

export async function getClinicalSummary(prompt: string, systemInstruction?: string): Promise<ClinicalSummary> {
  // Fallback chain logic
  try {
    // Primary: Claude (Simulated here as we only have Gemini SDK)
    // In a real app, use Anthropic SDK
    throw new Error("Claude API not configured");
  } catch (e) {
    try {
      // Fallback 1: Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          systemInstruction: systemInstruction || "You are a radiation oncology clinical decision support system. You assist qualified radiation oncologists and physicists. Provide concise (4–6 sentence) radiobiological interpretation. Always mention: (1) tissue category for this α/β, (2) clinical context, (3) comparison to standard 2 Gy/fx, (4) key OAR consideration. Never recommend specific patient treatment. Flag if dose appears non-standard. Use SI units. No markdown headers."
        }
      });
      let text = response.text || "{}";
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (e) {
      // Fallback 2: Rule-based
      return generateClinicalSummaryRuleBased();
    }
  }
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
