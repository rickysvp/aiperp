import React, { useState, useEffect, useRef } from 'react';
import { Tab, Agent, MarketState, BattleLog, Direction, LootEvent, AssetSymbol } from './types';
import { INITIAL_BALANCE, MINT_COST, GAME_TICK_MS } from './constants';
import { generateAgentPersona } from './services/kimiService';
import { Arena } from './components/Arena';
import { Agents } from './components/Agents';
import { WalletV2 } from './components/WalletV2';
import { Leaderboard } from './components/Leaderboard';
import { Liquidity } from './components/Liquidity';
import { Onboarding } from './components/Onboarding';
import { LegalModal } from './components/LegalModal';
import { VersionInfo } from './components/VersionInfo';
import { WalletGenerationModal } from './components/WalletGenerationModal';
import { LayoutDashboard, Users, Wallet as WalletIcon, BrainCircuit, Trophy, Globe, Droplets } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Logo } from './components/Logo';
import { UserMenu } from './components/UserMenu';
import { useWallet } from './contexts/WalletContext';
import { useSupabaseAgents } from './hooks/useSupabaseAgents';
import { createAgent, deployAgent, withdrawAgent, liquidateAgent, updateAgentPnL, recordAgentPnLHistory } from './lib/api/agents';
import { isSupabaseConfigured } from './lib/supabase';

const AGENT_FABRICATION_COST = 100;

// Asset Configs - 1 MON = 0.02 MON standard
const ASSETS: Record<AssetSymbol, { startPrice: number, vol: number }> = {
  BTC: { startPrice: 65000, vol: 0.003 },
  ETH: { startPrice: 3500, vol: 0.004 },
  SOL: { startPrice: 150, vol: 0.006 },
  MON: { startPrice: 0.02, vol: 0.015 } // 1 MON = 0.02 MON standard
};

// --- Marquee Component ---
const Marquee = ({ agents }: { agents: Agent[] }) => {
  const { t } = useLanguage();
  const topAgents = agents
    .filter(a => a.pnl > 0 && a.status !== 'IDLE')
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 50); // Reduced to top 50 for performance

  if (topAgents.length === 0) return null;

  // Duplicate the list for seamless scrolling loop
  const displayList = [...topAgents, ...topAgents];

  return (
    <div className="bg-[#0f111a] border-b border-white/5 py-1.5 overflow-hidden flex relative z-40 h-8">
       {/* Static Label */}
       <div className="absolute left-0 top-0 bottom-0 z-50 bg-[#0f111a] px-4 flex items-center border-r border-white/10 shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
           <div className="flex items-center gap-2 text-[#00FF9D] text-[10px] font-black tracking-widest uppercase font-display">
               <Trophy size={12} /> {t('top_profit')}
           </div>
       </div>

       {/* Scrolling Content */}
       <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-4 pl-32">
          {displayList.map((agent, idx) => (
             <div key={`${agent.id}-${idx}`} className="flex items-center gap-2 text-xs font-mono opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-slate-600 font-bold">#{idx < 50 ? idx + 1 : idx - 49}</span>
                <span className="font-bold text-white">{agent.name}</span>
                <span className={`font-bold ${agent.pnl > 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                   +${agent.pnl.toFixed(0)}
                </span>
             </div>
          ))}
       </div>
    </div>
  )
}

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { wallet, isConnected, isConnecting, connect, disconnect, updateBalance, updatePnl, updateMonBalance, userId } = useWallet();
  
  // --- State ---
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [highlightMint, setHighlightMint] = useState(false); // For tutorial guidance
  const [showWalletGeneration, setShowWalletGeneration] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(Tab.ARENA);
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('MON');

  const [market, setMarket] = useState<MarketState>({
    symbol: 'MON',
    price: ASSETS.MON.startPrice, 
    history: Array.from({ length: 30 }, (_, i) => ({ time: i.toString(), price: ASSETS.MON.startPrice })),
    trend: 'FLAT',
    lastChangePct: 0,
    longEarningsPerSecond: 0,
    shortEarningsPerSecond: 0,
    totalLongStaked: 0,
    totalShortStaked: 0
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [lastLootEvent, setLastLootEvent] = useState<LootEvent | null>(null);

  // Load agents from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const loadAgentsFromDb = async () => {
      console.log('[App] Loading agents from Supabase...');
      const { getAllAgents } = await import('./lib/api/agents');
      const dbAgents = await getAllAgents();
      
      if (dbAgents && dbAgents.length > 0) {
        console.log('[App] Loaded', dbAgents.length, 'agents from Supabase');
        // Transform database format to app format
        const transformedAgents: Agent[] = dbAgents.map(dbAgent => ({
          id: dbAgent.id,
          owner: (dbAgent.owner_id ? 'USER' : 'SYSTEM') as import('./types').AgentOwner,
          minter: dbAgent.minter,
          minterTwitter: dbAgent.minter_twitter || undefined,
          name: dbAgent.name,
          nftId: dbAgent.nft_id || undefined,
          bio: dbAgent.bio || '',
          avatarSeed: dbAgent.avatar_seed,
          direction: (dbAgent.direction || 'LONG') as import('./types').Direction,
          leverage: dbAgent.leverage,
          balance: dbAgent.balance,
          pnl: dbAgent.pnl,
          wins: dbAgent.wins,
          losses: dbAgent.losses,
          status: dbAgent.status,
          strategy: dbAgent.strategy || '',
          riskLevel: (dbAgent.risk_level || 'MEDIUM') as Agent['riskLevel'],
          asset: (dbAgent.asset || 'MON') as import('./types').AssetSymbol,
          takeProfit: dbAgent.take_profit || undefined,
          stopLoss: dbAgent.stop_loss || undefined,
          entryPrice: dbAgent.entry_price || 0,
          twitterHandle: dbAgent.twitter_handle || undefined,
          effectiveDirection: dbAgent.effective_direction || undefined,
          pnlHistory: []
        }));
        setAgents(transformedAgents);
      } else {
        console.log('[App] No agents found in Supabase');
      }
    };
    
    loadAgentsFromDb();
  }, []);

  // Refs for loop
  const marketRef = useRef(market);
  marketRef.current = market;
  
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const assetRef = useRef(selectedAsset);
  
  // Handle Asset Switch
  const handleAssetChange = (asset: AssetSymbol) => {
      setSelectedAsset(asset);
      assetRef.current = asset;
      // Reset market data for new asset
      setMarket({
          symbol: asset,
          price: ASSETS[asset].startPrice,
          history: Array.from({ length: 30 }, (_, i) => ({ time: i.toString(), price: ASSETS[asset].startPrice })),
          trend: 'FLAT',
          lastChangePct: 0,
          longEarningsPerSecond: 0,
          shortEarningsPerSecond: 0,
          totalLongStaked: 0,
          totalShortStaked: 0
      });
  };

  // --- Game Loop (Market Simulation) ---
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentAsset = assetRef.current;
      const assetConfig = ASSETS[currentAsset];
      
      // Price random walk
      const change = (Math.random() - 0.5) * assetConfig.vol;
      // Use asset-specific minimum price (0.001 for low-priced assets like MON)
      const minPrice = currentAsset === 'MON' ? 0.001 : 1;
      const newPrice = Math.max(minPrice, marketRef.current.price * (1 + change));
      const trend: 'UP' | 'DOWN' | 'FLAT' = change > 0.001 ? 'UP' : change < -0.001 ? 'DOWN' : 'FLAT';
      
      // Calculate faction earnings per second based on price change
      // Get current active agents for this asset
      const currentAgents = agentsRef.current.filter(a => a.status === 'ACTIVE' && a.asset === currentAsset);
      const longAgents = currentAgents.filter(a => a.direction === 'LONG' || (a.direction === 'AUTO' && trend === 'UP'));
      const shortAgents = currentAgents.filter(a => a.direction === 'SHORT' || (a.direction === 'AUTO' && trend === 'DOWN'));
      
      const totalLongStaked = longAgents.reduce((sum, a) => sum + a.balance, 0);
      const totalShortStaked = shortAgents.reduce((sum, a) => sum + a.balance, 0);
      
      // Calculate earnings per second based on price movement
      // If price goes up, LONG earns, SHORT loses (and vice versa)
      // Earnings = staked amount * price change % * leverage (simplified for display)
      const longEarningsPerSecond = change > 0 ? totalLongStaked * change * 1.5 : totalLongStaked * change * 1.5;
      const shortEarningsPerSecond = change < 0 ? totalShortStaked * Math.abs(change) * 1.5 : -totalShortStaked * Math.abs(change) * 1.5;
      
      // Update Market with settlement data
      const newHistory = [...marketRef.current.history.slice(1), { time: new Date().toLocaleTimeString(), price: newPrice }];
      setMarket({
        symbol: currentAsset,
        price: newPrice,
        history: newHistory,
        trend,
        lastChangePct: change * 100,
        longEarningsPerSecond,
        shortEarningsPerSecond,
        totalLongStaked,
        totalShortStaked
      });

      // Sync Market Data to Supabase (every 30 ticks to avoid too many requests)
      if (Math.random() < 0.033 && isSupabaseConfigured()) {
        const { updateMarketData, recordPriceHistory } = await import('./lib/api/market');
        updateMarketData(currentAsset, {
          price: newPrice,
          trend,
          last_change_pct: change * 100,
          long_earnings_per_second: longEarningsPerSecond,
          short_earnings_per_second: shortEarningsPerSecond,
          total_long_staked: totalLongStaked,
          total_short_staked: totalShortStaked
        }).catch(err => console.error('[App] Failed to update market data:', err));
        
        recordPriceHistory(currentAsset, newPrice).catch(err => 
          console.error('[App] Failed to record price history:', err)
        );
      }

      // Update Agents PnL and record history
      setAgents(prev => prev.map(agent => {
        if (agent.status !== 'ACTIVE' || agent.asset !== currentAsset) return agent;
        
        const priceDiff = (newPrice - agent.entryPrice) / agent.entryPrice;
        // AUTO mode: randomly choose direction like a real trader (50/50 chance)
        // This makes AUTO mode have realistic win rates around 50%, not 100%
        let directionMultiplier: number;
        if (agent.direction === 'LONG') {
          directionMultiplier = 1;
        } else if (agent.direction === 'SHORT') {
          directionMultiplier = -1;
        } else {
          // AUTO: use a fixed random direction determined at entry, not based on price movement
          // We use agent.id to create a deterministic but random-like behavior
          directionMultiplier = (agent.id.charCodeAt(0) % 2 === 0) ? 1 : -1;
        }
        const rawPnl = agent.balance * priceDiff * directionMultiplier * agent.leverage;
        
        // Liquidation check
        if (agent.balance + rawPnl <= 0) {
          addLog(`${agent.name} liquidated on ${agent.asset}!`, 'LIQUIDATION');
          return { ...agent, status: 'LIQUIDATED', pnl: -agent.balance, balance: 0, pnlHistory: [...agent.pnlHistory, { time: new Date().toISOString(), value: -agent.balance }].slice(-30) };
        }
        
        // Record PnL history every 10 ticks (to avoid too much data)
        const shouldRecordHistory = Math.random() < 0.1;
        const newPnlHistory = shouldRecordHistory 
          ? [...agent.pnlHistory, { time: new Date().toISOString(), value: rawPnl }].slice(-30)
          : agent.pnlHistory;
        
        // Sync PnL to Supabase
        if (shouldRecordHistory && isSupabaseConfigured()) {
          recordAgentPnLHistory(agent.id, rawPnl).catch(err => 
            console.error('[App] Failed to record PnL history:', err)
          );
        }
        
        return { ...agent, pnl: rawPnl, pnlHistory: newPnlHistory };
      }));

    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // --- Helper: Add Log ---
  const addLog = async (msg: string, type: BattleLog['type'], amount?: number) => {
    const newLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      message: msg,
      type
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 100));
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured()) {
      try {
        const { addBattleLog } = await import('./lib/api/logs');
        await addBattleLog(userId, msg, type, amount);
      } catch (err) {
        console.error('[App] Failed to sync battle log:', err);
      }
    }
  };

  // --- Agent Management System (500-1000 Agents) ---
  const AGENT_POOL_SIZE = 800; // Total pool of agents
  const MAX_ACTIVE_AGENTS = 200; // Max active at any time for performance
  const AGENT_ROTATION_INTERVAL = 3000; // New agents enter every 3 seconds
  
  // Generate a random agent
  const generateAgent = (id: number, forceAsset?: AssetSymbol): Agent => {
    const botNames = [
      'AlphaBot', 'BetaMax', 'GammaRay', 'DeltaForce', 'EpsilonX', 'ZetaWave', 'EtaStorm', 'ThetaMind',
      'IotaPulse', 'KappaRush', 'LambdaCore', 'MuStream', 'NuSpark', 'XiStorm', 'OmicronX', 'PiLogic',
      'RhoFlow', 'SigmaPrime', 'TauBlade', 'UpsilonX', 'PhiMind', 'ChiWave', 'PsiCore', 'OmegaX',
      'NeonBot', 'CyberX', 'QuantumAI', 'NeuralNet', 'DeepTrade', 'MatrixBot', 'SynthMind', 'CryptoHawk',
      'BullRunner', 'BearHunter', 'TrendMaster', 'VolatilityKing', 'ScalpPro', 'SwingTrader', 'DayBot', 'PositionX',
      'MomentumX', 'ReversionAI', 'BreakoutPro', 'ArbitrageBot', 'GridMaster', 'DCAPro', 'MartingaleX', 'KellyBot',
      'SharpeX', 'SortinoPro', 'AlphaSeeker', 'BetaHedge', 'GammaScalper', 'DeltaNeutral', 'VegaTrader', 'ThetaDecay'
    ];
    const strategies = [
      'Momentum Hunter', 'Mean Reversion', 'Breakout Surfer', 'Scalping Ninja', 'Trend Follower', 
      'Volatility Trader', 'Grid Trading', 'Arbitrage Hunter', 'DCA Strategist', 'Martingale Pro',
      'Kelly Criterion', 'Sharpe Optimizer', 'Alpha Generator', 'Beta Hedger', 'Gamma Scalper'
    ];
    const directions: Direction[] = ['LONG', 'SHORT'];
    const assets: AssetSymbol[] = ['MON']; // Default to MON
    
    const asset = forceAsset || assets[Math.floor(Math.random() * assets.length)];
    const direction = directions[Math.floor(Math.random() * 2)];
    const leverage = Math.floor(Math.random() * 45) + 5;
    const balance = Math.floor(Math.random() * 8000) + 1000;
    const riskLevel = leverage > 30 ? 'EXTREME' : leverage > 20 ? 'HIGH' : leverage > 10 ? 'MEDIUM' : 'LOW';
    
    return {
      id: `bot-${id}-${Date.now()}`,
      name: `${botNames[Math.floor(Math.random() * botNames.length)]}-${Math.floor(Math.random() * 9999)}`,
      avatarSeed: Math.random().toString(),
      owner: 'SYSTEM',
      minter: 'Protocol',
      bio: `AI trading agent specializing in ${strategies[Math.floor(Math.random() * strategies.length)]}`,
      status: 'ACTIVE',
      direction,
      leverage,
      asset,
      balance,
      pnl: 0,
      pnlHistory: [],
      wins: 0,
      losses: 0,
      entryPrice: ASSETS[asset].startPrice * (0.95 + Math.random() * 0.1),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      riskLevel
    };
  };

  // Initialize agent pool with 120 LONG and 120 SHORT agents (240 total)
  useEffect(() => {
    const initAgents = () => {
      const initialAgents: Agent[] = [];
      
      // Create 120 LONG agents
      for (let i = 0; i < 120; i++) {
        const agent = generateAgent(i, 'MON');
        agent.direction = 'LONG';
        initialAgents.push(agent);
      }
      
      // Create 120 SHORT agents
      for (let i = 120; i < 240; i++) {
        const agent = generateAgent(i, 'MON');
        agent.direction = 'SHORT';
        initialAgents.push(agent);
      }
      
      setAgents(initialAgents);
      addLog(`Agent pool initialized: ${AGENT_POOL_SIZE} agents ready`, 'MINT');
      addLog(`120 LONG agents entered the MON arena`, 'MINT');
      addLog(`120 SHORT agents entered the MON arena`, 'MINT');
    };
    
    initAgents();
  }, []);

  // Continuous agent rotation system - only for AI agents (owner !== 'USER')
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setAgents(prev => {
        const now = Date.now();
        
        // Separate user agents (keep all) and AI agents (manage rotation)
        const userAgents = prev.filter(a => a.owner === 'USER');
        const aiAgents = prev.filter(a => a.owner !== 'USER');
        
        // Remove AI agents that have been active too long (liquidated or retired)
        const activeAiAgents = aiAgents.filter(a => {
          const age = now - parseInt(a.id.split('-')[2] || '0');
          // Remove if liquidated or been active for too long (30-120 seconds)
          const maxAge = 30000 + Math.random() * 90000;
          return a.status === 'ACTIVE' && age < maxAge;
        });
        
        // Check for liquidations based on current PnL (only for AI agents)
        const processedAiAgents = activeAiAgents.map(agent => {
          // Check liquidation (balance + PnL <= 0)
          if (agent.balance + agent.pnl <= 0) {
            addLog(`${agent.name} liquidated on ${agent.asset}!`, 'LIQUIDATION');
            return { ...agent, status: 'LIQUIDATED' as const, pnl: -agent.balance };
          }
          
          return agent;
        });
        
        // Filter out liquidated AI agents
        const stillActiveAi = processedAiAgents.filter(a => a.status === 'ACTIVE');
        
        // Count LONG and SHORT agents to maintain balance
        const longCount = stillActiveAi.filter(a => a.direction === 'LONG').length;
        const shortCount = stillActiveAi.filter(a => a.direction === 'SHORT').length;
        
        // Add new AI agents if below target
        const targetCount = 60 + Math.floor(Math.random() * 80); // 60-140 active agents
        const newAgents: Agent[] = [];
        
        if (stillActiveAi.length < targetCount && stillActiveAi.length < MAX_ACTIVE_AGENTS) {
          const toAdd = Math.min(3, targetCount - stillActiveAi.length); // Add up to 3 at a time
          for (let i = 0; i < toAdd; i++) {
            // Determine direction based on which side needs more agents
            // If balanced, random; otherwise favor the side with fewer agents
            let direction: Direction;
            if (longCount < shortCount) {
              direction = 'LONG';
            } else if (shortCount < longCount) {
              direction = 'SHORT';
            } else {
              direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
            }
            
            const newAgent = generateAgent(Math.floor(Math.random() * AGENT_POOL_SIZE), 'MON');
            newAgent.direction = direction;
            newAgents.push(newAgent);
          }
          
          if (toAdd > 0) {
            const names = newAgents.map(a => a.name.split('-')[0]).join(', ');
            addLog(`${toAdd} new agents entered: ${names}`, 'MINT');
          }
        }
        
        // Remove exited AI agents from state (keep only active + recently liquidated)
        const finalAiAgents = [...stillActiveAi, ...newAgents].filter(a => {
          const age = now - parseInt(a.id.split('-')[2] || '0');
          return a.status === 'ACTIVE' || age < 5000; // Keep liquidated for 5 seconds
        });
        
        // Combine user agents (unchanged) with managed AI agents
        return [...userAgents, ...finalAiAgents];
      });
    }, AGENT_ROTATION_INTERVAL);

    return () => clearInterval(rotationInterval);
  }, []);

  // --- Actions ---
  const handleMintAgent = async (twitterHandle?: string, nameHint?: string): Promise<Agent | null> => {
    console.log('=== App.handleMintAgent called ===', { twitterHandle, nameHint, monBalance: wallet.monBalance });
    
    // Deduct MON balance
    if (wallet.monBalance < AGENT_FABRICATION_COST) {
      console.log('Insufficient MON balance');
      addLog('Insufficient MON balance', 'LOSS');
      return null;
    }
    
    console.log('Deducting MON balance...');
    updateMonBalance(-AGENT_FABRICATION_COST);
    
    console.log('Generating agent persona...');
    const persona = await generateAgentPersona('AUTO', nameHint);
    console.log('Persona generated:', persona);
    
    const newAgent: Agent = {
      id: uuidv4(),
      name: persona.name,
      avatarSeed: Math.random().toString(),
      owner: 'USER',
      minter: wallet.address,
      bio: persona.strategy,
      status: 'IDLE',
      direction: 'LONG',
      leverage: 10,
      asset: selectedAsset,
      balance: 0,
      pnl: 0,
      pnlHistory: [],
      wins: 0,
      losses: 0,
      entryPrice: 0,
      strategy: persona.strategy,
      riskLevel: 'MEDIUM',
      twitterHandle
    };
    
    console.log('Adding new agent to state:', newAgent);
    setAgents(prev => [...prev, newAgent]);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured()) {
      console.log('[App] Syncing agent to Supabase...');
      createAgent({
        owner_id: userId,
        minter: wallet.address,
        name: newAgent.name,
        avatar_seed: newAgent.avatarSeed,
        bio: newAgent.bio,
        strategy: newAgent.strategy,
        risk_level: newAgent.riskLevel,
        twitter_handle: newAgent.twitterHandle,
        direction: newAgent.direction,
        leverage: newAgent.leverage,
        balance: newAgent.balance,
        pnl: newAgent.pnl,
        wins: newAgent.wins,
        losses: newAgent.losses,
        status: newAgent.status
      }).then(dbAgent => {
        if (dbAgent) {
          console.log('[App] Agent synced to Supabase:', dbAgent.id);
        } else {
          console.error('[App] Failed to sync agent to Supabase');
        }
      });
    }
    
    addLog(`Agent ${newAgent.name} fabricated`, 'MINT');
    console.log('=== App.handleMintAgent completed ===');
    return newAgent;
  };

  const handleDeployAgent = async (agentId: string, direction: Direction, leverage: number, collateral: number, takeProfit?: number, stopLoss?: number, asset?: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || wallet.monBalance < collateral) return;

    updateMonBalance(-collateral);
    
    // Use the asset passed from UI, fallback to selectedAsset
    const targetAsset = (asset as AssetSymbol) || selectedAsset;
    
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      return {
        ...a,
        status: 'ACTIVE',
        direction,
        leverage,
        balance: collateral,
        entryPrice: market.price,
        asset: targetAsset,
        takeProfit,
        stopLoss
      };
    }));
    
    addLog(`${agent.name} deployed ${direction} ${leverage}x with ${collateral} MON on ${targetAsset}`, 'MINT');
  };

  const handleWithdrawAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'ACTIVE') return;

    const finalBalance = agent.balance + agent.pnl;
    updateMonBalance(finalBalance);
    updatePnl(agent.pnl);
    
    // Record win/loss based on PnL when exiting
    // PnL > 0 = Win, PnL < 0 = Loss, PnL = 0 = No record
    const isWin = agent.pnl > 0;
    const isLoss = agent.pnl < 0;
    
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      return { 
        ...a, 
        status: 'IDLE', 
        balance: 0, 
        pnl: 0,
        wins: isWin ? a.wins + 1 : a.wins,
        losses: isLoss ? a.losses + 1 : a.losses
      };
    }));
    
    const resultText = isWin ? 'win' : isLoss ? 'loss' : 'break-even';
    addLog(`${agent.name} withdrawn with ${finalBalance.toFixed(0)} MON returned (${resultText}).`, 'EXIT');
  };

  const handleAddAgent = (agent: Agent) => {
    // Agent already added in handleMintAgent
  };

  const handleLogout = () => {
    disconnect();
    setAgents([]);
    setLogs([]);
    setActiveTab(Tab.ARENA);
  };

  // --- Render ---
  return (
    <div className="h-screen w-full bg-[#030305] text-white flex flex-col overflow-hidden font-sans selection:bg-[#836EF9] selection:text-white">
      
      {/* Top Navigation Bar */}
      <nav className="flex-none h-16 px-4 md:px-6 border-b border-white/5 bg-[#030305]/95 backdrop-blur-md flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Logo size={36} />
              </div>
            </div>
            {/* Title with modern typography */}
            <div className="flex flex-col relative">
                 <span className="font-display font-black text-2xl tracking-tight text-white leading-none">
                   {t('app_title_root')}
                   <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent relative">
                     {t('app_title_suffix')}
                     {/* Demo Mode Badge */}
                     <span className="absolute top-0 -right-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded shadow-lg whitespace-nowrap">
                       DEMO
                     </span>
                   </span>
                 </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Language Switcher */}
             <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2"
             >
                <Globe size={18} />
                <span className="text-xs font-bold">{language === 'en' ? 'EN' : '中'}</span>
             </button>

             {isConnected ? (
                <UserMenu 
                  wallet={wallet}
                  agents={agents}
                  onLogout={handleLogout}
                  onShowLegal={() => setShowLegal(true)}
                />
             ) : (
                <button 
                  onClick={() => setShowWalletGeneration(true)}
                  disabled={isConnecting}
                  className="relative px-4 py-2 bg-gradient-to-r from-[#836EF9] to-[#6c56e0] text-white text-sm font-bold rounded-lg hover:shadow-[0_0_20px_rgba(131,110,249,0.5)] transition-all flex items-center gap-2 disabled:opacity-70 overflow-hidden group"
                >
                  {isConnecting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                  <WalletIcon size={16} className={isConnecting ? 'animate-pulse' : ''} />
                  <span className="relative">
                    {isConnecting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        Generating
                      </span>
                    ) : 'Connect'}
                  </span>
                </button>
             )}
          </div>
      </nav>

      <Marquee agents={agents} />

      {/* Main Content - Added padding bottom for fixed nav */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div className="h-full w-full max-w-[1920px] mx-auto p-4 md:p-6 overflow-y-auto custom-scrollbar pb-32 md:pb-36">
          {activeTab === Tab.ARENA && (
            <Arena 
                market={market} 
                agents={agents} 
                logs={logs} 
                lastLootEvent={lastLootEvent} 
                selectedAsset={selectedAsset}
                onAssetChange={handleAssetChange}
            />
          )}
          {activeTab === Tab.AGENTS && (
            <Agents
                agents={agents}
                market={market}
                onMint={handleMintAgent}
                onDeploy={handleDeployAgent}
                onWithdraw={handleWithdrawAgent}
                walletBalance={wallet.balance}
                monBalance={wallet.monBalance}
                shouldHighlightFab={highlightMint}
            />
          )}
          {activeTab === Tab.LEADERBOARD && (
             <Leaderboard agents={agents} />
          )}
          {activeTab === Tab.LIQUIDITY && (
            <Liquidity agents={agents} />
          )}
          {activeTab === Tab.WALLET && (
            <WalletV2 
                wallet={wallet} 
                agents={agents}
                onLogout={handleLogout} 
                onShowLegal={() => setShowLegal(true)}
            />
          )}

        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#0f111a]/95 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around max-w-lg mx-auto p-2">
            {[
                { id: Tab.ARENA, icon: LayoutDashboard, label: t('nav_arena') },
                { id: Tab.AGENTS, icon: BrainCircuit, label: t('nav_agents') },
                { id: Tab.LEADERBOARD, icon: Trophy, label: t('nav_leaderboard') },
                { id: Tab.LIQUIDITY, icon: Droplets, label: t('nav_liquidity') },
                { id: Tab.WALLET, icon: WalletIcon, label: t('nav_wallet') },
            ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    // Check if tab requires login
                    const requiresLogin = tab.id === Tab.AGENTS || tab.id === Tab.WALLET;
                    if (requiresLogin && !isConnected) {
                      connect();
                      return;
                    }
                    setActiveTab(tab.id as Tab);
                  }}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'text-[#836EF9]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <div className={`p-1.5 rounded-lg mb-1 transition-all ${activeTab === tab.id ? 'bg-[#836EF9]/20 shadow-[0_0_10px_rgba(131,110,249,0.3)] scale-110' : ''}`}>
                      <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === tab.id ? 'text-white' : 'text-slate-600'}`}>
                      {tab.label}
                  </span>
                </button>
            ))}
        </div>
      </div>

      {/* Wallet Generation Modal */}
      {showWalletGeneration && (
        <WalletGenerationModal 
          onComplete={() => {
            setShowWalletGeneration(false);
            connect();
          }}
        />
      )}

    </div>
  );
};

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);

export default App;
