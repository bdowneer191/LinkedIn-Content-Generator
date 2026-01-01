import { GoogleGenAI } from "@google/genai";

// Initialize AI. We use the OR operator to catch whichever variable Vite injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

// FIXED: Use correct model name
const MODEL_NAME = 'gemini-2.0-flash-exp'; // or 'gemini-1.5-flash' for stable
const DEFAULT_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192, // Increased for longer content
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateWithRetry(
  prompt: string,
  retries: number = 3,
  isJson: boolean = true // Changed default to true
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
        console.log(`Retrying in ${Math.round(delay)}ms...`);
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
    
    // Robust JSON extraction using Regex
    // This finds the first { or [ and the last } or ]
    // It ignores any markdown code fences or conversational text before/after
    // [\s\S]* matches any character including newlines
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      throw new Error("Invalid JSON structure from AI Agent - No JSON found");
    }
    
    const jsonString = jsonMatch[0];
    
    try {
      const parsed = JSON.parse(jsonString);
      return parsed as T;
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Raw Text:", text);
      console.error("Extracted JSON:", jsonString);
      throw new Error(`Invalid JSON structure from AI Agent: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Gemini queryAI Error:", error);
    
    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      throw new Error("Invalid or missing Gemini API key. Check your environment variables.");
    } else if (error.message?.includes('model not found')) {
      throw new Error("Gemini model not available. Try 'gemini-1.5-flash' instead.");
    } else if (error.message?.includes('quota')) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    
    throw error;
  }
}

// Helper function to validate API key
export function validateApiKey(): boolean {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No Gemini API key found in environment variables");
    return false;
  }
  console.log("✅ Gemini API key found");
  return true;
}
