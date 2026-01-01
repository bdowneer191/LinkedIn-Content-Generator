import React, { useState } from 'react';
import { Image as ImageIcon, Copy, Maximize, Palette, Layout, Info, ChevronDown, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { rateLimiter } from '../lib/rate-limiter';
import { queryAI } from '../lib/gemini';
import { imagePromptGenerationPrompt } from '../lib/prompts';

const styles = [
  { id: 'professional', name: 'Professional', desc: 'Clean, corporate, authoritative' },
  { id: 'creative', name: 'Creative', desc: 'Bold colors, unique perspective' },
  { id: 'minimalist', name: 'Minimalist', desc: 'Sleek, focused, plenty of white space' },
  { id: 'infographic', name: 'Infographic', desc: 'Data-driven, structured, clear' }
];

export const ImagePromptCard: React.FC = () => {
  const { state, updateState } = useApp();
  const [visualStyle, setVisualStyle] = useState(state.imagePrompts[0]?.style || 'professional');
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleGeneratePrompts = async () => {
    if (!state.content) return;
    updateState({ isGenerating: true, error: null });
    try {
      const promptText = imagePromptGenerationPrompt(state.content.text, state.selectedIdea?.contentType || 'post', visualStyle);
      const result = await rateLimiter.add(() => queryAI<any>(promptText));
      const imagePrompts = (result.imagePrompts || result).map((p: any, idx: number) => ({
        ...p,
        id: `img-${Date.now()}-${idx}`
      }));
      updateState({ imagePrompts, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-6">
          <Palette className="text-primary" size={24} /> Visual Direction
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {styles.map(s => (
            <button
              key={s.id}
              onClick={() => setVisualStyle(s.id)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                visualStyle === s.id ? "bg-primary/5 border-primary" : "bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <div className={cn("font-black text-sm", visualStyle === s.id ? "text-primary" : "text-gray-900")}>{s.name}</div>
              <div className="text-[10px] text-gray-400 font-medium leading-tight">{s.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={handleGeneratePrompts}
          disabled={state.isGenerating || !state.content}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <ImageIcon size={20} /> Generate AI Prompts
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {state.imagePrompts.map((p) => (
          <div key={p.id} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <ImageIcon size={120} />
            </div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex gap-2">
                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/10 flex items-center gap-1.5">
                  <Layout size={12} /> {p.placement}
                </span>
                <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                  <Maximize size={12} /> {p.aspectRatio}
                </span>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(p.prompt); alert("Prompt copied!"); }}
                className="bg-white p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-primary hover:border-primary shadow-sm transition-all"
                title="Copy for AI Generator"
              >
                <Copy size={20} />
              </button>
            </div>
            
            <p className="text-gray-700 italic font-medium leading-relaxed mb-6 relative z-10 line-clamp-4 group-hover:line-clamp-none transition-all">"{p.prompt}"</p>
            
            <div className="flex items-center gap-3 mt-auto relative z-10 pt-6 border-t border-gray-50">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                 <Info size={16} />
               </div>
               <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Strategic Purpose</span>
                 <p className="text-xs font-bold text-gray-700">{p.purpose}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {state.imagePrompts.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setTipsOpen(!tipsOpen)}
            className="w-full p-6 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <CheckCircle size={18} />
              </div>
              <span className="font-black text-gray-900 uppercase tracking-widest text-xs">LinkedIn Design Rules</span>
            </div>
            <ChevronDown className={cn("text-gray-400 transition-transform duration-300", tipsOpen && "rotate-180")} />
          </button>
          
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            tipsOpen ? "max-h-[500px] p-8" : "max-h-0"
          )}>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <div className="mt-1 p-0.5 bg-green-500 rounded-full"><CheckCircle size={10} className="text-white" /></div>
                <p className="text-sm text-gray-600 font-medium">Keep text minimal (under 20% of image area) for readability on small mobile screens.</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="mt-1 p-0.5 bg-green-500 rounded-full"><CheckCircle size={10} className="text-white" /></div>
                <p className="text-sm text-gray-600 font-medium">Use high contrast between text and background to satisfy WCAG accessibility standards.</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="mt-1 p-0.5 bg-green-500 rounded-full"><CheckCircle size={10} className="text-white" /></div>
                <p className="text-sm text-gray-600 font-medium">Ensure visual consistency with your personal or company branding (colors, logo placement).</p>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
