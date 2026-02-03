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
  scrutinyResult: null,
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
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing idea...';
  
  try {
    // Step 1: Scrutinize the idea
    const scrutinyResult = await scrutinizeIdea(coreIdea, targetAudience, targetMarket);
    reviewData.scrutinyResult = scrutinyResult;
    displayScrutinyResult(scrutinyResult);
    
    // Step 2: Generate audience/market combinations
    const combinations = await generateCombinations(coreIdea, targetAudience, targetMarket);
    reviewData.audienceCombinations = combinations;
    displayCombinations(combinations);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error reviewing idea. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Review My Idea →';
  }
}

async function scrutinizeIdea(coreIdea, targetAudience, targetMarket) {
  const personaDetail = getPersonaDetailForPrompt(targetAudience);
  const personaContext = personaDetail ? `Relevant Philips persona detail:\n${personaDetail}\n\n` : '';
  const platformReminder = philipsPlatformPromptBlock ? 'Honor the Philips "Made for the Homemakers" platform that celebrates real-life homemaking, emotional connection, and tone of voice that is proudly humble, light-hearted, welcoming, and genuine.\n\n' : '';
  
  const prompt = `You are a senior creative strategist for Philips home appliances. Deeply scrutinize this creative idea.

Core Idea: "${coreIdea}"
${targetAudience ? `Suggested Audience: "${targetAudience}"` : ''}
${targetMarket ? `Suggested Market: "${targetMarket}"` : ''}

Analyze this idea CRITICALLY. Be brutally honest - weak, generic, or off-brand ideas should score below 60. Strong ideas that authentically connect to homemaker needs and platform principles score 75+.

EVALUATION CRITERIA (score harshly if missing):
- Does it celebrate real homemaking moments (not just product features)?
- Does it keep Philips as supportive helper (not hero)?
- Is the tone proudly humble, light-hearted, welcoming, genuine?
- Does it connect to actual persona rituals and emotional drivers?
- Would this resonate authentically or feel forced/gimmicky?

${personaContext}${platformReminder}

Return ONLY a JSON object:
{
  "overallScore": 72,
  "overallAssessment": "2-3 sentence summary of the idea's potential and main challenges",
  "coreStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "coreWeaknesses": ["Weakness 1", "Weakness 2"],
  "brandAlignment": {
    "score": 75,
    "explanation": "How well this fits the Philips platform (2 sentences)"
  },
  "audienceFit": {
    "score": 70,
    "explanation": "How well this connects to homemaker personas (2 sentences)"
  },
  "emotionalResonance": {
    "score": 68,
    "explanation": "Potential for emotional connection (2 sentences)"
  },
  "recommendedRefinement": "How to improve the core idea (2-3 sentences)",
  "shouldProceed": true
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function displayScrutinyResult(result) {
  const container = document.getElementById('scrutinyResults');
  const card = document.getElementById('scrutinyCard');
  
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
      <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #22C55E;">
        <h4 style="font-size: 14px; font-weight: 600; color: #166534; margin: 0 0 12px 0;">Core Strengths</h4>
        <ul style="font-size: 13px; color: #166534; margin: 0; padding-left: 20px;">
          ${result.coreStrengths.map(s => `<li style="margin-bottom: 6px;">${s}</li>`).join('')}
        </ul>
      </div>
      
      <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; border-left: 4px solid #EF4444;">
        <h4 style="font-size: 14px; font-weight: 600; color: #991B1B; margin: 0 0 12px 0;">Core Weaknesses</h4>
        <ul style="font-size: 13px; color: #991B1B; margin: 0; padding-left: 20px;">
          ${result.coreWeaknesses.map(w => `<li style="margin-bottom: 6px;">${w}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <h3 style="font-size: 18px; font-weight: 600; color: #004C97; margin-bottom: 16px;">Detailed Analysis</h3>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Brand Alignment</div>
          <div class="funnel-output-subtitle">How well does this fit the Philips platform?</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.brandAlignment.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.brandAlignment.score)}">${result.brandAlignment.score}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">${result.brandAlignment.explanation}</p>
    </div>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Audience Fit</div>
          <div class="funnel-output-subtitle">How well does this connect to homemakers?</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.audienceFit.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.audienceFit.score)}">${result.audienceFit.score}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">${result.audienceFit.explanation}</p>
    </div>
    
    <div class="funnel-output-card">
      <div class="funnel-output-header">
        <div>
          <div class="funnel-output-title">Emotional Resonance</div>
          <div class="funnel-output-subtitle">Potential for authentic emotional connection</div>
        </div>
        <div class="score-indicator">
          <div class="score-bar">
            <div class="score-marker" style="left: ${result.emotionalResonance.score}%"></div>
          </div>
          <span class="score-label ${getScoreClass(result.emotionalResonance.score)}">${result.emotionalResonance.score}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">${result.emotionalResonance.explanation}</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FEF9E7 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-top: 24px;">
      <h4 style="font-size: 16px; font-weight: 600; color: #92400E; margin: 0 0 12px 0;">Recommended Refinement</h4>
      <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${result.recommendedRefinement}</p>
    </div>
  `;
  
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
