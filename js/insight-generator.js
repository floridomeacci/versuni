// Insight Generator - Generate creative ideas and expand through funnel
const OPENAI_API_KEY_STORAGE_KEY = 'philips_openai_api_key';
const OPENAI_API_KEY = (
  window?.philipsConfig?.openAiKey ||
  localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ||
  ''
).trim();

// API key check removed - proxy endpoint handles authentication

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
let insightData = {
  trend: '',
  audience: '',
  market: '',
  generatedIdea: '',
  awarenessResult: null,
  considerationResult: null,
  conversionResult: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  knowledgePromise = loadPhilipsKnowledge();
  
  const discoverBtn = document.getElementById('discoverBtn');
  if (discoverBtn) {
    discoverBtn.addEventListener('click', handleIdeaGeneration);
  }
  
  updateProgress(1); // Start at step 1
});

// Progress tracking
function updateProgress(step) {
  const steps = document.querySelectorAll('.progress-step');
  
  steps.forEach((stepEl) => {
    const stepNum = parseInt(stepEl.dataset.step);
    
    if (stepNum < step) {
      stepEl.classList.add('completed');
      stepEl.classList.remove('active');
    } else if (stepNum === step) {
      stepEl.classList.add('active');
      stepEl.classList.remove('completed');
    } else {
      stepEl.classList.remove('active', 'completed');
    }
  });
}

// Generate creative idea from trend input
async function handleIdeaGeneration() {
  const trendInput = document.querySelector('.trend-textarea');
  const trend = trendInput?.value.trim();
  
  if (!trend) {
    alert('Please enter a trend or topic');
    return;
  }
  
  insightData.trend = trend;
  
  const btn = document.getElementById('discoverBtn');
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span><span>Generating creative idea...</span>';
  
  updateProgress(2); // Move to idea generation
  
  try {
    const ideaResult = await generateCreativeIdea(trend);
    insightData.generatedIdea = ideaResult.idea;
    insightData.audience = ideaResult.targetAudience;
    insightData.market = ideaResult.targetMarket;
    
    displayGeneratedIdea(ideaResult);
    
    btn.innerHTML = '<span class="loading-spinner"></span><span>Expanding through funnel...</span>';
    updateProgress(3); // Move to awareness
    
    // Auto-expand through funnel
    await expandThroughFunnel(ideaResult);
    
    updateProgress(6); // Complete all steps
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating idea. Please try again.');
    updateProgress(1); // Reset to start
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }
}

async function generateCreativeIdea(trend) {
  const personaGuidance = philipsPersonaPromptBlock || DEFAULT_PERSONA_SUMMARIES;
  const platformReminder = philipsPlatformPromptBlock || DEFAULT_PLATFORM_SUMMARY;
  
  const prompt = `You are a senior creative strategist for Philips home appliances. Generate a compelling creative idea based on this emerging trend or topic.

Trend/Topic: "${trend}"

${personaGuidance}

${platformReminder}

Create a creative campaign idea that:
- Connects authentically to a specific homemaker persona
- Celebrates real homemaking moments (not just product features)
- Keeps Philips as the supportive helper
- Uses the platform tone (proudly humble, light-hearted, welcoming, genuine)

Return ONLY a JSON object:
{
  "idea": "The creative campaign idea (2-3 sentences)",
  "targetAudience": "Most relevant persona name",
  "targetMarket": "Market code (NL, USA, UK, DE, etc)",
  "rationale": "Why this idea fits this audience and market (1-2 sentences)"
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayGeneratedIdea(result) {
  // Hide the old trends section and show results
  const trendsSection = document.querySelector('.previous-trends-section');
  if (trendsSection) trendsSection.style.display = 'none';
  
  // Create or update results container
  let resultsContainer = document.getElementById('insightResults');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'insightResults';
    resultsContainer.style.cssText = 'max-width: 1000px; margin: 40px auto;';
    document.querySelector('.page-container').appendChild(resultsContainer);
  }
  
  resultsContainer.innerHTML = `
    <div class="white-card" style="margin-bottom: 32px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #004C97; margin-bottom: 16px;">Generated Creative Idea</h2>
      <div style="background: linear-gradient(135deg, #E8F4FD 0%, #F8FAFB 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #0B5ED7; margin-bottom: 16px;">
        <p style="font-size: 16px; color: #1A1A1A; line-height: 1.6; margin-bottom: 12px;">${result.idea}</p>
        <div style="display: flex; gap: 16px; font-size: 14px; color: #6B7280; margin-top: 16px;">
          <span><strong>Target Audience:</strong> ${result.targetAudience}</span>
          <span><strong>Market:</strong> ${result.targetMarket}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #6B7280; font-style: italic;">${result.rationale}</p>
    </div>
    <div id="funnelResults"></div>
  `;
  
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function expandThroughFunnel(ideaResult) {
  // Generate awareness
  const awareness = await generateAwarenessContent(ideaResult);
  insightData.awarenessResult = awareness;
  displayAwarenessResult(awareness);
  
  updateProgress(4); // Move to consideration
  
  // Generate consideration
  const consideration = await generateConsiderationContent(awareness);
  insightData.considerationResult = consideration;
  displayConsiderationResult(consideration);
  
  updateProgress(5); // Move to conversion
  
  // Generate conversion
  const conversion = await generateConversionContent(consideration);
  insightData.conversionResult = conversion;
  displayConversionResult(conversion);
}

async function generateAwarenessContent(ideaResult) {
  const personaDetail = getPersonaDetailForPrompt(ideaResult.targetAudience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Honor the Philips "Made for the Homemakers" platform: celebrate authentic homemaking moments, keep Philips as the supportive helper, and maintain the tone (proudly humble, light-hearted, welcoming, genuine).\n'
    : '';
    
  const prompt = `You are a creative strategist for Philips home appliances. Create awareness-stage content for this generated idea:

Generated Idea: "${ideaResult.idea}"
Audience: ${ideaResult.targetAudience}
Market: ${ideaResult.targetMarket}

${personaContext}${platformReminder}

SCORING GUIDELINES:
- 80-100: Deeply authentic to persona rituals, perfectly aligned with platform tone, celebrates real homemaking
- 65-79: Good fit but missing some emotional depth or platform alignment
- 50-64: Generic or partially misaligned with persona needs/platform principles
- Below 50: Off-brand, forced, or disconnected from actual homemaker reality

Return ONLY a JSON object:
{
  "humanInsight": "A real-life tension or desire this audience feels (1-2 sentences)",
  "reframedIdea": "The core idea emotionally translated for this audience (1 sentence)",
  "contentThought": "What kind of story or moment would work (1-2 sentences)",
  "brandRole": "How Philips supports in the background (1 sentence)",
  "awarenessScore": 75,
  "scoreExplanation": "Why this score",
  "redFlags": ["Concern 1", "Concern 2"],
  "optimizations": ["Improvement 1", "Improvement 2"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

async function generateConsiderationContent(awarenessResult) {
  const personaDetail = getPersonaDetailForPrompt(insightData.audience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Keep alignment with the Philips "Made for the Homemakers" platform (real-life authenticity, proudly humble tone, Philips as supportive helper).\n'
    : '';
    
  const prompt = `You are a creative strategist for Philips home appliances. Create consideration-stage content that builds trust.

Generated Idea: "${insightData.generatedIdea}"
Audience: ${insightData.audience}
Market: ${insightData.market}
Awareness Idea: "${awarenessResult.reframedIdea}"
Awareness Score: ${awarenessResult.awarenessScore}

${personaContext}${platformReminder}

Be critical: if awareness was weak, consideration should reflect difficulty building credibility.

Return ONLY a JSON object:
{
  "proofAngle": "What reassures this audience (1 sentence)",
  "socialProofType": "Best type of social proof and why (1 sentence)",
  "messageReframing": "Message reframed from emotional to credible (1 sentence)",
  "formatLogic": "Best content format and why (1 sentence)",
  "considerationScore": 78,
  "scoreExplanation": "Why this credibility score",
  "redFlags": ["Credibility gap 1", "Trust barrier 2"],
  "optimizations": ["How to strengthen believability", "How to add more proof"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

async function generateConversionContent(considerationResult) {
  const personaDetail = getPersonaDetailForPrompt(insightData.audience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Stay within the Philips "Made for the Homemakers" platform: keep Philips as the supportive helper who removes barriers.\n'
    : '';
    
  const prompt = `You are a creative strategist for Philips home appliances. Create conversion-stage content that removes barriers.

Generated Idea: "${insightData.generatedIdea}"
Audience: ${insightData.audience}
Market: ${insightData.market}
Consideration Message: "${considerationResult.messageReframing}"
Consideration Score: ${considerationResult.considerationScore}

${personaContext}${platformReminder}

Be realistic: weak ideas create more purchase barriers.

Return ONLY a JSON object:
{
  "barrier": "Main barrier to purchase (1 sentence)",
  "reassuranceMessage": "Why this is a safe choice (1 sentence)",
  "ctaLogic": "Best CTA approach and reasoning (1 sentence)",
  "offerFraming": "How to frame the value (1 sentence)",
  "conversionScore": 82,
  "scoreExplanation": "Why this conversion score",
  "redFlags": ["Purchase barrier 1", "Friction point 2"],
  "optimizations": ["How to reduce friction", "How to increase purchase confidence"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayAwarenessResult(result) {
  const funnelContainer = document.getElementById('funnelResults');
  if (!funnelContainer) return;
  
  const scoreClass = result.awarenessScore >= 80 ? 'score-excellent' : result.awarenessScore >= 65 ? 'score-good' : result.awarenessScore >= 50 ? 'score-fair' : 'score-poor';
  
  funnelContainer.innerHTML += `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #004C97; margin: 0;">Awareness Stage</h3>
          <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">How does this create emotional resonance?</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.awarenessScore}%"></div>
          </div>
          <span class="score-label ${scoreClass}">${result.awarenessScore}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Human Insight</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.humanInsight}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Reframed Idea</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.reframedIdea}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Content Approach</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.contentThought}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Philips Brand Role</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.brandRole}</p>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #92400E; margin-bottom: 8px;">Score Explanation</div>
        <p style="font-size: 14px; color: #78350F; margin: 0;">${result.scoreExplanation}</p>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #991B1B; margin-bottom: 8px;">Red Flags</div>
          <ul style="font-size: 14px; color: #991B1B; margin: 0; padding-left: 20px;">
            ${result.redFlags.map(flag => `<li style="margin-bottom: 4px;">${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #22C55E;">
          <div style="font-size: 13px; font-weight: 600; color: #166534; margin-bottom: 8px;">Optimizations</div>
          <ul style="font-size: 14px; color: #166534; margin: 0; padding-left: 20px;">
            ${result.optimizations.map(opt => `<li style="margin-bottom: 4px;">${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

function displayConsiderationResult(result) {
  const funnelContainer = document.getElementById('funnelResults');
  if (!funnelContainer) return;
  
  const scoreClass = result.considerationScore >= 80 ? 'score-excellent' : result.considerationScore >= 65 ? 'score-good' : result.considerationScore >= 50 ? 'score-fair' : 'score-poor';
  
  funnelContainer.innerHTML += `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #004C97; margin: 0;">Consideration Stage</h3>
          <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">Building credibility and trust</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.considerationScore}%"></div>
          </div>
          <span class="score-label ${scoreClass}">${result.considerationScore}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Proof Angle</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.proofAngle}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Social Proof Type</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.socialProofType}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Message Reframing</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.messageReframing}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Content Format</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.formatLogic}</p>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #92400E; margin-bottom: 8px;">Score Explanation</div>
        <p style="font-size: 14px; color: #78350F; margin: 0;">${result.scoreExplanation}</p>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #991B1B; margin-bottom: 8px;">Red Flags</div>
          <ul style="font-size: 14px; color: #991B1B; margin: 0; padding-left: 20px;">
            ${result.redFlags.map(flag => `<li style="margin-bottom: 4px;">${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #22C55E;">
          <div style="font-size: 13px; font-weight: 600; color: #166534; margin-bottom: 8px;">Optimizations</div>
          <ul style="font-size: 14px; color: #166534; margin: 0; padding-left: 20px;">
            ${result.optimizations.map(opt => `<li style="margin-bottom: 4px;">${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

function displayConversionResult(result) {
  const funnelContainer = document.getElementById('funnelResults');
  if (!funnelContainer) return;
  
  const scoreClass = result.conversionScore >= 80 ? 'score-excellent' : result.conversionScore >= 65 ? 'score-good' : result.conversionScore >= 50 ? 'score-fair' : 'score-poor';
  
  funnelContainer.innerHTML += `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #004C97; margin: 0;">Conversion Stage</h3>
          <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">Removing barriers to purchase</p>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.conversionScore}%"></div>
          </div>
          <span class="score-label ${scoreClass}">${result.conversionScore}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Main Barrier</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.barrier}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Reassurance Message</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.reassuranceMessage}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Call-to-Action Logic</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.ctaLogic}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 4px;">Value Framing</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.offerFraming}</p>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #92400E; margin-bottom: 8px;">Score Explanation</div>
        <p style="font-size: 14px; color: #78350F; margin: 0;">${result.scoreExplanation}</p>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: #991B1B; margin-bottom: 8px;">Red Flags</div>
          <ul style="font-size: 14px; color: #991B1B; margin: 0; padding-left: 20px;">
            ${result.redFlags.map(flag => `<li style="margin-bottom: 4px;">${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #22C55E;">
          <div style="font-size: 13px; font-weight: 600; color: #166534; margin-bottom: 8px;">Optimizations</div>
          <ul style="font-size: 14px; color: #166534; margin: 0; padding-left: 20px;">
            ${result.optimizations.map(opt => `<li style="margin-bottom: 4px;">${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

// Knowledge loading helpers (same as creative-reviewer)
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
      if (!line.trim()) {
        break;
      }
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
      culturalContext: personaMap['Cultural Context (Location)'] || '',
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
    'Top-of-Mind Awareness',
    'emotional connection',
    'Philips, Made for the homemakers',
    'everyday acts',
    'brand preference'
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
      console.warn('Proceeding without Philips knowledge context due to load error:', error);
    }
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a world-class marketing strategist specializing in consumer behavior, creative strategy, and funnel optimization for Philips home appliances. Always provide strategic, actionable insights that ladder up to the "Made for the Homemakers" platform.'
    }
  ];

  if (philipsPersonaPromptBlock) {
    messages.push({
      role: 'system',
      content: `Philips Homemaker Personas Reference:\n${philipsPersonaPromptBlock}`
    });
  }

  if (philipsPlatformPromptBlock) {
    messages.push({
      role: 'system',
      content: `Philips "Made for the Homemakers" Platform Highlights:\n${philipsPlatformPromptBlock}`
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
