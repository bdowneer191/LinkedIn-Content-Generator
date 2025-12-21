
import { GoogleGenAI, Type } from "@google/genai";
// Fixed: Changed 'InternalLink' to 'WPInternalLink' to correctly import the type from types.ts
import { WPSEOAnalysis, WPPost, WPInternalLink } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using WPSEOAnalysis to distinguish from the LinkedIn SEO types
export async function analyzeContentForLinking(
  content: string,
  existingPosts: WPPost[],
  seoRules: string
): Promise<WPSEOAnalysis> {
  // We provide a simplified context of existing posts to avoid token limits
  const postContext = existingPosts.map(p => ({
    id: p.id,
    title: p.title,
    link: p.link
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Analyze the following article content and suggest internal links to our existing blog posts.
      
      SEO RULES:
      ${seoRules}

      EXISTING POSTS:
      ${JSON.stringify(postContext)}

      CONTENT TO ANALYZE:
      ${content}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedContent: {
            type: Type.STRING,
            description: "The original content with HTML anchor tags added for internal linking."
          },
          linksAdded: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                anchor: { type: Type.STRING },
                url: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["anchor", "url"]
            }
          },
          seoTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["optimizedContent", "linksAdded", "seoTips"]
      }
    }
  });

  // Fixed: Ensure the return object includes 'originalContent' as required by the WPSEOAnalysis interface
  const text = response.text;
  const parsedResponse = JSON.parse(text || '{}');
  
  return {
    originalContent: content,
    ...parsedResponse
  } as WPSEOAnalysis;
}

export async function generateSEORules(): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate a comprehensive set of SEO internal linking rules for 2024-2025, focusing on news sites, Google/Bing ranking factors, and semantic relevance. Keep it concise but professional."
  });
  // Using .text property directly as per Google GenAI SDK guidelines
  return response.text || "Prioritize high-relevance links with natural anchor text.";
}
