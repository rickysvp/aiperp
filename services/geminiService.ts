import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI service only if API key is provided
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here') {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('No Gemini API key provided, using fallback responses');
}

export interface AgentPersona {
  name: string;
  bio: string;
  strategy: string;
  visualTrait: string;
}

export const generateAgentPersona = async (direction: string, nameHint?: string): Promise<AgentPersona> => {
  // Use fallback if no AI service initialized
  if (!ai) {
    console.warn('Using fallback for agent persona generation');
    return {
      name: nameHint || `Unit-${Math.floor(Math.random() * 9999)}`,
      bio: "An autonomous trading unit.",
      strategy: "Momentum Scalping",
      visualTrait: "Steel"
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are creating a persona for a user-named AI Trading Agent.
      The User's chosen name is: "${nameHint || 'Unknown'}". 
      
      Tasks:
      1. Generate a short, punchy bio (1 sentence) for an agent named "${nameHint}".
      2. Generate a technical-sounding trading strategy name (e.g. "Mean Reversion v4", "Aggressive Momentum", "Delta Neutral"). This should be random and not necessarily related to the name.
      3. Generate a visual trait (1 word, e.g. Neon, Rust, Cyber, Gold).

      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Echo the user name back, or clean it if it contains profanity (replacing with "Redacted")
            name: { type: Type.STRING }, 
            bio: { type: Type.STRING },
            strategy: { type: Type.STRING },
            visualTrait: { type: Type.STRING },
          },
          required: ["name", "bio", "strategy", "visualTrait"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AgentPersona;
  } catch (error) {
    console.error("Failed to generate agent:", error);
    // Fallback
    return {
      name: nameHint || `Unit-${Math.floor(Math.random() * 9999)}`,
      bio: "An autonomous trading unit.",
      strategy: "Momentum Scalping",
      visualTrait: "Steel"
    };
  }
};

export const refineAgentStrategy = async (currentStrategy: string, userMessage: string, agentName: string): Promise<{ reply: string, newStrategy: string }> => {
  // Use fallback if no AI service initialized
  if (!ai) {
    console.warn('Using fallback for strategy refinement');
    return {
      reply: "Connection unstable. Keeping current protocols.",
      newStrategy: currentStrategy
    };
  }

  try {
     const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are ${agentName}, an autonomous AI trading agent in a cyberpunk future.
        Your current trading strategy protocol is: "${currentStrategy}".
        Your Commander (the user) has sent you a directive: "${userMessage}".
        
        1. Reply to the Commander in character (brief, loyal, robotic but sentient).
        2. Based on the directive, synthesize a NEW strategy protocol name (max 3-4 words, technical).

        Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    reply: { type: Type.STRING },
                    newStrategy: { type: Type.STRING }
                },
                required: ["reply", "newStrategy"]
            }
        }
     });

     const text = response.text;
     if (!text) throw new Error("No response");
     return JSON.parse(text);

  } catch (error) {
      console.error("Failed to refine strategy", error);
      return {
          reply: "Connection unstable. Keeping current protocols.",
          newStrategy: currentStrategy
      };
  }
}