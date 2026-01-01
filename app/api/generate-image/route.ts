import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // Check Server-Side Env Vars
    if (!process.env.BANANA_API_KEY && !process.env.STABILITY_API_KEY) {
      return NextResponse.json({ error: "No Image Generation API Key configured on server." }, { status: 500 });
    }

    // Example: Stability AI Implementation
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY || process.env.BANANA_API_KEY}`
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        steps: 30,
        samples: 1
      })
    });

    if (!response.ok) throw new Error(await response.text());
    
    const data = await response.json();
    return NextResponse.json({ imageUrl: `data:image/png;base64,${data.artifacts[0].base64}` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
