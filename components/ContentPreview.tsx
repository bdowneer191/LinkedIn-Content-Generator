
import React, { useState } from 'react';
import { Copy, RefreshCw, Smartphone, BookOpen, Hash, ArrowRight, Edit3, Eye, Check, Download, Zap, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { calculateSEOScore, analyzeContent } from '../lib/linkedin-seo';
import { queryAI } from '../lib/gemini';
import { contentGenerationPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';

export const ContentPreview: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(state.content?.text || '');
  
  if (!state.content) return null;

  const metrics = analyzeContent(editedText || state.content.text);
  const currentScore = calculateSEOScore(editedText || state.content.text, state.content.hashtags);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText || state.content!.text);
    alert("Draft copied to clipboard!");
  };

  const handleSaveEdit = () => {
    if (!state.content) return;
    updateState({ 
      content: { 
        ...state.content, 
        text: editedText,
        characterCount: editedText.length,
        wordCount: editedText.split(/\s+/).length,
        seoScore: currentScore
      } 
    });
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!state.outline) return;
    updateState({ isGenerating: true, error: null });
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
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                {isEditing ? <Edit3 size={18} /> : <Smartphone size={18} />}
              </div>
              <div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{isEditing ? 'Editor Mode' : 'LinkedIn Preview'}</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Optimized for algorithms</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm",
                  isEditing ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                )}
              >
                {isEditing ? <><Eye size={14} /> Preview</> : <><Edit3 size={14} /> Edit</>}
              </button>
              {!isEditing && (
                <button onClick={handleRegenerate} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary shadow-sm transition-all" title="Regenerate">
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div className="p-8">
            {isEditing ? (
              <div className="space-y-4">
                <textarea 
                  className="w-full h-[500px] p-8 bg-gray-50 rounded-[2rem] border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-sans text-lg leading-relaxed resize-none scrollbar-hide"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                />
                <button 
                  onClick={handleSaveEdit}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Check size={20} /> Save Changes
                </button>
              </div>
            ) : (
              <div className="max-w-[500px] mx-auto bg-white border border-gray-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-4 bg-white flex items-center gap-3 border-b border-gray-50">
                   <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                     <BookOpen size={20} />
                   </div>
                   <div className="flex-1">
                     <div className="w-24 h-2.5 bg-gray-100 rounded-full mb-1.5" />
                     <div className="w-16 h-1.5 bg-gray-50 rounded-full" />
                   </div>
                   <div className="p-2 text-gray-300">
                     <Hash size={16} />
                   </div>
                </div>
                <div className="p-8 text-gray-800 whitespace-pre-wrap leading-relaxed font-sans text-[16px] selection:bg-primary selection:text-white">
                   {editedText || state.content.text}
                </div>
                <div className="px-8 py-4 border-t border-gray-50 bg-gray-50/30 flex gap-4">
                   <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                   <div className="w-20 h-2 bg-gray-100 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
             <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Performance Analysis</h3>
             <div className={cn(
               "px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-2",
               currentScore > 70 ? "bg-green-100 text-green-700" : currentScore > 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
             )}>
                <Zap size={14} /> SEO: {currentScore}/100
             </div>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-2">
               <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span>Character Usage</span>
                  <span className={cn(metrics.characterCount > 1300 ? "text-amber-500" : "text-green-600")}>
                    {metrics.characterCount} / 3000
                  </span>
               </div>
               <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", metrics.characterCount > 1300 ? "bg-amber-400" : "bg-green-500")}
                    style={{ width: `${Math.min(100, (metrics.characterCount / 3000) * 100)}%` }}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Words</span>
                  <span className="text-xl font-black text-gray-900">{metrics.wordCount}</span>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Read Time</span>
                  <span className="text-xl font-black text-gray-900">{metrics.readingTime} min</span>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Paragraphs</span>
                  <span className="text-xl font-black text-gray-900">{metrics.paragraphCount}</span>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Hashtags</span>
                  <span className="text-xl font-black text-gray-900">{metrics.hashtagCount}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-primary text-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
          {/* Fixed: Sparkles added to imports to resolve missing name error */}
          <Sparkles className="absolute -right-4 -top-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform duration-1000" />
          <h3 className="text-2xl font-black mb-3 relative z-10">Maximize Engagement</h3>
          <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed relative z-10">Run advanced SEO analysis and generate tailored image prompts to double your post's visibility.</p>
          <div className="space-y-3">
            <button 
              onClick={() => {
                // If the user hasn't enhanced yet, we need to call the enhance logic
                // In App.tsx handleEnhance handles API calls
                // Here we navigate to Step 5
                goToStep(5);
              }}
              className="w-full bg-white text-primary py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95"
            >
              Enhance Content
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={handleCopy}
              className="w-full bg-primary/20 text-white py-3 rounded-2xl font-bold text-sm border border-white/20 hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Copy size={14} /> Quick Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
