// Kimi AI Service (Moonshot AI)
// Uses fetch API directly for browser compatibility

const KIMI_API_KEY = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

export interface AgentPersona {
  name: string;
  bio: string;
  strategy: string;
  visualTrait: string;
}

const callKimiAPI = async (messages: any[], temperature: number = 0.8, max_tokens: number = 500): Promise<string | null> => {
  if (!KIMI_API_KEY || KIMI_API_KEY === 'your_api_key_here') {
    console.warn('No Kimi API key provided');
    return null;
  }

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-k2-5',
        messages,
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Kimi API call failed:', error);
    return null;
  }
};

export const generateAgentPersona = async (direction: string, nameHint?: string): Promise<AgentPersona> => {
  const messages = [
    {
      role: 'system',
      content: 'You are a persona generator for AI trading agents. Always respond with valid JSON.'
    },
    {
      role: 'user',
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
  ];

  const text = await callKimiAPI(messages, 0.8, 500);

  if (!text) {
    console.warn('Using fallback for agent persona generation');
    return {
      name: nameHint || `Unit-${Math.floor(Math.random() * 9999)}`,
      bio: "An autonomous trading unit.",
      strategy: "Momentum Scalping",
      visualTrait: "Steel"
    };
  }

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]) as AgentPersona;
  } catch (error) {
    console.error("Failed to parse agent persona:", error);
    return {
      name: nameHint || `Unit-${Math.floor(Math.random() * 9999)}`,
      bio: "An autonomous trading unit.",
      strategy: "Momentum Scalping",
      visualTrait: "Steel"
    };
  }
};

export const refineAgentStrategy = async (currentStrategy: string, userMessage: string, agentName: string): Promise<{ reply: string, newStrategy: string }> => {
  const messages = [
    {
      role: 'system',
      content: 'You are an AI trading agent in a cyberpunk future. Respond in character.'
    },
    {
      role: 'user',
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
  ];

  const text = await callKimiAPI(messages, 0.7, 300);

  if (!text) {
    console.warn('Using fallback for strategy refinement');
    return {
      reply: "Connection unstable. Keeping current protocols.",
      newStrategy: currentStrategy
    };
  }

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse strategy refinement:", error);
    return {
      reply: "Connection unstable. Keeping current protocols.",
      newStrategy: currentStrategy
    };
  }
}
