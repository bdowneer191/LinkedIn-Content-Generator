import React, { useState } from 'react';
import { Copy, RefreshCw, Smartphone, Edit3, Eye, Check, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateSEOScore, analyzeContent } from '../lib/linkedin-seo';
import { queryAI } from '../lib/gemini';
import { contentGenerationPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';

export const ContentPreview: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(state.content?.text || '');
  
  if (!state.content) return null;

  const metrics = analyzeContent(editedText || state.content.text);
  const currentScore = calculateSEOScore(editedText || state.content.text, state.content.hashtags);

  const handleRegenerate = async () => {
    if (!state.outline) return;
    updateState({ isGenerating: true });
    try {
      const prompt = contentGenerationPrompt(state.outline, state.selectedIdea?.contentType || 'post');
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      updateState({ content: result.content, isGenerating: false });
      setEditedText(result.content.text);
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">{isEditing ? <Edit3 size={18}/> : <Smartphone size={18}/>}</div>
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">LinkedIn Preview</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(!isEditing)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all border", isEditing ? "bg-primary text-white" : "bg-white text-gray-600")}>
                {isEditing ? "Preview" : "Edit"}
              </button>
              <button onClick={handleRegenerate} className="p-2 bg-white border rounded-xl text-gray-400 hover:text-primary"><RefreshCw size={18}/></button>
            </div>
          </div>
          <div className="p-8">
            {isEditing ? (
              <div className="space-y-4">
                <textarea className="w-full h-[500px] p-8 bg-gray-50 rounded-[2rem] border-transparent focus:bg-white font-sans text-lg resize-none" value={editedText} onChange={e => setEditedText(e.target.value)} />
                <button onClick={() => { updateState({ content: { ...state.content!, text: editedText } }); setIsEditing(false); }} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg">Save Changes</button>
              </div>
            ) : (
              <div className="max-w-[500px] mx-auto bg-white border rounded-[2.5rem] shadow-lg overflow-hidden">
                <div className="p-8 text-gray-800 whitespace-pre-wrap leading-relaxed font-sans text-[16px]">{editedText}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between mb-8 pb-4 border-b border-gray-50">
             <h3 className="font-black text-gray-900 uppercase text-sm">Analysis</h3>
             <div className="px-4 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-700 flex items-center gap-2"><Zap size={14}/> Score: {currentScore}/100</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 rounded-2xl"><span className="text-[10px] uppercase text-gray-400 font-black">Words</span><div className="text-xl font-black">{metrics.wordCount}</div></div>
             <div className="p-4 bg-gray-50 rounded-2xl"><span className="text-[10px] uppercase text-gray-400 font-black">Read Time</span><div className="text-xl font-black">{metrics.readingTime}m</div></div>
          </div>
        </div>
        <div className="bg-primary text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <h3 className="text-2xl font-black mb-3 relative z-10">Enhance Content</h3>
          <p className="text-blue-100 text-sm mb-8 relative z-10">Generate tailored image prompts and run deep SEO audit.</p>
          <button onClick={() => goToStep(5)} className="w-full bg-white text-primary py-4 rounded-2xl font-black hover:bg-blue-50 transition-all relative z-10">Next Step</button>
        </div>
      </div>
    </div>
  );
};
