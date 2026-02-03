// Insight Generator - Acts of Homemaking Framework
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
  market: '',
  feature: '',
  acts: null
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

// Generate homemaking acts from market and feature
async function handleIdeaGeneration() {
  const marketInput = document.getElementById('marketInput');
  const featureInput = document.getElementById('featureInput');
  
  const market = marketInput?.value.trim();
  const feature = featureInput?.value;
  
  if (!market) {
    alert('Please enter a market');
    return;
  }
  
  if (!feature) {
    alert('Please select a product feature');
    return;
  }
  
  insightData.market = market;
  insightData.feature = feature;
  
  const btn = document.getElementById('discoverBtn');
  const originalBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span><span>Generating acts of homemaking...</span>';
  
  updateProgress(2); // Move to generation
  
  try {
    const acts = await generateHomemakingActs(market, feature);
    insightData.acts = acts;
    displayHomemakingActs(acts);
    
    updateProgress(6); // Complete all steps
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating insights. Please try again.');
    updateProgress(1); // Reset to start
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }
}

async function generateHomemakingActs(market, feature) {
  const prompt = `You are a creative strategist for Philips kitchen appliances, specializing in the "Acts of Homemaking" framework.

Market: ${market}
Product Feature: ${feature}

ACTS OF HOMEMAKING FRAMEWORK:
It's the (often unseen) things we do to turn a house into a home. They are:
- Transformative: Changes how a moment feels, not just how a task gets done
- Intentional: Always done on purpose, even if it's quick, habitual, or simple  
- Consequential: Even if it's small, it's meaningful

A homemaker can be anyone: Kids, parents, singles, solo parents, families, couples.

TRUE HOMEMAKING celebrates the realness of everyday life with quirks and imperfections. We want to honor everyone for being themselves and doing things that bring joy and happiness in the home no matter what happens.

PRODUCT FEATURE CAPABILITIES:
${getFeatureDescription(feature)}

THREE LEVELS OF ACTS:
1. HERO ACTS: Big singular acts that are deeply moving (high-stakes moments disguised as ordinary meals)
2. RITUAL ACTS: Every day, recognizable and repeatable acts (meals that hold a household together)
3. MICRO ACTS: Small invisible acts (tiny decisions that signal care)

TONE: 20% witty, 60% insightful, rooted in product truth. Wry smile of recognition - "We see you, we know life isn't always perfect."

Generate 6-8 scenarios across all three levels (2-3 per level). For each scenario, connect:
- Life moment (unpredictable situation)
- Act of care (what homemaker is doing)
- How the product feature enables/transforms it
- Emotional shift (stress → relief, guilt → pride, etc)

Return ONLY a JSON object:
{
  "heroActs": [
    {
      "lifeMoment": "A breakup meal made from 'whatever's left'",
      "unpredictability": "When comfort is needed most, energy is lowest",
      "actOfCare": "Making something soft, nourishing, and comforting after a hard day",
      "dish": "Leftover risotto or mac & cheese, reheated perfectly",
      "featurePayoff": "SteamFry keeps it creamy inside, crispy on top - not dried out",
      "emotionalShift": "Despair → Self-care",
      "toneExample": "When life falls apart, at least dinner doesn't have to."
    }
  ],
  "ritualActs": [
    {
      "lifeMoment": "Kids don't like greens",
      "unpredictability": "What they loved yesterday, they refuse today",
      "actOfCare": "Making vegetables enjoyable without a fight",
      "dish": "Broccoli or cauliflower 'tempura-style' bites",
      "featurePayoff": "SteamFry makes them crispy outside, juicy inside - suddenly acceptable",
      "emotionalShift": "Battle → Victory",
      "toneExample": "Turns out, broccoli just needed better representation."
    }
  ],
  "microActs": [
    {
      "lifeMoment": "Home alone and you'd eat a dry sandwich",
      "unpredictability": "Hunger arrives without warning",
      "actOfCare": "Making a nice quick meal, even if just for yourself",
      "dish": "Frozen dumplings or spring rolls",
      "featurePayoff": "SteamFry makes them crispy outside, juicy inside - not microwave-sad",
      "emotionalShift": "Settling → Treating yourself",
      "toneExample": "Because you're worth more than cold cereal."
    }
  ]
}`;

  return await callOpenAI(prompt, 'gpt-4o', true);
}

function getFeatureDescription(feature) {
  const descriptions = {
    'SteamFry': 'SteamFry combines steam and air frying for crispy outside, juicy inside - best of both worlds. Makes frozen food restaurant-quality, keeps reheated meals fresh, and lets you cook multiple textures in one go.',
    'AirFry': 'AirFry uses Rapid Air technology for crispy, delicious results with up to 90% less fat. Perfect for healthier cooking without sacrificing taste or texture.',
    'SteamClean': 'Steam Clean uses steam to loosen baked-on grease and sugar - no scraping needed. The best food leaves the worst mess, but cleanup resets fast.',
    'EveryBiteTasty': 'Smart sensing technology automatically adjusts time and temperature for perfect results every time. Takes the guesswork out of cooking.',
    'MealsVariety': 'One appliance, endless possibilities - from frozen to fresh, breakfast to dinner, snacks to full meals. Expands what\'s possible without filling the kitchen.'
  };
  return descriptions[feature] || feature;
}

function displayHomemakingActs(result) {
  // Hide the old input section
  const introGrid = document.querySelector('.trend-intro-grid');
  if (introGrid) introGrid.style.display = 'none';
  
  const trendsSection = document.querySelector('.previous-trends-section');
  if (trendsSection) trendsSection.style.display = 'none';
  
  // Create or update results container
  let resultsContainer = document.getElementById('insightResults');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'insightResults';
    resultsContainer.style.cssText = 'max-width: 1000px; margin: 40px auto;';
    document.querySelector('.funnel-main-content').appendChild(resultsContainer);
  }
  
  resultsContainer.innerHTML = `
    <div class="white-card" style="margin-bottom: 32px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 700; color: #004C97; margin: 0;">Acts of Homemaking</h2>
          <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">${insightData.market} × ${insightData.feature}</p>
        </div>
      </div>
      <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
        Connecting product features to real life moments - the acts of care that transform how those moments feel.
      </p>
    </div>
    
    ${generateActSection('Hero Acts', 'Big singular acts that are deeply moving', result.heroActs, '#8B5CF6')}
    ${generateActSection('Ritual Acts', 'Every day, recognizable and repeatable', result.ritualActs, '#0B5ED7')}
    ${generateActSection('Micro Acts', 'Small invisible acts of care', result.microActs, '#10B981')}
  `;
  
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateActSection(title, subtitle, acts, color) {
  return `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 4px; height: 32px; background: ${color}; border-radius: 2px;"></div>
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: ${color}; margin: 0;">${title}</h3>
          <p style="font-size: 13px; color: #6B7280; margin: 2px 0 0 0;">${subtitle}</p>
        </div>
      </div>
      
      <div style="display: grid; gap: 20px;">
        ${acts.map(act => `
          <div style="background: linear-gradient(135deg, #F8FAFB 0%, #FFFFFF 100%); padding: 20px; border-radius: 12px; border-left: 3px solid ${color};">
            
            <div style="margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: ${color}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Life Moment</div>
              <p style="font-size: 16px; color: #1A1A1A; font-weight: 600; margin: 0 0 4px 0;">"${act.lifeMoment}"</p>
              <p style="font-size: 13px; color: #6B7280; font-style: italic; margin: 0;">${act.unpredictability}</p>
            </div>
            
            <div style="margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Act of Care</div>
              <p style="font-size: 14px; color: #1A1A1A; margin: 0 0 8px 0;">${act.actOfCare}</p>
              <div style="background: #E8F4FD; padding: 10px 12px; border-radius: 6px; display: inline-block;">
                <span style="font-size: 13px; color: #004C97; font-weight: 500;">🍽️ ${act.dish}</span>
              </div>
            </div>
            
            <div style="background: ${color}15; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: ${color}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">${insightData.feature} Payoff</div>
              <p style="font-size: 14px; color: #1A1A1A; line-height: 1.5; margin: 0; font-weight: 500;">${act.featurePayoff}</p>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Emotional Shift</div>
                <p style="font-size: 13px; color: #1A1A1A; margin: 0; font-weight: 600;">${act.emotionalShift}</p>
              </div>
              <div style="flex: 1; text-align: right;">
                <p style="font-size: 13px; color: #6B7280; margin: 0; font-style: italic;">"${act.toneExample}"</p>
              </div>
            </div>
            
          </div>
        `).join('')}
      </div>
    </div>
  `;
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
      content: 'You are a world-class creative strategist for Philips home appliances, specializing in the "Acts of Homemaking" framework. You connect product features to real life moments with insight, wit, and genuine understanding of modern homemaking.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const requestPayload = {
    model,
    messages,
    temperature: 0.8
  };

  if (jsonMode) {
    requestPayload.response_format = { type: 'json_object' };
  }

  let data;

  const OPENAI_API_KEY = (
    window?.philipsConfig?.openAiKey ||
    localStorage.getItem('philips_openai_api_key') ||
    ''
  ).trim();

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
