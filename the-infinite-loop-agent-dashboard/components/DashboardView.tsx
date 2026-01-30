import React, { useEffect, useState } from 'react';
import { StrategicDossier } from '../types';
import { getDossierHistory, deleteDossier } from '../services/storageService';
import { Trash2, ArrowRight, Calendar, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  onSelect: (dossier: StrategicDossier) => void;
  onNew: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSelect, onNew }) => {
  const [history, setHistory] = useState<StrategicDossier[]>([]);

  useEffect(() => {
    setHistory(getDossierHistory());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDossier(id);
    setHistory(getDossierHistory());
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Your Portfolio</h2>
           <p className="text-brand-gray mt-2">Past strategic analyses and concepts.</p>
        </div>
        <button 
           onClick={onNew}
           className="bg-brand-dark text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors shadow-lg"
        >
           + New Analysis
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
           <div className="mb-4 text-brand-light-gray mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 opacity-50" />
           </div>
           <h3 className="text-xl font-bold text-brand-gray">No concepts yet</h3>
           <p className="text-gray-400 mt-2 max-w-sm mx-auto">Start a new analysis to populate your strategic portfolio.</p>
           <button 
             onClick={onNew}
             className="mt-6 text-brand-accent font-bold hover:underline"
           >
             Start Analysis
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {history.map((dossier) => (
              <div 
                key={dossier.id}
                onClick={() => onSelect(dossier)}
                className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-airbnb transition-all duration-300 cursor-pointer border border-transparent hover:border-brand-light-gray relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gray flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(dossier.timestamp)}
                    </span>
                    <button 
                        onClick={(e) => handleDelete(e, dossier.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <h3 className="text-xl font-bold text-brand-dark mb-2 line-clamp-2 group-hover:text-brand-accent transition-colors">
                    {dossier.main_stage.verdict.winning_concept}
                 </h3>
                 
                 <p className="text-sm text-brand-gray line-clamp-3 mb-6 h-14">
                    {dossier.main_stage.verdict.one_sentence_pitch}
                 </p>

                 <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand-accent" />
                        <span className="text-sm font-bold text-brand-dark">{dossier.main_stage.verdict.market_fit_score}/100</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default DashboardView;