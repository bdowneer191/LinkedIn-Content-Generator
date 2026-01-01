import { queryAI } from './gemini';

export const LINKEDIN_BEST_PRACTICES = {
  POST_MAX_LENGTH: 3000,
  HASHTAG_MIN: 3,
  HASHTAG_MAX: 5,
};

export function calculateSEOScore(content: string, hashtags: string[] = []): number {
  let score = 0;
  // Length Check: Optimal 800-2000 chars for dwell time
  if (content.length > 800 && content.length < 2000) score += 30;
  else if (content.length > 200) score += 10;

  // Engagement Triggers (Questions/CTAs)
  if (content.includes('?') || content.toLowerCase().includes('thoughts')) score += 15;
  
  // Formatting: Readability
  const lineBreaks = content.split('\n\n').length;
  if (lineBreaks > 3) score += 20;
  
  // Hashtag usage
  if (hashtags.length >= LINKEDIN_BEST_PRACTICES.HASHTAG_MIN) score += 20;
  
  // Mobile optimization (short paragraphs)
  const longParagraphs = content.split('\n\n').filter(p => p.length > 250).length;
  if (longParagraphs === 0 && content.length > 50) score += 15;
  
  return Math.min(score, 100);
}

export function analyzeContent(content: string) {
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  return {
    characterCount: content.length,
    wordCount: words,
    readingTime: Math.max(1, Math.ceil(words / 200)),
    paragraphCount: content.split('\n\n').length,
    hashtagCount: (content.match(/#/g) || []).length
  };
}

export async function generateHashtagSuggestions(content: string, topic: string) {
  const prompt = `Generate 5 relevant LinkedIn hashtags for a post about "${topic}". Content snippet: "${content.substring(0, 100)}...". Return JSON array: [{ "hashtag": "#tag", "reach": "high", "relevanceScore": 90 }]`;
  try {
    return await queryAI<any[]>(prompt);
  } catch (e) {
    return [];
  }
}
