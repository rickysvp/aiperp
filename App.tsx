import React, { useState, useEffect, useRef } from 'react';
import { Tab, Agent, MarketState, WalletState, BattleLog, Direction, LootEvent, AssetSymbol } from './types';
import { INITIAL_BALANCE, MINT_COST, GAME_TICK_MS } from './constants';
import { generateAgentPersona } from './services/kimiService';
import { Arena } from './components/Arena';
import { Agents } from './components/Agents';
import { Wallet } from './components/Wallet';
import { Leaderboard } from './components/Leaderboard';
import { AuthModal } from './components/AuthModal';
import { Onboarding } from './components/Onboarding';
import { LegalModal } from './components/LegalModal';
import { VersionInfo } from './components/VersionInfo';
import { LayoutDashboard, Users, Wallet as WalletIcon, BrainCircuit, Trophy, Globe } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Logo } from './components/Logo';

const AGENT_FABRICATION_COST = 100;

// Asset Configs
const ASSETS: Record<AssetSymbol, { startPrice: number, vol: number }> = {
  BTC: { startPrice: 65000, vol: 0.003 },
  ETH: { startPrice: 3500, vol: 0.004 },
  SOL: { startPrice: 150, vol: 0.006 },
  MON: { startPrice: 15, vol: 0.008 }
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
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [highlightMint, setHighlightMint] = useState(false); // For tutorial guidance

  const [currentUser, setCurrentUser] = useState<{email: string, address: string} | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ARENA);
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('BTC');
  
  const [wallet, setWallet] = useState<WalletState>({
    address: '',
    balance: 0,
    totalPnl: 0,
    referralEarnings: 0,
    referralCount: 0
  });

  const [market, setMarket] = useState<MarketState>({
    symbol: 'BTC',
    price: ASSETS.BTC.startPrice, 
    history: Array.from({ length: 30 }, (_, i) => ({ time: i.toString(), price: ASSETS.BTC.startPrice })),
    trend: 'FLAT',
    lastChangePct: 0
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [lastLootEvent, setLastLootEvent] = useState<LootEvent | null>(null);

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
      // Reset Market for new asset
      const startPrice = ASSETS[asset].startPrice;
      setMarket({
          symbol: asset,
          price: startPrice,
          history: Array.from({ length: 30 }, (_, i) => ({ time: i.toString(), price: startPrice })),
          trend: 'FLAT',
          lastChangePct: 0
      });
      addLog(`Market switched to ${asset}-USD Perps.`, 'MINT');
  };

  // --- Auth & Init ---
  useEffect(() => {
    const savedUser = localStorage.getItem('aipers_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Load wallet from storage or init
        const savedBalance = localStorage.getItem('aipers_balance');
        const savedRef = localStorage.getItem('aipers_referral');
        
        let refData = { earnings: 0, count: 0, code: '' };
        if (savedRef) refData = JSON.parse(savedRef);

        setWallet({
            address: user.address,
            balance: savedBalance ? parseFloat(savedBalance) : INITIAL_BALANCE,
            totalPnl: 0,
            referralEarnings: refData.earnings,
            referralCount: refData.count,
            referralCode: refData.code
        });
    }

    // Initialize System Bots
    const systemBots: Agent[] = [];
    for (let i = 0; i < 200; i++) { 
        const dir = Math.random() > 0.5 ? 'LONG' : 'SHORT';
        systemBots.push({
            id: uuidv4(),
            owner: 'SYSTEM',
            minter: 'Protocol',
            name: `Unit-${Math.floor(Math.random() * 9999)}`,
            bio: "System Drone",
            strategy: "Swarm",
            avatarSeed: Math.random().toString(36),
            direction: dir,
            leverage: Math.floor(Math.random() * 19) + 1,
            balance: MINT_COST + (Math.random() * 500),
            pnl: 0,
            pnlHistory: [],
            wins: 0,
            losses: 0,
            status: 'ACTIVE'
        });
    }
    setAgents(systemBots);
    addLog("System Swarm Initialized.", "MINT");
  }, []);

  // Save balance on change
  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem('aipers_balance', wallet.balance.toString());
        localStorage.setItem('aipers_referral', JSON.stringify({
            earnings: wallet.referralEarnings,
            count: wallet.referralCount,
            code: wallet.referralCode
        }));
    }
  }, [wallet.balance, wallet.referralEarnings, isAuthenticated]);

  const handleLogin = (email: string) => {
    // Generate deterministic-ish address
    const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    // Generate Referral Code from email
    const refCode = email.split('@')[0].toUpperCase().substring(0, 8);

    const user = { email, address: mockAddress };
    
    localStorage.setItem('aipers_user', JSON.stringify(user));
    localStorage.setItem('aipers_balance', INITIAL_BALANCE.toString());
    
    setCurrentUser(user);
    setWallet({
        address: mockAddress,
        balance: INITIAL_BALANCE,
        totalPnl: 0,
        referralCode: refCode,
        referralEarnings: 0,
        referralCount: 0
    });
    setIsAuthenticated(true);

    // Check onboarding
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
        setShowOnboarding(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aipers_user');
    localStorage.removeItem('aipers_balance');
    localStorage.removeItem('aipers_referral');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWallet({ address: '', balance: 0, totalPnl: 0, referralEarnings: 0, referralCount: 0 });
    setActiveTab(Tab.ARENA);
    // Remove user agents
    setAgents(prev => prev.filter(a => a.owner !== 'USER'));
  };

  const handleFinishOnboarding = () => {
      setShowOnboarding(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
      setActiveTab(Tab.AGENTS); // Send to agents page to start
      setHighlightMint(true); // Enable visual cue
      // Remove highlight after 5 seconds
      setTimeout(() => setHighlightMint(false), 8000);
  };

  // --- Helpers ---
  const addLog = (message: string, type: BattleLog['type'], amount?: number) => {
    const newLog: BattleLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      message,
      type,
      amount
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // --- Game Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAsset = assetRef.current;
      const assetConfig = ASSETS[currentAsset];

      // 1. Update Market Price (Volatile Random Walk)
      const change = (Math.random() - 0.5) * 2 * assetConfig.vol;
      const currentPrice = marketRef.current.price;
      const newPrice = currentPrice * (1 + change);
      
      const newHistory = [...marketRef.current.history, { time: Date.now().toString(), price: newPrice }].slice(-40);
      const priceChangePct = (newPrice - currentPrice) / currentPrice;

      const marketUpdate: MarketState = {
        symbol: currentAsset,
        price: newPrice,
        history: newHistory,
        trend: change > 0 ? 'UP' : 'DOWN',
        lastChangePct: priceChangePct * 100 
      };
      
      setMarket(marketUpdate);

      // 2. Battle Logic / Settlement
      const currentAgents = [...agentsRef.current];
      let userBalanceChange = 0; // Only track user's change
      let roundTotalLoot = 0;
      
      // Determine Winning Side
      const marketDirection = priceChangePct > 0 ? 'LONG' : 'SHORT';
      const isSignificantMove = Math.abs(priceChangePct) > 0.00005;

      // Optimization: Separate logic lists once
      const activeAgents = [];
      const winners = [];
      const losers = [];

      for (const agent of currentAgents) {
          if (agent.status === 'ACTIVE') {
              activeAgents.push(agent);
              
              // RESOLVE EFFECTIVE DIRECTION
              let effectiveDirection = agent.direction;
              if (agent.direction === 'AUTO') {
                  // Auto Agents follow momentum (aligned with market direction)
                  effectiveDirection = marketDirection;
              }

              if (effectiveDirection === marketDirection) winners.push(agent);
              else losers.push(agent);
          }
      }

      if (isSignificantMove) {
        // --- A. Base PnL Update ---
        for (const agent of activeAgents) {
          // Resolve effective direction again for PnL calc
          let effectiveDirection = agent.direction;
          if (agent.direction === 'AUTO') {
              effectiveDirection = marketDirection;
          }

          const directionMultiplier = effectiveDirection === 'LONG' ? 1 : -1;
          const tickPnl = agent.balance * agent.leverage * priceChangePct * directionMultiplier;
          
          agent.pnl += tickPnl;
          agent.balance += tickPnl;
          
          // Record PnL history for charts (keep last 24 data points)
          if (!agent.pnlHistory) agent.pnlHistory = [];
          agent.pnlHistory.push({
            time: new Date().toISOString(),
            value: agent.pnl
          });
          if (agent.pnlHistory.length > 24) {
            agent.pnlHistory.shift();
          }
          
          if (tickPnl > 0) agent.wins++;
          else agent.losses++;

          // Only update wallet if it belongs to user
          if (agent.owner === 'USER') {
            userBalanceChange += tickPnl;
          }
        }

        // --- B. Looting / Plunder Mechanic ---
        if (winners.length > 0 && losers.length > 0) {
            // Optimization: Limit looting events per tick to avoid spam
            const lootAttemps = Math.min(winners.length, 5); 
            
            for (let i = 0; i < lootAttemps; i++) {
                if (Math.random() < 0.3) {
                    const winnerIndex = Math.floor(Math.random() * winners.length);
                    const winner = winners[winnerIndex];
                    
                    const victimIndex = Math.floor(Math.random() * losers.length);
                    const victim = losers[victimIndex];
                    
                    const lootAmount = Math.min(victim.balance * 0.05, 50); 
                    
                    if (lootAmount > 1) {
                        const fee = lootAmount * 0.01;
                        const netLoot = lootAmount - fee;

                        victim.balance -= lootAmount;
                        winner.balance += netLoot;
                        
                        winner.pnl += netLoot;
                        victim.pnl -= lootAmount;
                        roundTotalLoot += netLoot;

                        // Adjust User Wallet if they are involved in looting
                        if (winner.owner === 'USER') userBalanceChange += netLoot;
                        if (victim.owner === 'USER') userBalanceChange -= lootAmount;
                    }
                }
            }
        }

        // --- C. Exit Arena Check (Auto-withdraw when balance is low) ---
        for (const agent of activeAgents) {
             if (agent.balance <= 50) {
                 // Return remaining balance to user
                 const remainingBalance = agent.balance;
                 if (agent.owner === 'USER') {
                     userBalanceChange += remainingBalance;
                     addLog(`${agent.name} exited arena with ${remainingBalance.toFixed(0)} $MON remaining.`, 'EXIT');
                 }
                 // Reset agent to IDLE state
                 agent.status = 'IDLE';
                 agent.balance = 0;
                 agent.pnl = 0;
                 agent.leverage = 1;
                 agent.direction = 'LONG';
             }
        }

        // --- D. Update State ---
        setAgents([...currentAgents]);
        
        const newWalletBalance = walletRef.current.balance + userBalanceChange;
        
        // SIMULATION: Randomly increment referral earnings
        let newReferralEarnings = walletRef.current.referralEarnings;
        let newReferralCount = walletRef.current.referralCount;
        if (Math.random() < 0.01) { // 1% chance per tick to get a referral commission
             const commish = Math.floor(Math.random() * 50);
             newReferralEarnings += commish;
             if (Math.random() < 0.2) newReferralCount += 1; // New user joined
        }

        setWallet(prev => ({
            ...prev,
            balance: newWalletBalance,
            totalPnl: prev.totalPnl + userBalanceChange,
            referralEarnings: newReferralEarnings,
            referralCount: newReferralCount
        }));

        if (Math.abs(priceChangePct) > 0.002) {
             const winningSide = priceChangePct > 0 ? "BULLS" : "BEARS";
             addLog(`${winningSide} PUSHING ${currentAsset} LINE.`, priceChangePct > 0 ? 'WIN' : 'LOSS');
        }

        if (roundTotalLoot > 0) {
            setLastLootEvent({
                amount: roundTotalLoot,
                winner: marketDirection,
                timestamp: Date.now()
            });
        }
      }

    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated]); 

  // --- Actions ---
  const handleMintAgent = async (twitterHandle?: string, nameHint?: string): Promise<Agent | null> => {
    if (wallet.balance < AGENT_FABRICATION_COST) {
      alert("Insufficient Balance!");
      return null;
    }

    const userInputName = nameHint || "Agent";
    // Generate Random 4-digit NFT ID
    const nftId = Math.floor(1000 + Math.random() * 9000);
    const finalName = `${userInputName} #${nftId}`;

    // Deduct cost immediately
    setWallet(prev => ({ ...prev, balance: prev.balance - AGENT_FABRICATION_COST }));
    addLog(`Fabricating ${finalName}...`, 'MINT');

    try {
      // Just pass the user name, let Gemini generate bio/strategy but we force the name
      const persona = await generateAgentPersona('AUTO', userInputName);
      
      const newAgent: Agent = {
        id: uuidv4(),
        owner: 'USER',
        minter: wallet.address,
        minterTwitter: twitterHandle && twitterHandle.startsWith('@') ? twitterHandle : twitterHandle ? `@${twitterHandle}` : undefined,
        name: finalName,
        bio: persona.bio,
        strategy: persona.strategy,
        avatarSeed: finalName, // Use name as seed for consistent pixel art
        direction: 'LONG', // Default, will be set on deploy
        leverage: 1, 
        balance: 0, 
        pnl: 0,
        pnlHistory: [],
        wins: 0,
        losses: 0,
        status: 'IDLE',
        twitterHandle: twitterHandle
      };

      // Agent is returned but NOT added to list yet
      // It will be added when user accepts in the UI
      return newAgent;
    } catch (e) {
      console.error(e);
      // Refund on error
      setWallet(prev => ({ ...prev, balance: prev.balance + AGENT_FABRICATION_COST }));
      return null;
    }
  };

  const handleAddAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
    addLog(`${agent.name} fabricated. Awaiting orders.`, 'MINT');
  };

  const handleWithdrawAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'ACTIVE') return;

    const withdrawAmount = agent.balance;

    // Return balance to wallet
    setWallet(prev => ({ ...prev, balance: prev.balance + withdrawAmount }));

    // Reset agent to IDLE state
    setAgents(prev => prev.map(a => {
        if (a.id === agentId) {
            return {
                ...a,
                status: 'IDLE',
                balance: 0,
                pnl: 0,
                leverage: 1,
                direction: 'LONG'
            };
        }
        return a;
    }));

    addLog(`${agent.name} withdrawn with ${withdrawAmount.toFixed(0)} $MON returned.`, 'EXIT');
  };

  const handleDeployAgent = async (agentId: string, direction: Direction, leverage: number, collateral: number) => {
    if (wallet.balance < collateral) {
      alert("Insufficient Collateral for deployment!");
      return;
    }

    setWallet(prev => ({ ...prev, balance: prev.balance - collateral }));
    
    setAgents(prev => prev.map(agent => {
        if (agent.id === agentId) {
            return {
                ...agent,
                status: 'ACTIVE',
                direction: direction,
                leverage: leverage,
                balance: collateral,
                pnl: 0 
            };
        }
        return agent;
    }));

    addLog(`Unit Deployed ${direction} @ ${leverage}x (${collateral} $MON)`, 'MINT');
    setActiveTab(Tab.ARENA);
  };

  const tabs = [
    { id: Tab.ARENA, icon: LayoutDashboard, label: t('tab_arena') },
    { id: Tab.AGENTS, icon: Users, label: t('tab_agents') },
    { id: Tab.LEADERBOARD, icon: Trophy, label: t('tab_legends') },
    { id: Tab.WALLET, icon: WalletIcon, label: t('tab_wallet') }
  ];

  return (
    <div className="h-screen bg-[#030305] text-slate-200 font-sans flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#030305] to-[#030305]">
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {!isAuthenticated && <AuthModal onLogin={handleLogin} />}
      {showOnboarding && <Onboarding onFinish={handleFinishOnboarding} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      
      {/* Version Info */}
      <VersionInfo />

      {/* Top Header - Modern Design */}
      <nav className="border-b border-white/5 bg-[#030305]/90 backdrop-blur-xl sticky top-0 z-50 shrink-0">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Container with enhanced glow */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 blur-lg opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative w-11 h-11 bg-[#0f111a] border border-white/10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300">
                    <Logo size={28} />
                </div>
            </div>
            {/* Title with modern typography */}
            <div className="flex flex-col">
                 <span className="font-display font-black text-2xl tracking-tight text-white leading-none">
                   {t('app_title_root')}
                   <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">{t('app_title_suffix')}</span>
                 </span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-[0.25em] pl-0.5 font-medium">{t('nav_subtitle')}</span>
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

             {isAuthenticated && (
                <div className="text-right">
                    <p className="text-[9px] text-[#836EF9] uppercase font-bold tracking-widest mb-0.5">{t('net_equity')}</p>
                    <p className="text-lg font-mono font-bold text-white tabular-nums leading-none tracking-tight text-shadow-glow">
                        {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-slate-500">$MON</span>
                    </p>
                </div>
             )}
          </div>
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
                onAddAgent={handleAddAgent}
                walletBalance={wallet.balance}
                shouldHighlightFab={highlightMint}
            />
          )}
          {activeTab === Tab.LEADERBOARD && (
             <Leaderboard agents={agents} />
          )}
          {activeTab === Tab.WALLET && (
            <Wallet 
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
            {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
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

    </div>
  );
};

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);

export default App;
