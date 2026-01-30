import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Infinity as InfinityIcon, LayoutGrid, Plus, Zap, ArrowRight, Sparkles, PenTool, CheckCircle, ChevronLeft, Upload, FileText } from 'lucide-react';
import { SimulationState, StrategicDossier } from './types';
import { generateDossier, initializeSimulation, generateCopyStrategy, generateStandaloneCopyStrategy, generateConceptImage } from './services/geminiService';
import DossierView from './components/DossierView';
import DashboardView from './components/DashboardView';
import { SUPPORTED_LANGUAGES, POPULAR_BRANDS } from './constants';

type ViewState = 'library' | 'validator_input' | 'copywriter_input' | 'dashboard' | 'dossier';

const SPARKS = [
  "A subscription for baby clothes that grows with the child",
  "Airbnb for renting high-end power tools to neighbors",
  "AI-powered personal stylist that audits your wardrobe",
  "A dating app that matches people based on their dislikes",
  "A vertical farm in every grocery store for fresh herbs",
  "Uber for professional photographers on demand"
];

function App() {
  const [concept, setConcept] = useState('');
  
  // Copywriter State
  const [copyName, setCopyName] = useState('');
  const [copyPitch, setCopyPitch] = useState('');
  const [copyContext, setCopyContext] = useState('');
  const [copyLang, setCopyLang] = useState('English');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Brand Autocomplete State
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandInputRef = useRef<HTMLDivElement>(null);

  const [currentView, setCurrentView] = useState<ViewState>('library');
  const [state, setState] = useState<SimulationState>({
    isAnalyzing: false,
    dossier: null,
    error: null
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandInputRef.current && !brandInputRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAnalyze = async (inputConcept?: string) => {
    const targetConcept = typeof inputConcept === 'string' ? inputConcept : concept;
    if (!targetConcept.trim()) return;
    
    if (inputConcept) setConcept(inputConcept);
    
    setState({ isAnalyzing: true, dossier: null, error: null });
    initializeSimulation();

    try {
      const result = await generateDossier(targetConcept);
      setState({ isAnalyzing: false, dossier: result, error: null });
      setCurrentView('dossier');
    } catch (e) {
      setState({ 
        isAnalyzing: false, 
        dossier: null, 
        error: "Analysis failed. The Loop encountered an error." 
      });
    }
  };

  const handleStandaloneCopy = async () => {
      if (!copyPitch.trim()) return;

      setState({ isAnalyzing: true, dossier: null, error: null });
      
      try {
          // Pass empty array for benefits, the service will now handle generation
          const result = await generateStandaloneCopyStrategy(copyName, copyPitch, [], copyLang, copyContext);
          setState({ isAnalyzing: false, dossier: result, error: null });
          setCurrentView('dossier');
      } catch (e) {
           setState({ 
            isAnalyzing: false, 
            dossier: null, 
            error: "Copy generation failed. The Loop encountered an error." 
          });
      }
  }

  const handleGenerateCopy = async (dossier: StrategicDossier, language: string) => {
      try {
          const updatedDossier = await generateCopyStrategy(dossier, language);
          setState(prev => ({
              ...prev,
              dossier: updatedDossier
          }));
      } catch (e) {
          console.error("Failed to generate copy", e);
      }
  };

  const handleGenerateSketch = async (dossier: StrategicDossier) => {
    try {
        const updatedDossier = await generateConceptImage(dossier);
        setState(prev => ({
            ...prev,
            dossier: updatedDossier
        }));
    } catch (e) {
        console.error("Failed to generate sketch", e);
    }
  }

  const handleViewDossier = (dossier: StrategicDossier) => {
    setState({ isAnalyzing: false, dossier: dossier, error: null });
    setCurrentView('dossier');
  };

  const handleNewAnalysis = () => {
    setConcept('');
    setCopyName('');
    setCopyPitch('');
    setCopyContext('');
    setState({ isAnalyzing: false, dossier: null, error: null });
    setCurrentView('library');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        setCopyContext(prev => prev ? prev + "\n\n" + text : text);
    };
    reader.readAsText(file);
  };

  const filteredBrands = copyName 
    ? POPULAR_BRANDS.filter(b => b.name.toLowerCase().includes(copyName.toLowerCase())).slice(0, 10)
    : POPULAR_BRANDS.slice(0, 10);

  return (
    <div className="h-screen w-full flex flex-col overflow-y-auto bg-brand-bg scroll-smooth relative selection:bg-brand-accent/20">
      
      {/* Global Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-brand-light-gray/40 to-transparent rounded-full blur-[100px] opacity-50"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
             className="flex items-center gap-3 cursor-pointer group" 
             onClick={() => setCurrentView('library')} 
             role="button"
          >
             {/* THE LOOP LOGO SVG */}
             <svg className="h-10 w-auto" viewBox="0 0 240 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="The Loop">
                <text x="0" y="38" fontFamily="Switzer, sans-serif" fontSize="40" fontWeight="900" fill="#222" letterSpacing="-1">THE</text>
                <text x="88" y="38" fontFamily="Switzer, sans-serif" fontSize="40" fontWeight="900" fill="#222" letterSpacing="-1">L</text>
                
                {/* Interlocking Os */}
                <circle cx="132" cy="24" r="15" stroke="#222" strokeWidth="7" fill="none" />
                <circle cx="158" cy="24" r="15" stroke="#222" strokeWidth="7" fill="none" />
                
                <text x="188" y="38" fontFamily="Switzer, sans-serif" fontSize="40" fontWeight="900" fill="#222" letterSpacing="-1">P</text>
             </svg>
          </div>
          
          <div className="flex items-center gap-3">
            {state.isAnalyzing && (
                <div className="flex items-center gap-2 text-sm font-medium text-brand-gray animate-pulse mr-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                </div>
            )}
            
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`p-2.5 rounded-full transition-all duration-200 ${currentView === 'dashboard' ? 'bg-black text-white shadow-md' : 'bg-white text-brand-gray border border-gray-200 hover:border-brand-dark hover:text-brand-dark'}`}
                title="My Dashboard"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
                onClick={handleNewAnalysis}
                className="p-2.5 rounded-full bg-brand-accent text-white hover:bg-rose-600 transition-all shadow-md shadow-brand-accent/20 hover:shadow-lg hover:shadow-brand-accent/30"
                title="New Agent Session"
            >
                <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 relative z-10">
        
        {/* VIEW: DASHBOARD */}
        {currentView === 'dashboard' && (
            <DashboardView onSelect={handleViewDossier} onNew={handleNewAnalysis} />
        )}

        {/* VIEW: AGENT LIBRARY (HOME) */}
        {currentView === 'library' && (
             <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
                 <div className="text-center mb-16">
                     <h2 className="text-4xl md:text-5xl font-extrabold text-brand-dark tracking-tighter mb-4">
                         Select an Agent
                     </h2>
                     <p className="text-xl text-brand-gray font-light">
                         Choose a specialized AI agent to start your workflow.
                     </p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                     {/* VALIDATOR CARD */}
                     <button 
                        onClick={() => setCurrentView('validator_input')}
                        className="group relative bg-white rounded-3xl p-8 md:p-12 text-left shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 overflow-hidden"
                     >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
                         <div className="w-16 h-16 bg-brand-dark text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:bg-brand-accent transition-colors">
                             <Sparkles className="w-8 h-8" />
                         </div>
                         <h3 className="text-2xl font-bold text-brand-dark mb-3">Concept Validator</h3>
                         <p className="text-brand-gray leading-relaxed mb-8">
                             Deep strategic analysis. Turns raw ideas into market-proof concepts through critique, pivoting, and insight mining.
                         </p>
                         <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-dark group-hover:text-brand-accent transition-colors">
                             Start Validation <ArrowRight className="w-4 h-4" />
                         </div>
                     </button>

                     {/* COPYWRITER CARD */}
                     <button 
                        onClick={() => setCurrentView('copywriter_input')}
                        className="group relative bg-white rounded-3xl p-8 md:p-12 text-left shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 overflow-hidden"
                     >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
                         <div className="w-16 h-16 bg-white border border-gray-200 text-brand-dark rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:border-brand-dark transition-colors">
                             <PenTool className="w-8 h-8" />
                         </div>
                         <h3 className="text-2xl font-bold text-brand-dark mb-3">The Copywriter</h3>
                         <p className="text-brand-gray leading-relaxed mb-8">
                             Agency-grade creative direction. Instantly generate high-conversion headlines, taglines, and landing page copy.
                         </p>
                         <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-dark group-hover:text-blue-600 transition-colors">
                             Start Writing <ArrowRight className="w-4 h-4" />
                         </div>
                     </button>
                 </div>
             </div>
        )}

        {/* VIEW: COPYWRITER INPUT */}
        {currentView === 'copywriter_input' && (
             <div className="max-w-2xl mx-auto pt-10 pb-20 animate-[fadeIn_0.5s_ease-out]">
                 <button 
                    onClick={() => setCurrentView('library')}
                    className="flex items-center gap-2 text-brand-gray hover:text-brand-dark transition-colors mb-8 text-sm font-bold uppercase tracking-widest"
                 >
                     <ChevronLeft className="w-4 h-4" /> Back to Library
                 </button>

                 <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                         <PenTool className="w-32 h-32" />
                     </div>

                     <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-brand-dark mb-2">The Creative Brief</h2>
                        <p className="text-brand-gray mb-8">Tell the Copywriter Agent about your finished concept.</p>

                        <div className="space-y-6">
                            
                            {/* Brand Name Autocomplete */}
                            <div className="relative" ref={brandInputRef}>
                                <label className="block text-xs font-bold uppercase tracking-widest text-brand-gray mb-2">Brand Name</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={copyName}
                                        onChange={(e) => {
                                            setCopyName(e.target.value);
                                            setShowBrandDropdown(true);
                                        }}
                                        onFocus={() => setShowBrandDropdown(true)}
                                        placeholder="e.g. Luminar (Optional)"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark transition-all pl-10"
                                    />
                                    <div className="absolute left-3 top-3 text-brand-gray">
                                        <Search className="w-5 h-5 opacity-50" />
                                    </div>
                                </div>
                                
                                {/* Dropdown */}
                                {showBrandDropdown && filteredBrands.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-airbnb border border-gray-100 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-brand-gray tracking-widest">
                                            Suggestions
                                        </div>
                                        {filteredBrands.map((brand, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCopyName(brand.name);
                                                    setShowBrandDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                                                    <img 
                                                        src={`https://logo.clearbit.com/${brand.domain}`} 
                                                        alt={brand.name} 
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'block';
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-bold text-brand-gray hidden">{brand.name.substring(0, 1)}</span>
                                                </div>
                                                <span className="font-medium text-brand-dark">{brand.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-brand-gray mb-2">One Sentence Pitch</label>
                                <textarea 
                                    value={copyPitch}
                                    onChange={(e) => setCopyPitch(e.target.value)}
                                    placeholder="e.g. A smart lamp that mimics natural sunlight to improve sleep cycles."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark transition-all h-20 resize-none"
                                />
                            </div>

                            {/* Context & Brief Input */}
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-brand-gray">Strategic Context / Brief</label>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:underline flex items-center gap-1"
                                    >
                                        <Upload className="w-3 h-3" /> Upload Doc
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept=".txt,.md,.json,.csv"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={copyContext}
                                        onChange={(e) => setCopyContext(e.target.value)}
                                        placeholder="Paste your brief, brand guidelines, or audience research here..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark transition-all h-32 resize-none text-sm leading-relaxed"
                                    />
                                    {copyContext.length > 0 && (
                                        <div className="absolute bottom-3 right-3 text-[10px] font-bold bg-white px-2 py-1 rounded-md shadow-sm text-brand-gray border border-gray-100 flex items-center gap-1">
                                            <FileText className="w-3 h-3 text-brand-accent" />
                                            {copyContext.length} chars
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-brand-gray mt-2 leading-relaxed">
                                    The AI will read this context and perform <b>Market Research</b> to gather additional insights before writing.
                                </p>
                            </div>

                             <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-brand-gray mb-2">Target Language</label>
                                <div className="relative">
                                    <select 
                                        value={copyLang}
                                        onChange={(e) => setCopyLang(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-brand-dark font-medium py-3 px-4 pr-8 rounded-xl focus:outline-none focus:border-brand-dark cursor-pointer"
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-gray">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleStandaloneCopy}
                                disabled={state.isAnalyzing || !copyPitch}
                                className="w-full bg-brand-dark text-white font-bold py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg"
                            >
                                {state.isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                Generate Copy Strategy
                            </button>
                        </div>
                     </div>
                 </div>
             </div>
        )}

        {/* VIEW: VALIDATOR INPUT (Original Home) */}
        {currentView === 'validator_input' && (
             <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
                 <button 
                    onClick={() => setCurrentView('library')}
                    className="absolute top-28 left-6 md:left-auto md:top-auto md:mb-12 flex items-center gap-2 text-brand-gray hover:text-brand-dark transition-colors text-sm font-bold uppercase tracking-widest"
                 >
                     <ChevronLeft className="w-4 h-4" /> Back to Library
                 </button>

                <div className="mb-12 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-dark/5 text-brand-dark text-xs font-bold uppercase tracking-wider mb-2 border border-brand-dark/5">
                        <Sparkles className="w-3 h-3 text-brand-accent" />
                        <span>AI-Powered Validation</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold text-brand-dark tracking-tighter leading-[1.1]">
                        Validate your concept. <br/>
                        <span className="text-brand-accent">Find the breakthrough.</span>
                    </h2>
                    <p className="text-xl text-brand-gray max-w-2xl mx-auto font-light leading-relaxed">
                        Input a raw business idea. The Loop will mine insights, critique the flaws, and pivot it into a strategic winner.
                    </p>
                </div>

                {/* Input Box */}
                <div className="w-full max-w-2xl relative group mb-16">
                        <div className={`absolute inset-0 bg-brand-accent/20 blur-2xl rounded-full transition-opacity duration-500 ${state.isAnalyzing ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-40'}`}></div>
                        <div className="relative bg-white shadow-2xl shadow-black/5 rounded-full flex items-center p-2.5 border border-gray-200 focus-within:border-brand-accent/50 focus-within:ring-4 focus-within:ring-brand-accent/10 transition-all duration-300">
                            <input 
                                type="text"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder="Describe a business idea, product, or problem..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-brand-dark placeholder:text-gray-400 px-6 py-4 text-xl font-medium"
                                disabled={state.isAnalyzing}
                                autoFocus
                            />
                            <button 
                                onClick={() => handleAnalyze()}
                                disabled={!concept.trim() || state.isAnalyzing}
                                className="w-14 h-14 bg-brand-accent hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-brand-accent rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                            >
                                {state.isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            </button>
                        </div>
                </div>

                {/* Inspiration Sparks */}
                <div className="w-full max-w-5xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <div className="flex items-center gap-2 text-brand-gray text-xs font-bold uppercase tracking-widest opacity-60">
                            <Zap className="w-3 h-3" />
                            <span>Or spark inspiration</span>
                        </div>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {SPARKS.map((spark, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnalyze(spark)}
                                disabled={state.isAnalyzing}
                                className="group text-left p-5 rounded-2xl bg-white border border-gray-100 hover:border-brand-accent/30 hover:shadow-airbnb transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <p className="text-brand-dark font-medium leading-snug group-hover:text-brand-accent transition-colors relative z-10 pr-6">
                                    {spark}
                                </p>
                                <ArrowRight className="w-4 h-4 text-brand-accent absolute bottom-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
                 
                 {state.error && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center text-sm">
                        {state.error}
                    </div>
                )}
            </div>
        )}

        {/* VIEW: DOSSIER RESULTS */}
        {currentView === 'dossier' && state.dossier && (
            <div className="animate-[fadeIn_0.5s_ease-out]">
                 <div className="mb-8 flex items-center justify-between">
                     <div className="flex items-center gap-3 text-sm text-brand-gray bg-white py-2 px-4 rounded-full shadow-sm border border-gray-100">
                        <span className="opacity-50 uppercase tracking-widest font-bold text-[10px]">Analysis of</span>
                        <span className="font-bold text-brand-dark border-l border-gray-200 pl-3">"{state.dossier.concept_input}"</span>
                     </div>
                     <button 
                        onClick={() => handleAnalyze(state.dossier?.concept_input)}
                        className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
                     >
                        <InfinityIcon className="w-3 h-3" />
                        Retry Analysis
                     </button>
                 </div>
                 <DossierView 
                    dossier={state.dossier} 
                    onGenerateCopy={handleGenerateCopy}
                    onGenerateSketch={handleGenerateSketch}
                 />
            </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-xs text-brand-light-gray font-medium tracking-widest uppercase">
             The Loop Engine v3.0
      </footer>

    </div>
  );
}

export default App;