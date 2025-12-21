
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Search, Edit3, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { topicSuggestionPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';
import { ContentTopic } from '../types/index';

export const TopicSelector: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [industry, setIndustry] = useState(state.industry || '');
  const [manualTopic, setManualTopic] = useState('');
  
  const handleGenerateTopics = async () => {
    if (!industry) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = topicSuggestionPrompt(industry);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      const topics = (result.topics || result).map((t: any, idx: number) => ({
        ...t,
        id: `topic-${Date.now()}-${idx}`,
        source: 'auto'
      }));
      updateState({ topics, industry, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleSelectTopic = (topic: ContentTopic) => {
    updateState({ selectedTopic: topic });
    goToStep(2);
  };

  const handleManualContinue = () => {
    if (manualTopic.length < 10) return;
    const topic: ContentTopic = {
      id: `manual-${Date.now()}`,
      title: manualTopic,
      description: 'Manually entered topic',
      popularity: 5,
      keywords: manualTopic.split(' ').filter(w => w.length > 4).slice(0, 3),
      source: 'manual'
    };
    handleSelectTopic(topic);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('auto')}
            className={cn(
              "flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === 'auto' ? "text-primary border-b-2 border-primary bg-blue-50/30" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Sparkles size={18} /> AI Suggestions
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={cn(
              "flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === 'manual' ? "text-primary border-b-2 border-primary bg-blue-50/30" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Edit3 size={18} /> Manual Input
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'auto' ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">What industry or domain are you focused on?</h3>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g. Fintech, Personal Growth, Digital Marketing..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateTopics()}
                  />
                </div>
                <button
                  onClick={handleGenerateTopics}
                  disabled={state.isGenerating || !industry}
                  className="bg-primary text-white px-8 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  {state.isGenerating ? <Loader2 className="animate-spin" /> : "Discover Trends"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Enter your specific topic or core idea</h3>
              <textarea
                placeholder="Describe what you want to write about in detail..."
                className="w-full p-6 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-medium h-32 resize-none"
                value={manualTopic}
                onChange={(e) => setManualTopic(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-bold", manualTopic.length < 10 ? "text-amber-500" : "text-green-500")}>
                  {manualTopic.length} / 200 characters (min 10)
                </span>
                <button
                  onClick={handleManualContinue}
                  disabled={manualTopic.length < 10}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'auto' && state.topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {state.topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleSelectTopic(topic)}
              className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-primary hover:shadow-xl transition-all text-left flex flex-col h-full cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <ArrowRight size={20} />
                </div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                  topic.popularity > 8 ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"
                )}>
                  {topic.popularity > 8 ? "🔥 Viral Potential" : `Trend Score: ${topic.popularity}/10`}
                </div>
              </div>
              <h4 className="font-black text-lg mb-2 text-gray-900 leading-tight group-hover:text-primary transition-colors">{topic.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{topic.description}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {topic.keywords.map(kw => (
                  <span key={kw} className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
