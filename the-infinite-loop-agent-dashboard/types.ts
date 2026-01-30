
export interface Insight {
  statement: string;
  source_concept: string;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface SocialPost {
  platform: 'reddit' | 'tiktok' | 'twitter' | 'other';
  content: string; // The text content or video title
  url: string;
  author?: string;
  likes?: string; // e.g. "1.2k"
}

export interface Competitor {
  name: string;
  url: string;
  description?: string;
  pros: string[];
  cons: string[];
}

export interface TargetAudience {
  segment: string;
  description: string;
  pain_point: string;
}

export interface RiskFactor {
  risk: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface CopyStrategy {
  taglines: {
    literal: string;
    abstract: string;
    emotional: string;
  };
  hero_header: string;
  sub_header: string;
  cta_button: string;
  value_props: string[];
}

export interface StrategicDossier {
  id: string;
  timestamp: number;
  concept_input: string;
  web_sources?: WebSource[];
  social_proof?: SocialPost[]; 
  insights: Insight[];
  copy_strategy?: CopyStrategy;
  
  market_analysis: {
    industry: string;
    market_size: string; // e.g. "$50B TAM"
    key_trends: string[];
  };

  target_audiences: TargetAudience[];

  scores: {
    market_potential: number;
    competitive_edge: number;
    technical_feasibility: number;
    business_viability: number; // Revenue potential
    overall_score: number;
  };

  main_stage: {
    kill_floor: {
      critique: string;
      commodity_trap: string;
    };
    evolution: {
      pivot: string;
      value_shift: string;
    };
    verdict: {
      winning_concept: string;
      one_sentence_pitch: string;
      unique_value_proposition: string; // The "Awwwards" text
      killer_benefits: string[];
      competitors: Competitor[];
      risk_assessment: RiskFactor[]; // Detailed array
      open_hypotheses: string[];
      next_steps: string[];
      strategic_rationale?: string;
      visual_concept_description?: string; // Prompt for the sketch
      generated_image?: string; // Base64 data
    };
  };
}

export interface SimulationState {
  isAnalyzing: boolean;
  dossier: StrategicDossier | null;
  error: string | null;
}

export interface SimulationStep {
  active_agent: string;
  round_status: string;
  payload: {
    score?: number | null;
    insights?: string[];
    critique_points?: string[];
    changes_made?: string[];
    content?: string;
  };
}