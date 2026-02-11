import OpenAI from 'openai';

// Initialize Kimi AI service (Moonshot AI)
// Kimi API is compatible with OpenAI SDK
let openai: OpenAI | null = null;

const KIMI_API_KEY = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;

if (KIMI_API_KEY && KIMI_API_KEY !== 'your_api_key_here') {
  openai = new OpenAI({
    apiKey: KIMI_API_KEY,
    baseURL: 'https://api.moonshot.cn/v1',
    dangerouslyAllowBrowser: true
  });
} else {
  console.warn('No Kimi API key provided, using fallback responses');
}

export interface AgentPersona {
  name: string;
  bio: string;
  strategy: string;
  visualTrait: string;
}

export const generateAgentPersona = async (direction: string, nameHint?: string): Promise<AgentPersona> => {
  // Use fallback if no AI service initialized
  if (!openai) {
    console.warn('Using fallback for agent persona generation');
    return {
      name: nameHint || `Unit-${Math.floor(Math.random() * 9999)}`,
      bio: "An autonomous trading unit.",
      strategy: "Momentum Scalping",
      visualTrait: "Steel"
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "kimi-k2-5",
      messages: [
        {
          role: "system",
          content: "You are a persona generator for AI trading agents. Always respond with valid JSON."
        },
        {
          role: "user",
          content: `You are creating a persona for a user-named AI Trading Agent.
The User's chosen name is: "${nameHint || 'Unknown'}".

Tasks:
1. Generate a short, punchy bio (1 sentence) for an agent named "${nameHint}".
2. Generate a technical-sounding trading strategy name (e.g. "Mean Reversion v4", "Aggressive Momentum", "Delta Neutral"). This should be random and not necessarily related to the name.
3. Generate a visual trait (1 word, e.g. Neon, Rust, Cyber, Gold).

Return ONLY a JSON object in this exact format:
{
  "name": "string",
  "bio": "string",
  "strategy": "string",
  "visualTrait": "string"
}`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("No response from AI");

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]) as AgentPersona;
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
  if (!openai) {
    console.warn('Using fallback for strategy refinement');
    return {
      reply: "Connection unstable. Keeping current protocols.",
      newStrategy: currentStrategy
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "kimi-k2-5",
      messages: [
        {
          role: "system",
          content: "You are an AI trading agent in a cyberpunk future. Respond in character."
        },
        {
          role: "user",
          content: `You are ${agentName}, an autonomous AI trading agent in a cyberpunk future.
Your current trading strategy protocol is: "${currentStrategy}".
Your Commander (the user) has sent you a directive: "${userMessage}".

1. Reply to the Commander in character (brief, loyal, robotic but sentient).
2. Based on the directive, synthesize a NEW strategy protocol name (max 3-4 words, technical).

Return ONLY a JSON object in this exact format:
{
  "reply": "string",
  "newStrategy": "string"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("No response");

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("Failed to refine strategy", error);
    return {
      reply: "Connection unstable. Keeping current protocols.",
      newStrategy: currentStrategy
    };
  }
}
