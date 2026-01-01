import { queryAI } from './gemini';

// Updated Constants (From your specific update request)
export const LINKEDIN_BEST_PRACTICES = {
  POST_MAX_LENGTH: 3000,
  HASHTAG_MIN: 3,
  HASHTAG_MAX: 5,
};

// Updated Interface to match the new analyzeContent return shape
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
  estimatedPosts: string;
  reasoning: string;
}

export interface DynamicSEOScore {
  overallScore: number;
  breakdown: {
    keywordOptimization: number;
    engagementPotential: number;
    algorithmAlignment: number;
    readability: number;
  };
  competitorComparison: string;
  predictedReach: string;
  suggestions: string[];
}

/**
 * AI-Powered Real-Time Hashtag Generation
 * Uses semantic analysis of content to find relevant tags.
 */
export async function generateHashtagSuggestions(
  topic: string,
  content: string,
  existing: string[] = []
): Promise<HashtagSuggestion[]> {
  try {
    // Extract semantic keywords locally to guide the AI
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
    
    // Validate and filter results
    return suggestions
      .filter(s => s.relevanceScore >= 60)
      .slice(0, 7);
      
  } catch (error) {
    console.error('Hashtag generation failed:', error);
    return extractHashtagsFromContent(content);
  }
}

/**
 * Advanced Dynamic SEO Scoring
 * Combines local rule-based scoring with AI competitive analysis.
 */
export async function calculateDynamicSEOScore(
  content: string,
  topic: string,
  hashtags: string[]
): Promise<DynamicSEOScore> {
  // 1. Run Local Analysis (Instant)
  const localScore = calculateSEOScore(content, hashtags);
  const localMetrics = analyzeContent(content);
  
  // 2. Run AI Analysis (Deep Dive)
  try {
    const prompt = `
      Act as a LinkedIn Algorithm Expert. Compare this post against top-performing content in the "${topic}" niche.
      
      CONTENT: "${content.substring(0, 800)}..."
      HASHTAGS: ${hashtags.join(', ')}
      
      Analyze:
      1. Keyword optimization vs. competitors
      2. Engagement likelihood (based on hook quality, CTA strength, formatting)
      3. Algorithm favorability (dwell time potential)
      4. Reach potential
      
      Return ONLY valid JSON:
      {
        "keywordScore": 85,
        "engagementScore": 90,
        "algorithmScore": 80,
        "vsCompetitors": "Better/Worse/Similar because...",
        "reachEstimate": "High/Medium/Low",
        "suggestions": ["Tip 1", "Tip 2"]
      }
    `;

    const aiResult = await queryAI<any>(prompt);

    // Calculate a simple readability score based on new metrics
    const readabilityScore = Math.max(0, 100 - (localMetrics.wordCount / Math.max(1, localMetrics.paragraphCount) > 50 ? 20 : 0));

    return {
      overallScore: Math.round((localScore + ((aiResult.keywordScore + aiResult.engagementScore + aiResult.algorithmScore) / 3)) / 2),
      breakdown: {
        keywordOptimization: aiResult.keywordScore,
        engagementPotential: aiResult.engagementScore,
        algorithmAlignment: aiResult.algorithmScore,
        readability: readabilityScore
      },
      competitorComparison: aiResult.vsCompetitors,
      predictedReach: aiResult.reachEstimate,
      suggestions: aiResult.suggestions
    };
  } catch (error) {
    console.error("Dynamic SEO Analysis failed, falling back to local score", error);
    return {
      overallScore: localScore,
      breakdown: {
        keywordOptimization: 0,
        engagementPotential: 0,
        algorithmAlignment: 0,
        readability: 0
      },
      competitorComparison: "Analysis unavailable",
      predictedReach: "Unknown",
      suggestions: ["Ensure hooks are under 150 chars", "Use 3-5 relevant hashtags"]
    };
  }
}

/**
 * Calculates a 0-100 score based on updated local best practices
 */
export function calculateSEOScore(content: string, hashtags: string[] = []): number {
  let score = 0;
  
  // Length Check: Optimal 500-2000 chars
  if (content.length > 500 && content.length < 2000) score += 30;
  
  // Baseline Score for minimal content
  if (content.length > 50) score += 20;

  // CTA Check
  if (content.includes('?')) score += 10; 
  
  // Readability / Formatting
  const lineBreaks = content.split('\n\n').length;
  if (lineBreaks > 3) score += 20;
  
  // Hashtag usage
  if (hashtags.length >= LINKEDIN_BEST_PRACTICES.HASHTAG_MIN) score += 20;
  
  return Math.min(score, 100);
}

/**
 * Detailed local content analysis (Updated Logic)
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

// --- Helpers ---

function extractHashtagsFromContent(content: string): HashtagSuggestion[] {
  const keywords = extractKeywords(content);
  const topKeywords = keywords
    .filter(kw => kw.length > 4 && kw.length < 20)
    .slice(0, 5);
  
  return topKeywords.map(kw => ({
    hashtag: `#${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
    reach: 'medium',
    relevanceScore: 70,
    type: 'niche',
    estimatedPosts: 'Unknown',
    reasoning: 'Extracted from content keywords (Fallback)'
  }));
}

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
  
  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 15);
}

/**
 * Formats content for mobile readability
 */
export function optimizeForMobile(content: string): string {
  const sentences = content.split(/(?<=[.!?])\s+/);
  let optimized = '';
  let sentenceCount = 0;

  sentences.forEach((sentence) => {
    optimized += sentence + ' ';
    sentenceCount++;

    if (sentenceCount >= 2) {
      optimized = optimized.trim() + '\n\n';
      sentenceCount = 0;
    }
  });

  return optimized.trim();
}
