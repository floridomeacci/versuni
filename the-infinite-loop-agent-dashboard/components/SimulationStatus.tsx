import React from 'react';
import { MAX_ROUNDS } from '../constants';
import { Activity } from 'lucide-react';

interface SimulationStatusProps {
  currentRound: number;
  isRunning: boolean;
  totalSteps: number;
}

const SimulationStatus: React.FC<SimulationStatusProps> = ({ currentRound, isRunning, totalSteps }) => {
  // Calculate progress percentage based on 4 phases
  const progress = Math.min(((currentRound) / MAX_ROUNDS) * 100, 100);

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 p-4 sticky top-0 z-30 backdrop-blur-md bg-opacity-90">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-100">
                <Activity className={`w-5 h-5 ${isRunning ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-mono font-bold text-lg tracking-widest">THE LOOP</span>
            </div>
            {isRunning && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-900 text-teal-300 border border-teal-700 animate-pulse">
                    PROCESSING
                </span>
            )}
        </div>

        <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Status</p>
                <p className="text-sm font-mono text-slate-300">
                    PHASE <span className="text-white">{Math.min(currentRound, MAX_ROUNDS)}</span> / {MAX_ROUNDS}
                </p>
            </div>
            
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationStatus;