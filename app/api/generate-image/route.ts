// api/generate-image.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt } = await req.json();
    
    // Server-Side API Key Check
    const apiKey = process.env.STABILITY_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server Error: Missing Image Gen API Key" }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Stability AI
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
      throw new Error(`Stability API Error: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.artifacts && data.artifacts.length > 0) {
      return new Response(
        JSON.stringify({ imageUrl: `data:image/png;base64,${data.artifacts[0].base64}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw new Error("No image data received");

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Image generation failed" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
