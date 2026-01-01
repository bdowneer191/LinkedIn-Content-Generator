// lib/env.ts

/**
 * Validates that all necessary environment variables are set.
 */
export function validateEnv() {
  // In Vite, we must use dot notation (process.env.API_KEY) for the replacement to work.
  // We check specifically for the key we expect.
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Missing required environment variable: API_KEY");
    // In production, we might want to throw or show a specific UI
    return false;
  }
  return true;
}

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'LinkedIn Content Generator',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
