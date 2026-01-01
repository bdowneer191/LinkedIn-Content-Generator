// lib/linkedin-seo.ts - ENHANCED WITH REAL HASHTAG ANALYSIS
import { queryAI } from './gemini';

export const LINKEDIN_BEST_PRACTICES = {
  POST_OPTIMAL_LENGTH: 1300,
  POST_MAX_LENGTH: 3000,
  ARTICLE_MIN_LENGTH: 1000,
  ARTICLE_OPTIMAL_LENGTH: 1500,
  PARAGRAPH_MAX_SENTENCES: 3,
  LINE_BREAKS_MIN: 5,
  EMOJI_MAX: 3,
  HASHTAG_MIN: 3,
  HASHTAG_MAX: 5,
  HOOK_MAX_CHARS: 150,
  KEYWORD_DENSITY_MIN: 0.01,
  KEYWORD_DENSITY_MAX: 0.03,
};

export interface ContentAnalysis {
  characterCount: number;
  wordCount: number;
  readingTime: number;
  paragraphCount: number;
  lineBreakCount: number;
  emojiCount: number;
  hashtagCount: number;
  keywordDensity: Record<string, number>;
}

export interface HashtagSuggestion {
  hashtag: string;
  reach: 'high' | 'medium' | 'low';
  relevanceScore: number;
  type: 'broad' | 'niche' | 'trending' | 'branded';
  estimatedPosts: string; // "100K+" or "25K-50K"
  reasoning: string;
}

/**
 * AI-Powered Real-Time Hashtag Generation
 * NO MORE MOCK DATA - Uses semantic analysis of content
 */
export async function generateHashtagSuggestions(
  topic: string,
  content: string,
  existing: string[] = []
): Promise<HashtagSuggestion[]> {
  try {
    // Extract semantic keywords from content
    const keywords = extractKeywords(content);
    
    const prompt = `
      Analyze this LinkedIn content and generate optimal hashtag strategy:
      
      TOPIC: ${topic}
      CONTENT LENGTH: ${content.length} characters
      KEY THEMES: ${keywords.slice(0, 10).join(', ')}
      CURRENT HASHTAGS: ${existing.join(', ') || 'None'}
      
      Requirements for 2025 LinkedIn Algorithm:
      1. Mix of reach levels:
         - 1-2 broad hashtags (500K+ posts) for visibility
         - 2-3 niche hashtags (10K-50K posts) for targeting
         - 1 trending/emerging hashtag (<10K but growing)
      
      2. Avoid:
         - Over-saturated tags (>2M posts)
         - Irrelevant trending tags
         - Generic tags like #motivation #success
      
      3. Semantic relevance > popularity
      
      Generate 5-7 strategic hashtags with detailed analysis.
      
      Return ONLY valid JSON:
      [
        {
          "hashtag": "#SpecificTag",
          "reach": "high|medium|low",
          "relevanceScore": 85,
          "type": "broad|niche|trending|branded",
          "estimatedPosts": "250K+",
          "reasoning": "Why this tag is optimal for this content"
        }
      ]
    `;
    
    const suggestions = await queryAI<HashtagSuggestion[]>(prompt);
    
    // Validate and filter
    return suggestions
      .filter(s => s.relevanceScore >= 60) // Minimum relevance threshold
      .slice(0, 7); // Max 7 suggestions
      
  } catch (error) {
    console.error('Hashtag generation failed:', error);
    
    // Fallback: Content-based extraction instead of generic list
    return extractHashtagsFromContent(content, topic);
  }
}

/**
 * Fallback: Extract potential hashtags from content keywords
 */
function extractHashtagsFromContent(
  content: string,
  topic: string
): HashtagSuggestion[] {
  const keywords = extractKeywords(content);
  const topKeywords = keywords
    .filter(kw => kw.length > 4 && kw.length < 20)
    .slice(0, 5);
  
  return topKeywords.map(kw => ({
    hashtag: `#${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
    reach: 'medium',
    relevanceScore: 70,
    type: 'niche' as const,
    estimatedPosts: 'Unknown',
    reasoning: `Extracted from content keywords`
  }));
}

/**
 * Enhanced Keyword Extraction with TF-IDF-like scoring
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'you', 'for', 
    'with', 'on', 'was', 'be', 'are', 'as', 'at', 'this', 'by', 'from',
    'or', 'an', 'but', 'not', 'can', 'will', 'about', 'if', 'has', 'been'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  // Count frequency
  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 15);
}

/**
 * Calculate comprehensive SEO score with real analysis
 */
export function calculateSEOScore(content: string, hashtags: string[] = []): number {
  let score = 0;
  const bp = LINKEDIN_BEST_PRACTICES;

  // 1. Length Check (20 pts)
  if (content.length >= 800 && content.length <= bp.POST_MAX_LENGTH) {
    score += 20;
  } else if (content.length > 300) {
    score += 10;
  }

  // 2. Line Breaks / Formatting (15 pts)
  const lineBreaks = (content.match(/\n\n/g) || []).length;
  if (lineBreaks >= bp.LINE_BREAKS_MIN) {
    score += 15;
  } else if (lineBreaks >= 2) {
    score += 7;
  }

  // 3. Hashtags (20 pts)
  const detectedHashtags = (content.match(/#\w+/g) || []).length;
  const totalHashtags = Math.max(detectedHashtags, hashtags.length);
  if (totalHashtags >= bp.HASHTAG_MIN && totalHashtags <= bp.HASHTAG_MAX) {
    score += 20;
  } else if (totalHashtags > 0 && totalHashtags < bp.HASHTAG_MIN) {
    score += 10;
  }

  // 4. Hook Quality (25 pts)
  const firstLines = content.split('\n').slice(0, 2).join('\n').trim();
  if (firstLines.length > 30 && firstLines.length <= bp.HOOK_MAX_CHARS) {
    score += 25;
  } else if (firstLines.length > 0) {
    score += 10;
  }

  // 5. Engagement Triggers / CTA (10 pts)
  const lowers = content.toLowerCase();
  const hasCTA = lowers.includes('comment') || 
                 lowers.includes('?') || 
                 lowers.includes('share') || 
                 lowers.includes('agree') ||
                 lowers.includes('thoughts');
  if (hasCTA) score += 10;

  // 6. Emoji Usage (10 pts)
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojis > 0 && emojis <= bp.EMOJI_MAX) {
    score += 10;
  } else if (emojis > bp.EMOJI_MAX) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Detailed content analysis
 */
export function analyzeContent(content: string): ContentAnalysis {
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const hashtags = (content.match(/#\w+/g) || []).length;
  
  // Keyword density analysis
  const stopWords = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'you', 'for', 'with', 'on', 'was', 'be', 'are', 'as', 'at']);
  const freq: Record<string, number> = {};
  
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  });

  const density: Record<string, number> = {};
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([word, count]) => {
      density[word] = count / wordCount;
    });

  return {
    characterCount: content.length,
    wordCount,
    readingTime,
    paragraphCount: paragraphs.length,
    lineBreakCount: (content.match(/\n/g) || []).length,
    emojiCount: emojis,
    hashtagCount: hashtags,
    keywordDensity: density,
  };
}

/**
 * Optimize content for mobile readability
 */
export function optimizeForMobile(content: string): string {
  const sentences = content.split(/(?<=[.!?])\s+/);
  let optimized = '';
  let sentenceCount = 0;

  sentences.forEach((sentence) => {
    optimized += sentence + ' ';
    sentenceCount++;

    // Force line break every 2 sentences
    if (sentenceCount >= 2) {
      optimized = optimized.trim() + '\n\n';
      sentenceCount = 0;
    }
  });

  return optimized.trim();
}
