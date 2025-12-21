import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize AI directly with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Configuration constants
const MODEL_NAME = 'gemini-3-flash-preview';
const DEFAULT_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

/**
 * Implements exponential backoff for retrying AI requests.
 */
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
      // Use ai.models.generateContent for querying models
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          ...DEFAULT_CONFIG,
          ...(isJson ? { responseMimeType: 'application/json' } : {}),
        }
      });

      // Extract text output using the .text property directly
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini API");
      
      return text;
    } catch (error: any) {
      lastError = error;
      
      // Handle rate limit (429) or other temporary errors
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      const isRetryable = isRateLimit || error?.status >= 500;
      
      if (isRetryable && i < retries - 1) {
        const backoffMs = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API error (attempt ${i + 1}/${retries}). Retrying in ${Math.round(backoffMs)}ms...`, error.message);
        await sleep(backoffMs);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Generates and parses JSON response safely with robust boundary detection.
 */
export async function queryAI<T>(prompt: string): Promise<T> {
  try {
    const text = await generateWithRetry(prompt, 3, true);
    
    // Robustly find the JSON boundaries in case of AI "chatter" or markdown markers
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    
    if (startIdx === -1 || endIdx === 0) {
      console.error("Raw AI Output (No JSON found):", text);
      throw new Error("No JSON object found in AI response");
    }

    const cleaned = text.substring(startIdx, endIdx);
    
    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error("Cleaned JSON String:", cleaned);
      throw new Error("Invalid JSON structure from AI Agent");
    }
  } catch (error) {
    console.error("Gemini queryAI Error:", error);
    throw error;
  }
}

export { ai };
