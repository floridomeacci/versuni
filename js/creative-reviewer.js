// Creative Reviewer - Scrutiny + Audience Analysis Only
const OPENAI_API_KEY_STORAGE_KEY = 'philips_openai_api_key';
const OPENAI_API_KEY = (
  window?.philipsConfig?.openAiKey ||
  localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ||
  ''
).trim();

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Set window.philipsConfig.openAiKey or localStorage philips_openai_api_key.');
}

// Philips knowledge integration
let knowledgePromise = null;
let philipsKnowledgeRaw = '';
let philipsPersonas = [];
let philipsPersonaPromptBlock = '';
let philipsPlatformPromptBlock = '';

const DEFAULT_PERSONA_SUMMARIES = [
  'Young Families: Authentic progress over perfection; homes are lived-in and loved-in.',
  'Busy Professionals: Efficiency without sacrificing quality; seek calm, trusted helpers.',
  'Mature Homemakers: Reinventing cozy spaces with reliable, high-quality devices.',
  'Traditional Cooks: Express love through familiar, hearty meals rooted in ritual.',
  'Master Cooks: Experimental foodies chasing expert-level results to connect people.',
  'Tech-loving Cooks: Inspired by premium innovation that makes cooking feel futuristic.',
  'Novice Cooks: Adventurous learners wanting simple wins that boost confidence.',
  'Reluctant Cooks: Time-poor homemakers needing effortless, dependable solutions.'
].join('\n');

const DEFAULT_PLATFORM_SUMMARY = [
  '- Philips is pivoting from being an appliance maker to an emotional home enabler for homemakers.',
  '- Celebrate the everyday acts that turn a house into a home under the "Made for the Homemakers" platform.',
  '- Tone of voice stays proudly humble, light-hearted, welcoming, and genuine, with Philips as the helpful background ally.',
  '- Creative principle: Real Life Authenticity that shows un-curated homemaking moments.',
  '- Funnel focus: build emotional awareness, reinforce consideration with proof, and remove conversion barriers.'
].join('\n');

// Global state
let reviewData = {
  coreIdea: '',
  targetAudience: '',
  targetMarket: '',
  desireResult: null,
  engageResult: null,
  convertResult: null,
  audienceCombinations: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  knowledgePromise = loadPhilipsKnowledge();
  
  const reviewBtn = document.getElementById('reviewIdeaBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', handleReviewIdea);
  }
});

async function handleReviewIdea() {
  const coreIdea = document.getElementById('coreIdea').value.trim();
  
  if (!coreIdea) {
    alert('Please enter your creative idea');
    return;
  }
  
  const targetAudience = document.getElementById('targetAudience').value.trim();
  const targetMarket = document.getElementById('targetMarket').value.trim();
  
  reviewData.coreIdea = coreIdea;
  reviewData.targetAudience = targetAudience;
  reviewData.targetMarket = targetMarket;
  
  const btn = document.getElementById('reviewIdeaBtn');
  const originalBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing idea...';
  
  try {
    // Step 1: Evaluate DESIRE stage
    btn.innerHTML = '<span class="loading-spinner"></span> Evaluating Desire stage...';
    const desireResult = await evaluateDesireStage(coreIdea, targetAudience, targetMarket);
    reviewData.desireResult = desireResult;
    displayDesireResult(desireResult);
    
    // Step 2: Evaluate ENGAGE stage
    btn.innerHTML = '<span class="loading-spinner"></span> Evaluating Engage stage...';
    const engageResult = await evaluateEngageStage(coreIdea, targetAudience, targetMarket);
    reviewData.engageResult = engageResult;
    displayEngageResult(engageResult);
    
    // Step 3: Evaluate CONVERT stage
    btn.innerHTML = '<span class="loading-spinner"></span> Evaluating Convert stage...';
    const convertResult = await evaluateConvertStage(coreIdea, targetAudience, targetMarket);
    reviewData.convertResult = convertResult;
    displayConvertResult(convertResult);
    
    // Step 4: Generate audience/market combinations
    btn.innerHTML = '<span class="loading-spinner"></span> Generating audience combinations...';
    const combinations = await generateCombinations(coreIdea, targetAudience, targetMarket);
    reviewData.audienceCombinations = combinations;
    displayCombinations(combinations);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error reviewing idea. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

async function evaluateDesireStage(coreIdea, targetAudience, targetMarket) {
  const personaDetail = getPersonaDetailForPrompt(targetAudience);
  const personaContext = personaDetail ? `Relevant Philips persona detail:\n${personaDetail}\n\n` : '';
  const platformReminder = philipsPlatformPromptBlock ? 'Honor the Philips "Made for the Homemakers" platform.\n\n' : '';
  
  const prompt = `You are a senior creative strategist for Philips home appliances. Evaluate this creative idea for the DESIRE stage.

Core Idea: "${coreIdea}"
${targetAudience ? `Target Audience: "${targetAudience}"` : ''}
${targetMarket ? `Target Market: "${targetMarket}"` : ''}

${personaContext}${platformReminder}

DESIRE STAGE CRITERIA:
- Role: Declare Leadership - Get people to think of Philips as the preferred brand when they think of Airfryers
- Task: Build brand preference and superiority associations
- Media Approach: Place Philips in premium & emotive environments that drive superiority associations
- Channels: AV, YouTube, OLV, Social, Creators, Digital Outdoor
- KPIs: Brand searches, Brand tracking, Brand lift, Ad recall, Brand score, Preference

Evaluate:
1. Does this idea position Philips as category leader?
2. Does it create premium/aspirational brand associations?
3. Will it drive brand preference and consideration?
4. Does it work in premium media environments (AV, OLV)?

Return ONLY a JSON object:
{
  "score": 75,
  "leadership": "How well does this declare Philips leadership? (2 sentences)",
  "brandPreference": "Will this make people prefer Philips over competitors? (2 sentences)",
  "premiumPositioning": "Does this position Philips as premium/aspirational? (2 sentences)",
  "mediaFit": "How well will this work in premium AV and digital environments? (1-2 sentences)",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": "How to improve for DESIRE stage (2 sentences)"
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

async function evaluateEngageStage(coreIdea, targetAudience, targetMarket) {
  const personaDetail = getPersonaDetailForPrompt(targetAudience);
  const personaContext = personaDetail ? `Relevant Philips persona detail:\n${personaDetail}\n\n` : '';
  
  const prompt = `You are a senior creative strategist for Philips home appliances. Evaluate this creative idea for the ENGAGE stage.

Core Idea: "${coreIdea}"
${targetAudience ? `Target Audience: "${targetAudience}"` : ''}
${targetMarket ? `Target Market: "${targetMarket}"` : ''}

${personaContext}

ENGAGE STAGE CRITERIA:
- Role: Activate the Community - Constantly remind people of Philips Airfryer and key product benefits
- Task: Build ongoing engagement through participation and authentic content
- Media Approach: Authentic engagement that invites participation, breaking away from conventions to cut through
- Channels: AV, Partnerships, YouTube/OLV, Social, Creators, Contextual Display
- KPIs: Engagement, Brand lift (consideration), Product searches, Share of search

Evaluate:
1. Does this invite community participation and engagement?
2. Does it authentically showcase product benefits in real-life usage?
3. Will it break through the noise and feel fresh/different?
4. Does it work across social, creators, and partnership channels?

Return ONLY a JSON object:
{
  "score": 78,
  "communityActivation": "How well does this activate community participation? (2 sentences)",
  "benefitShowcase": "Does this authentically remind people of Philips benefits? (2 sentences)",
  "cutThrough": "Will this break conventions and cut through the noise? (2 sentences)",
  "channelFit": "How well will this work across social, creators, partnerships? (1-2 sentences)",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": "How to improve for ENGAGE stage (2 sentences)"
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

async function evaluateConvertStage(coreIdea, targetAudience, targetMarket) {
  const personaDetail = getPersonaDetailForPrompt(targetAudience);
  const personaContext = personaDetail ? `Relevant Philips persona detail:\n${personaDetail}\n\n` : '';
  
  const prompt = `You are a senior creative strategist for Philips home appliances. Evaluate this creative idea for the CONVERT stage.

Core Idea: "${coreIdea}"
${targetAudience ? `Target Audience: "${targetAudience}"` : ''}
${targetMarket ? `Target Market: "${targetMarket}"` : ''}

${personaContext}

CONVERT STAGE CRITERIA:
- Role: Enlist Buyers - Provide pathways for people to purchase Philips Airfryer
- Task: Capture in-market consumers and drive purchase intent
- Media Approach: Always-on digital availability to capture in-market consumers
- Channels: Meta, Online display (Google Discovery & Amazon DSP), paid search, Amazon Performance (Biddable)
- KPIs: Sales/1st party collection, Click share of category generics

Evaluate:
1. Does this create clear pathways to purchase?
2. Will it capture in-market consumers actively searching?
3. Does it work in performance/commerce environments?
4. Can it drive immediate action and conversion?

Return ONLY a JSON object:
{
  "score": 72,
  "purchasePathways": "How well does this create clear paths to purchase? (2 sentences)",
  "inMarketCapture": "Will this capture people actively ready to buy? (2 sentences)",
  "performanceFit": "Does this work in Google/Amazon/Meta performance channels? (2 sentences)",
  "conversionPotential": "Will this drive immediate purchase action? (1-2 sentences)",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": "How to improve for CONVERT stage (2 sentences)"
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayDesireResult(result) {
  const container = document.getElementById('scrutinyResults');
  const card = document.getElementById('scrutinyCard');
  
  container.innerHTML = `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 3px solid #0B5ED7; padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #0B5ED7; margin: 0;">DESIRE Stage</h3>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0 0 0;">Declare Leadership - Build brand preference</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.score)}">${result.score}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Leadership Declaration</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.leadership}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Brand Preference Impact</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.brandPreference}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Premium Positioning</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.premiumPositioning}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Media Fit (AV, YouTube, OLV, Social)</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.mediaFit}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
        <div style="background: #F0FDF4; padding: 14px; border-radius: 8px; border-left: 3px solid #22C55E;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Strengths</div>
          <ul style="font-size: 13px; color: #166534; margin: 0; padding-left: 18px;">
            ${result.strengths.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #FEF2F2; padding: 14px; border-radius: 8px; border-left: 3px solid #EF4444;">
          <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Weaknesses</div>
          <ul style="font-size: 13px; color: #991B1B; margin: 0; padding-left: 18px;">
            ${result.weaknesses.map(w => `<li style="margin-bottom: 4px;">${w}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 3px solid #F59E0B; margin-top: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #92400E; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Recommendations</div>
        <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${result.recommendations}</p>
      </div>
    </div>
  `;
  
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayEngageResult(result) {
  const container = document.getElementById('scrutinyResults');
  
  container.innerHTML += `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 3px solid #0891B2; padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #0891B2; margin: 0;">ENGAGE Stage</h3>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0 0 0;">Activate the Community - Build ongoing engagement</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.score)}">${result.score}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Community Activation</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.communityActivation}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Benefit Showcase</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.benefitShowcase}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Cut Through</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.cutThrough}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Channel Fit (Social, Creators, Partnerships)</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.channelFit}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
        <div style="background: #F0FDF4; padding: 14px; border-radius: 8px; border-left: 3px solid #22C55E;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Strengths</div>
          <ul style="font-size: 13px; color: #166534; margin: 0; padding-left: 18px;">
            ${result.strengths.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #FEF2F2; padding: 14px; border-radius: 8px; border-left: 3px solid #EF4444;">
          <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Weaknesses</div>
          <ul style="font-size: 13px; color: #991B1B; margin: 0; padding-left: 18px;">
            ${result.weaknesses.map(w => `<li style="margin-bottom: 4px;">${w}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 3px solid #F59E0B; margin-top: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #92400E; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Recommendations</div>
        <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${result.recommendations}</p>
      </div>
    </div>
  `;
}

function displayConvertResult(result) {
  const container = document.getElementById('scrutinyResults');
  
  container.innerHTML += `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 3px solid #22C55E; padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #22C55E; margin: 0;">CONVERT Stage</h3>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0 0 0;">Enlist Buyers - Provide clear pathways to purchase</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.score)}">${result.score}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Purchase Pathways</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.purchasePathways}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">In-Market Capture</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.inMarketCapture}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Performance Channel Fit</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.performanceFit}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Conversion Potential (Meta, Google, Amazon)</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.conversionPotential}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
        <div style="background: #F0FDF4; padding: 14px; border-radius: 8px; border-left: 3px solid #22C55E;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Strengths</div>
          <ul style="font-size: 13px; color: #166534; margin: 0; padding-left: 18px;">
            ${result.strengths.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #FEF2F2; padding: 14px; border-radius: 8px; border-left: 3px solid #EF4444;">
          <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Weaknesses</div>
          <ul style="font-size: 13px; color: #991B1B; margin: 0; padding-left: 18px;">
            ${result.weaknesses.map(w => `<li style="margin-bottom: 4px;">${w}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 3px solid #F59E0B; margin-top: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #92400E; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Recommendations</div>
        <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${result.recommendations}</p>
      </div>
    </div>
  `;
}

async function generateCombinations(coreIdea, targetAudience, targetMarket) {
  const personaDescriptions = philipsPersonas.length
    ? philipsPersonas.map(persona => `${persona.name}: Mindset ${persona.mindset}. Rituals ${persona.rituals}. Drivers ${persona.drivers}.`).join('\n')
    : DEFAULT_PERSONA_SUMMARIES;
  const personaGuidance = `Use these Philips homemaker personas:\n${personaDescriptions}\n\n`;
  const platformReminder = philipsPlatformPromptBlock
    ? 'Ensure combinations reinforce the "Made for the Homemakers" platform.\n\n'
    : '';
    
  const prompt = `You are a marketing strategist for Philips home appliances. Analyze which audiences and markets would best resonate with this creative idea.

Core Idea: "${coreIdea}"
${targetAudience ? `Suggested Audience: "${targetAudience}"` : ''}
${targetMarket ? `Suggested Market: "${targetMarket}"` : ''}

${personaGuidance}${platformReminder}

Generate 4-6 audience × market combinations ranked by relevance. Consider Philips products: kitchen appliances, garment care, air purifiers.

Return ONLY a JSON object:
{
  "combinations": [
    {
      "audience": "Audience name",
      "audienceDescription": "Brief description of their needs (1 sentence)",
      "market": "Market code (NL, USA, UK, DE, FR)",
      "marketName": "Full market name",
      "relevanceScore": 85,
      "scoreReasoning": "Why this fits (1 sentence)"
    }
  ]
}`;

  const response = await callOpenAI(prompt, 'gpt-4o', true);
  return response.combinations || [];
}

function displayCombinations(combinations) {
  const container = document.getElementById('audienceResults');
  const card = document.getElementById('audienceCard');
  
  container.innerHTML = `
    <p style="font-size: 14px; color: #6B7280; margin-bottom: 16px;">Here are the most relevant audience and market combinations for your idea:</p>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
      ${combinations.map(combo => `
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <h4 style="font-size: 15px; font-weight: 600; color: #004C97; margin: 0;">${combo.audience}</h4>
            <span style="font-size: 12px; font-weight: 600; color: #6B7280;">${combo.market}</span>
          </div>
          <p style="font-size: 13px; color: #6B7280; margin: 8px 0;">${combo.audienceDescription}</p>
          <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <div class="score-bar" style="width: 100%;">
              <div class="score-marker" style="left: ${combo.relevanceScore}%"></div>
            </div>
            <span style="font-size: 12px; font-weight: 600; color: #0B5ED7;">${combo.relevanceScore}%</span>
          </div>
          <p style="font-size: 12px; color: #6B7280; margin-top: 8px; font-style: italic;">${combo.scoreReasoning}</p>
        </div>
      `).join('')}
    </div>
  `;
  
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 65) return 'score-good';
  if (score >= 50) return 'score-fair';
  return 'score-poor';
}

// Knowledge loading helpers
async function loadPhilipsKnowledge() {
  try {
    const response = await fetch('context/knowledge.txt');
    if (!response.ok) {
      throw new Error(`Failed to load knowledge file: ${response.status}`);
    }
    philipsKnowledgeRaw = await response.text();
    philipsPersonas = parsePersonaTable(philipsKnowledgeRaw);
    philipsPersonaPromptBlock = formatPersonaPromptBlock(philipsPersonas);
    philipsPlatformPromptBlock = extractPlatformHighlights(philipsKnowledgeRaw);
  } catch (error) {
    console.warn('Unable to load Philips knowledge base:', error);
  } finally {
    if (!philipsPersonaPromptBlock) {
      philipsPersonaPromptBlock = philipsPersonas.length ? formatPersonaPromptBlock(philipsPersonas) : DEFAULT_PERSONA_SUMMARIES;
    }
    if (!philipsPlatformPromptBlock) {
      philipsPlatformPromptBlock = DEFAULT_PLATFORM_SUMMARY;
    }
  }
}

function parsePersonaTable(rawText) {
  if (!rawText) return [];
  const lines = rawText.replace(/\r/g, '').split('\n');
  const personaLines = [];
  let capturing = false;
  for (const line of lines) {
    if (!capturing && line.includes('Persona Name') && line.includes('\t')) {
      capturing = true;
    }
    if (capturing) {
      if (!line.trim()) break;
      personaLines.push(line.trim());
    }
  }

  if (personaLines.length <= 1) return [];

  const headers = personaLines[0].split('\t').map(header => header.trim());
  return personaLines.slice(1).map(line => {
    const values = line.split('\t');
    const personaMap = {};
    headers.forEach((header, index) => {
      personaMap[header] = values[index] ? values[index].trim() : '';
    });
    return {
      name: personaMap['Persona Name'] || '',
      mindset: personaMap['Mindset and Values'] || '',
      lifeStage: personaMap['Life Stage and Profile'] || '',
      rituals: personaMap['Home Rituals and Acts'] || '',
      drivers: personaMap['Emotional Drivers'] || '',
      productSynergy: personaMap['Philips Product Synergy (Inferred)'] || ''
    };
  }).filter(persona => persona.name);
}

function formatPersonaPromptBlock(personas) {
  if (!personas || !personas.length) return '';
  return personas.map(persona => {
    return `${persona.name}: Mindset - ${persona.mindset}. Life stage - ${persona.lifeStage}. Key rituals - ${persona.rituals}. Emotional drivers - ${persona.drivers}. Philips product focus - ${persona.productSynergy}.`;
  }).join('\n');
}

function extractPlatformHighlights(rawText, maxLength = 1400) {
  if (!rawText) return '';
  const sentences = rawText.replace(/\r/g, '').split(/(?<=[.!?])\s+/);
  const keywords = [
    'appliance maker',
    'home enabler',
    'homemakers',
    'tone of voice',
    'Real Life Authenticity',
    'everyday acts'
  ];
  const selectedSentences = [];

  keywords.forEach(keyword => {
    const match = sentences.find(sentence => sentence && sentence.toLowerCase().includes(keyword.toLowerCase()));
    if (match && !selectedSentences.includes(match.trim())) {
      selectedSentences.push(match.trim());
    }
  });

  if (!selectedSentences.length) {
    return safeTruncate(rawText.trim(), maxLength);
  }

  const bulletSummary = selectedSentences.map(sentence => `- ${sentence}`).join('\n');
  return safeTruncate(bulletSummary, maxLength);
}

function getPersonaDetailForPrompt(audienceName) {
  if (!audienceName || !philipsPersonas.length) return '';
  const normalized = audienceName.toLowerCase();
  let persona = philipsPersonas.find(item => item.name.toLowerCase() === normalized);
  if (!persona) {
    persona = philipsPersonas.find(item => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized));
  }
  if (!persona) return '';
  return `${persona.name}: Mindset - ${persona.mindset}. Life stage - ${persona.lifeStage}. Home rituals - ${persona.rituals}. Emotional drivers - ${persona.drivers}. Philips product synergy - ${persona.productSynergy}.`;
}

function safeTruncate(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}...`;
}

async function callOpenAI(prompt, model = 'gpt-4o', jsonMode = false) {
  if (knowledgePromise) {
    try {
      await knowledgePromise;
    } catch (error) {
      console.warn('Proceeding without Philips knowledge context:', error);
    }
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a world-class marketing strategist specializing in consumer behavior and creative strategy for Philips home appliances.'
    }
  ];

  if (philipsPersonaPromptBlock) {
    messages.push({
      role: 'system',
      content: `Philips Homemaker Personas:\n${philipsPersonaPromptBlock}`
    });
  }

  if (philipsPlatformPromptBlock) {
    messages.push({
      role: 'system',
      content: `Philips "Made for the Homemakers" Platform:\n${philipsPlatformPromptBlock}`
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  const requestPayload = {
    model,
    messages,
    temperature: 0.7
  };

  if (jsonMode) {
    requestPayload.response_format = { type: 'json_object' };
  }

  let data;

  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    data = await response.json();
  } else {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI proxy error (${response.status}): ${errorText}`);
    }

    data = await response.json();
  }

  const content = data.choices?.[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('OpenAI response missing content');
  }

  return jsonMode ? JSON.parse(content) : content;
}
