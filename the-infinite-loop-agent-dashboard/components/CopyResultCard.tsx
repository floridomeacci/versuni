import React, { useState } from 'react';
import { CopyStrategy, StrategicDossier } from '../types';
import { PenTool, Loader2, RotateCcw, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface CopyResultCardProps {
  dossier: StrategicDossier;
  onRegenerate: (dossier: StrategicDossier, language: string) => Promise<void>;
  isGenerating: boolean;
  defaultLanguage?: string;
}

const CopyResultCard: React.FC<CopyResultCardProps> = ({ dossier, onRegenerate, isGenerating, defaultLanguage = "English" }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  
  if (!dossier.copy_strategy) return null;

  const handleRegenerate = () => {
      onRegenerate(dossier, selectedLanguage);
  };

  return (
    <div className="bg-brand-dark text-white border-none shadow-xl overflow-hidden relative rounded-2xl p-6 md:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <PenTool className="w-48 h-48 text-white" />
        </div>

        {/* Header with Regenerate */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                <h2 className="text-2xl font-bold text-white mb-1">Creative Director Output</h2>
                <p className="text-gray-400 text-sm">Agency-grade copy optimized for conversion.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="appearance-none bg-white/10 border border-white/20 text-white font-medium py-1.5 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-brand-accent cursor-pointer hover:bg-white/20 transition-colors"
                            disabled={isGenerating}
                        >
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value} className="text-black">{lang.label}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <button 
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-rose-600 text-white text-sm font-bold transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isGenerating ? 'Refining...' : 'Regenerate'}</span>
                    </button>
                </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Landing Page Preview */}
            <div className="bg-white text-brand-dark rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-gray-100 p-2 flex items-center gap-1 border-b border-gray-200">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <div className="ml-2 w-2/3 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="p-8 flex flex-col items-center text-center h-full">
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                            {dossier.copy_strategy.hero_header}
                        </h1>
                        <p className="text-gray-500 text-lg leading-snug max-w-sm">
                            {dossier.copy_strategy.sub_header}
                        </p>
                        <button className="bg-brand-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg mt-4">
                            {dossier.copy_strategy.cta_button}
                        </button>
                    </div>
                    <div className="w-full mt-8 border-t border-gray-100 pt-6">
                        <div className="grid grid-cols-1 gap-3 text-left">
                            {dossier.copy_strategy.value_props.map((prop, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>{prop}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
            </div>

            {/* Tagline Variations */}
            <div className="flex flex-col justify-center space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Tagline Variations
                    </h4>
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-lg">
                            <span className="text-[10px] uppercase font-bold text-brand-accent tracking-widest block mb-1">Literal</span>
                            <p className="text-lg font-medium text-brand-dark">"{dossier.copy_strategy.taglines.literal}"</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-lg">
                            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-widest block mb-1">Abstract</span>
                            <p className="text-lg font-medium text-brand-dark">"{dossier.copy_strategy.taglines.abstract}"</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-lg">
                            <span className="text-[10px] uppercase font-bold text-purple-500 tracking-widest block mb-1">Emotional</span>
                            <p className="text-lg font-medium text-brand-dark">"{dossier.copy_strategy.taglines.emotional}"</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CopyResultCard;