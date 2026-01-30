// Creative Reviewer - Funnel System with OpenAI API
const OPENAI_API_KEY_STORAGE_KEY = 'philips_openai_api_key';
const OPENAI_API_KEY = (
  window?.philipsConfig?.openAiKey ||
  localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ||
  ''
).trim();

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Set window.philipsConfig.openAiKey or localStorage philips_openai_api_key before running funnel generations.');
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
let funnelData = {
  coreIdea: '',
  targetAudience: '',
  targetMarket: '',
  selectedCombinations: [],
  awarenessResults: [],
  considerationResults: [],
  conversionResults: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  knowledgePromise = loadPhilipsKnowledge();
  initializeEventListeners();
  updateProgressBar(1); // Start at step 1
});

function initializeEventListeners() {
  // Step 1: Generate combinations
  const generateCombosBtn = document.getElementById('generateCombosBtn');
  if (generateCombosBtn) {
    generateCombosBtn.addEventListener('click', handleStep1Submit);
  }

  // Step 2-4 proceed buttons
  const proceedToStep2Btn = document.getElementById('proceedToStep2Btn');
  if (proceedToStep2Btn) {
    proceedToStep2Btn.addEventListener('click', handleStep2Generate);
  }

  const proceedToStep3Btn = document.getElementById('proceedToStep3Btn');
  if (proceedToStep3Btn) {
    proceedToStep3Btn.addEventListener('click', handleStep3Generate);
  }

  const proceedToStep4Btn = document.getElementById('proceedToStep4Btn');
  if (proceedToStep4Btn) {
    proceedToStep4Btn.addEventListener('click', handleStep4Generate);
  }

  const downloadReportBtn = document.getElementById('downloadReportBtn');
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', downloadReport);
  }
  
  // Proceed to audiences button (after scrutiny)
  const proceedToAudiencesBtn = document.getElementById('proceedToAudiencesBtn');
  if (proceedToAudiencesBtn) {
    proceedToAudiencesBtn.addEventListener('click', handleProceedToAudiences);
  }
  
  // Progress step clicks for navigation
  document.querySelectorAll('.progress-step').forEach(step => {
    step.addEventListener('click', () => {
      const stepNumber = parseInt(step.dataset.step);
      scrollToStep(stepNumber);
    });
  });
}

// Progress Bar Management
function updateProgressBar(currentStep) {
  const steps = document.querySelectorAll('.progress-step');
  
  steps.forEach((step) => {
    const stepId = step.dataset.step;
    
    // Determine if completed, active, or pending
    if (shouldBeCompleted(stepId, currentStep)) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepId === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

function shouldBeCompleted(stepId, currentStep) {
  const order = ['1', '1b', '2', '3', '4'];
  const stepIndex = order.indexOf(stepId);
  const currentIndex = order.indexOf(String(currentStep));
  
  return stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex;
}

function scrollToStep(stepNumber) {
  let targetCard;
  
  switch(stepNumber) {
    case 1:
      targetCard = document.getElementById('step1Card');
      break;
    case 2:
      targetCard = document.getElementById('step2Card');
      break;
    case 3:
      targetCard = document.getElementById('step3Card');
      break;
    case 4:
      targetCard = document.getElementById('step4Card');
      break;
  }
  
  if (targetCard && targetCard.style.display !== 'none') {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Step 1: Generate Audience × Market Combinations
async function handleStep1Submit() {
  const coreIdea = document.getElementById('coreIdea').value.trim();
  
  if (!coreIdea) {
    alert('Please enter your core idea');
    return;
  }
  
  const targetAudience = document.getElementById('targetAudience').value.trim();
  const targetMarket = document.getElementById('targetMarket').value.trim();
  
  funnelData.coreIdea = coreIdea;
  funnelData.targetAudience = targetAudience;
  funnelData.targetMarket = targetMarket;
  
  const btn = document.getElementById('generateCombosBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';
  
  try {
    // First, scrutinize the idea
    const scrutinyResult = await scrutinizeIdea(coreIdea, targetAudience, targetMarket);
    displayIdeaScrutiny(scrutinyResult);
    
    // Update progress to scrutiny step
    updateProgressBar('1b');
    
    // Scroll to scrutiny
    const scrutinyCard = document.getElementById('ideaScrutinyCard');
    scrutinyCard.style.display = 'block';
    scrutinyCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('Error:', error);
    alert('Error analyzing idea. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Generate Audience × Market Combinations →';
  }
}

// Idea Scrutiny - Deep analysis of the core idea
async function scrutinizeIdea(coreIdea, targetAudience, targetMarket) {
  const personaDetail = getPersonaDetailForPrompt(targetAudience);
  const personaContext = personaDetail ? `Relevant Philips persona detail:\n${personaDetail}\n\n` : '';
  const platformReminder = philipsPlatformPromptBlock ? 'Honor the Philips "Made for the Homemakers" platform that celebrates real-life homemaking, emotional connection, and tone of voice that is proudly humble, light-hearted, welcoming, and genuine.\n\n' : '';
  const prompt = `You are a senior creative strategist for Philips home appliances. Deeply scrutinize this creative idea across the full marketing funnel.

Core Idea: "${coreIdea}"
${targetAudience ? `Suggested Audience: "${targetAudience}"` : ''}
${targetMarket ? `Suggested Market: "${targetMarket}"` : ''}

Analyze this idea CRITICALLY across all funnel stages. Be honest about weaknesses and provide specific, actionable improvements.

${personaContext}${platformReminder}

Return ONLY a JSON object with this exact structure:
{
  "overallScore": 72,
  "overallAssessment": "2-3 sentence summary of the idea's potential and main challenges",
  "coreStrengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "coreWeaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "awarenessAnalysis": {
    "score": 75,
    "strengths": "What works for emotional resonance (1-2 sentences)",
    "gaps": "What's missing emotionally (1-2 sentences)",
    "improvement": "Specific way to strengthen awareness appeal"
  },
  "considerationAnalysis": {
    "score": 68,
    "strengths": "What builds credibility (1-2 sentences)",
    "gaps": "What lacks proof or trust (1-2 sentences)",
    "improvement": "Specific way to add credibility"
  },
  "conversionAnalysis": {
    "score": 70,
    "strengths": "What drives purchase intent (1-2 sentences)",
    "gaps": "What creates purchase hesitation (1-2 sentences)",
    "improvement": "Specific way to remove barriers"
  },
  "recommendedRefinement": "How to improve the core idea itself (2-3 sentences)",
  "shouldProceed": true
}`

;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayIdeaScrutiny(result) {
  const container = document.getElementById('ideaScrutinyResults');
  
  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #E8F4FD 0%, #F8FAFB 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #0B5ED7; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 600; color: #004C97; margin: 0;">Overall Assessment</h3>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.overallScore}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.overallScore)}">${result.overallScore}</span>
        </div>
      </div>
      <p style="font-size: 15px; color: #1A1A1A; line-height: 1.6;">${result.overallAssessment}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div class="optimization-section" style="margin-top: 0;">
        <div class="optimization-header">
          <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h4 class="optimization-title">Core Strengths</h4>
        </div>
        <ul class="optimization-list">
          ${result.coreStrengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      
      <div class="red-flag-section" style="margin-top: 0;">
        <div class="red-flag-header">
          <svg class="red-flag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h4 class="red-flag-title">Core Weaknesses</h4>
        </div>
        <ul class="red-flag-list">
          ${result.coreWeaknesses.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <h3 style="font-size: 18px; font-weight: 600; color: #004C97; margin-bottom: 16px;">Funnel Stage Analysis</h3>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Awareness Stage</div>
          <div class="funnel-output-subtitle">How does this idea create emotional resonance?</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.awarenessAnalysis.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.awarenessAnalysis.score)}">${result.awarenessAnalysis.score}</span>
        </div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Strengths</span>
        <div class="output-field-value">${result.awarenessAnalysis.strengths}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Gaps</span>
        <div class="output-field-value">${result.awarenessAnalysis.gaps}</div>
      </div>
      
      <div class="optimization-section" style="margin-top: 16px; margin-bottom: 0;">
        <div class="optimization-header">
          <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <h4 class="optimization-title">Improvement</h4>
        </div>
        <p style="font-size: 14px; color: #166534; padding: 0 0 0 24px; margin: 0;">${result.awarenessAnalysis.improvement}</p>
      </div>
    </div>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Consideration Stage</div>
          <div class="funnel-output-subtitle">Why should people believe this works?</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.considerationAnalysis.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.considerationAnalysis.score)}">${result.considerationAnalysis.score}</span>
        </div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Strengths</span>
        <div class="output-field-value">${result.considerationAnalysis.strengths}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Gaps</span>
        <div class="output-field-value">${result.considerationAnalysis.gaps}</div>
      </div>
      
      <div class="optimization-section" style="margin-top: 16px; margin-bottom: 0;">
        <div class="optimization-header">
          <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <h4 class="optimization-title">Improvement</h4>
        </div>
        <p style="font-size: 14px; color: #166534; padding: 0 0 0 24px; margin: 0;">${result.considerationAnalysis.improvement}</p>
      </div>
    </div>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Conversion Stage</div>
          <div class="funnel-output-subtitle">What drives purchase action?</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.conversionAnalysis.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.conversionAnalysis.score)}">${result.conversionAnalysis.score}</span>
        </div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Strengths</span>
        <div class="output-field-value">${result.conversionAnalysis.strengths}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Gaps</span>
        <div class="output-field-value">${result.conversionAnalysis.gaps}</div>
      </div>
      
      <div class="optimization-section" style="margin-top: 16px; margin-bottom: 0;">
        <div class="optimization-header">
          <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <h4 class="optimization-title">Improvement</h4>
        </div>
        <p style="font-size: 14px; color: #166534; padding: 0 0 0 24px; margin: 0;">${result.conversionAnalysis.improvement}</p>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FEF9E7 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-top: 24px;">
      <h4 style="font-size: 16px; font-weight: 600; color: #92400E; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Recommended Refinement
      </h4>
      <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${result.recommendedRefinement}</p>
    </div>
  `;
  
  // Store scrutiny result
  funnelData.scrutinyResult = result;
  
  // Show proceed button
  document.getElementById('proceedToAudiencesBtn').style.display = 'block';
}

// Proceed to audience selection after scrutiny
async function handleProceedToAudiences() {
  const btn = document.getElementById('proceedToAudiencesBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating combinations...';
  
  try {
    const combinations = await generateCombinations(funnelData.coreIdea, funnelData.targetAudience, funnelData.targetMarket);
    displayCombinations(combinations);
    
    // Update progress
    updateProgressBar(1);
    
    // Scroll to results
    document.getElementById('step1Results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating combinations. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Generate Audience × Market Combinations →';
  }
}

async function generateCombinations(coreIdea, targetAudience, targetMarket) {
  const personaDescriptions = philipsPersonas.length
    ? philipsPersonas.map(persona => `${persona.name}: Mindset ${persona.mindset}. Rituals ${persona.rituals}. Drivers ${persona.drivers}. Philips focus ${persona.productSynergy}.`).join('\n')
    : DEFAULT_PERSONA_SUMMARIES;
  const personaGuidance = `Use these Philips homemaker personas as audience anchors:\n${personaDescriptions}\n\n`;
  const platformReminder = philipsPlatformPromptBlock
    ? 'Ensure combinations reinforce the "Made for the Homemakers" platform that shifts Philips from appliance maker to home enabler, celebrates everyday homemaking acts, and keeps the tone proudly humble, light-hearted, welcoming, and genuine.\n\n'
    : '';
  const prompt = `You are a marketing strategist for Philips home appliances. Analyze this creative idea and generate relevant audience and market combinations.

Core Idea: "${coreIdea}"
${targetAudience ? `Suggested Audience: "${targetAudience}"` : ''}
${targetMarket ? `Suggested Market: "${targetMarket}"` : ''}

${personaGuidance}${platformReminder}
Generate 4-6 audience × market combinations that would be most relevant for this idea. Consider:
- Philips product categories: Kitchen appliances (airfryers, coffee machines), garment care, air purifiers
- Different audience segments with distinct needs
- Geographic markets with cultural nuances

For each combination, provide:
- Relevance score (0-100): How well this audience × market fits the core idea
- Score reasoning: Why this score (1 sentence)

Return ONLY a JSON object with this exact structure:
{
  "combinations": [
    {
      "audience": "Audience name",
      "audienceDescription": "Brief 1-sentence description of their needs/behaviors",
      "market": "Market code (e.g., NL, USA, UK, DE, FR)",
      "marketName": "Full market name",
      "relevanceScore": 85,
      "scoreReasoning": "Why this audience-market combination fits the idea"
    }
  ]
}`;

  const response = await callOpenAI(prompt, 'gpt-4o', true);
  return response.combinations || [];
}

function displayCombinations(combinations) {
  const grid = document.getElementById('audienceMarketGrid');
  const resultsSection = document.getElementById('step1Results');
  
  grid.innerHTML = '';
  
  combinations.forEach((combo, index) => {
    const card = document.createElement('div');
    card.className = 'audience-market-card';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="audience-market-card-header">
        <div class="audience-market-checkbox">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="2,6 5,9 10,3"></polyline>
          </svg>
        </div>
        <div>
          <div class="audience-market-label">${combo.audience} × ${combo.market}</div>
          <div class="audience-market-meta">${combo.marketName}</div>
        </div>
      </div>
      <p style="font-size: 13px; color: #6B7280; margin-top: 8px; line-height: 1.5;">${combo.audienceDescription}</p>
      <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
        <div class="score-bar" style="width: 100%;">
          <div class="score-marker" style="left: ${combo.relevanceScore}%"></div>
        </div>
        <span style="font-size: 12px; font-weight: 600; color: #0B5ED7;">${combo.relevanceScore}%</span>
      </div>
      ${combo.scoreReasoning ? `<p style="font-size: 12px; color: #6B7280; margin-top: 8px; font-style: italic;">${combo.scoreReasoning}</p>` : ''}
    `;
    
    card.addEventListener('click', () => toggleCombination(card, combo));
    grid.appendChild(card);
  });
  
  resultsSection.style.display = 'block';
}

function toggleCombination(card, combo) {
  card.classList.toggle('selected');
  
  const index = parseInt(card.dataset.index);
  const existingIndex = funnelData.selectedCombinations.findIndex(c => 
    c.audience === combo.audience && c.market === combo.market
  );
  
  if (existingIndex >= 0) {
    funnelData.selectedCombinations.splice(existingIndex, 1);
  } else {
    funnelData.selectedCombinations.push(combo);
  }
  
  // Show/hide proceed button
  const proceedBtn = document.getElementById('proceedToStep2Btn');
  if (funnelData.selectedCombinations.length > 0) {
    proceedBtn.style.display = 'block';
    proceedBtn.textContent = `Proceed to Awareness Stage (${funnelData.selectedCombinations.length} selected) →`;
  } else {
    proceedBtn.style.display = 'none';
  }
}

// Step 2: Awareness (Expand Idea)
async function handleStep2Generate() {
  const resultsContainer = document.getElementById('awarenessResults');
  const step2Card = document.getElementById('step2Card');
  
  resultsContainer.innerHTML = '<div class="loading-text"><span class="loading-spinner"></span> Expanding ideas for each audience × market...</div>';
  // Update progress
  updateProgressBar(2);
  
  step2Card.style.display = 'block';
  step2Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    const results = [];
    
    for (const combo of funnelData.selectedCombinations) {
      const result = await generateAwarenessContent(combo);
      results.push({ ...combo, ...result });
    }
    
    funnelData.awarenessResults = results;
    displayAwarenessResults(results);
    
    document.getElementById('proceedToStep3Btn').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    resultsContainer.innerHTML = '<p style="color: #EF4444;">Error generating awareness content. Please try again.</p>';
  }
}

async function generateAwarenessContent(combo) {
  const personaDetail = getPersonaDetailForPrompt(combo.audience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Honor the Philips "Made for the Homemakers" platform: celebrate authentic homemaking moments, keep Philips as the supportive helper, and maintain the tone (proudly humble, light-hearted, welcoming, genuine).\n'
    : '';
  const prompt = `You are a creative strategist for Philips home appliances. Create awareness-stage content for this combination:

Core Idea: "${funnelData.coreIdea}"
Audience: ${combo.audience} (${combo.audienceDescription})
Market: ${combo.marketName}

${personaContext}${platformReminder}

Create awareness content that emotionally resonates with this audience in this market. Follow Philips's "sense and simplicity" philosophy - the brand is a background helper, not a hero.

Provide:
- Awareness score (0-100): How effectively this idea creates emotional resonance
- Score explanation: What drives this score (1 sentence)
- 2-3 specific red flags if score is below 70
- 2-3 specific optimizations to improve

Return ONLY a JSON object with this exact structure:
{
  "humanInsight": "A real-life tension or desire this audience feels (1-2 sentences)",
  "reframedIdea": "The core idea emotionally translated for this audience (1 sentence)",
  "contentThought": "What kind of story or moment would work (1-2 sentences)",
  "brandRole": "How Philips supports in the background (1 sentence)",
  "awarenessScore": 75,
  "scoreExplanation": "Why this score - what makes it strong or weak",
  "redFlags": ["Specific concerns about emotional connection", "Cultural misalignment risks"],
  "optimizations": ["Concrete way to strengthen emotional resonance", "How to improve cultural fit"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayAwarenessResults(results) {
  const container = document.getElementById('awarenessResults');
  
  container.innerHTML = results.map(result => `
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">${result.audience} × ${result.market}</div>
          <div class="funnel-output-subtitle">${result.marketName}</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.awarenessScore}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.awarenessScore)}">${result.awarenessScore}</span>
        </div>
      </div>
      
      ${result.scoreExplanation ? `
        <div style="background: #F8FAFB; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #0B5ED7;">
          <span style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Score Reasoning</span>
          <p style="font-size: 14px; color: #1A1A1A; margin-top: 4px; line-height: 1.5;">${result.scoreExplanation}</p>
        </div>
      ` : ''}
      
      <div class="output-field">
        <span class="output-field-label">Human Insight</span>
        <div class="output-field-value highlight">"${result.humanInsight}"</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Reframed Idea</span>
        <div class="output-field-value">${result.reframedIdea}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Content Thought</span>
        <div class="output-field-value">${result.contentThought}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Role of the Brand</span>
        <div class="output-field-value">${result.brandRole}</div>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div class="red-flag-section">
          <div class="red-flag-header">
            <svg class="red-flag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h4 class="red-flag-title">Red Flags</h4>
          </div>
          <ul class="red-flag-list">
            ${result.redFlags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div class="optimization-section">
          <div class="optimization-header">
            <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h4 class="optimization-title">Optimizations</h4>
          </div>
          <ul class="optimization-list">
            ${result.optimizations.map(opt => `<li>${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Step 3: Consideration (Build Trust)
async function handleStep3Generate() {
  const resultsContainer = document.getElementById('considerationResults');
  // Update progress
  updateProgressBar(3);
  
  const step3Card = document.getElementById('step3Card');
  
  resultsContainer.innerHTML = '<div class="loading-text"><span class="loading-spinner"></span> Building credibility and social proof...</div>';
  step3Card.style.display = 'block';
  step3Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    const results = [];
    
    for (let i = 0; i < funnelData.awarenessResults.length; i++) {
      const awarenessResult = funnelData.awarenessResults[i];
      const result = await generateConsiderationContent(awarenessResult);
      results.push({ ...awarenessResult, ...result });
    }
    
    funnelData.considerationResults = results;
    displayConsiderationResults(results);
    
    document.getElementById('proceedToStep4Btn').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    resultsContainer.innerHTML = '<p style="color: #EF4444;">Error generating consideration content. Please try again.</p>';
  }
}

async function generateConsiderationContent(awarenessResult) {
  const personaDetail = getPersonaDetailForPrompt(awarenessResult.audience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Keep alignment with the Philips "Made for the Homemakers" platform (real-life authenticity, proudly humble tone, Philips as supportive helper).\n'
    : '';
  const prompt = `You are a creative strategist for Philips home appliances. Now create consideration-stage content that builds trust and credibility.

Core Idea: "${funnelData.coreIdea}"
Audience: ${awarenessResult.audience}
Market: ${awarenessResult.marketName}
Awareness Idea: "${awarenessResult.reframedIdea}"
Awareness Score: ${awarenessResult.awarenessScore}

${personaContext}${platformReminder}

Create consideration content that answers "Why should I believe this actually works?" Focus on proof, social credibility, and moving from emotional to credible.

Provide:
- Consideration score (0-100): How credible and trustworthy this feels
- Score explanation: What drives trust or skepticism (1 sentence)
- 2-3 specific red flags for credibility gaps
- 2-3 specific ways to build more trust

Return ONLY a JSON object with this exact structure:
{
  "proofAngle": "What reassures this audience (1 sentence)",
  "socialProofType": "Best type of social proof (reviews/creators/demos/comparisons) and why (1 sentence)",
  "messageReframing": "The message reframed from emotional to credible (1 sentence)",
  "formatLogic": "Best content format and why (demo/explainer/UGC/creator POV) (1 sentence)",
  "considerationScore": 78,
  "scoreExplanation": "Why this credibility score - trust factors present or missing",
  "redFlags": ["Specific credibility gap", "Trust barrier to address"],
  "optimizations": ["Concrete way to strengthen believability", "How to add more social proof"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayConsiderationResults(results) {
  const container = document.getElementById('considerationResults');
  
  container.innerHTML = results.map(result => `
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">${result.audience} × ${result.market}</div>
          <div class="funnel-output-subtitle">${result.marketName}</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.considerationScore}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.considerationScore)}">${result.considerationScore}</span>
        </div>
      </div>
      
      ${result.scoreExplanation ? `
        <div style="background: #F8FAFB; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #0B5ED7;">
          <span style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Score Reasoning</span>
          <p style="font-size: 14px; color: #1A1A1A; margin-top: 4px; line-height: 1.5;">${result.scoreExplanation}</p>
        </div>
      ` : ''}
      
      <div class="output-field">
        <span class="output-field-label">Proof Angle</span>
        <div class="output-field-value highlight">${result.proofAngle}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Social Proof Type</span>
        <div class="output-field-value">${result.socialProofType}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Message Reframing</span>
        <div class="output-field-value">${result.messageReframing}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Format Logic</span>
        <div class="output-field-value">${result.formatLogic}</div>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div class="red-flag-section">
          <div class="red-flag-header">
            <svg class="red-flag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h4 class="red-flag-title">Red Flags</h4>
          </div>
          <ul class="red-flag-list">
            ${result.redFlags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div class="optimization-section">
          <div class="optimization-header">
            <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h4 class="optimization-title">Optimizations</h4>
          </div>
          <ul class="optimization-list">
            ${result.optimizations.map(opt => `<li>${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Step 4: Conversion (Remove Barriers)
async function handleStep4Generate() {
  const resultsContainer = document.getElementById('conversionResults');
  const step4Card = document.getElementById('step4Card');
  // Update progress
  updateProgressBar(4);
  
  const summaryCard = document.getElementById('summaryCard');
  
  resultsContainer.innerHTML = '<div class="loading-text"><span class="loading-spinner"></span> Identifying barriers and conversion tactics...</div>';
  step4Card.style.display = 'block';
  step4Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    const results = [];
    
    for (let i = 0; i < funnelData.considerationResults.length; i++) {
      const considerationResult = funnelData.considerationResults[i];
      const result = await generateConversionContent(considerationResult);
      results.push({ ...considerationResult, ...result });
    }
    
    funnelData.conversionResults = results;
    displayConversionResults(results);
    
    document.getElementById('downloadReportBtn').style.display = 'block';
    
    // Show summary
    summaryCard.style.display = 'block';
    displayFunnelSummary();
    
    setTimeout(() => {
      summaryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  } catch (error) {
    console.error('Error:', error);
    resultsContainer.innerHTML = '<p style="color: #EF4444;">Error generating conversion content. Please try again.</p>';
  }
}

async function generateConversionContent(considerationResult) {
  const personaDetail = getPersonaDetailForPrompt(considerationResult.audience);
  const personaContext = personaDetail ? `Persona Insight: ${personaDetail}\n` : '';
  const platformReminder = philipsPlatformPromptBlock
    ? 'Stay within the Philips "Made for the Homemakers" platform: keep Philips as the supportive helper who removes barriers for real homemaking routines.\n'
    : '';
  const prompt = `You are a creative strategist for Philips home appliances. Now create conversion-stage content that removes final barriers.

Core Idea: "${funnelData.coreIdea}"
Audience: ${considerationResult.audience}
Market: ${considerationResult.marketName}
Consideration Message: "${considerationResult.messageReframing}"
Consideration Score: ${considerationResult.considerationScore}

${personaContext}${platformReminder}

Create conversion content that answers "What removes the last hesitation to buy?" Focus on barriers, reassurance, and clear CTAs.

Provide:
- Conversion score (0-100): How likely this drives purchase action
- Score explanation: What helps or hinders conversion (1 sentence)
- 2-3 specific purchase barriers still present
- 2-3 specific tactics to overcome hesitation

Return ONLY a JSON object with this exact structure:
{
  "barrier": "Main barrier to purchase (price/doubt/complexity/space) (1 sentence)",
  "reassuranceMessage": "Why this is a safe choice (1 sentence)",
  "ctaLogic": "Best CTA approach (Buy now/Find out more/Try it/etc) and reasoning (1 sentence)",
  "offerFraming": "How to frame the value (convenience/value/versatility/etc) (1 sentence)",
  "conversionScore": 82,
  "scoreExplanation": "Why this conversion score - what drives or blocks purchase intent",
  "redFlags": ["Specific purchase barrier", "Conversion friction point"],
  "optimizations": ["Concrete way to reduce friction", "How to increase purchase confidence"]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayConversionResults(results) {
  const container = document.getElementById('conversionResults');
  
  container.innerHTML = results.map(result => `
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">${result.audience} × ${result.market}</div>
          <div class="funnel-output-subtitle">${result.marketName}</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.conversionScore}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.conversionScore)}">${result.conversionScore}</span>
        </div>
      </div>
      
      ${result.scoreExplanation ? `
        <div style="background: #F8FAFB; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #0B5ED7;">
          <span style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Score Reasoning</span>
          <p style="font-size: 14px; color: #1A1A1A; margin-top: 4px; line-height: 1.5;">${result.scoreExplanation}</p>
        </div>
      ` : ''}
      
      <div class="output-field">
        <span class="output-field-label">Barrier</span>
        <div class="output-field-value highlight">${result.barrier}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Reassurance Message</span>
        <div class="output-field-value">${result.reassuranceMessage}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">CTA Logic</span>
        <div class="output-field-value">${result.ctaLogic}</div>
      </div>
      
      <div class="output-field">
        <span class="output-field-label">Offer Framing</span>
        <div class="output-field-value">${result.offerFraming}</div>
      </div>
      
      ${result.redFlags && result.redFlags.length > 0 ? `
        <div class="red-flag-section">
          <div class="red-flag-header">
            <svg class="red-flag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h4 class="red-flag-title">Red Flags</h4>
          </div>
          <ul class="red-flag-list">
            ${result.redFlags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${result.optimizations && result.optimizations.length > 0 ? `
        <div class="optimization-section">
          <div class="optimization-header">
            <svg class="optimization-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h4 class="optimization-title">Optimizations</h4>
          </div>
          <ul class="optimization-list">
            ${result.optimizations.map(opt => `<li>${opt}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function displayFunnelSummary() {
  const container = document.getElementById('funnelSummary');
  
  const avgAwareness = Math.round(
    funnelData.awarenessResults.reduce((sum, r) => sum + r.awarenessScore, 0) / funnelData.awarenessResults.length
  );
  
  const avgConsideration = Math.round(
    funnelData.considerationResults.reduce((sum, r) => sum + r.considerationScore, 0) / funnelData.considerationResults.length
  );
  
  const avgConversion = Math.round(
    funnelData.conversionResults.reduce((sum, r) => sum + r.conversionScore, 0) / funnelData.conversionResults.length
  );
  
  container.innerHTML = `
    <div style="background: #F8FAFB; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="font-size: 18px; font-weight: 600; color: #004C97; margin-bottom: 12px;">Original Idea</h3>
      <p style="font-size: 15px; color: #1A1A1A; line-height: 1.6;">"${funnelData.coreIdea}"</p>
    </div>
    
    <div class="summary-grid">
      <div class="summary-stage">
        <div class="summary-stage-title">Awareness</div>
        <div class="summary-stage-score">
          <div class="score-bar">
            <div class="score-marker" style="left: ${avgAwareness}%"></div>
          </div>
          <span class="score-label ${getScoreClass(avgAwareness)}">${avgAwareness}</span>
        </div>
        <div class="summary-stage-items">
          ${funnelData.selectedCombinations.length} audience × market combinations analyzed
        </div>
      </div>
      
      <div class="summary-stage">
        <div class="summary-stage-title">Consideration</div>
        <div class="summary-stage-score">
          <div class="score-bar">
            <div class="score-marker" style="left: ${avgConsideration}%"></div>
          </div>
          <span class="score-label ${getScoreClass(avgConsideration)}">${avgConsideration}</span>
        </div>
        <div class="summary-stage-items">
          Social proof strategies and format recommendations provided
        </div>
      </div>
      
      <div class="summary-stage">
        <div class="summary-stage-title">Conversion</div>
        <div class="summary-stage-score">
          <div class="score-bar">
            <div class="score-marker" style="left: ${avgConversion}%"></div>
          </div>
          <span class="score-label ${getScoreClass(avgConversion)}">${avgConversion}</span>
        </div>
        <div class="summary-stage-items">
          Barriers identified with conversion optimization tactics
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #E8F4FD 0%, #F8FAFB 100%); padding: 24px; border-radius: 8px; margin-top: 24px; border-left: 4px solid #0B5ED7;">
      <h3 style="font-size: 16px; font-weight: 600; color: #004C97; margin-bottom: 12px;">Overall Assessment</h3>
      <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6;">
        Your creative idea scores an average of <strong>${Math.round((avgAwareness + avgConsideration + avgConversion) / 3)}/100</strong> across the full funnel.
        ${getOverallRecommendation(avgAwareness, avgConsideration, avgConversion)}
      </p>
    </div>
  `;
}

function getOverallRecommendation(awareness, consideration, conversion) {
  const avg = (awareness + consideration + conversion) / 3;
  
  if (avg >= 80) {
    return 'This is a strong concept ready for execution. Focus on the optimization tips to maximize impact.';
  } else if (avg >= 65) {
    return 'This concept has good potential but needs refinement. Address the red flags before moving forward.';
  } else {
    return 'This concept needs significant work. Consider revisiting the core idea or target audiences before proceeding.';
  }
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

// Helper Functions
function getScoreClass(score) {
  if (score >= 75) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return jsonMode ? JSON.parse(content) : content;
}

function downloadReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    coreIdea: funnelData.coreIdea,
    targetAudience: funnelData.targetAudience,
    targetMarket: funnelData.targetMarket,
    selectedCombinations: funnelData.selectedCombinations,
    awarenessResults: funnelData.awarenessResults,
    considerationResults: funnelData.considerationResults,
    conversionResults: funnelData.conversionResults
  };
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creative-funnel-report-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
