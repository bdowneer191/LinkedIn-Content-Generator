
/**
 * Validates that all necessary environment variables are set.
 */
export function validateEnv() {
  const required = ['API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    // In production, we might want to throw or show a specific UI
    return false;
  }
  return true;
}

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'LinkedIn Content Generator',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
