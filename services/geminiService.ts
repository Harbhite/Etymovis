import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EtymologyTree } from "../types";

/**
 * Switching to 'gemini-3-flash-preview' which typically has higher rate limits 
 * and quotas compared to the 'pro' model, while still maintaining high performance 
 * for structured data tasks.
 */
const GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Helper function to implement exponential backoff for retries
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchEtymology = async (word: string, retries = 3): Promise<EtymologyTree | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are a world-class historical linguist and etymologist.
Your task is to provide an EXHAUSTIVE, multi-generational lineage for a given word.
1. Trace back to the earliest known ancestor (e.g., Proto-Indo-European, Proto-Semitic).
2. Detail EVERY significant linguistic stage (e.g., Proto-Germanic -> Old English -> Middle English).
3. For each stage, include:
   - word: The phonetic/written form.
   - language: The specific historical dialect or language name.
   - meaning: The definition or nuance during that era.
   - era: The approximate century or period.
   - context: A 1-2 sentence note on the phonetic or semantic shift that occurred.
4. Data Structure: Return a hierarchical JSON object where the root is the MODERN word, and 'children' are the ancestral stages.
Example: { "word": "...", "language": "...", "children": [ { "word": "ancestor", ... } ] }`;

  const prompt = `Perform a deep etymological analysis for the word: "${word}". Ensure you include era and historical context for every ancestor node.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        // Setting thinking budget to 0 for flash model to prioritize speed and reliability
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim();
    if (!text) return null;

    // Remove markdown code blocks if present
    const cleanJson = text.replace(/^```json\n?|\n?```$/g, '');
    const data = JSON.parse(cleanJson) as EtymologyTree;
    
    if (!data.children || data.children.length === 0) {
      console.warn("Etymology result depth check failed for:", word);
    }
    
    return data;
  } catch (error: any) {
    // Handle Rate Limit (429) errors with retries
    if (error?.message?.includes('429') && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${4 - retries}s... (${retries} retries left)`);
      await delay(1000 * (4 - retries)); // Exponential-ish backoff
      return fetchEtymology(word, retries - 1);
    }

    console.error("Etymology Service Error:", error);
    throw error;
  }
};
