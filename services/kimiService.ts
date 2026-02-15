import { AgentPersona } from '../types';

// Local simulated conversation responses
const SIMULATED_RESPONSES = {
  greetings: [
    "Greetings! I'm your AI trading strategist. What kind of market approach are you looking for?",
    "Hello! Ready to craft a winning strategy together? Tell me your trading style.",
    "Welcome! Let's design an agent that matches your market vision. What's your preference?",
    "Hi there! I'm here to help you create the perfect trading strategy. What direction do you favor?"
  ],
  
  longResponses: [
    "Bullish outlook! I'll focus on momentum strategies and breakout detection for upward trends.",
    "Going long! My strategy will emphasize trend following and support level buying.",
    "Optimistic approach! I'll hunt for accumulation zones and ride the upward momentum.",
    "Long bias confirmed! Expect strategies around moving average crossovers and volume spikes."
  ],
  
  shortResponses: [
    "Bearish stance! I'll focus on resistance rejection and downward momentum capture.",
    "Short strategy activated! Looking for distribution zones and breakdown patterns.",
    "Defensive positioning! My approach will target overbought conditions and trend reversals.",
    "Short bias set! Expect strategies around resistance testing and bearish engulfing patterns."
  ],
  
  autoResponses: [
    "Adaptive mode! I'll switch between long and short based on market conditions and volatility.",
    "Flexible strategy! My algorithm will detect trend direction and adjust accordingly.",
    "Neutral stance with agility! I'll capture opportunities in both directions.",
    "Market-neutral approach! Expect dynamic position switching based on technical indicators."
  ],
  
  riskResponses: {
    low: "Conservative risk profile. Tight stop-losses and smaller position sizes for steady growth.",
    medium: "Balanced approach. Moderate leverage with reasonable risk-reward ratios.",
    high: "Aggressive strategy. Higher leverage for maximum returns, accept larger drawdowns.",
    extreme: "Degen mode! Maximum leverage, tight stops, all or nothing mentality!"
  },
  
  strategyTemplates: [
    "I'll use {indicator} to identify entries and exit on {exitCondition}.",
    "My approach combines {indicator} with volume analysis for confirmation.",
    "Strategy: Wait for {indicator} signal, enter with {riskLevel} position sizing.",
    "Core tactic: {indicator} crossovers with {exitCondition} as exit trigger."
  ],
  
  indicators: [
    "RSI divergence", "MACD crossovers", "Bollinger Band squeezes", 
    "EMA ribbon alignment", "Volume profile analysis", "Support/Resistance breaks",
    "Fibonacci retracements", "Ichimoku cloud signals"
  ],
  
  exitConditions: [
    "opposite signal", "profit target hit", "trailing stop triggered",
    "time-based exit", "volatility spike", "trend reversal pattern"
  ]
};

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStrategyDescription(direction: 'AUTO' | 'LONG' | 'SHORT', riskLevel: string): string {
  const template = getRandomItem(SIMULATED_RESPONSES.strategyTemplates);
  const indicator = getRandomItem(SIMULATED_RESPONSES.indicators);
  const exitCondition = getRandomItem(SIMULATED_RESPONSES.exitConditions);
  
  return template
    .replace('{indicator}', indicator)
    .replace('{exitCondition}', exitCondition)
    .replace('{riskLevel}', riskLevel);
}

// Generate a complete persona with simulated conversation
function generateSimulatedPersona(nameHint: string, strategy: 'AUTO' | 'LONG' | 'SHORT'): AgentPersona {
  const greeting = getRandomItem(SIMULATED_RESPONSES.greetings);
  
  let directionResponse: string;
  let directionBio: string;
  
  switch (strategy) {
    case 'LONG':
      directionResponse = getRandomItem(SIMULATED_RESPONSES.longResponses);
      directionBio = "A bullish strategist who thrives in upward markets.";
      break;
    case 'SHORT':
      directionResponse = getRandomItem(SIMULATED_RESPONSES.shortResponses);
      directionBio = "A bearish tactician who profits from downward moves.";
      break;
    case 'AUTO':
    default:
      directionResponse = getRandomItem(SIMULATED_RESPONSES.autoResponses);
      directionBio = "An adaptive trader who follows market momentum.";
      break;
  }
  
  const riskLevel = getRandomItem(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const);
  const riskResponse = SIMULATED_RESPONSES.riskResponses[riskLevel.toLowerCase() as keyof typeof SIMULATED_RESPONSES.riskResponses];
  
  const strategyDesc = generateStrategyDescription(strategy, riskLevel);
  
  // Simulate conversation log
  console.log('[Agent Conversation]');
  console.log(`Agent: ${greeting}`);
  console.log(`User: I want to go ${strategy}`);
  console.log(`Agent: ${directionResponse}`);
  console.log(`User: What's my risk level?`);
  console.log(`Agent: ${riskResponse}`);
  console.log(`User: Explain your strategy`);
  console.log(`Agent: ${strategyDesc}`);
  
  return {
    name: nameHint,
    bio: directionBio,
    strategy: `${directionResponse} ${strategyDesc} ${riskResponse}`,
    riskLevel: riskLevel as any,
    specialties: [strategy, 'Technical Analysis', riskLevel === 'EXTREME' ? 'Degen Trading' : 'Risk Management'],
    catchphrase: getRandomItem([
      "Markets reward the prepared mind.",
      "Patience and precision win the game.",
      "Ride the trend, cut the losses.",
      "Fortune favors the bold.",
      "Analyze, execute, profit."
    ])
  };
}

export async function generateAgentPersona(
  strategy: 'AUTO' | 'LONG' | 'SHORT',
  nameHint?: string
): Promise<AgentPersona> {
  const userName = nameHint || 'Anonymous';
  
  // Always use simulated conversation (no API call)
  console.log(`[Simulated] Generating persona for ${userName} with strategy: ${strategy}`);
  return generateSimulatedPersona(userName, strategy);
}

export async function refineAgentStrategy(
  currentStrategy: string,
  userInput: string
): Promise<string> {
  // Simulate strategy refinement conversation
  const refinements = [
    `Based on your input "${userInput}", I'll adjust the approach. ${currentStrategy}`,
    `Noted! Incorporating "${userInput}" into the strategy. ${currentStrategy}`,
    `Strategy updated with your feedback: "${userInput}". ${currentStrategy}`,
    `Understood. Refining tactics based on "${userInput}". ${currentStrategy}`
  ];
  
  const response = getRandomItem(refinements);
  
  console.log('[Strategy Refinement]');
  console.log(`User: ${userInput}`);
  console.log(`Agent: ${response}`);
  
  return response;
}
