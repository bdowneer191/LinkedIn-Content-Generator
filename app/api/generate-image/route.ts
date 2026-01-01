// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // 1. Check for API Key (Server-Side Only)
    const apiKey = process.env.STABILITY_API_KEY || process.env.BANANA_API_KEY;
    
    if (!apiKey) {
      console.error("Missing Image Gen API Key");
      return NextResponse.json(
        { error: "Image generation service not configured (Missing API Key)" }, 
        { status: 500 }
      );
    }

    // 2. Call Stability AI (Standard Production Implementation)
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        steps: 30,
        samples: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider Error: ${errorText}`);
    }

    const data = await response.json();
    
    // 3. Return Base64 Image
    if (data.artifacts && data.artifacts.length > 0) {
      return NextResponse.json({ 
        imageUrl: `data:image/png;base64,${data.artifacts[0].base64}` 
      });
    }

    throw new Error("No image generated");

  } catch (error: any) {
    console.error("Image Route Error:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
