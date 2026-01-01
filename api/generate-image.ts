export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.STABILITY_API_KEY; // Real Key check

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });

    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ text_prompts: [{ text: prompt, weight: 1 }], cfg_scale: 7, steps: 30, samples: 1 })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${data.artifacts[0].base64}` }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
