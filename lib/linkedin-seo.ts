// lib/linkedin-seo.ts
import { queryAI } from './gemini';

export const LINKEDIN_BEST_PRACTICES = {
  POST_MAX_LENGTH: 3000,
  HASHTAG_MIN: 3,
  HASHTAG_MAX: 5,
};

export interface ContentAnalysis {
  characterCount: number;
  wordCount: number;
  readingTime: number;
  paragraphCount: number;
  hashtagCount: number;
}

export interface HashtagSuggestion {
  hashtag: string;
  reach: 'high' | 'medium' | 'low';
  relevanceScore: number;
  type: 'broad' | 'niche' | 'trending' | 'branded';
  reasoning: string;
}

/**
 * Calculates a 0-100 score based on local best practices (Instant feedback)
 */
export function calculateSEOScore(content: string, hashtags: string[] = []): number {
  let score = 0;
  
  // Length: LinkedIn prefers 800-2000 chars for dwell time
  if (content.length > 800 && content.length < 2000) score += 30;
  else if (content.length > 300) score += 15;
  
  // Engagement: CTA check
  const lower = content.toLowerCase();
  if (lower.includes('?') || lower.includes('thoughts?') || lower.includes('agree?')) score += 15;
  
  // Formatting: Readability
  const lineBreaks = content.split('\n\n').length;
  if (lineBreaks > 3) score += 20;
  
  // Discovery: Hashtags
  if (hashtags.length >= 3 && hashtags.length <= 5) score += 20;
  else if (hashtags.length > 0) score += 10;
  
  // Mobile Optimization: Short paragraphs
  const longParagraphs = content.split('\n\n').filter(p => p.length > 300).length;
  if (longParagraphs === 0 && content.length > 50) score += 15;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Detailed local content analysis
 */
export function analyzeContent(content: string): ContentAnalysis {
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  return {
    characterCount: content.length,
    wordCount: words,
    readingTime: Math.ceil(words / 200),
    paragraphCount: content.split('\n\n').length,
    hashtagCount: (content.match(/#/g) || []).length
  };
}

/**
 * AI-Powered Hashtag Generation (Replaces Mock Data)
 */
export async function generateHashtagSuggestions(content: string, topic: string): Promise<HashtagSuggestion[]> {
  const prompt = `
    Analyze this LinkedIn post and generate 5 strategic hashtags.
    Topic: ${topic}
    Content: "${content.substring(0, 500)}..."
    
    Rules:
    1. Mix of Broad (High reach) and Niche (Targeted) tags.
    2. Tags must be professionally relevant.
    
    Return ONLY valid JSON array:
    [
      {
        "hashtag": "#Tag",
        "reach": "high",
        "type": "niche",
        "relevanceScore": 90,
        "reasoning": "Directly relates to topic"
      }
    ]
  `;
  
  try {
    return await queryAI<HashtagSuggestion[]>(prompt);
  } catch (e) {
    console.error("AI Hashtag Gen failed:", e);
    return []; // Fail gracefully
  }
}
