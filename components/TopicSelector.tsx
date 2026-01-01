import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

const MODEL_NAME = 'gemini-2.0-flash-exp';
const DEFAULT_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateWithRetry(
  prompt: string,
  retries: number = 3,
  isJson: boolean = true
): Promise<string> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          ...DEFAULT_CONFIG,
          responseMimeType: isJson ? 'application/json' : 'text/plain',
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini API");
      
      return text;
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini attempt ${i + 1} failed:`, error.message || error);
      
      const isRetryable = error?.status === 429 || 
                         error?.message?.includes('429') || 
                         error?.status >= 500 ||
                         error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRetryable && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await sleep(delay);
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
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (!jsonMatch) {
      throw new Error("Invalid JSON structure from AI Agent - No JSON found");
    }
    
    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error: any) {
    console.error("Gemini queryAI Error:", error);
    
    if (error.message?.includes('API key')) {
      throw new Error("Invalid or missing Gemini API key");
    } else if (error.message?.includes('model not found')) {
      throw new Error("Gemini model not available");
    } else if (error.message?.includes('quota')) {
      throw new Error("API quota exceeded");
    }
    
    throw error;
  }
}
