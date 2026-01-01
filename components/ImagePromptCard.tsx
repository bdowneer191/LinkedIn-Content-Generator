import React, { useState } from 'react';
import { Image as ImageIcon, Copy, Palette, Layout, Info, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { rateLimiter } from '../lib/rate-limiter';
import { queryAI } from '../lib/gemini';
import { imagePromptGenerationPrompt } from '../lib/prompts';

export const ImagePromptCard: React.FC = () => {
  const { state, updateState } = useApp();
  const [visualStyle, setVisualStyle] = useState('professional');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const handleGeneratePrompts = async () => {
    if (!state.content) return;
    updateState({ isGenerating: true });
    try {
      const prompt = imagePromptGenerationPrompt(state.content.text, 'post', visualStyle);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      const imagePrompts = (result.imagePrompts || []).map((p: any, i: number) => ({ ...p, id: `img-${Date.now()}-${i}` }));
      updateState({ imagePrompts, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleGenerateRealImage = async (promptText: string) => {
    setIsGeneratingImg(true);
    try {
      // Secure Server-Side Call
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateState({ generatedImage: data.imageUrl });
    } catch (err: any) {
      alert("Generation failed: " + err.message);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Palette size={24} className="text-primary"/> Visual Direction</h3>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {['professional', 'creative', 'minimalist', 'infographic'].map(s => (
            <button key={s} onClick={() => setVisualStyle(s)} className={cn("p-4 rounded-2xl border-2 text-left capitalize", visualStyle === s ? "border-primary bg-primary/5 text-primary" : "border-gray-100")}>
              <div className="font-black text-sm">{s}</div>
            </button>
          ))}
        </div>
        <button onClick={handleGeneratePrompts} disabled={state.isGenerating} className="w-full bg-primary text-white py-4 rounded-2xl font-black flex justify-center gap-2 shadow-lg hover:bg-blue-700">
          <ImageIcon size={20} /> Generate Prompts
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {state.imagePrompts.map((p) => (
          <div key={p.id} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase">{p.placement}</span>
              <button onClick={() => navigator.clipboard.writeText(p.prompt)} className="bg-gray-50 p-2 rounded-xl"><Copy size={16}/></button>
            </div>
            <p className="text-gray-700 italic font-medium mb-6">"{p.prompt}"</p>
            {state.generatedImage ? (
              <img src={state.generatedImage} alt="Generated" className="rounded-2xl w-full" />
            ) : (
              <button onClick={() => handleGenerateRealImage(p.prompt)} disabled={isGeneratingImg} className="w-full bg-secondary text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                {isGeneratingImg ? <Loader2 className="animate-spin"/> : "Generate Real Image (Server-Side)"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
