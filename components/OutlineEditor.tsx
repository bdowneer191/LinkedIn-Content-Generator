import React, { useState, useEffect } from 'react';
import { ListOrdered, CheckCircle2, Plus, Trash2, MoveUp, MoveDown, Loader2, Sparkles, Hash } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { outlineGenerationPrompt, contentGenerationPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { ContentOutline } from '../types/index';

export const OutlineEditor: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [localOutline, setLocalOutline] = useState<ContentOutline | null>(state.outline);

  useEffect(() => {
    if (state.outline && !localOutline) setLocalOutline(state.outline);
  }, [state.outline]);

  const handleGenerateOutline = async () => {
    if (!state.selectedIdea) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = outlineGenerationPrompt(state.selectedIdea);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      const enriched = {
        ...result,
        sections: result.sections.map((s: any, i: number) => ({ ...s, id: `sec-${Date.now()}-${i}`, order: i + 1 }))
      };
      setLocalOutline(enriched);
      updateState({ outline: enriched, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleGenerateContent = async () => {
    if (!localOutline) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = contentGenerationPrompt(localOutline, state.selectedIdea?.contentType || 'post');
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      updateState({ content: result.content, isGenerating: false });
      goToStep(4);
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  if (!localOutline && !state.isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center animate-in zoom-in">
        <div className="bg-primary/10 p-6 rounded-full text-primary mb-6"><ListOrdered size={48} /></div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Build Your Structure</h3>
        <button onClick={handleGenerateOutline} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all flex gap-2 items-center mt-6">
          <Sparkles size={20} /> AI Generate Outline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-primary text-white flex justify-between items-center">
          <h2 className="text-xl font-black">Structured Blueprint</h2>
          <button onClick={handleGenerateOutline} className="p-2 hover:bg-white/10 rounded-full"><Sparkles size={20}/></button>
        </div>
        
        <div className="p-10 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400">The Hook</label>
            <textarea className="w-full p-4 bg-blue-50/50 border-2 border-primary/10 rounded-2xl font-bold text-lg text-gray-800 resize-none h-28" value={localOutline?.hook} onChange={e => setLocalOutline({...localOutline!, hook: e.target.value})} />
          </div>

          <div className="space-y-4">
            {localOutline?.sections.map((section, idx) => (
              <div key={section.id} className="bg-white border border-gray-100 p-6 rounded-2xl hover:border-primary hover:shadow-lg transition-all">
                <input className="font-black text-lg w-full mb-2 outline-none" value={section.title} onChange={e => {
                  const s = [...localOutline!.sections]; s[idx].title = e.target.value; setLocalOutline({...localOutline!, sections: s});
                }} />
                <textarea className="w-full text-sm text-gray-600 resize-none h-16 outline-none bg-transparent" value={section.keyPoints.join('\n')} onChange={e => {
                  const s = [...localOutline!.sections]; s[idx].keyPoints = e.target.value.split('\n'); setLocalOutline({...localOutline!, sections: s});
                }} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Call to Action</label>
                <textarea className="w-full p-4 bg-green-50/50 border border-green-100 rounded-xl font-bold text-sm h-24 resize-none" value={localOutline?.callToAction} onChange={e => setLocalOutline({...localOutline!, callToAction: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Hashtags</label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl min-h-[96px] content-start">
                  {localOutline?.hashtags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-primary text-xs font-bold border border-primary/20">
                      <Hash size={10} /> {tag}
                      <button onClick={() => {
                        const h = localOutline!.hashtags.filter((_, x) => x !== i);
                        setLocalOutline({...localOutline!, hashtags: h});
                      }} className="text-gray-300 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <button onClick={handleGenerateContent} disabled={state.isGenerating} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50">
        {state.isGenerating ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />} Generate Content
      </button>
    </div>
  );
};
