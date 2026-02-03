// Ad Generator - Philips "Made for the Homemakers" Platform
// Aligned with Acts of Homemaking and Desire/Engage/Convert framework

// Philips knowledge integration
let knowledgePromise = null;
let philipsKnowledgeRaw = '';
let philipsPersonas = [];

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

// Global state
let adData = {
  audience: '',
  moment: '',
  product: '',
  funnelStage: 'desire',
  market: 'USA',
  generatedAds: {}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ Ad Generator v2.0 initialized - Desire/Engage/Convert framework loaded');
  knowledgePromise = loadPhilipsKnowledge();
  
  const createBtn = document.getElementById('createAdBtn');
  if (createBtn) {
    createBtn.addEventListener('click', handleAdGeneration);
    console.log('✓ Create button connected');
  }
  
  // Setup product selection
  const productSelect = document.getElementById('adProductSelect');
  if (productSelect) {
    productSelect.addEventListener('change', updateProductPreview);
  }
  
  // Setup funnel stage selector
  setupFunnelStageSelector();
  console.log('✓ Funnel stage selector (Desire/Engage/Convert) ready');
});

function setupFunnelStageSelector() {
  // Add funnel stage selector to the form
  const formCard = document.querySelector('.ad-maker-form');
  if (!formCard) {
    console.warn('⚠️ Could not find .ad-maker-form element');
    return;
  }
  
  const funnelSelector = document.createElement('div');
  funnelSelector.style.cssText = 'margin-bottom: 24px;';
  funnelSelector.innerHTML = `
    <label class="form-label">Funnel Stage:</label>
    <div style="display: flex; gap: 12px; margin-top: 12px;">
      <button type="button" class="funnel-stage-btn active" data-stage="desire" style="flex: 1; padding: 12px 16px; border: 2px solid #0B5ED7; background: #0B5ED7; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
        DESIRE<br><span style="font-size: 12px; font-weight: 400; opacity: 0.9;">Declare Leadership</span>
      </button>
      <button type="button" class="funnel-stage-btn" data-stage="engage" style="flex: 1; padding: 12px 16px; border: 2px solid #0891B2; background: white; color: #0891B2; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
        ENGAGE<br><span style="font-size: 12px; font-weight: 400;">Activate Community</span>
      </button>
      <button type="button" class="funnel-stage-btn" data-stage="convert" style="flex: 1; padding: 12px 16px; border: 2px solid #22C55E; background: white; color: #22C55E; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
        CONVERT<br><span style="font-size: 12px; font-weight: 400;">Enlist Buyers</span>
      </button>
    </div>
  `;
  
  const createBtn = document.getElementById('createAdBtn');
  formCard.insertBefore(funnelSelector, createBtn);
  console.log('✓ Funnel stage buttons injected into DOM');
  
  // Setup click handlers
  document.querySelectorAll('.funnel-stage-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.funnel-stage-btn').forEach(b => {
        b.classList.remove('active');
        const stage = b.dataset.stage;
        const color = stage === 'desire' ? '#0B5ED7' : stage === 'engage' ? '#0891B2' : '#22C55E';
        b.style.background = 'white';
        b.style.color = color;
      });
      
      this.classList.add('active');
      const stage = this.dataset.stage;
      const color = stage === 'desire' ? '#0B5ED7' : stage === 'engage' ? '#0891B2' : '#22C55E';
      this.style.background = color;
      this.style.color = 'white';
      
      adData.funnelStage = stage;
      console.log(`✓ Funnel stage selected: ${stage.toUpperCase()}`);
    });
  });
}

function updateProductPreview() {
  const productSelect = document.getElementById('adProductSelect');
  const selectedProductCard = document.getElementById('selectedProductCard');
  const productValue = productSelect.value;
  
  if (!productValue) {
    selectedProductCard.style.display = 'none';
    return;
  }
  
  // Product data
  const products = {
    'airfryer-xxl': {
      name: 'Philips Airfryer XXL',
      price: '$299.99',
      desc: 'Uses Rapid Air technology to deliver crispy, delicious results with up to 90% less fat. Perfect for families.',
      image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp'
    },
    'lattego-5400': {
      name: 'Philips LatteGo 5400',
      price: '$899.99',
      desc: 'Barista-quality coffee at home with one-touch recipes and easy milk frothing.',
      image: 'images/imgi_93_Philips_5400_Latte_Go_1_68dab93d0d_ce5ad74505.png'
    },
    'air-steam-cooker': {
      name: 'Philips Air Steam Cooker',
      price: '$349.99',
      desc: 'Combines time, temperature and humidity for optimal cooking results every time.',
      image: 'images/imgi_30_Aircooker_88aaad917c_af05dc9f85_1600_75.webp'
    }
  };
  
  const product = products[productValue] || products['airfryer-xxl'];
  
  document.getElementById('selectedProductName').textContent = product.name;
  document.getElementById('selectedProductPrice').textContent = product.price;
  document.getElementById('selectedProductDesc').textContent = product.desc;
  document.getElementById('selectedProductImg').src = product.image;
  
  selectedProductCard.style.display = 'block';
}

async function handleAdGeneration() {
  const audience = document.getElementById('adAudienceSelect').value;
  const moment = document.getElementById('adMomentSelect').value;
  const product = document.getElementById('adProductSelect').value;
  
  if (!audience || !moment || !product) {
    alert('Please select audience, moment, and product');
    return;
  }
  
  adData.audience = audience;
  adData.moment = moment;
  adData.product = product;
  
  const btn = document.getElementById('createAdBtn');
  const originalBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating ads...';
  
  try {
    const ads = await generatePhilipsAds(audience, moment, product, adData.funnelStage);
    adData.generatedAds = ads;
    displayGeneratedAds(ads);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating ads. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

async function generatePhilipsAds(audience, moment, product, funnelStage) {
  const personaContext = philipsPersonas.length 
    ? philipsPersonas.map(p => `${p.name}: ${p.mindset}. Rituals: ${p.rituals}.`).join('\n')
    : DEFAULT_PERSONA_SUMMARIES;
  
  const stageGuidance = {
    desire: {
      role: 'Declare Leadership - Position Philips as the preferred brand for homemakers',
      approach: 'Premium, emotive, aspirational content that builds brand superiority',
      channels: 'AV, YouTube, OLV, Social (brand-building)',
      tone: 'Proudly humble, celebrates real homemaking, positions Philips as trusted helper'
    },
    engage: {
      role: 'Activate the Community - Remind people of Philips benefits through authentic moments',
      approach: 'Participatory, authentic, real-life usage that breaks conventions',
      channels: 'Social, Creators, Partnerships, Contextual Display',
      tone: 'Light-hearted, welcoming, genuine - celebrates imperfect homemaking'
    },
    convert: {
      role: 'Enlist Buyers - Clear pathways to purchase for in-market consumers',
      approach: 'Direct, benefit-focused, removes purchase barriers',
      channels: 'Meta, Google Discovery, Amazon DSP, Paid Search',
      tone: 'Helpful, reassuring, practical - makes purchase feel safe and easy'
    }
  };
  
  const stage = stageGuidance[funnelStage];
  
  const prompt = `You are a senior creative for Philips home appliances. Create 3 social media ad concepts for the ${funnelStage.toUpperCase()} stage.

AUDIENCE: ${audience}
MOMENT: ${moment}
PRODUCT: ${product}
MARKET: ${adData.market}

PHILIPS "MADE FOR THE HOMEMAKERS" PLATFORM:
${personaContext}

${funnelStage.toUpperCase()} STAGE GUIDANCE:
Role: ${stage.role}
Approach: ${stage.approach}
Channels: ${stage.channels}
Tone: ${stage.tone}

ACTS OF HOMEMAKING FRAMEWORK:
- Celebrate real homemaking moments (not just product features)
- Show Philips as the supportive helper in the background
- Honor imperfect, un-curated everyday life
- Focus on emotional transformation through small acts of care

CREATIVE REQUIREMENTS:
1. Connect authentically to the audience's ${moment} moment
2. Show how ${product} enables acts of homemaking
3. Match ${funnelStage} stage objectives and tone
4. Feel like genuine, relatable homemaking content

Generate 3 ad concepts with different formats:

Return ONLY a JSON object:
{
  "desireAds": [
    {
      "format": "15s Video (Instagram Reels/TikTok)",
      "concept": "Brief concept description (2 sentences)",
      "visual": "What we see (3-4 sentences describing scenes)",
      "copy": "Ad copy text (headline + body, <100 chars total for social)",
      "hook": "Opening hook that stops the scroll (1 sentence)",
      "brandMoment": "Where/how Philips appears (1 sentence)",
      "cta": "Call to action",
      "rationale": "Why this works for ${funnelStage} stage (2 sentences)"
    }
  ],
  "engageAds": [
    {
      "format": "Carousel Post (Instagram/Facebook)",
      "concept": "Brief concept description (2 sentences)",
      "slides": ["Slide 1 description", "Slide 2 description", "Slide 3 description"],
      "copy": "Ad copy text (headline + body)",
      "hook": "Opening that invites participation (1 sentence)",
      "brandMoment": "Where/how Philips appears (1 sentence)",
      "cta": "Call to action",
      "rationale": "Why this works for ${funnelStage} stage (2 sentences)"
    }
  ],
  "convertAds": [
    {
      "format": "Static Image (Meta/Google Display)",
      "concept": "Brief concept description (2 sentences)",
      "visual": "What we see (2-3 sentences)",
      "copy": "Ad copy text (headline + benefit + CTA, clear and direct)",
      "hook": "Benefit-driven headline (1 sentence)",
      "brandMoment": "Product and brand prominence (1 sentence)",
      "cta": "Clear purchase CTA",
      "rationale": "Why this works for ${funnelStage} stage (2 sentences)"
    }
  ],
  "overallStrategy": "How these 3 concepts work together for ${funnelStage} stage (2-3 sentences)"
}`;

  const result = await callOpenAI(prompt, 'gpt-4o', true);
  
  // Return the appropriate ads based on funnel stage
  return {
    ads: result[funnelStage + 'Ads'] || result.desireAds,
    overallStrategy: result.overallStrategy
  };
}

function displayGeneratedAds(result) {
  // Hide previous briefs
  const previousBriefs = document.querySelector('.previous-briefs-section');
  if (previousBriefs) previousBriefs.style.display = 'none';
  
  // Create or update results container
  let resultsContainer = document.getElementById('adResults');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'adResults';
    resultsContainer.style.cssText = 'max-width: 1200px; margin: 40px auto;';
    document.querySelector('.page-container').appendChild(resultsContainer);
  }
  
  const stageColors = {
    desire: '#0B5ED7',
    engage: '#0891B2',
    convert: '#22C55E'
  };
  
  const stageColor = stageColors[adData.funnelStage];
  
  resultsContainer.innerHTML = `
    <div class="white-card" style="margin-bottom: 32px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 3px solid ${stageColor};">
        <div>
          <h2 style="font-size: 24px; font-weight: 700; color: ${stageColor}; margin: 0; text-transform: uppercase;">${adData.funnelStage} Stage Ads</h2>
          <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0 0;">${adData.audience} × ${adData.moment} × ${adData.product}</p>
        </div>
      </div>
      
      <div style="background: #F8FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid ${stageColor}; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Strategy Overview</div>
        <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.overallStrategy}</p>
      </div>
    </div>
    
    ${result.ads.map((ad, index) => generateAdCard(ad, index + 1, stageColor)).join('')}
  `;
  
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateAdCard(ad, number, color) {
  const isVideo = ad.format.includes('Video');
  const isCarousel = ad.format.includes('Carousel');
  
  return `
    <div class="white-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 40px; height: 40px; background: ${color}; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;">${number}</div>
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #1A1A1A; margin: 0;">${ad.format}</h3>
          <p style="font-size: 13px; color: #6B7280; margin: 2px 0 0 0;">${ad.concept}</p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #F8FAFB 0%, #FFFFFF 100%); padding: 20px; border-radius: 12px; border-left: 3px solid ${color}; margin-bottom: 16px;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: ${color}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Hook</div>
          <p style="font-size: 15px; color: #1A1A1A; font-weight: 600; margin: 0;">${ad.hook}</p>
        </div>
        
        ${isCarousel ? `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Carousel Slides</div>
            <div style="display: grid; gap: 8px;">
              ${ad.slides.map((slide, i) => `
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #E5E7EB;">
                  <span style="font-weight: 600; color: ${color};">Slide ${i + 1}:</span> ${slide}
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Visual Description</div>
            <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${ad.visual}</p>
          </div>
        `}
        
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Ad Copy</div>
          <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0; font-style: italic;">"${ad.copy}"</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Brand Moment</div>
            <p style="font-size: 13px; color: #1A1A1A; margin: 0;">${ad.brandMoment}</p>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Call to Action</div>
            <p style="font-size: 13px; color: #1A1A1A; font-weight: 600; margin: 0;">${ad.cta}</p>
          </div>
        </div>
      </div>
      
      <div style="background: #FEF9E7; padding: 16px; border-radius: 8px; border-left: 3px solid #F59E0B;">
        <div style="font-size: 11px; font-weight: 700; color: #92400E; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Strategic Rationale</div>
        <p style="font-size: 14px; color: #78350F; line-height: 1.6; margin: 0;">${ad.rationale}</p>
      </div>
    </div>
  `;
}

// Knowledge loading helpers
async function loadPhilipsKnowledge() {
  try {
    const response = await fetch('context/knowledge.txt');
    if (!response.ok) throw new Error(`Failed to load knowledge file: ${response.status}`);
    philipsKnowledgeRaw = await response.text();
    philipsPersonas = parsePersonaTable(philipsKnowledgeRaw);
  } catch (error) {
    console.warn('Unable to load Philips knowledge base:', error);
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
      rituals: personaMap['Home Rituals and Acts'] || '',
      drivers: personaMap['Emotional Drivers'] || ''
    };
  }).filter(persona => persona.name);
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
      content: 'You are a world-class creative director for Philips home appliances. You understand the "Made for the Homemakers" platform, Acts of Homemaking framework, and Desire/Engage/Convert funnel. Create authentic, relatable content that celebrates real homemaking.'
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

  const OPENAI_API_KEY = (
    window?.philipsConfig?.openAiKey ||
    localStorage.getItem('philips_openai_api_key') ||
    ''
  ).trim();

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
