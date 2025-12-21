import { ContentIdea, ContentOutline } from '../types/index';

/**
 * Prompt for Step 1: Generating trending topics
 */
export function topicSuggestionPrompt(industry?: string, interests?: string[], targetAudience?: string): string {
  return `
    You are a LinkedIn content strategist with expertise in viral content.
    Generate 5 trending LinkedIn topics for ${industry || 'general business'}.
    Consider: current trends, high engagement potential, professional relevance.
    
    ${interests && interests.length > 0 ? `Focus on these areas: ${interests.join(', ')}` : ''}
    ${targetAudience ? `Target audience: ${targetAudience}` : ''}
    
    Return ONLY valid JSON array with NO markdown formatting:
    [
      {
        "id": "unique-id",
        "title": "Clear, engaging title",
        "description": "2-3 sentence description of why this topic matters",
        "popularity": 8,
        "keywords": ["keyword1", "keyword2", "keyword3"]
      }
    ]
    
    Make topics actionable, relevant to current business climate, and engagement-worthy.
  `;
}

/**
 * Prompt for Step 2: Generating content ideas/angles with strict user instructions
 */
export function contentIdeasPrompt(topic: string, userInput: string, contentType: string, tone: string): string {
  return `
    You are a LinkedIn content creator specializing in ${tone} content.
    
    TOPIC: ${topic}
    CRITICAL USER INSTRUCTIONS: ${userInput || "None provided. Use your best creative judgment."}
    CONTENT TYPE: ${contentType}
    
    TASK: Generate 5 unique content ideas. You MUST strictly follow the 'CRITICAL USER INSTRUCTIONS' provided above.
    
    Return ONLY a valid JSON array:
    [
      {
        "id": "unique-id",
        "title": "Title",
        "hook": "Hook",
        "angle": "Angle",
        "targetAudience": "Audience",
        "estimatedEngagement": 8
      }
    ]
  `;
}

/**
 * Prompt for Step 3: Generating a detailed outline
 */
export function outlineGenerationPrompt(idea: ContentIdea, sections: number = 3, includeCallToAction: boolean = true): string {
  return `
    Create a detailed LinkedIn content outline.
    
    Idea: ${idea.title}
    Hook: ${idea.hook}
    Sections: ${sections}
    
    Generate a structured outline with:
    1. Attention-grabbing hook (under 150 chars, visible before "see more")
    2. ${sections} main sections with:
       - Clear section title
       - 3-4 key points per section
       - Suggested word count
    3. ${includeCallToAction ? 'Strong call-to-action with engagement question' : ''}
    4. 3-5 relevant hashtags (mix of broad and niche)
    
    Return ONLY valid JSON:
    {
      "hook": "Compelling first line",
      "sections": [
        {
          "id": "section-1",
          "title": "Section title",
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "suggestedLength": 150
        }
      ],
      "callToAction": "Engaging question or action",
      "hashtags": ["#Hashtag1", "#Hashtag2"]
    }
    
    Optimize for: LinkedIn algorithm, mobile readability, short paragraphs, natural flow.
  `;
}

/**
 * Prompt for Step 4: Generating full content text
 */
export function contentGenerationPrompt(outline: ContentOutline, contentType: string, maxLength: number = 1300): string {
  return `
    Generate complete LinkedIn ${contentType} content.
    
    Outline: ${JSON.stringify(outline)}
    Max
