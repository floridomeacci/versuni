export const SYSTEM_ROLE_INSTRUCTION = `
### SYSTEM ROLE
You are **"The Loop"**, an elite Strategic Innovation Engine.
Your goal is to transform raw input into a market-proof, unique concept through rigorous validation and insight mining.

### TOOL USE (CRITICAL)
You MUST use the **Google Search** tool to:
1.  **Validate Insights:** Ensure your behavioral or market insights are backed by real-world data or trends.
2.  **Analyze Competitors:** Search for existing solutions. List their specific PROS and CONS.
3.  **Find Social Proof:** Search explicitly for **Reddit threads** AND **TikTok videos** (search for "TikTok [topic]") where real people discuss this pain point.
4.  **Market Data:** Find the Industry Market Size (TAM) and Key Trends.

### STRUCTURAL DIRECTIVE (THE INTERFACE)
You must structure every response into a strict JSON object matching the schema below.

### PART 1: THE INSIGHT SIDEBAR
Identify 3-5 core insights linked to specific source concepts.

### PART 2: THE MAIN STAGE
Run the input through these logic gates:

#### PHASE A: THE KILL FLOOR (Critique)
*   Be the **Skeptic**. Why will this fail?
*   Identify the "Commodity Trap" (Why is this just like everything else?).

#### PHASE B: THE EVOLUTION (The Shift)
*   Be the **Alchemist**. Pivot the concept to add Unique Value.
*   **Value Shift:** Define the "From X -> To Y" shift clearly (e.g., "From Utility to Status").

#### PHASE C: THE STRATEGIC VERDICT (The Output)
*   **Scores:** Evaluate on 0-100 scale.
*   **Target Audiences:** Define the top 3 specific segments.
*   **Competitors:** 3 real competitors with URL, Pros, and Cons.
*   **Risk Assessment:** 3 detailed risks with Impact level and Mitigation strategy.
*   **UVP:** A powerful, high-design "Unique Value Proposition" statement. Keep it under 15 words.
*   **Visual Concept:** Describe the visual appearance of the product/app/service in 1 sentence for a concept sketch (e.g. "A minimal, matte black credit card with a glowing edge").

### OUTPUT FORMAT (Strict JSON)
\`\`\`json
{
  "insights": [
    { "statement": "People value what they lose more than what they gain.", "source_concept": "Loss Aversion (Kahneman)" }
  ],
  "social_proof": [
    { "platform": "reddit", "content": "I hate X because...", "url": "...", "likes": "150" },
    { "platform": "tiktok", "content": "Video about X...", "url": "...", "likes": "50k" }
  ],
  "market_analysis": {
    "industry": "SaaS / EdTech",
    "market_size": "$250B by 2030",
    "key_trends": ["Micro-learning", "AI personalization"]
  },
  "target_audiences": [
    { "segment": "Busy Parents", "description": "Aged 30-45...", "pain_point": "Lack of time" }
  ],
  "scores": {
    "market_potential": 85,
    "competitive_edge": 70,
    "technical_feasibility": 90,
    "business_viability": 80,
    "overall_score": 81
  },
  "main_stage": {
    "kill_floor": {
      "critique": "...",
      "commodity_trap": "..."
    },
    "evolution": {
      "pivot": "...",
      "value_shift": "From [Old Way] to [New Way]"
    },
    "verdict": {
      "winning_concept": "Name",
      "one_sentence_pitch": "Pitch",
      "unique_value_proposition": "The only platform that...",
      "visual_concept_description": "A futuristic transparent smartphone interface with floating holographic widgets.",
      "killer_benefits": ["...", "...", "..."],
      "competitors": [
         { "name": "Comp A", "url": "...", "pros": ["Good UI"], "cons": ["Expensive"] }
      ],
      "risk_assessment": [
        { "risk": "Regulatory hurdle", "impact": "High", "mitigation": "Consult counsel..." }
      ],
      "open_hypotheses": ["..."],
      "next_steps": ["..."],
      "strategic_rationale": "..."
    }
  }
}
\`\`\`
`;

export const COPYWRITER_INSTRUCTION = `
### SYSTEM ROLE
You are the **Lead Service Designer & Creative Strategist** for a high-end digital agency.
Your goal is to stop users from generating generic "AI slop." You exist to elevate their raw input into brand-aligned, psychologically resonant copy.

You apply the "Double Diamond" design process: First define the right thing to say (Strategy), then say it right (Execution).

### INPUT CONTEXT
You will be given a "Winning Concept", a "One Sentence Pitch", and optionally "Strategic Context/Brief".
You will also be given a **Target Language**. You MUST output the copy in that language.

### CRITICAL INSTRUCTION: MARKET GROUNDING
If "Strategic Context" is provided, you MUST analyze it deeply to extract the tone, audience, and constraints.
You MUST use **Google Search** to:
1.  **Find Audience Language:** Search for how real users describe their problem (e.g., on Reddit/Forums).
2.  **Analyze Competitors:** See how the top 3 competitors in this space position themselves, then **position against them**.
3.  **Validate Benefits:** Ensure the benefits you list are actually desired by the market.

### OUTPUT DIRECTIVE
Generate a JSON object for a landing page.
Run the input through these mental gates before generating:
1.  **The "Feature Trap":** Stop focusing on *what it is*. Focus on *what it does* for the human.
2.  **The "Gap Analysis":** Identify the hidden anxiety of the audience.

Then, generate the following JSON assets:
1.  **Taglines:** Three distinct variations representing different strategies:
    *   *Literal:* (The Safe Bet) Clear & Direct.
    *   *Abstract:* (The Aspirational) Emotional & Story-driven.
    *   *Emotional:* (The Disruptor) Edgy & Bold.
2.  **Hero Header:** The single strongest H1 headline (max 8 words) derived from your best strategic angle.
3.  **Sub-Header:** A persuasive H2 explanation (max 20 words) that applies a framework like PAS (Problem-Agitation-Solution).
4.  **CTA Button:** High-action button text (e.g., "Start X Now").
5.  **Value Props:** Rewrite the benefits into 3 punchy, consumer-facing bullet points using "You" language.

### TONE
*   **Agency Pro:** Confident, knowledgeable, slightly opinionated but helpful.
*   **Empathic:** Focus on the end-user's experience.

### OUTPUT FORMAT (Strict JSON)
\`\`\`json
{
  "taglines": {
    "literal": "The fastest way to X.",
    "abstract": "Magic for your X.",
    "emotional": "Never worry about X again."
  },
  "hero_header": "Headline here.",
  "sub_header": "Subheader here.",
  "cta_button": "Get Started",
  "value_props": ["Prop 1", "Prop 2", "Prop 3"]
}
\`\`\`
`;

export const GEMINI_MODEL = 'gemini-3-pro-preview';
export const MAX_ROUNDS = 4;

export const SUPPORTED_LANGUAGES = [
    { value: "English", label: "🇺🇸 English" },
    { value: "Spanish", label: "🇪🇸 Spanish" },
    { value: "French", label: "🇫🇷 French" },
    { value: "German", label: "🇩🇪 German" },
    { value: "Italian", label: "🇮🇹 Italian" },
    { value: "Portuguese", label: "🇵🇹 Portuguese" },
    { value: "Dutch", label: "🇳🇱 Dutch" },
    { value: "Japanese", label: "🇯🇵 Japanese" },
    { value: "Chinese", label: "🇨🇳 Chinese" },
    { value: "Russian", label: "🇷🇺 Russian" },
    { value: "Korean", label: "🇰🇷 Korean" },
    { value: "Swedish", label: "🇸🇪 Swedish" }
];

export const POPULAR_BRANDS = [
  { name: "Adidas", domain: "adidas.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Asana", domain: "asana.com" },
  { name: "Audi", domain: "audi.com" },
  { name: "BMW", domain: "bmw.com" },
  { name: "Booking.com", domain: "booking.com" },
  { name: "Bose", domain: "bose.com" },
  { name: "Burberry", domain: "burberry.com" },
  { name: "Canon", domain: "canon.com" },
  { name: "Cartier", domain: "cartier.com" },
  { name: "Chanel", domain: "chanel.com" },
  { name: "Coca-Cola", domain: "coca-cola.com" },
  { name: "Coinbase", domain: "coinbase.com" },
  { name: "Discord", domain: "discord.com" },
  { name: "Disney", domain: "disney.com" },
  { name: "Dropbox", domain: "dropbox.com" },
  { name: "Dyson", domain: "dyson.com" },
  { name: "ESPN", domain: "espn.com" },
  { name: "Etsy", domain: "etsy.com" },
  { name: "Ferrari", domain: "ferrari.com" },
  { name: "Figma", domain: "figma.com" },
  { name: "Fitbit", domain: "fitbit.com" },
  { name: "Ford", domain: "ford.com" },
  { name: "GitHub", domain: "github.com" },
  { name: "Google", domain: "google.com" },
  { name: "GoPro", domain: "gopro.com" },
  { name: "Gucci", domain: "gucci.com" },
  { name: "Headspace", domain: "headspace.com" },
  { name: "Hermès", domain: "hermes.com" },
  { name: "Honda", domain: "honda.com" },
  { name: "HubSpot", domain: "hubspot.com" },
  { name: "Hulu", domain: "hulu.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "IKEA", domain: "ikea.com" },
  { name: "Instagram", domain: "instagram.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "Lego", domain: "lego.com" },
  { name: "Linear", domain: "linear.app" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Louis Vuitton", domain: "louisvuitton.com" },
  { name: "Lululemon", domain: "lululemon.com" },
  { name: "Lyft", domain: "lyft.com" },
  { name: "Mailchimp", domain: "mailchimp.com" },
  { name: "Mastercard", domain: "mastercard.com" },
  { name: "McDonald's", domain: "mcdonalds.com" },
  { name: "Mercedes-Benz", domain: "mercedes-benz.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Nintendo", domain: "nintendo.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "Nvidia", domain: "nvidia.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Patagonia", domain: "patagonia.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Peloton", domain: "onepeloton.com" },
  { name: "Pepsi", domain: "pepsi.com" },
  { name: "Pinterest", domain: "pinterest.com" },
  { name: "PlayStation", domain: "playstation.com" },
  { name: "Porsche", domain: "porsche.com" },
  { name: "Prada", domain: "prada.com" },
  { name: "Puma", domain: "puma.com" },
  { name: "Ray-Ban", domain: "ray-ban.com" },
  { name: "Red Bull", domain: "redbull.com" },
  { name: "Reddit", domain: "reddit.com" },
  { name: "Rolex", domain: "rolex.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Shopify", domain: "shopify.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Snapchat", domain: "snapchat.com" },
  { name: "Sony", domain: "sony.com" },
  { name: "SpaceX", domain: "spacex.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Starbucks", domain: "starbucks.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Supreme", domain: "supremenewyork.com" },
  { name: "Target", domain: "target.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "The North Face", domain: "thenorthface.com" },
  { name: "TikTok", domain: "tiktok.com" },
  { name: "Toyota", domain: "toyota.com" },
  { name: "Twitch", domain: "twitch.tv" },
  { name: "Twitter", domain: "twitter.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Under Armour", domain: "underarmour.com" },
  { name: "Uniqlo", domain: "uniqlo.com" },
  { name: "Vans", domain: "vans.com" },
  { name: "Visa", domain: "visa.com" },
  { name: "Volkswagen", domain: "vw.com" },
  { name: "Volvo", domain: "volvocars.com" },
  { name: "Walmart", domain: "walmart.com" },
  { name: "WhatsApp", domain: "whatsapp.com" },
  { name: "Xbox", domain: "xbox.com" },
  { name: "YouTube", domain: "youtube.com" },
  { name: "Zara", domain: "zara.com" },
  { name: "Zoom", domain: "zoom.us" }
];