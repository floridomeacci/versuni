import React from 'react';
import { SimulationStep } from '../types';
import { Eye, ShieldAlert, FlaskConical, Trophy, CheckCircle } from 'lucide-react';

interface AgentCardProps {
  step: SimulationStep;
  isLatest: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ step, isLatest }) => {
  const { active_agent, payload, round_status } = step;

  const getAgentStyles = () => {
    switch (active_agent) {
      case 'Anthropologist':
        return {
          borderColor: 'border-emerald-500/50',
          bgColor: 'bg-emerald-950/20',
          textColor: 'text-emerald-400',
          icon: <Eye className="w-5 h-5 text-emerald-400" />,
          title: 'THE ANTHROPOLOGIST'
        };
      case 'Skeptic':
        return {
          borderColor: 'border-rose-500/50',
          bgColor: 'bg-rose-950/20',
          textColor: 'text-rose-400',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          title: 'THE SKEPTIC'
        };
      case 'Alchemist':
        return {
          borderColor: 'border-violet-500/50',
          bgColor: 'bg-violet-950/20',
          textColor: 'text-violet-400',
          icon: <FlaskConical className="w-5 h-5 text-violet-400" />,
          title: 'THE ALCHEMIST'
        };
      case 'Verdict':
        return {
            borderColor: 'border-amber-500/50',
            bgColor: 'bg-amber-950/20',
            textColor: 'text-amber-400',
            icon: <Trophy className="w-5 h-5 text-amber-400" />,
            title: 'THE VERDICT'
        };
      default:
        return {
          borderColor: 'border-slate-700',
          bgColor: 'bg-slate-800/50',
          textColor: 'text-slate-400',
          icon: <CheckCircle className="w-5 h-5" />,
          title: 'UNKNOWN AGENT'
        };
    }
  };

  const styles = getAgentStyles();

  return (
    <div 
      className={`
        relative w-full mb-6 p-6 rounded-lg border-l-4 shadow-lg backdrop-blur-sm transition-all duration-500 ease-in-out
        ${styles.borderColor} ${styles.bgColor}
        ${isLatest ? 'opacity-100 translate-x-0' : 'opacity-80 translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full bg-slate-950/50 ${styles.textColor}`}>
            {styles.icon}
          </div>
          <div>
            <h3 className={`font-bold font-mono tracking-wider ${styles.textColor}`}>
              {styles.title}
            </h3>
            <p className="text-xs text-slate-500 font-mono">{round_status}</p>
          </div>
        </div>
        {active_agent === 'Skeptic' && payload.score !== null && (
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-mono uppercase">Viability Score</span>
            <span className={`text-xl font-bold font-mono ${payload.score && payload.score > 7 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {payload.score}/10
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Anthropologist Insights */}
        {active_agent === 'Anthropologist' && payload.insights && (
             <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Key Human Insights:</h4>
                <ul className="space-y-2">
                    {payload.insights.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-emerald-200/90 bg-emerald-950/30 p-2 rounded border border-emerald-900/30">
                            <Eye className="w-3 h-3 mt-1 text-emerald-500" />
                            {point}
                        </li>
                    ))}
                </ul>
             </div>
        )}

        {/* Skeptic Critiques */}
        {active_agent === 'Skeptic' && payload.critique_points && (
            <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">The Kill Floor Analysis:</h4>
                <ul className="space-y-2">
                    {payload.critique_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-rose-200/90 bg-rose-950/30 p-2 rounded border border-rose-900/30">
                            <span className="text-rose-500 mt-0.5">•</span>
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Alchemist Pivots */}
        {active_agent === 'Alchemist' && payload.changes_made && (
             <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Evolutionary Pivots:</h4>
                <div className="flex flex-col gap-2">
                    {payload.changes_made.map((change, idx) => (
                        <span key={idx} className="text-sm font-mono text-violet-200 bg-violet-950/50 px-3 py-2 rounded border border-violet-500/30 flex items-center gap-2">
                           <FlaskConical className="w-3 h-3 text-violet-400" />
                           {change}
                        </span>
                    ))}
                </div>
             </div>
        )}

        {/* Main Content */}
        <div className="prose prose-invert prose-sm max-w-none">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">
                {active_agent === 'Verdict' ? 'THE WINNING CONCEPT' : 'Analysis & Output'}
            </h4>
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed bg-slate-950/30 p-4 rounded-md border border-slate-800 shadow-inner">
                {payload.content}
            </div>
        </div>
      </div>
      
      {/* Decorative pulse for active item */}
      {isLatest && (
        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full animate-ping ${styles.textColor.replace('text-', 'bg-')}`} style={{marginTop: '1.5rem', marginRight: '1.5rem'}}></div>
      )}
    </div>
  );
};

export default AgentCard;