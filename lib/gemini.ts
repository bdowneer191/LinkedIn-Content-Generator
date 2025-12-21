import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';
const DEFAULT_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096, // Increased from 2048 to prevent truncation
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateWithRetry(
  prompt: string,
  retries: number = 3,
  isJson: boolean = false
): Promise<string> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          ...DEFAULT_CONFIG,
          ...(isJson ? { responseMimeType: 'application/json' } : {}),
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini API");
      return text;
    } catch (error: any) {
      lastError = error;
      const isRetryable = error?.status === 429 || error?.message?.includes('429') || error?.status >= 500;
      if (isRetryable && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000 + Math.random() * 1000);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function queryAI<T>(prompt: string): Promise<T> {
  try {
    const text = await generateWithRetry(prompt, 3, true);
    
    const startIdx = text.indexOf('{');
    let endIdx = text.lastIndexOf('}') + 1;
    
    // Recovery Logic: If the JSON is truncated, try to close it manually
    let jsonString = text;
    if (startIdx !== -1 && endIdx === 0) {
       jsonString = text.trim() + '"} }'; // Attempt emergency closure for content blocks
       endIdx = jsonString.length;
    }

    const cleaned = jsonString.substring(startIdx, endIdx);
    
    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error("Failed to parse. Raw:", text);
      throw new Error("Invalid JSON structure from AI Agent");
    }
  } catch (error) {
    console.error("Gemini queryAI Error:", error);
    throw error;
  }
}
