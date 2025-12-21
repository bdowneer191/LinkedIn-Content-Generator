
import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  PlusCircle, 
  Share2,
  AlertCircle,
  Download,
  Upload,
  X,
  Keyboard
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AppProvider, useApp } from './context/AppContext';
import { storage } from './lib/storage';
import { ProgressSteps } from './components/ProgressSteps';
import { TopicSelector } from './components/TopicSelector';
import { IdeaCards } from './components/IdeaCards';
import { OutlineEditor } from './components/OutlineEditor';
import { ContentPreview } from './components/ContentPreview';
import { SEOChecklist } from './components/SEOChecklist';
import { ImagePromptCard } from './components/ImagePromptCard';
import { rateLimiter } from './lib/rate-limiter';
import { Step } from './types/index';
import { validateEnv } from './lib/env';

const WelcomeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark/50 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 relative overflow-hidden animate-in zoom-in duration-300">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full" />
      <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
        <X size={20} className="text-gray-400" />
      </button>
      <div className="relative z-10">
        <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-primary mb-6">
          <Sparkles size={32} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Welcome to ContentGen</h2>
        <p className="text-gray-600 font-medium mb-8 leading-relaxed">
          The ultimate AI agent for LinkedIn content. We help you discover trending topics, generate scroll-stopping ideas, and optimize for the 2025 algorithm in 5 simple steps.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="flex items-start gap-3">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600 mt-1"><Sparkles size={12} /></div>
              <p className="text-xs font-bold text-gray-500">AI-Powered Ideation</p>
           </div>
           <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 mt-1"><Sparkles size={12} /></div>
              <p className="text-xs font-bold text-gray-500">SEO Algorithm Audit</p>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Let's Start Writing
        </button>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { state, updateState, resetState, goToStep, isLoading, error, clearError } = useApp();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    validateEnv();
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('has_seen_welcome', 'true');
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to Save/Export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        storage.export();
        toast.success("Draft exported to JSON!");
      }
      // Ctrl/Cmd + Right Arrow for Next Step
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight' && state.currentStep < 5) {
        e.preventDefault();
        goToStep((state.currentStep + 1) as Step);
      }
      // Ctrl/Cmd + Left Arrow for Previous Step
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft' && state.currentStep > 1) {
        e.preventDefault();
        goToStep((state.currentStep - 1) as Step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.currentStep, goToStep]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedState = await storage.import(file);
      updateState(importedState);
      toast.success("Session imported successfully!");
    } catch (err) {
      updateState({ error: "Failed to import session. File might be corrupted." });
      toast.error("Import failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-dark font-sans selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-right" expand={false} richColors closeButton />
      
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Share2 className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-none">ContentGen</h1>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">LinkedIn Agent</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => storage.export()} className="p-3 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-primary" title="Export (Ctrl+S)">
                <Download size={20} />
             </button>
             <label className="p-3 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-primary cursor-pointer" title="Import Session">
                <Upload size={20} />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
             </label>
             <button onClick={resetState} className="p-3 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-primary" title="New Draft">
                <PlusCircle size={22} />
             </button>
             <div className="h-8 w-px bg-gray-100 mx-1" />
             <div className="bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  {rateLimiter.getRemainingRequests()} API Credits
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-10 flex items-center justify-between">
          <button 
            disabled={state.currentStep === 1 || isLoading}
            onClick={() => goToStep((state.currentStep - 1) as Step)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all disabled:opacity-0"
          >
            <ArrowLeft size={18} />
            Back to Step {state.currentStep - 1}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <Keyboard size={12} /> Use Arrows to Navigate
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Progress: {Math.round((state.currentStep / 5) * 100)}%
            </div>
          </div>
        </div>

        <ProgressSteps currentStep={state.currentStep} onStepClick={(s) => goToStep(s as Step)} />

        <div className="mt-12 mb-20">
          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle className="text-red-500 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-red-900 mb-1">Oops! Something went wrong</h4>
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={clearError} className="mt-3 text-xs font-bold text-red-500 hover:underline">Dismiss Error</button>
              </div>
            </div>
          )}

          {state.currentStep === 1 && <TopicSelector />}
          {state.currentStep === 2 && <IdeaCards />}
          {state.currentStep === 3 && <OutlineEditor />}
          {state.currentStep === 4 && <ContentPreview />}
          {state.currentStep === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <div className="space-y-8">
                  <SEOChecklist />
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="text-lg font-bold mb-4">Final Actions</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => storage.export()} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-xl hover:border-primary hover:bg-blue-50 transition-all gap-2">
                           <Download size={24} className="text-primary" />
                           <span className="text-sm font-bold">Download JSON</span>
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(state.content?.text || ''); toast.success("Copied to clipboard!"); }} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-xl hover:border-primary hover:bg-blue-50 transition-all gap-2">
                           <Share2 size={24} className="text-primary" />
                           <span className="text-sm font-bold">Copy Final Text</span>
                        </button>
                     </div>
                  </div>
               </div>
               <div className="space-y-8">
                  <ImagePromptCard />
                  <div className="bg-secondary text-white p-8 rounded-2xl shadow-xl shadow-green-500/20 relative overflow-hidden group">
                     <Sparkles className="absolute -right-10 -bottom-10 w-40 h-40 text-white/10 group-hover:scale-110 transition-transform duration-1000" />
                     <h3 className="text-xl font-bold mb-2 relative z-10">Ready to Publish?</h3>
                     <p className="text-green-100 text-sm mb-6 relative z-10">Your content is fully optimized for LinkedIn's 2025 algorithm.</p>
                     <button onClick={resetState} className="w-full bg-white text-secondary py-3 rounded-xl font-bold hover:bg-green-50 transition-all relative z-10">Start Next Post</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-primary w-8 h-8 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-gray-900 mb-1">AI Agent Working</p>
                <p className="text-sm text-gray-500 font-medium">Generating creative professional content...</p>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 opacity-50">
              <Share2 size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">ContentGen v1.0</span>
           </div>
           <div className="flex gap-8">
              <span className="text-xs font-bold text-gray-400">RPM Limit: {rateLimiter.getRemainingRequests()}/15</span>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-xs font-bold text-gray-400 hover:text-primary transition-all">Back to Top</button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs font-bold text-gray-400 hover:text-primary transition-all">API Docs</a>
           </div>
           <div className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">
              &copy; 2025 AI CONTENT STUDIO
           </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
