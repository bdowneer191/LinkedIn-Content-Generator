// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, provider = 'stability' } = await req.json();

    switch (provider) {
      case 'stability':
        return await generateStabilityImage(prompt);
      case 'dalle':
        return await generateDALLEImage(prompt);
      case 'midjourney':
        return await generateMidjourneyImage(prompt);
      default:
        return NextResponse.json({ error: 'Invalid provider selected' }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

async function generateStabilityImage(prompt: string) {
  if (!process.env.STABILITY_API_KEY) {
    return NextResponse.json({ error: "Missing STABILITY_API_KEY" }, { status: 500 });
  }

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
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
    throw new Error(`Stability API Error: ${errorText}`);
  }

  const data = await response.json();
  
  // Stability returns an array of artifacts
  if (data.artifacts && data.artifacts.length > 0) {
    return NextResponse.json({ 
      imageUrl: `data:image/png;base64,${data.artifacts[0].base64}` 
    });
  }

  throw new Error("No image artifacts received from Stability AI");
}

async function generateDALLEImage(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json" // Using base64 to match the app's expectation
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    return NextResponse.json({ 
      imageUrl: `data:image/png;base64,${data.data[0].b64_json}` 
    });
  }

  throw new Error("No image data received from DALL-E");
}

async function generateMidjourneyImage(prompt: string) {
  // Midjourney does not have an official API. 
  // This would require a third-party proxy service (e.g., MyMidjourney, GoAPI).
  return NextResponse.json(
    { error: "Midjourney integration requires a specific third-party proxy configuration." }, 
    { status: 501 }
  );
}
