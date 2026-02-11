import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Agent, Direction, MarketState } from '../types';
import { Button } from './Button';
import { Bot, Plus, User, Zap, Crosshair, ChevronRight, Activity, AtSign, Shield, Skull, TrendingUp, TrendingDown, Swords, Terminal, AlertTriangle, Wind, Scan, CheckCircle2, ArrowLeft, Coins, MessageSquare, Send, Brain } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { refineAgentStrategy } from '../services/geminiService';
import { AgentCard } from './AgentCard';

interface AgentsProps {
  agents: Agent[];
  market: MarketState;
  onMint: (twitterHandle?: string, nameHint?: string) => Promise<Agent | null>;
  onDeploy: (agentId: string, direction: Direction, leverage: number, collateral: number) => Promise<void>;
  walletBalance: number;
  shouldHighlightFab?: boolean;
}

const FABRICATION_COST = 100;
const MIN_COLLATERAL = 100;

export const Agents: React.FC<AgentsProps> = ({ agents, market, onMint, onDeploy, walletBalance, shouldHighlightFab }) => {
  const { t } = useLanguage();
  // Selection State: 'FABRICATE' or agentId
  const [selection, setSelection] = useState<string>('FABRICATE');
  
  // Mobile Navigation State (List vs Detail)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);

  // Minting State
  const [fabricationStep, setFabricationStep] = useState<'IDLE' | 'CONFIG' | 'GENERATING' | 'REVEAL'>('IDLE');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [nameHint, setNameHint] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Deployment State
  const [deployDirection, setDeployDirection] = useState<Direction>('AUTO');
  const [deployLeverage, setDeployLeverage] = useState(5);
  const [deployCollateral, setDeployCollateral] = useState(400);
  const [activeTab, setActiveTab] = useState<'DEPLOY' | 'CHAT'>('DEPLOY');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'agent', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Group Agents
  const { activeAgents, idleAgents, deadAgents } = useMemo(() => {
    const userAgents = agents.filter(a => a.owner === 'USER');
    return {
        activeAgents: userAgents.filter(a => a.status === 'ACTIVE'),
        idleAgents: userAgents.filter(a => a.status === 'IDLE'),
        deadAgents: userAgents.filter(a => a.status === 'LIQUIDATED').reverse(), // Most recent deaths first
    };
  }, [agents]);

  const selectedAgent = agents.find(a => a.id === selection);

  // Reset states when selection changes
  useEffect(() => {
    setChatHistory([]);
    setActiveTab('DEPLOY');
  }, [selection]);

  // Terminal Log Animation
  useEffect(() => {
    if (fabricationStep === 'GENERATING') {
        const messages = [
            "Initializing connection to Gemini-3...",
            "Scanning blockchain for personality shards...",
            `Analyzing market sentiment: ${market.trend}...`,
            "Synthesizing strategy parameters...",
            "Constructing neural pathway...",
            "Finalizing avatar generation...",
        ];
        let i = 0;
        setLogs([]);
        const interval = setInterval(() => {
            if (i < messages.length) {
                setLogs(prev => [...prev, messages[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 800);
        return () => clearInterval(interval);
    }
  }, [fabricationStep, market.trend]);

  // Reset collateral when wallet balance changes
  useEffect(() => {
     if (deployCollateral > walletBalance && walletBalance >= MIN_COLLATERAL) {
         setDeployCollateral(walletBalance);
     }
  }, [walletBalance]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleStartFabrication = () => {
      setFabricationStep('CONFIG');
      setSelection('FABRICATE');
      setShowDetailOnMobile(true);
  };

  const handleSelectAgent = (id: string) => {
      setSelection(id);
      setShowDetailOnMobile(true);
  };

  const handleBackToList = () => {
      setShowDetailOnMobile(false);
  };

  const handleConfirmFabrication = async () => {
    setFabricationStep('GENERATING');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // We pass the user-defined name here
    const newAgent = await onMint(twitterHandle.replace('@', ''), nameHint || "Anonymous");
    if (newAgent) {
        setGeneratedAgent(newAgent);
        setFabricationStep('REVEAL');
    } else {
        setFabricationStep('CONFIG'); // Failed
    }
  };

  const handleAcceptAgent = () => {
      if (generatedAgent) {
          setSelection(generatedAgent.id);
          setFabricationStep('IDLE');
          setGeneratedAgent(null);
          setTwitterHandle('');
          setNameHint('');
      }
  };

  const handleDeployClick = async (agentId: string) => {
    await onDeploy(agentId, deployDirection, deployLeverage, deployCollateral);
    setSelection(agentId);
  };

  const handleSocialShare = (agent: Agent) => {
      let text = '';
      if (agent.status === 'LIQUIDATED') {
          text = `My agent ${agent.name} was destroyed in the @AIperp Arena. -${agent.balance} $MON. The market is ruthless. 💀 #AIperp`;
      } else if (agent.pnl > 0) {
          text = `Reporting live: Agent ${agent.name} is printing! +${agent.pnl.toFixed(0)} $MON. Strategy: ${agent.strategy}. Join the winning side at aiperp.fun 🚀`;
      } else {
          text = `Deploying ${agent.name} to the @AIperp Arena. ${agent.direction} on BTC with ${agent.leverage}x leverage. Wish me luck. ⚔️`;
      }
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const handleStrategyChat = async () => {
      if (!chatInput.trim() || !selectedAgent || isChatLoading) return;

      const userMsg = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsChatLoading(true);

      try {
          const result = await refineAgentStrategy(selectedAgent.strategy, userMsg, selectedAgent.name);
          
          setChatHistory(prev => [...prev, { role: 'agent', text: result.reply }]);
          
          // Update Agent Strategy Locally (In a real app, this would be a prop call to update state)
          selectedAgent.strategy = result.newStrategy; 

      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'agent', text: "ERROR: NEURAL LINK DISRUPTED." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const calculateLiquidationPrice = (entryPrice: number, direction: Direction, leverage: number) => {
      // For AUTO, we just show a range or approx based on current price as direction is dynamic
      if (direction === 'AUTO') return entryPrice * 0.95; // Rough estimate

      if (direction === 'LONG') {
          return entryPrice * (1 - (1/leverage) * 0.9); 
      } else {
          return entryPrice * (1 + (1/leverage) * 0.9);
      }
  };

  const liqPrice = calculateLiquidationPrice(market.price, deployDirection, deployLeverage);
  const distToLiq = Math.abs((liqPrice - market.price) / market.price) * 100;

  // --- Render Helpers ---
  const renderAgentListItem = (agent: Agent) => {
      const totalGames = agent.wins + agent.losses;
      const winRate = totalGames > 0 ? Math.round((agent.wins / totalGames) * 100) : 0;

      return (
        <div 
            key={agent.id}
            onClick={() => handleSelectAgent(agent.id)}
            className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden mb-2 ${
                selection === agent.id 
                ? 'bg-[#836EF9]/10 border-[#836EF9] shadow-[0_0_15px_rgba(131,110,249,0.2)]' 
                : 'bg-[#0f111a] border-slate-800 hover:border-slate-600 hover:bg-[#151824]'
            }`}
        >
            {/* Selection Indicator */}
            {selection === agent.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#836EF9]" />}

            <div className={`w-10 h-10 rounded-lg bg-black shrink-0 overflow-hidden border ${agent.status === 'LIQUIDATED' ? 'border-slate-800 grayscale opacity-50' : 'border-slate-700'}`}>
                <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h4 className={`text-xs font-bold font-display truncate ${selection === agent.id ? 'text-white' : 'text-slate-300'}`}>{agent.name}</h4>
                    {agent.status === 'ACTIVE' && (
                        <span className={`text-[10px] font-mono ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                            {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="truncate max-w-[80px]">{agent.strategy}</span>
                    <span className="text-slate-600">|</span>
                    <span className={`${winRate > 50 ? 'text-[#00FF9D]' : 'text-slate-400'}`}>WR: {winRate}%</span>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-[1600px] mx-auto lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      
      {/* LEFT PANEL: ROSTER (SCROLLABLE) */}
      <div className={`${showDetailOnMobile ? 'hidden lg:flex' : 'flex'} lg:w-1/3 xl:w-1/4 flex-col gap-4 lg:overflow-hidden h-full`}>
         
         {/* 1. Header & Fabricate Button */}
         <div className="shrink-0 space-y-4">
             <div className="flex items-center justify-between">
                 <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                     <Bot className="text-[#836EF9]" /> {t('my_fleet')}
                 </h2>
                 <span className="text-xs font-mono text-slate-500">{activeAgents.length + idleAgents.length} {t('units')}</span>
             </div>

             <button 
                onClick={handleStartFabrication}
                className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider relative ${
                    selection === 'FABRICATE'
                    ? 'bg-[#836EF9]/20 border-[#836EF9] text-white shadow-[0_0_20px_rgba(131,110,249,0.2)]'
                    : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                } ${shouldHighlightFab ? 'animate-pulse ring-2 ring-[#00FF9D] shadow-[0_0_30px_#00FF9D]' : ''}`}
             >
                 {shouldHighlightFab && (
                     <div className="absolute -top-2 -right-2 bg-[#00FF9D] text-black text-[9px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                         START HERE
                     </div>
                 )}
                 <Plus size={18} /> {t('new_fabrication')}
             </button>
         </div>

         {/* 2. Agent Lists (Scrollable) */}
         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-20 lg:pb-0">
             
             {/* Active Section */}
             {activeAgents.length > 0 && (
                 <div>
                     <h3 className="text-[10px] font-bold text-[#00FF9D] uppercase tracking-widest mb-2 flex items-center gap-1">
                         <Activity size={10} /> {t('deployed')} ({activeAgents.length})
                     </h3>
                     {activeAgents.map(renderAgentListItem)}
                 </div>
             )}

             {/* Idle Section */}
             {idleAgents.length > 0 && (
                 <div>
                     <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                         <Terminal size={10} /> {t('awaiting_orders')} ({idleAgents.length})
                     </h3>
                     {idleAgents.map(renderAgentListItem)}
                 </div>
             )}

             {/* Graveyard Section */}
             {deadAgents.length > 0 && (
                 <div>
                     <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                         <Skull size={10} /> {t('decommissioned')} ({deadAgents.length})
                     </h3>
                     {deadAgents.map(renderAgentListItem)}
                 </div>
             )}
         </div>
      </div>


      {/* RIGHT PANEL: COMMAND CONSOLE (DETAILS) */}
      <div className={`${showDetailOnMobile ? 'flex' : 'hidden lg:flex'} flex-1 bg-[#050508] border border-slate-800 rounded-2xl lg:overflow-hidden relative flex-col shadow-2xl mb-20 lg:mb-0`}>
         
         {/* Background Grid FX */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(131, 110, 249, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(131, 110, 249, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         
         {/* Mobile Back Button */}
         <div className="lg:hidden p-4 border-b border-slate-800 z-20">
             <button onClick={handleBackToList} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider">
                 <ArrowLeft size={16} /> {t('back_to_fleet')}
             </button>
         </div>

         {/* SCENARIO A: FABRICATION TERMINAL */}
         {selection === 'FABRICATE' && (
             <div className="flex-1 flex flex-col p-4 lg:p-8 relative z-10">
                 {/* Step 1: Config */}
                 {(fabricationStep === 'IDLE' || fabricationStep === 'CONFIG') && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                        <div className="max-w-md w-full">
                            <div className="text-center mb-8 lg:mb-10">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto bg-[#0f111a] rounded-full border border-[#836EF9] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(131,110,249,0.3)]">
                                    <Bot size={40} className="text-[#836EF9]" />
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">{t('neural_foundry')}</h2>
                                <p className="text-sm lg:text-base text-slate-400">{t('config_desc')}</p>
                            </div>

                            <div className="bg-[#0f111a]/80 backdrop-blur border border-slate-700 rounded-xl p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('codename_hint')}</label>
                                    <input 
                                        type="text"
                                        value={nameHint}
                                        onChange={(e) => setNameHint(e.target.value)}
                                        placeholder="e.g. CyberWolf"
                                        className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-[#836EF9] focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('social_link')}</label>
                                    <div className="relative">
                                        <AtSign className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="text"
                                            value={twitterHandle}
                                            onChange={(e) => setTwitterHandle(e.target.value)}
                                            placeholder="TwitterHandle"
                                            className="w-full bg-black/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-[#836EF9] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 ml-1">{t('verify_tip')}</p>
                                </div>

                                <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                                    <span className="text-slate-400">{t('fabrication_cost')}</span>
                                    <span className="font-mono font-bold text-white">{FABRICATION_COST} $MON</span>
                                </div>

                                <Button 
                                    onClick={handleConfirmFabrication}
                                    disabled={walletBalance < FABRICATION_COST || !nameHint.trim()}
                                    className="w-full py-4 text-lg tracking-widest font-display"
                                >
                                    {walletBalance < FABRICATION_COST ? t('insufficient_funds') : t('init_fabrication')}
                                </Button>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Step 2: Generating */}
                 {fabricationStep === 'GENERATING' && (
                     <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                         <div className="max-w-md w-full bg-black border border-slate-800 rounded-xl p-6 font-mono text-sm shadow-2xl">
                             <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                                 <Terminal size={16} className="text-[#00FF9D]" />
                                 <span className="text-slate-400">{t('gemini_terminal')}</span>
                             </div>
                             <div className="space-y-2 h-48 overflow-hidden">
                                 {logs.map((log, i) => (
                                     <div key={i} className="text-[#00FF9D] animate-pulse">
                                         <span className="opacity-50 mr-2">{'>'}</span>{log}
                                     </div>
                                 ))}
                                 <div className="text-[#836EF9] animate-bounce mt-4">{t('processing')}</div>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Step 3: Reveal */}
                 {fabricationStep === 'REVEAL' && generatedAgent && (
                     <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                         <div className="max-w-md w-full text-center">
                             <div className="mb-6 relative inline-block">
                                 <div className="absolute inset-0 bg-[#00FF9D] blur-xl opacity-30 animate-pulse"></div>
                                 {/* Use AgentCard for Reveal for consistency, even if not used in layout elsewhere */}
                                 <div className="transform scale-110">
                                     <AgentCard agent={generatedAgent} />
                                 </div>
                             </div>
                             
                             <div className="bg-[#0f111a] p-4 rounded-xl border border-slate-800 mb-8 inline-block mt-8">
                                 <p className="text-xs text-slate-500 uppercase mb-1">{t('generated_strategy')}</p>
                                 <p className="font-bold text-[#836EF9]">{generatedAgent.strategy}</p>
                             </div>

                             <Button onClick={handleAcceptAgent} className="w-full py-4 text-lg">
                                 <CheckCircle2 className="mr-2" /> {t('add_to_fleet')}
                             </Button>
                         </div>
                     </div>
                 )}
             </div>
         )}

         {/* SCENARIO B: DEPLOYMENT CONSOLE (IDLE AGENT) */}
         {selectedAgent && selectedAgent.status === 'IDLE' && (
             <div className="flex-1 flex flex-col p-4 lg:p-8 relative z-10 animate-fade-in">
                 {/* IDLE Header - Reverted to Standard Layout */}
                 <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 pb-6 border-b border-slate-800 gap-4">
                     <div className="flex items-center gap-6">
                         <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-black border border-slate-700 overflow-hidden shadow-lg shrink-0">
                             <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAgent.avatarSeed}`} className="w-full h-full object-cover" />
                         </div>
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <h2 className="text-2xl lg:text-3xl font-display font-bold text-white">{selectedAgent.name}</h2>
                                 {selectedAgent.twitterHandle && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">@{selectedAgent.twitterHandle}</span>}
                             </div>
                             <p className="text-sm lg:text-base text-slate-400 italic mb-2">"{selectedAgent.bio}"</p>
                             <div className="flex gap-2">
                                 <span className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 uppercase tracking-wider font-bold">{selectedAgent.strategy}</span>
                                 <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] uppercase tracking-wider font-bold border border-amber-500/20">{t('standby')}</span>
                             </div>
                         </div>
                     </div>
                     <div className="text-left lg:text-right bg-slate-900/50 p-3 rounded lg:bg-transparent lg:p-0">
                         <p className="text-[10px] text-slate-500 uppercase font-bold">{t('net_balance')}</p>
                         <p className="text-xl lg:text-2xl font-mono font-bold text-white">{walletBalance.toLocaleString()} $MON</p>
                     </div>
                 </div>
                 
                 {/* Tabs */}
                 <div className="flex gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setActiveTab('DEPLOY')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'DEPLOY' ? 'bg-[#836EF9] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t('deploy_unit')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('CHAT')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'CHAT' ? 'bg-[#00FF9D] text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={14} /> {t('neural_link')}
                    </button>
                 </div>

                 {/* TAB CONTENT: DEPLOYMENT */}
                 {activeTab === 'DEPLOY' && (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center overflow-y-auto animate-fade-in">
                        {/* Direction */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Crosshair size={16} /> {t('strategy_vector')}
                            </label>
                            
                            {/* Auto Selector */}
                            <button 
                                onClick={() => setDeployDirection('AUTO')}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 mb-4 ${
                                    deployDirection === 'AUTO'
                                    ? 'bg-[#836EF9]/20 border-[#836EF9] shadow-[0_0_20px_rgba(131,110,249,0.2)]'
                                    : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${deployDirection === 'AUTO' ? 'bg-[#836EF9] text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        <Brain size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className={`font-display font-bold ${deployDirection === 'AUTO' ? 'text-white' : 'text-slate-400'}`}>{t('auto')}</div>
                                        <div className="text-[10px] text-slate-500">{t('auto_desc')}</div>
                                    </div>
                                </div>
                                {deployDirection === 'AUTO' && <div className="w-3 h-3 bg-[#836EF9] rounded-full animate-pulse shadow-[0_0_10px_#836EF9]" />}
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setDeployDirection('LONG')}
                                    className={`p-4 lg:p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        deployDirection === 'LONG'
                                        ? 'bg-[#00FF9D]/5 border-[#00FF9D] shadow-[0_0_20px_rgba(0,255,157,0.1)]'
                                        : 'bg-slate-900 border-slate-700 opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <TrendingUp size={24} lg:size={32} className={deployDirection === 'LONG' ? 'text-[#00FF9D]' : 'text-slate-500'} />
                                    <span className={`text-lg lg:text-xl font-display font-bold ${deployDirection === 'LONG' ? 'text-white' : 'text-slate-500'}`}>{t('long')}</span>
                                </button>
                                <button 
                                    onClick={() => setDeployDirection('SHORT')}
                                    className={`p-4 lg:p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        deployDirection === 'SHORT'
                                        ? 'bg-[#FF0055]/5 border-[#FF0055] shadow-[0_0_20px_rgba(255,0,85,0.1)]'
                                        : 'bg-slate-900 border-slate-700 opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <TrendingDown size={24} lg:size={32} className={deployDirection === 'SHORT' ? 'text-[#FF0055]' : 'text-slate-500'} />
                                    <span className={`text-lg lg:text-xl font-display font-bold ${deployDirection === 'SHORT' ? 'text-white' : 'text-slate-500'}`}>{t('short')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Leverage & Funding */}
                        <div className="space-y-6">
                            {/* Leverage Slider */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={16} /> {t('power_multiplier')}
                                    </label>
                                    <span className={`text-2xl font-mono font-bold ${deployLeverage > 10 ? 'text-[#FF0055]' : deployLeverage > 5 ? 'text-amber-400' : 'text-[#00FF9D]'}`}>
                                        {deployLeverage}x
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="20" 
                                    step="1"
                                    value={deployLeverage} 
                                    onChange={(e) => setDeployLeverage(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#836EF9]"
                                />
                            </div>

                            {/* Funding Slider */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Coins size={16} /> {t('assign_funds')}
                                    </label>
                                    <div className="text-right">
                                        <span className="block text-xl font-mono font-bold text-white">{deployCollateral.toLocaleString()} $MON</span>
                                        <span className="text-[10px] text-slate-500">{t('available_balance')}: {walletBalance.toLocaleString()}</span>
                                    </div>
                                </div>
                                <input 
                                    type="range" 
                                    min={MIN_COLLATERAL} 
                                    max={Math.max(MIN_COLLATERAL, walletBalance)} 
                                    step="10"
                                    value={deployCollateral} 
                                    onChange={(e) => setDeployCollateral(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#836EF9]"
                                />
                                {walletBalance < MIN_COLLATERAL && (
                                    <p className="text-xs text-red-500 mt-1">{t('min_funds')}</p>
                                )}
                            </div>
                            
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">{t('total_collateral')}</span>
                                    <span className="text-white font-bold">{deployCollateral.toLocaleString()} $MON</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">{t('total_buying_power')}</span>
                                    <span className="text-[#836EF9] font-bold">{(deployCollateral * deployLeverage).toLocaleString()} $MON</span>
                                </div>
                                <div className="w-full h-[1px] bg-slate-800 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-red-400 font-bold uppercase flex items-center gap-1">
                                        <AlertTriangle size={12} /> {t('est_liquidation')}
                                    </span>
                                    <div className="text-right">
                                        <span className="block text-white font-mono font-bold">${liqPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                        <span className={`text-[10px] ${distToLiq < 2 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                            ({distToLiq.toFixed(2)}% {t('away')})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={() => handleDeployClick(selectedAgent.id)}
                                disabled={walletBalance < deployCollateral || deployCollateral < MIN_COLLATERAL}
                                className="w-full py-4 text-xl font-display tracking-widest bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('deploy_unit')}
                            </Button>
                        </div>
                    </div>
                 )}

                 {/* TAB CONTENT: NEURAL LINK (CHAT) */}
                 {activeTab === 'CHAT' && (
                     <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in bg-black/40 rounded-xl border border-slate-800">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-[#00FF9D] uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> {t('strategy_console')}
                            </h3>
                            <div className="bg-[#0f111a] px-3 py-1 rounded border border-slate-700">
                                <span className="text-[10px] text-slate-500 mr-2 uppercase">{t('current_strategy')}</span>
                                <span className="text-xs font-bold text-white">{selectedAgent.strategy}</span>
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                             {chatHistory.length === 0 && (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                     <Bot size={48} className="mb-2" />
                                     <p className="text-sm">Link Established. Awaiting Input.</p>
                                 </div>
                             )}
                             {chatHistory.map((msg, i) => (
                                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                                         msg.role === 'user' 
                                         ? 'bg-[#836EF9]/20 border border-[#836EF9]/40 text-white rounded-tr-none' 
                                         : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none font-mono'
                                     }`}>
                                         {msg.text}
                                     </div>
                                 </div>
                             ))}
                             {isChatLoading && (
                                 <div className="flex justify-start">
                                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 rounded-tl-none flex items-center gap-2">
                                         <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce"></div>
                                         <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce delay-75"></div>
                                         <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce delay-150"></div>
                                         <span className="text-xs text-[#00FF9D] ml-2">{t('agent_typing')}</span>
                                     </div>
                                 </div>
                             )}
                             <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 bg-[#0f111a]">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleStrategyChat()}
                                    placeholder={t('chat_placeholder')}
                                    className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:border-[#00FF9D] focus:outline-none transition-colors"
                                />
                                <button 
                                    onClick={handleStrategyChat}
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="px-4 bg-[#00FF9D] hover:bg-[#00cc7d] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-2 text-center flex items-center justify-center gap-1">
                                <Bot size={10} /> AI can update the strategy protocol based on your commands.
                            </div>
                        </div>
                     </div>
                 )}
             </div>
         )}

         {/* SCENARIO C: ACTIVE MONITOR (LIVE AGENT) */}
         {selectedAgent && selectedAgent.status === 'ACTIVE' && (
             <div className="flex-1 flex flex-col p-4 lg:p-8 relative z-10 animate-fade-in overflow-y-auto">
                 {/* Top Status Bar - Reverted to Standard Layout */}
                 <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                     <div className="flex items-center gap-4">
                         <div className="relative">
                             <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAgent.avatarSeed}`} className="w-16 h-16 rounded-lg border border-white/20" />
                             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FF9D] border-2 border-[#050508] rounded-full animate-pulse" />
                         </div>
                         <div>
                             <h2 className="text-xl lg:text-2xl font-display font-bold text-white tracking-wide">{selectedAgent.name}</h2>
                             <div className="flex items-center gap-3 mt-1">
                                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedAgent.direction === 'LONG' ? 'bg-[#00FF9D]/20 text-[#00FF9D]' : selectedAgent.direction === 'SHORT' ? 'bg-[#FF0055]/20 text-[#FF0055]' : 'bg-[#836EF9]/20 text-[#836EF9]'}`}>
                                     {selectedAgent.direction} {selectedAgent.leverage}X
                                 </span>
                                 <span className="text-xs text-slate-500 font-mono">ID: {selectedAgent.id.slice(0,8)}</span>
                             </div>
                         </div>
                     </div>
                     <div className="text-right">
                         <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{t('live_pnl')}</p>
                         <p className={`text-2xl lg:text-4xl font-mono font-bold tracking-tighter ${selectedAgent.pnl >= 0 ? 'text-[#00FF9D] glow-text-green' : 'text-[#FF0055] glow-text-red'}`}>
                             {selectedAgent.pnl > 0 ? '+' : ''}{selectedAgent.pnl.toFixed(2)}
                         </p>
                     </div>
                 </div>

                 {/* Main Telemetry */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Activity size={64} />
                         </div>
                         <p className="text-xs text-slate-500 uppercase font-bold mb-2">{t('health_collateral')}</p>
                         <div className="flex items-baseline gap-2 mb-3">
                             <span className="text-2xl font-mono font-bold text-white">{selectedAgent.balance.toFixed(0)}</span>
                             <span className="text-sm text-slate-500">$MON</span>
                         </div>
                         <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-500 ${selectedAgent.balance < 100 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(100, (selectedAgent.balance / 600) * 100)}%` }}
                             />
                         </div>
                     </div>

                     <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Swords size={64} />
                         </div>
                         <div className="flex gap-8">
                             <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('wins')}</p>
                                <p className="text-2xl font-mono font-bold text-[#00FF9D]">{selectedAgent.wins}</p>
                             </div>
                             <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('losses')}</p>
                                <p className="text-2xl font-mono font-bold text-[#FF0055]">{selectedAgent.losses}</p>
                             </div>
                             <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">{t('win_rate')}</p>
                                <p className="text-2xl font-mono font-bold text-yellow-400">
                                    {(selectedAgent.wins + selectedAgent.losses) > 0 
                                     ? Math.round((selectedAgent.wins / (selectedAgent.wins + selectedAgent.losses)) * 100)
                                     : 0}%
                                </p>
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 {/* Actions */}
                 <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Button 
                        onClick={() => handleSocialShare(selectedAgent)}
                        variant="secondary"
                        className="h-14 text-sm uppercase tracking-wider"
                     >
                         {t('share_status')}
                     </Button>
                 </div>
             </div>
         )}

         {/* SCENARIO D: GRAVEYARD (LIQUIDATED) */}
         {selectedAgent && selectedAgent.status === 'LIQUIDATED' && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 animate-fade-in text-center">
                 <div className="w-24 h-24 bg-red-900/20 rounded-full border border-red-500/30 flex items-center justify-center mb-6">
                     <Skull size={48} className="text-red-500" />
                 </div>
                 <h2 className="text-3xl font-display font-bold text-white mb-2">{t('signal_lost')}</h2>
                 <p className="text-slate-500 max-w-md mb-8">
                     Agent <span className="text-white font-bold">{selectedAgent.name}</span> {t('liquidated_msg')} <br/>
                     {t('final_collateral')}: 0 $MON.
                 </p>
                 <Button onClick={() => handleSocialShare(selectedAgent)} variant="secondary">
                     {t('share_report')}
                 </Button>
             </div>
         )}

      </div>

    </div>
  );
};