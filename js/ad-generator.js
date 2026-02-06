// Ad Generator V3.0 - Philips "Made for the Homemakers" with AI Image Generation
// Instagram-style previews with DALL-E generated creative

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

// Product data with images and visual descriptions for DALL-E
const PRODUCTS = {
  'airfryer-xxl': {
    name: 'Philips Airfryer XXL',
    price: '$299.99',
    desc: 'Uses Rapid Air technology to deliver crispy, delicious results with up to 90% less fat.',
    image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp',
    visualDesc: 'a sleek black Philips Airfryer XXL kitchen appliance with a digital touchscreen'
  },
  'airfryer-compact': {
    name: 'Philips Airfryer Compact',
    price: '$179.99',
    desc: 'Compact design with powerful performance for smaller households.',
    image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp',
    visualDesc: 'a compact white Philips Airfryer kitchen appliance'
  },
  'lattego-5400': {
    name: 'Philips LatteGo 5400',
    price: '$899.99',
    desc: 'Barista-quality coffee at home with one-touch recipes and easy milk frothing.',
    image: 'images/imgi_93_Philips_5400_Latte_Go_1_68dab93d0d_ce5ad74505.png',
    visualDesc: 'a premium silver and black Philips LatteGo 5400 espresso machine with milk frother'
  },
  'lattego-3200': {
    name: 'Philips LatteGo 3200',
    price: '$599.99',
    desc: 'Easy-to-use coffee maker with LatteGo milk system for creamy drinks.',
    image: 'images/imgi_93_Philips_5400_Latte_Go_1_68dab93d0d_ce5ad74505.png',
    visualDesc: 'a black Philips LatteGo 3200 coffee machine'
  },
  'air-steam-cooker': {
    name: 'Philips Air Steam Cooker',
    price: '$349.99',
    desc: 'Combines time, temperature and humidity for optimal cooking results every time.',
    image: 'images/imgi_30_Aircooker_88aaad917c_af05dc9f85_1600_75.webp',
    visualDesc: 'a modern black Philips Air Steam Cooker with a glass lid and digital display'
  },
  'air-purifier': {
    name: 'Philips Air Purifier',
    price: '$449.99',
    desc: 'HEPA filtration removes 99.97% of particles for cleaner, healthier air at home.',
    image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp',
    visualDesc: 'a white cylindrical Philips Air Purifier with a subtle blue light indicator'
  },
  'aquatrio-cordless': {
    name: 'Philips AquaTrio Cordless',
    price: '$399.99',
    desc: 'Vacuums, mops and dries in one pass for effortless floor cleaning.',
    image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp',
    visualDesc: 'a cordless Philips AquaTrio wet and dry vacuum cleaner'
  },
  'handheld-steamer': {
    name: 'Philips Handheld Steamer',
    price: '$79.99',
    desc: 'Quick and easy garment steaming with continuous steam output.',
    image: 'images/imgi_13_Airfryer_XL_1574f74b04_a03d8c5cb0_1920_75.webp',
    visualDesc: 'a compact blue Philips handheld garment steamer'
  },
  'saeco-xelsis': {
    name: 'Saeco Xelsis Suprema',
    price: '$1,799.99',
    desc: 'Premium fully automatic espresso machine with CoffeeEqualizer touch display.',
    image: 'images/imgi_93_Philips_5400_Latte_Go_1_68dab93d0d_ce5ad74505.png',
    visualDesc: 'a premium stainless steel Saeco Xelsis Suprema espresso machine with touchscreen'
  },
  'gaggia-classic': {
    name: 'Gaggia Classic Evo',
    price: '$499.99',
    desc: 'Iconic Italian design meets modern brewing technology for espresso purists.',
    image: 'images/imgi_93_Philips_5400_Latte_Go_1_68dab93d0d_ce5ad74505.png',
    visualDesc: 'a classic stainless steel Gaggia Classic Evo espresso machine with portafilter'
  }
};

// Global state
let adData = {
  audience: '',
  moment: '',
  product: '',
  funnelStage: 'desire',
  market: 'USA',
  context: '',
  generatedAds: {}
};

// ─── CSS animation for spinner ──────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .ig-preview-card { transition: transform 0.2s, box-shadow 0.2s; }
  .ig-preview-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
`;
document.head.appendChild(styleSheet);

// ─── Initialize ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ Ad Generator v3.0 - Instagram Preview + AI Image Generation');
  knowledgePromise = loadPhilipsKnowledge();

  const createBtn = document.getElementById('createAdBtn');
  if (createBtn) createBtn.addEventListener('click', handleAdGeneration);

  const productSelect = document.getElementById('adProductSelect');
  if (productSelect) productSelect.addEventListener('change', updateProductPreview);

  setupFunnelStageHandlers();
});

function setupFunnelStageHandlers() {
  document.querySelectorAll('.funnel-stage-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.funnel-stage-btn').forEach(b => {
        b.classList.remove('active');
        const stage = b.dataset.stage;
        const color = stage === 'desire' ? '#0B5ED7' : stage === 'engage' ? '#0891B2' : '#22C55E';
        b.style.background = 'white';
        b.style.color = color;
        b.style.boxShadow = 'none';
      });
      this.classList.add('active');
      const stage = this.dataset.stage;
      const color = stage === 'desire' ? '#0B5ED7' : stage === 'engage' ? '#0891B2' : '#22C55E';
      this.style.background = color;
      this.style.color = 'white';
      this.style.boxShadow = `0 4px 12px ${color}44`;
      adData.funnelStage = stage;
    });
  });
}

function updateProductPreview() {
  const productSelect = document.getElementById('adProductSelect');
  const selectedProductCard = document.getElementById('selectedProductCard');
  const productValue = productSelect.value;

  if (!productValue || !selectedProductCard) {
    if (selectedProductCard) selectedProductCard.style.display = 'none';
    return;
  }

  const product = PRODUCTS[productValue];
  if (!product) { selectedProductCard.style.display = 'none'; return; }

  document.getElementById('selectedProductName').textContent = product.name;
  document.getElementById('selectedProductPrice').textContent = product.price;
  document.getElementById('selectedProductDesc').textContent = product.desc;
  document.getElementById('selectedProductImg').src = product.image;
  selectedProductCard.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// Main Generation Flow
// ═══════════════════════════════════════════════════════════════════
async function handleAdGeneration() {
  const audience = document.getElementById('adAudienceSelect').value;
  const moment = document.getElementById('adMomentSelect').value;
  const product = document.getElementById('adProductSelect').value;
  const context = (document.getElementById('adContextInput')?.value || '').trim();

  if (!audience || !moment || !product) {
    alert('Please select audience, moment, and product');
    return;
  }

  adData.audience = audience;
  adData.moment = moment;
  adData.product = product;
  adData.context = context;

  const btn = document.getElementById('createAdBtn');
  const originalBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating ads & images...';

  try {
    // Step 1: Generate ad copy concepts via GPT-4o
    const adConcepts = await generateAdConcepts(audience, moment, product, adData.funnelStage, context);

    // Step 2: Show initial cards with loading spinners for images
    displayAdPreviews(adConcepts, true);

    // Step 3: Generate DALL-E images in parallel
    const productInfo = PRODUCTS[product] || PRODUCTS['airfryer-xxl'];
    const imagePromises = adConcepts.ads.map((ad, i) =>
      generateAdImage(ad, productInfo, adData.funnelStage, i)
        .catch(err => { console.warn(`Image ${i + 1} failed:`, err); return null; })
    );

    const images = await Promise.all(imagePromises);

    // Step 4: Slot generated images into the preview cards
    images.forEach((imgUrl, i) => {
      const imgEl = document.getElementById(`ad-preview-img-${i}`);
      const loaderEl = document.getElementById(`ad-preview-loader-${i}`);
      if (imgEl && imgUrl) {
        imgEl.src = imgUrl;
        imgEl.style.display = 'block';
      }
      if (loaderEl) {
        if (imgUrl) {
          loaderEl.style.display = 'none';
        } else {
          loaderEl.innerHTML = '<p style="color:#6B7280;font-size:13px;">⚠️ Image generation failed</p>';
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

// ═══════════════════════════════════════════════════════════════════
// GPT-4o: Generate ad copy concepts
// ═══════════════════════════════════════════════════════════════════
async function generateAdConcepts(audience, moment, product, funnelStage, additionalContext = '') {
  const personaContext = philipsPersonas.length
    ? philipsPersonas.map(p => `${p.name}: ${p.mindset}. Rituals: ${p.rituals}.`).join('\n')
    : DEFAULT_PERSONA_SUMMARIES;

  const contextSection = additionalContext ? `\n\nADDITIONAL CONTEXT FROM USER:\n${additionalContext}` : '';

  const stageGuidance = {
    desire: { role: 'Declare Leadership', approach: 'Premium, emotive, aspirational', channels: 'AV, YouTube, Social', tone: 'Proudly humble, celebrates real homemaking' },
    engage: { role: 'Activate Community', approach: 'Participatory, authentic, real-life', channels: 'Social, Creators, Partnerships', tone: 'Light-hearted, welcoming, genuine' },
    convert: { role: 'Enlist Buyers', approach: 'Direct, benefit-focused', channels: 'Meta, Google, Amazon', tone: 'Helpful, reassuring, practical' }
  };

  const stage = stageGuidance[funnelStage];
  const productInfo = PRODUCTS[product] || PRODUCTS['airfryer-xxl'];

  const prompt = `You are a senior creative director at a top agency working on Philips home appliances.

Create 3 Instagram ad concepts for the ${funnelStage.toUpperCase()} stage.

AUDIENCE: ${audience}
MOMENT: ${moment}  
PRODUCT: ${productInfo.name}
STAGE: ${funnelStage.toUpperCase()} - ${stage.role}
APPROACH: ${stage.approach}
TONE: ${stage.tone}
CHANNELS: ${stage.channels}${contextSection}

PHILIPS PERSONAS:
${personaContext}

REQUIREMENTS:
- Each ad must have a punchy headline (max 8 words), a body caption, a visual scene description for image generation, and a CTA
- The visual scene must describe a real lifestyle photo scene (no text overlays) featuring the product in a real home setting
- Think Instagram-native: warm, authentic, aspirational but relatable
- Celebrate Acts of Homemaking — real people, real moments, real homes

Return ONLY valid JSON:
{
  "ads": [
    {
      "headline": "Short punchy headline (max 8 words)",
      "caption": "Instagram caption text (2-3 sentences with relevant hashtags)",
      "visualScene": "Detailed photo description for AI image generation. Describe the setting, lighting, people, mood, and where the ${productInfo.name} appears. Must be a lifestyle photo, warm and authentic. 2-3 sentences.",
      "cta": "Call to action button text",
      "format": "Feed Post / Reels / Carousel",
      "rationale": "Why this works for ${funnelStage} stage (1 sentence)"
    }
  ],
  "overallStrategy": "How these 3 concepts work together (1-2 sentences)"
}`;

  const result = await callOpenAI(prompt, 'gpt-4o', true);
  if (!result.ads || !Array.isArray(result.ads)) throw new Error('Invalid response format');
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// DALL-E 3: Generate ad image
// ═══════════════════════════════════════════════════════════════════
async function generateAdImage(ad, productInfo, funnelStage, index) {
  const imagePrompt = `Professional Instagram advertisement photo for Philips home appliances.

Scene: ${ad.visualScene}

The ${productInfo.name} (${productInfo.visualDesc}) should be naturally visible in the scene.

Style: High-end lifestyle photography, warm natural lighting, shallow depth of field, Instagram-worthy composition. Shot on Sony A7III with 35mm lens. Authentic and relatable, not stock-photo feeling. No text overlays, no logos, no watermarks, no words. Photorealistic.`;

  const OPENAI_API_KEY = (
    window?.philipsConfig?.openAiKey ||
    localStorage.getItem('philips_openai_api_key') || ''
  ).trim();

  let data;

  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt: imagePrompt, size: '1024x1024', quality: 'standard', n: 1 })
    });
    if (!response.ok) throw new Error(`Image API error: ${response.statusText}`);
    data = await response.json();
  } else {
    const response = await fetch('/api/openai-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imagePrompt, size: '1024x1024', quality: 'standard', n: 1 })
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Image proxy error: ${errText}`);
    }
    data = await response.json();
  }

  return data?.data?.[0]?.url || null;
}

// ═══════════════════════════════════════════════════════════════════
// Display: Instagram-style previews
// ═══════════════════════════════════════════════════════════════════
function displayAdPreviews(result, loading = false) {
  const resultsContainer = document.getElementById('adResults');

  const stageColors = { desire: '#0B5ED7', engage: '#0891B2', convert: '#22C55E' };
  const stageLabels = { desire: 'Desire · Declare Leadership', engage: 'Engage · Activate Community', convert: 'Convert · Enlist Buyers' };
  const stageColor = stageColors[adData.funnelStage];
  const productInfo = PRODUCTS[adData.product] || PRODUCTS['airfryer-xxl'];

  resultsContainer.innerHTML = `
    <!-- Strategy Overview -->
    <div class="white-card" style="margin-top: 40px; margin-bottom: 32px; border-top: 4px solid ${stageColor};">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 12px; height: 12px; background: ${stageColor}; border-radius: 50%;"></div>
        <h2 style="font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0;">${stageLabels[adData.funnelStage]}</h2>
      </div>
      <p style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0;">${adData.audience} × ${adData.moment} × ${productInfo.name}</p>
      <p style="font-size: 14px; color: #1A1A1A; line-height: 1.6; margin: 0;">${result.overallStrategy}</p>
    </div>

    <!-- Instagram Preview Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px;">
      ${result.ads.map((ad, i) => renderInstagramPreview(ad, i, stageColor, productInfo, loading)).join('')}
    </div>

    <!-- Detailed Breakdown -->
    <div style="margin-bottom: 48px;">
      <h3 style="font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 20px 0;">📋 Creative Breakdown</h3>
      ${result.ads.map((ad, i) => renderDetailCard(ad, i, stageColor)).join('')}
    </div>
  `;

  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderInstagramPreview(ad, index, color, productInfo, loading) {
  return `
    <div class="ig-preview-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #EFEFEF;">
      <!-- IG Header -->
      <div style="display: flex; align-items: center; gap: 10px; padding: 12px 14px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0B5ED7, #004C97); display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 10px; font-weight: 700;">P</span>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600; color: #262626;">philips_home</div>
          <div style="font-size: 11px; color: #8E8E8E;">Sponsored</div>
        </div>
        <span style="font-size: 16px; color: #262626;">⋯</span>
      </div>

      <!-- Image Area (1:1 ratio) -->
      <div style="position: relative; width: 100%; padding-bottom: 100%; background: #F5F5F5; overflow: hidden;">
        <img 
          id="ad-preview-img-${index}" 
          src="" 
          alt="Ad creative" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: none;"
        />
        <div 
          id="ad-preview-loader-${index}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f4ff 0%, #e8f5f0 100%);">
          ${loading ? `
            <div style="width: 40px; height: 40px; border: 3px solid #E5E7EB; border-top-color: ${color}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #6B7280;">Generating image with AI...</p>
          ` : ''}
        </div>
        <!-- Headline overlay on image -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 32px 16px 16px; background: linear-gradient(transparent, rgba(0,0,0,0.65));">
          <p style="color: white; font-size: 16px; font-weight: 700; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.5); line-height: 1.3;">${ad.headline}</p>
        </div>
      </div>

      <!-- IG Action Bar -->
      <div style="padding: 12px 14px 4px;">
        <div style="display: flex; gap: 16px; margin-bottom: 8px;">
          <span style="font-size: 22px; cursor: pointer;">♡</span>
          <span style="font-size: 22px; cursor: pointer;">💬</span>
          <span style="font-size: 22px; cursor: pointer;">📤</span>
          <span style="margin-left: auto; font-size: 22px; cursor: pointer;">🔖</span>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="padding: 0 14px 8px;">
        <a style="display: block; text-align: center; padding: 10px; background: ${color}; color: white; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer;">${ad.cta}</a>
      </div>

      <!-- Caption -->
      <div style="padding: 8px 14px 14px;">
        <p style="font-size: 13px; color: #262626; line-height: 1.5; margin: 0;">
          <span style="font-weight: 600;">philips_home</span> ${ad.caption}
        </p>
      </div>

      <!-- Format badge -->
      <div style="padding: 0 14px 12px;">
        <span style="font-size: 11px; background: ${color}15; color: ${color}; padding: 3px 10px; border-radius: 4px; font-weight: 600;">${ad.format}</span>
      </div>
    </div>
  `;
}

function renderDetailCard(ad, index, color) {
  return `
    <div class="white-card" style="margin-bottom: 16px; border-left: 4px solid ${color};">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: ${color}; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700;">${index + 1}</div>
        <div>
          <h4 style="font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0;">${ad.headline}</h4>
          <span style="font-size: 12px; color: #6B7280; background: #F3F4F6; padding: 2px 8px; border-radius: 4px;">${ad.format}</span>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Visual Scene (Image Prompt)</div>
          <p style="font-size: 13px; color: #374151; line-height: 1.5; margin: 0;">${ad.visualScene}</p>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Caption</div>
          <p style="font-size: 13px; color: #374151; line-height: 1.5; margin: 0;">${ad.caption}</p>
        </div>
      </div>
      <div style="background: #FFFBEB; padding: 10px 14px; border-radius: 6px; margin-top: 12px;">
        <span style="font-size: 12px; font-weight: 600; color: #92400E;">💡 Rationale:</span>
        <span style="font-size: 12px; color: #78350F;"> ${ad.rationale}</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// Knowledge loading
// ═══════════════════════════════════════════════════════════════════
async function loadPhilipsKnowledge() {
  try {
    const response = await fetch('context/knowledge.txt');
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
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
    if (!capturing && line.includes('Persona Name') && line.includes('\t')) capturing = true;
    if (capturing) {
      if (!line.trim()) break;
      personaLines.push(line.trim());
    }
  }
  if (personaLines.length <= 1) return [];
  const headers = personaLines[0].split('\t').map(h => h.trim());
  return personaLines.slice(1).map(line => {
    const values = line.split('\t');
    const m = {};
    headers.forEach((h, i) => { m[h] = values[i] ? values[i].trim() : ''; });
    return { name: m['Persona Name'] || '', mindset: m['Mindset and Values'] || '', rituals: m['Home Rituals and Acts'] || '', drivers: m['Emotional Drivers'] || '' };
  }).filter(p => p.name);
}

// ═══════════════════════════════════════════════════════════════════
// OpenAI API call (text)
// ═══════════════════════════════════════════════════════════════════
async function callOpenAI(prompt, model = 'gpt-4o', jsonMode = false) {
  if (knowledgePromise) {
    try { await knowledgePromise; } catch (e) { console.warn('Proceeding without knowledge:', e); }
  }

  const messages = [
    { role: 'system', content: 'You are a world-class creative director for Philips home appliances. You create Instagram-native ad content aligned with the "Made for the Homemakers" platform and Desire/Engage/Convert funnel. Always return only valid JSON when asked.' },
    { role: 'user', content: prompt }
  ];

  const requestPayload = { model, messages, temperature: 0.85 };
  if (jsonMode) requestPayload.response_format = { type: 'json_object' };

  const OPENAI_API_KEY = (
    window?.philipsConfig?.openAiKey ||
    localStorage.getItem('philips_openai_api_key') || ''
  ).trim();

  let data;
  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(requestPayload)
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    data = await response.json();
  } else {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Proxy error (${response.status}): ${errText}`);
    }
    data = await response.json();
  }

  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('Empty response from AI');

  if (jsonMode) {
    try { return JSON.parse(content); }
    catch (e) { throw new Error(`JSON parse error: ${e.message}`); }
  }
  return content;
}
