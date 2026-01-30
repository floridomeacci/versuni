import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_ROLE_INSTRUCTION, COPYWRITER_INSTRUCTION, GEMINI_MODEL } from "../constants";
import { StrategicDossier, WebSource, CopyStrategy } from "../types";
import { saveDossierToHistory } from "./storageService";

let chatSession: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing from environment variables.");
      throw new Error("API Key missing");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const initializeSimulation = (): void => {
  const ai = getAI();
  chatSession = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_ROLE_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 0.7,
      // Enable Google Search for deep research
      tools: [{ googleSearch: {} }],
    },
  });
};

export const generateDossier = async (concept: string): Promise<StrategicDossier> => {
  if (!chatSession) {
    initializeSimulation();
  }

  if (!chatSession) {
      throw new Error("Failed to initialize chat session");
  }

  try {
    const prompt = `Perform deep strategic research on this concept: "${concept}".
    
    RESEARCH TASKS:
    1. **Competitors:** Find 3 real competitors. Analyze their Pros & Cons.
    2. **Social Proof:** Search specifically for "Reddit" threads AND "TikTok videos" (return video links) where people discuss this problem.
    3. **Market:** Find the specific Industry Market Size (TAM) and Key Trends.
    4. **Scoring:** Evaluate Market Potential, Competitive Edge, Technical Feasibility, and Business Viability (0-100).
    5. **Visual:** Describe the concept visually for a sketch.
    
    OUTPUT: Generate the complete Strategic Dossier JSON.`;
    
    const response: GenerateContentResponse = await chatSession.sendMessage({ message: prompt });
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    
    const dossier = JSON.parse(cleanJson) as StrategicDossier;

    // Extract grounding metadata (Web Sources)
    const webSources: WebSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          webSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    // Attach metadata
    dossier.web_sources = webSources;
    dossier.id = crypto.randomUUID();
    dossier.timestamp = Date.now();
    dossier.concept_input = concept;

    // Save to local storage automatically
    saveDossierToHistory(dossier);

    return dossier;
  } catch (error) {
    console.error("Error generating dossier:", error);
    throw error;
  }
};

export const generateConceptImage = async (dossier: StrategicDossier): Promise<StrategicDossier> => {
    const ai = getAI();
    const visualDescription = dossier.main_stage.verdict.visual_concept_description || dossier.concept_input;
    
    // Use gemini-2.5-flash-image for general sketch generation
    const model = 'gemini-2.5-flash-image';
    
    const prompt = `
        Create a high-quality industrial design sketch of the following concept:
        "${visualDescription}"
        
        Style: Minimalist, clean, architectural product sketch, white background, detailed line work with subtle shading.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
                }
            }
        });

        let base64Image = "";
        
        // Extract image from response
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Image) {
            throw new Error("No image data returned from model");
        }

        const updatedDossier = {
            ...dossier,
            main_stage: {
                ...dossier.main_stage,
                verdict: {
                    ...dossier.main_stage.verdict,
                    generated_image: base64Image
                }
            }
        };

        saveDossierToHistory(updatedDossier);
        return updatedDossier;

    } catch (error) {
        console.error("Error generating concept image:", error);
        throw error;
    }
}

export const generateCopyStrategy = async (dossier: StrategicDossier, language: string = 'English'): Promise<StrategicDossier> => {
    const ai = getAI();
    
    // Create a specialized one-off chat for the Copywriter
    const copyChat = ai.chats.create({
        model: GEMINI_MODEL,
        config: {
            systemInstruction: COPYWRITER_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.9, // Higher temp for creative director flair
        }
    });

    const verdict = dossier.main_stage.verdict;
    const prompt = `
        Winning Concept: ${verdict.winning_concept}
        One Sentence Pitch: ${verdict.one_sentence_pitch}
        Killer Benefits: ${JSON.stringify(verdict.killer_benefits)}
        
        CRITICAL: Generate the copy in this language: ${language}
        
        Generate the Copy Strategy JSON.
    `;

    try {
        const response: GenerateContentResponse = await copyChat.sendMessage({ message: prompt });
        const text = response.text || "{}";
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
        const copyStrategy = JSON.parse(cleanJson) as CopyStrategy;
        
        // Update dossier
        const updatedDossier = { ...dossier, copy_strategy: copyStrategy };
        
        // Update history
        saveDossierToHistory(updatedDossier);
        
        return updatedDossier;
    } catch (error) {
        console.error("Error generating copy strategy:", error);
        throw error;
    }
}

export const generateStandaloneCopyStrategy = async (
    name: string,
    pitch: string,
    benefits: string[],
    language: string,
    context: string = ""
): Promise<StrategicDossier> => {
    
    const ai = getAI();
    const copyChat = ai.chats.create({
        model: GEMINI_MODEL,
        config: {
            systemInstruction: COPYWRITER_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.9,
            // Enable Search for market context if needed
            tools: [{ googleSearch: {} }],
        }
    });

    // If no benefits provided, explicitly ask the model to generate them
    const benefitsSection = benefits.length > 0 
        ? `Killer Benefits: ${JSON.stringify(benefits)}`
        : `Killer Benefits: [IMPORTANT: You must GENERATE 3 killer benefits based on the pitch and research]`;

    // If no name provided, ask to generate or use placeholder
    const conceptName = name.trim() ? name : "(Generate a specialized brand name for this concept)";

    const prompt = `
        Winning Concept: ${conceptName}
        One Sentence Pitch: ${pitch}
        ${benefitsSection}
        
        ADDITIONAL STRATEGIC CONTEXT / BRIEF:
        "${context}"

        TASK:
        1. Analyze the Context and Pitch.
        2. Use Google Search to find current market angles, competitor hooks, and "hidden anxieties" of the audience related to this sector.
        3. Define 3 Killer Benefits based on this research if not provided.
        4. Generate the Copy Strategy JSON in ${language}.
    `;

     try {
        const response: GenerateContentResponse = await copyChat.sendMessage({ message: prompt });
        const text = response.text || "{}";
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
        const copyStrategy = JSON.parse(cleanJson) as CopyStrategy;
        
        // Extract grounding metadata to show sources in the UI
        const webSources: WebSource[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri && chunk.web?.title) {
                    webSources.push({
                        title: chunk.web.title,
                        uri: chunk.web.uri,
                    });
                }
            });
        }

        // Create a Mock Dossier Wrapper
        const mockDossier: StrategicDossier = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            concept_input: name || pitch.substring(0, 30) + "...", 
            insights: [], // Could theoretically populate this from research, but keeping it simple for now
            web_sources: webSources, // Attach sources found during copy research
            copy_strategy: copyStrategy,
            // Mocking scores for standalone
             scores: {
                market_potential: 0,
                competitive_edge: 0,
                technical_feasibility: 0,
                business_viability: 0,
                overall_score: 0
            },
            market_analysis: { industry: "N/A", market_size: "N/A", key_trends: [] },
            target_audiences: [],
            main_stage: {
                kill_floor: { critique: "", commodity_trap: "" },
                evolution: { pivot: "", value_shift: "" },
                verdict: {
                    winning_concept: name || "Untitled Concept",
                    one_sentence_pitch: pitch,
                    unique_value_proposition: pitch,
                    strategic_rationale: "Standalone Copy Generation (Research Assisted)",
                    killer_benefits: benefits.length > 0 ? benefits : ["Generated via Research", "Generated via Research", "Generated via Research"], 
                    competitors: [],
                    risk_assessment: [],
                    open_hypotheses: [],
                    next_steps: []
                }
            }
        };
        
        // Save to history so it appears in dashboard
        saveDossierToHistory(mockDossier);
        
        return mockDossier;
    } catch (error) {
        console.error("Error generating standalone copy strategy:", error);
        throw error;
    }
}