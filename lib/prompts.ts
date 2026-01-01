// lib/prompts.ts
// ... (Previous prompts: topicSuggestionPrompt, contentIdeasPrompt, etc. keep as is) ...

export function seoAnalysisPrompt(content: string, topic: string, hashtags: string[]): string {
  return `
    You are a LinkedIn Algorithm Expert. Perform a technical audit on this post.
    
    CONTENT: "${content.substring(0, 1000)}..."
    TOPIC: "${topic}"
    HASHTAGS: [${hashtags.join(', ')}]
    
    Analyze against 2025 ranking factors:
    1. Dwell time potential (hook quality, structure)
    2. Keyword relevance
    3. Hashtag targeting (Broad vs Niche)
    4. Engagement probability (CTA strength)
    
    Return ONLY valid JSON matching this exact structure:
    {
      "seoScore": 85,
      "recommendations": [
        { 
          "category": "Structure", 
          "priority": "high", 
          "issue": "Paragraphs too long for mobile", 
          "solution": "Break into 1-2 sentence chunks", 
          "impact": "High boost to read-through rate" 
        }
      ],
      "hashtagAnalysis": [
        { 
          "hashtag": "#Example", 
          "type": "niche", 
          "reach": "medium", 
          "reasoning": "Good targeting for X audience" 
        }
      ],
      "bestPractices": {
        "timing": "Tuesday 8am-10am",
        "keywords": ["key1", "key2"],
        "length": "Optimal"
      }
    }
  `;
}
