import React, { useState } from 'react';
import { StrategicDossier } from '../types';
import { Lightbulb, Skull, ArrowRight, CheckCircle2, AlertTriangle, Target, Zap, Globe, ExternalLink, TrendingUp, Users, MessageSquare, PenTool, Loader2, Video, BarChart2, Check, X, Search, Sword, Fingerprint, Layers, Rocket, Image as ImageIcon } from 'lucide-react';
import CopyResultCard from './CopyResultCard';
import { SUPPORTED_LANGUAGES } from '../constants';

interface DossierViewProps {
  dossier: StrategicDossier;
  onGenerateCopy: (dossier: StrategicDossier, language: string) => Promise<void>;
  onGenerateSketch?: (dossier: StrategicDossier) => Promise<void>;
}

const PhaseHeader: React.FC<{ number: string; title: string; subtitle: string; icon?: React.ReactNode }> = ({ number, title, subtitle, icon }) => (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="text-xl md:text-2xl font-black text-brand-light-gray font-mono tracking-tighter select-none opacity-50">{number}</div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-brand-dark opacity-80">{icon}</span>}
                <h2 className="text-xl md:text-2xl font-bold text-brand-dark tracking-tight">{title}</h2>
            </div>
            <p className="text-brand-gray text-xs md:text-sm font-medium tracking-wide uppercase opacity-70">{subtitle}</p>
        </div>
    </div>
);

const SectionCard: React.FC<{ title?: string; children: React.ReactNode; className?: string; icon?: React.ReactNode }> = ({ title, children, className, icon }) => (
  <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-card transition-shadow duration-300 ${className}`}>
    {title && (
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-6 flex items-center gap-2 border-b border-gray-50 pb-2">
            {icon ? icon : <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>}
            {title}
        </h3>
    )}
    {children}
  </div>
);

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    let color = 'bg-brand-dark';
    if (score >= 85) color = 'bg-emerald-500';
    else if (score >= 70) color = 'bg-blue-500';
    else if (score >= 50) color = 'bg-yellow-500';
    else color = 'bg-red-500';

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold uppercase text-brand-gray tracking-wide">{label}</span>
                <span className="text-sm font-mono font-bold text-brand-dark">{score}</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-1000 ease-out`} 
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    )
}

const DossierView: React.FC<DossierViewProps> = ({ dossier, onGenerateCopy, onGenerateSketch }) => {
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  
  const scores = dossier.scores || { market_potential: 0, competitive_edge: 0, technical_feasibility: 0, business_viability: 0, overall_score: 0 };

  const handleCopyClick = async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isGeneratingCopy) return;
      setIsGeneratingCopy(true);
      await onGenerateCopy(dossier, selectedLanguage);
      setIsGeneratingCopy(false);
  }

  const handleSketchClick = async () => {
    if (!onGenerateSketch || isGeneratingSketch) return;
    setIsGeneratingSketch(true);
    await onGenerateSketch(dossier);
    setIsGeneratingSketch(false);
  }

  // Standalone check (Copy Only Mode)
  if (dossier.insights.length === 0 && dossier.copy_strategy) {
      return (
          <div className="max-w-5xl mx-auto">
               <CopyResultCard 
                    dossier={dossier} 
                    onRegenerate={async (d, l) => {
                        setIsGeneratingCopy(true);
                        await onGenerateCopy(d, l);
                        setIsGeneratingCopy(false);
                    }}
                    isGenerating={isGeneratingCopy}
                    defaultLanguage={selectedLanguage}
               />
          </div>
      )
  }

  return (
    <div className="max-w-5xl mx-auto pb-32 space-y-20">
      
      {/* PHASE 0: CONTEXT HEADER */}
      <div className="text-left pt-6 pb-2 border-b border-brand-dark/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold uppercase tracking-widest text-brand-gray mb-4">
              <Layers className="w-3 h-3" />
              Strategic Dossier
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tighter leading-tight mb-4">
             {dossier.concept_input}
          </h1>
          <p className="text-brand-gray text-lg max-w-2xl font-light">
             Analysis generated on {new Date(dossier.timestamp).toLocaleDateString()} • {dossier.market_analysis?.industry || 'General Industry'}
          </p>
      </div>

      {/* PHASE 1: MARKET INTELLIGENCE */}
      <section className="animate-[fadeIn_0.5s_ease-out]">
          <PhaseHeader 
            number="01" 
            title="Intelligence" 
            subtitle="Market Reality & Human Insights" 
            icon={<Search className="w-4 h-4" />}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Market Data - Left Col */}
              <div className="md:col-span-8">
                  <SectionCard className="h-full" title="Market Landscape" icon={<Globe className="w-3 h-3 text-brand-dark" />}>
                     {dossier.market_analysis && (
                        <div>
                             <div className="flex items-baseline gap-4 mb-6">
                                <div className="text-3xl font-light text-brand-dark">{dossier.market_analysis.industry}</div>
                                <div className="text-brand-accent font-bold text-sm bg-brand-accent/5 px-2 py-1 rounded">{dossier.market_analysis.market_size}</div>
                             </div>
                             <div className="space-y-3">
                                <span className="text-xs font-bold uppercase text-gray-400 block">Key Trends</span>
                                <div className="flex flex-wrap gap-2">
                                    {dossier.market_analysis.key_trends?.map((trend, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm font-medium text-brand-dark bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                            <TrendingUp className="w-3 h-3 text-gray-400" /> {trend}
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                     )}
                  </SectionCard>
              </div>

              {/* Insights - Right Col */}
              <div className="md:col-span-4">
                  <SectionCard className="h-full" title="Core Insights" icon={<Lightbulb className="w-3 h-3 text-yellow-500" />}>
                      <div className="space-y-6">
                        {dossier.insights.map((insight, idx) => (
                            <div key={idx} className="group">
                                <p className="text-sm font-medium text-brand-dark leading-relaxed mb-2">"{insight.statement}"</p>
                                <span className="text-[10px] font-bold text-brand-gray border-l-2 border-brand-accent pl-2 block">
                                    {insight.source_concept}
                                </span>
                            </div>
                        ))}
                      </div>
                  </SectionCard>
              </div>

              {/* Target Audiences - Full Width */}
              <div className="md:col-span-12">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-4 pl-1">Audience Segments</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {dossier.target_audiences?.map((aud, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-brand-dark/20 transition-colors group">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                        <Users className="w-3 h-3" />
                                    </div>
                                    <h4 className="font-bold text-brand-dark text-sm">{aud.segment}</h4>
                                </div>
                                <p className="text-xs text-brand-gray mb-4 leading-relaxed line-clamp-2">{aud.description}</p>
                                <div className="text-[10px] font-bold text-brand-accent flex items-start gap-1.5 bg-brand-accent/5 p-2 rounded-lg">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span className="leading-tight">{aud.pain_point}</span>
                                </div>
                            </div>
                        ))}
                   </div>
              </div>

              {/* Social Proof - Full Width */}
              <div className="md:col-span-12 mt-4">
                  <SectionCard title="Voice of the Customer" icon={<MessageSquare className="w-3 h-3 text-brand-dark" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dossier.social_proof?.map((post, i) => (
                                <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="block group h-full">
                                    <div className={`p-5 rounded-xl h-full border transition-all duration-300 relative overflow-hidden flex flex-col justify-between
                                        ${post.platform === 'tiktok' 
                                            ? 'bg-black text-white border-gray-800 hover:shadow-lg' 
                                            : 'bg-gray-50 text-brand-dark border-gray-100 hover:border-brand-dark/20'
                                        }
                                    `}>
                                        <div>
                                            <div className="flex items-center justify-between mb-3 relative z-10">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1.5
                                                    ${post.platform === 'tiktok' ? 'bg-gray-800' : 'bg-white border border-gray-100'}
                                                `}>
                                                    {post.platform === 'tiktok' ? <Video className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                                    {post.platform}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium leading-relaxed mb-2 relative z-10 line-clamp-3 italic">
                                                "{post.content}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-50 group-hover:opacity-100 transition-opacity mt-2">
                                            View Source <ExternalLink className="w-2.5 h-2.5" />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                  </SectionCard>
              </div>
          </div>
      </section>

      {/* PHASE 2: THE KILL FLOOR */}
      <section className="animate-[fadeIn_0.5s_ease-out_0.2s_both]">
          <PhaseHeader 
            number="02" 
            title="The Kill Floor" 
            subtitle="Stress-Testing & Competitive Threats" 
            icon={<Sword className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Critique & Risks */}
              <div className="md:col-span-7 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border-l-4 border-l-brand-dark border-y border-r border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                           <Skull className="w-4 h-4 text-brand-dark" />
                           <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray">The Critique</h3>
                      </div>
                      <p className="text-brand-dark text-base font-medium leading-relaxed mb-6">
                          {dossier.main_stage.kill_floor.critique}
                      </p>
                      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-start gap-4">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                              <div className="text-[10px] font-bold text-red-600 uppercase mb-1 tracking-wider">The Commodity Trap</div>
                              <p className="text-sm text-red-900/80 font-medium leading-relaxed">
                                  {dossier.main_stage.kill_floor.commodity_trap}
                              </p>
                          </div>
                      </div>
                  </div>

                  <SectionCard title="Risk Factors" icon={<AlertTriangle className="w-3 h-3 text-orange-500" />}>
                        <div className="divide-y divide-gray-50">
                            {dossier.main_stage.verdict.risk_assessment?.map((risk, i) => (
                                <div key={i} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-brand-dark text-sm">{risk.risk}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                            ${risk.impact === 'High' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
                                        `}>{risk.impact}</span>
                                    </div>
                                    <p className="text-xs text-brand-gray mt-1">
                                        <span className="font-bold text-brand-dark">Mitigation:</span> {risk.mitigation}
                                    </p>
                                </div>
                            ))}
                        </div>
                  </SectionCard>
              </div>

              {/* Competitors */}
              <div className="md:col-span-5">
                   <SectionCard title="Competitive Threats" className="h-full bg-gray-50 border-gray-100" icon={<Target className="w-3 h-3 text-brand-dark" />}>
                        <div className="space-y-4">
                            {dossier.main_stage.verdict.competitors?.map((comp, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-brand-dark text-sm">{comp.name}</h4>
                                        <a href={comp.url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-brand-dark">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                                            <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                                            <span className="leading-tight">{comp.pros[0]}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-600 bg-red-50 p-2 rounded">
                                            <X className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                            <span className="leading-tight">{comp.cons[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </SectionCard>
              </div>
          </div>
      </section>

      {/* PHASE 3: THE EVOLUTION */}
      <section className="animate-[fadeIn_0.5s_ease-out_0.4s_both]">
         <div className="bg-brand-dark text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
             
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                 <div className="md:col-span-4">
                    <div className="inline-flex items-center gap-2 text-brand-accent mb-4">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">The Pivot</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                        {dossier.main_stage.evolution.pivot}
                    </h2>
                 </div>
                 
                 <div className="hidden md:block md:col-span-1 flex justify-center">
                     <div className="h-24 w-px bg-white/20"></div>
                 </div>

                 <div className="md:col-span-7">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <span className="text-xs font-bold uppercase text-white/50 block mb-2">Value Shift</span>
                        <div className="text-xl md:text-2xl font-light text-white leading-relaxed">
                            {dossier.main_stage.evolution.value_shift}
                        </div>
                    </div>
                 </div>
             </div>
         </div>
      </section>

      {/* PHASE 4: THE VERDICT */}
      <section className="animate-[fadeIn_0.5s_ease-out_0.6s_both]">
           <PhaseHeader 
            number="04" 
            title="The Verdict" 
            subtitle="Strategic Recommendation" 
            icon={<Fingerprint className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left: UVP & Rationale */}
              <div className="md:col-span-8 space-y-8">
                   <div className="space-y-4">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray pl-1">Winning Concept</h3>
                       <div className="p-8 border-l-4 border-brand-accent bg-gray-50 rounded-r-2xl">
                            <h1 className="text-3xl md:text-4xl font-bold text-brand-dark tracking-tight leading-tight mb-4">
                                {dossier.main_stage.verdict.unique_value_proposition || dossier.main_stage.verdict.one_sentence_pitch}
                            </h1>
                            <p className="text-lg text-brand-gray font-medium">{dossier.main_stage.verdict.winning_concept}</p>
                       </div>
                   </div>

                   {/* SKETCH IT OUT SECTION */}
                   {onGenerateSketch && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-brand-bg rounded-md">
                                    <ImageIcon className="w-4 h-4 text-brand-dark" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wide">Sketch It Out</h3>
                                    <p className="text-xs text-brand-gray">Visual Prototype</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {dossier.main_stage.verdict.generated_image ? (
                                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-lg relative group">
                                    <img 
                                        src={`data:image/png;base64,${dossier.main_stage.verdict.generated_image}`} 
                                        alt="AI Generated Sketch" 
                                        className="w-full h-auto object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                        <p className="text-white text-xs font-medium leading-snug shadow-sm">
                                            "{dossier.main_stage.verdict.visual_concept_description}"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                                    <p className="text-sm text-brand-dark font-medium italic mb-6 max-w-md mx-auto">
                                        "{dossier.main_stage.verdict.visual_concept_description || 'No visual description available.'}"
                                    </p>
                                    <button 
                                        onClick={handleSketchClick}
                                        disabled={isGeneratingSketch}
                                        className="bg-brand-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingSketch ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                                        Generate Visual Sketch
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                   )}

                   <div className="space-y-4">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray pl-1">Strategic Rationale</h3>
                       <p className="text-brand-dark text-base leading-relaxed">
                          {dossier.main_stage.verdict.strategic_rationale}
                       </p>
                   </div>

                   <div className="space-y-4">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gray pl-1">Killer Benefits</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {dossier.main_stage.verdict.killer_benefits.map((benefit, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-white border border-gray-100 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-brand-accent" />
                                    <span className="text-sm font-bold text-brand-dark leading-snug">{benefit}</span>
                                </div>
                            ))}
                       </div>
                   </div>
              </div>

              {/* Right: Scorecard */}
              <div className="md:col-span-4">
                  <SectionCard title="Performance" className="h-full bg-gray-50 border-gray-100" icon={<BarChart2 className="w-3 h-3 text-brand-dark" />}>
                      <div className="mb-8 flex flex-col items-center justify-center py-6 border-b border-gray-200">
                          <span className="text-6xl font-black text-brand-dark tracking-tighter">{scores.overall_score}</span>
                          <span className="text-xs font-bold uppercase text-brand-gray mt-2 tracking-widest">Overall Score</span>
                      </div>
                      <div className="space-y-2">
                        <ScoreBar label="Market Potential" score={scores.market_potential} />
                        <ScoreBar label="Competitive Edge" score={scores.competitive_edge} />
                        <ScoreBar label="Tech Feasibility" score={scores.technical_feasibility} />
                        <ScoreBar label="Revenue Model" score={scores.business_viability} />
                      </div>
                  </SectionCard>
              </div>
          </div>
      </section>

      {/* PHASE 5: EXECUTION */}
      <section className="animate-[fadeIn_0.5s_ease-out_0.8s_both]">
           <PhaseHeader 
            number="05" 
            title="Execution" 
            subtitle="Next Steps & Assets" 
            icon={<Rocket className="w-4 h-4" />}
          />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
               
               {/* Next Steps */}
               <SectionCard title="Action Plan" icon={<Rocket className="w-3 h-3 text-brand-dark" />} className="bg-white border-gray-200">
                    <div className="space-y-5">
                        {dossier.main_stage.verdict.next_steps.map((step, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-bg text-brand-dark border border-gray-200 text-xs font-bold shrink-0 group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                    {i+1}
                                </div>
                                <p className="text-sm font-medium text-brand-dark pt-0.5 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
               </SectionCard>

               {/* Copywriter CTA */}
               {!dossier.copy_strategy ? (
                <div 
                    className="group relative bg-brand-dark rounded-2xl p-8 flex flex-col justify-center items-start text-left cursor-pointer overflow-hidden shadow-xl transition-all hover:scale-[1.01]"
                    onClick={() => handleCopyClick()}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/10 rounded-xl text-white">
                                <PenTool className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Creative Director</h3>
                                <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Copywriting Agent</p>
                            </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-8 leading-relaxed max-w-sm">
                            Generate high-conversion landing page copy, headlines, and ads based on this strategic dossier.
                        </p>
                        
                        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                                <select 
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="bg-black/30 text-white text-sm border border-white/10 rounded-lg px-4 py-3 focus:outline-none hover:bg-white/5 transition-colors cursor-pointer"
                                    disabled={isGeneratingCopy}
                                >
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <option key={lang.value} value={lang.value} className="text-black">{lang.label}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={(e) => handleCopyClick(e)}
                                    disabled={isGeneratingCopy}
                                    className="flex-1 bg-white text-brand-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
                                >
                                    {isGeneratingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Copy'}
                                </button>
                        </div>
                    </div>
                </div>
               ) : (
                <div className="h-full">
                     <CopyResultCard 
                        dossier={dossier}
                        onRegenerate={async (d, l) => {
                             setIsGeneratingCopy(true);
                             await onGenerateCopy(d, l);
                             setIsGeneratingCopy(false);
                        }}
                        isGenerating={isGeneratingCopy}
                        defaultLanguage={selectedLanguage}
                     />
                </div>
               )}
           </div>
      </section>

    </div>
  );
};

export default DossierView;