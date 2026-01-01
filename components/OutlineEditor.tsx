import React, { useState, useEffect } from 'react';
import { ListOrdered, CheckCircle2, Plus, Trash2, MoveUp, MoveDown, Loader2, Sparkles, Hash } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { outlineGenerationPrompt, contentGenerationPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';
import { ContentOutline, OutlineSection } from '../types/index';

export const OutlineEditor: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [localOutline, setLocalOutline] = useState<ContentOutline | null>(state.outline);

  useEffect(() => {
    if (state.outline && !localOutline) {
      setLocalOutline(state.outline);
    }
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

  const handleAddSection = () => {
    if (!localOutline) return;
    const newSection: OutlineSection = {
      id: `sec-${Date.now()}`,
      title: 'New Section',
      keyPoints: ['Enter a key point...'],
      suggestedLength: 100,
      order: localOutline.sections.length + 1
    };
    const updated = { ...localOutline, sections: [...localOutline.sections, newSection] };
    setLocalOutline(updated);
    updateState({ outline: updated });
  };

  const handleRemoveSection = (id: string) => {
    if (!localOutline) return;
    const updated = { 
      ...localOutline, 
      sections: localOutline.sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })) 
    };
    setLocalOutline(updated);
    updateState({ outline: updated });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!localOutline) return;
    const sections = [...localOutline.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    const updated = { ...localOutline, sections: sections.map((s, i) => ({ ...s, order: i + 1 })) };
    setLocalOutline(updated);
    updateState({ outline: updated });
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
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
        <div className="bg-primary/10 p-6 rounded-full text-primary mb-6">
          <ListOrdered size={48} />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Build Your Structure</h3>
        <p className="text-gray-500 max-w-sm mb-8">Generate an AI-optimized outline</p>
        <button 
          onClick={handleGenerateOutline}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl flex items-center gap-2"
        >
          <Sparkles size={20} /> Generate Outline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListOrdered size={24} />
            <div>
              <h2 className="text-xl font-black">Content Outline</h2>
              <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">{state.selectedIdea?.title}</p>
            </div>
          </div>
          <button 
            onClick={handleGenerateOutline}
            className="p-3 hover:bg-white/10 rounded-full transition-all"
          >
            <Sparkles size={20} />
          </button>
        </div>
        
        <div className="p-10 space-y-12">
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Hook</label>
              <span className={cn("text-[10px] font-bold", (localOutline?.hook.length || 0) > 150 ? "text-red-500" : "text-gray-400")}>
                {localOutline?.hook.length}/150
              </span>
            </div>
            <textarea
              className="w-full p-6 bg-blue-50/50 border-2 border-primary/10 rounded-2xl text-gray-800 font-bold text-lg focus:border-primary outline-none resize-none h-28"
              value={localOutline?.hook}
              onChange={(e) => setLocalOutline({ ...localOutline!, hook: e.target.value })}
            />
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Sections</label>
              <button 
                onClick={handleAddSection}
                className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            
            <div className="space-y-4">
              {localOutline?.sections.map((section, idx) => (
                <div key={section.id} className="group relative bg-white border border-gray-100 p-6 rounded-2xl hover:border-primary hover:shadow-lg transition-all">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveSection(idx, 'up')} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:text-primary"><MoveUp size={14} /></button>
                    <button onClick={() => moveSection(idx, 'down')} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:text-primary"><MoveDown size={14} /></button>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <input 
                      className="bg-transparent text-lg font-black text-gray-900 outline-none w-full mr-4"
                      value={section.title}
                      onChange={(e) => {
                        const sections = [...localOutline!.sections];
                        sections[idx].title = e.target.value;
                        setLocalOutline({ ...localOutline!, sections });
                      }}
                    />
                    <button 
                      onClick={() => handleRemoveSection(section.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {section.keyPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                        <textarea
                          rows={1}
                          className="w-full text-sm text-gray-600 bg-transparent outline-none resize-none"
                          value={point}
                          onChange={(e) => {
                            const sections = [...localOutline!.sections];
                            sections[idx].keyPoints[pIdx] = e.target.value;
                            setLocalOutline({ ...localOutline!, sections });
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const sections = [...localOutline!.sections];
                        sections[idx].keyPoints.push('New point...');
                        setLocalOutline({ ...localOutline!, sections });
                      }}
                      className="text-[10px] font-bold text-primary/60 hover:text-primary flex items-center gap-1"
                    >
                      <Plus size={10} /> Add Point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Call to Action</label>
              <textarea
                className="w-full p-4 bg-green-50/50 border border-green-100 rounded-xl text-green-900 font-bold text-sm focus:border-green-500 outline-none resize-none h-24"
                value={localOutline?.callToAction}
                onChange={(e) => setLocalOutline({ ...localOutline!, callToAction: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Hashtags</label>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl min-h-[96px]">
                {localOutline?.hashtags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-primary text-xs font-bold border border-primary/20">
                    <Hash size={10} /> {tag}
<button
onClick={() => {
const hashtags = localOutline!.hashtags.filter((_, idx) => idx !== i);
setLocalOutline({ ...localOutline!, hashtags });
}}
className="text-gray-300 hover:text-red-500"
>
×
</button>
</span>
))}
<input
className="bg-transparent text-xs font-bold outline-none flex-1 min-w-[100px]"
placeholder="Add hashtag..."
onKeyDown={(e: any) => {
if (e.key === 'Enter' && e.target.value) {
const val = e.target.value.replace(/^#/, '');
if (!localOutline!.hashtags.includes(val)) {
setLocalOutline({ ...localOutline!, hashtags: [...localOutline!.hashtags, val] });
}
e.target.value = '';
}
}}
/>
</div>
</div>
</div>
</div>
</div>
  <button
    onClick={handleGenerateContent}
    disabled={state.isGenerating}
    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50"
  >
    {state.isGenerating ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
    Generate Content
  </button>
</div>
);
};
