import { queryAI } from './gemini';

export interface TrendingTopic {
  topic: string;
  volume: number;
  growth: string; // "↑ 45% this week"
  industry: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export async function fetchLinkedInTrends(
  industry: string,
  userProfile?: { role: string; interests: string[] }
): Promise {
  const searchQuery = userProfile 
    ? `${industry} trends for ${userProfile.role} ${new Date().getFullYear()}`
    : `${industry} trending topics linkedin`;
    
  // Use web search to get real-time data
  const results = await fetch('/api/web-search', {
    method: 'POST',
    body: JSON.stringify({ query: searchQuery })
  }).then(r => r.json());
  
  // AI processes search results into structured trends
  const prompt = `
    Analyze these search results and extract trending LinkedIn topics:
    ${JSON.stringify(results)}
    
    Return top 5 trends with volume indicators and growth metrics.
  `;
  
  return await queryAI(prompt);
}
