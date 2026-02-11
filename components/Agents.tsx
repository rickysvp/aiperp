import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Agent, Direction, MarketState } from '../types';
import { Button } from './Button';
import { Bot, Plus, User, Zap, Crosshair, ChevronRight, Activity, AtSign, Shield, Skull, TrendingUp, TrendingDown, Swords, Terminal, AlertTriangle, Wind, Scan, CheckCircle2, ArrowLeft, Coins, MessageSquare, Send, Brain, Sparkles, Rocket, X, Wallet, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { refineAgentStrategy } from '../services/kimiService';
import { AgentCard } from './AgentCard';
import { MintingLoader } from './MintingLoader';
import { NFT3DCard } from './NFT3DCard';
import { AgentsDashboard } from './AgentsDashboard';

interface AgentsProps {
  agents: Agent[];
  market: MarketState;
  onMint: (twitterHandle?: string, nameHint?: string) => Promise<Agent | null>;
  onDeploy: (agentId: string, direction: Direction, leverage: number, collateral: number) => Promise<void>;
  onWithdraw: (agentId: string) => Promise<void>;
  onAddAgent: (agent: Agent) => void;
  walletBalance: number;
  shouldHighlightFab?: boolean;
}

const FABRICATION_COST = 100;
const MIN_COLLATERAL = 100;

export const Agents: React.FC<AgentsProps> = ({ agents, market, onMint, onDeploy, onWithdraw, onAddAgent, walletBalance, shouldHighlightFab }) => {
  const { t } = useLanguage();
  // Group Agents
  const { activeAgents, idleAgents, deadAgents, hasAgents } = useMemo(() => {
    const userAgents = agents.filter(a => a.owner === 'USER');
    return {
        activeAgents: userAgents.filter(a => a.status === 'ACTIVE'),
        idleAgents: userAgents.filter(a => a.status === 'IDLE'),
        deadAgents: userAgents.filter(a => a.status === 'LIQUIDATED').reverse(),
        hasAgents: userAgents.length > 0
    };
  }, [agents]);

  // Selection State: 'FABRICATE' or agentId or '' (dashboard)
  // Default to dashboard if user has agents, otherwise show FABRICATE page
  const [selection, setSelection] = useState<string>(hasAgents ? '' : 'FABRICATE');

  // Update selection when first agent is created (from FABRICATE to dashboard)
  useEffect(() => {
    // Only run when hasAgents changes from false to true, not on every selection change
    if (hasAgents && selection === 'FABRICATE') {
      setSelection('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAgents]);
  
  // Mobile Navigation State (List vs Detail)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);

  // Minting State
  const [fabricationStep, setFabricationStep] = useState<'IDLE' | 'CONFIG' | 'GENERATING' | 'REVEAL'>('IDLE');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [nameHint, setNameHint] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState<Agent | null>(null);

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

  // Withdraw State - Simple toast notification
  const [withdrawToast, setWithdrawToast] = useState<{show: boolean; agentName: string; amount: number}>({show: false, agentName: '', amount: 0});

  const selectedAgent = agents.find(a => a.id === selection);

  // Reset states when selection changes
  useEffect(() => {
    setChatHistory([]);
    setActiveTab('DEPLOY');
  }, [selection]);



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

  const mintPromiseRef = useRef<Promise<Agent | null> | null>(null);

  const handleConfirmFabrication = () => {
    console.log('handleConfirmFabrication called', { nameHint, twitterHandle, walletBalance, FABRICATION_COST });
    setFabricationStep('GENERATING');
    // 立即开始铸造，与加载动画并行
    mintPromiseRef.current = onMint(twitterHandle.replace('@', ''), nameHint || "Anonymous");
  };

  const handleMintingComplete = async () => {
    // 等待铸造完成（如果还没完成的话）
    if (mintPromiseRef.current) {
      const newAgent = await mintPromiseRef.current;
      if (newAgent) {
          setGeneratedAgent(newAgent);
          setFabricationStep('REVEAL');
      } else {
          setFabricationStep('CONFIG'); // Failed
      }
      mintPromiseRef.current = null;
    }
  };

  const handleAcceptAgent = () => {
      if (generatedAgent) {
          // Add agent to list first
          onAddAgent(generatedAgent);
          // Then select it for deployment
          setSelection(generatedAgent.id);
          setFabricationStep('IDLE');
          setGeneratedAgent(null);
          setNameHint('');
          // twitterHandle保留，因为部署页面可能需要
      }
  };

  const handleDeployClick = async (agentId: string) => {
    await onDeploy(agentId, deployDirection, deployLeverage, deployCollateral);
    setSelection(agentId);
  };

  // Withdraw with confirmation modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawingAgent, setWithdrawingAgent] = useState<Agent | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<{show: boolean; amount: number; agentName: string}>({show: false, amount: 0, agentName: ''});

  const handleWithdrawClick = (agent: Agent) => {
    setWithdrawingAgent(agent);
    setWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawingAgent) return;

    const amount = withdrawingAgent.balance;
    const name = withdrawingAgent.name;

    setWithdrawLoading(true);

    // Execute withdraw immediately (synchronous state update)
    await onWithdraw(withdrawingAgent.id);

    // Close modal
    setWithdrawModalOpen(false);
    setWithdrawingAgent(null);
    setWithdrawLoading(false);

    // Show success toast
    setWithdrawSuccess({show: true, amount, agentName: name});
    setTimeout(() => {
      setWithdrawSuccess({show: false, amount: 0, agentName: ''});
    }, 3000);
  };

  const handleCancelWithdraw = () => {
    setWithdrawModalOpen(false);
    setWithdrawingAgent(null);
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
  const renderAgentListItem = (agent: Agent, index: number) => {
      const totalGames = agent.wins + agent.losses;
      const winRate = totalGames > 0 ? Math.round((agent.wins / totalGames) * 100) : 0;

      return (
        <div
            key={agent.id}
            className={`group p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden mb-2 ${
                selection === agent.id
                ? 'bg-[#836EF9]/10 border-[#836EF9] shadow-[0_0_15px_rgba(131,110,249,0.2)]'
                : 'bg-[#0f111a] border-slate-800 hover:border-slate-600 hover:bg-[#151824]'
            }`}
        >
            {/* Selection Indicator */}
            {selection === agent.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#836EF9]" />}

            <div
                onClick={() => handleSelectAgent(agent.id)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
                <div className={`w-10 h-10 rounded-lg bg-black shrink-0 overflow-hidden border ${agent.status === 'LIQUIDATED' ? 'border-slate-800 grayscale opacity-50' : 'border-slate-700'}`}>
                    <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h4 className={`text-xs font-bold font-display truncate ${selection === agent.id ? 'text-white' : 'text-slate-300'}`}>{agent.name}</h4>
                        {agent.status === 'ACTIVE' && (
                            <span className={`text-[10px] font-mono ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                                {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)} $MON
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">#{String(index + 1).padStart(4, '0')}</span>
                        <div className="flex items-center gap-2">
                            <span className={`${winRate > 50 ? 'text-[#00FF9D]' : 'text-slate-400'}`}>WR: {winRate}%</span>
                            {agent.status === 'ACTIVE' && agent.balance > 0 && (
                                <span className={agent.pnl / agent.balance >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}>
                                    {agent.pnl / agent.balance >= 0 ? '+' : ''}{(agent.pnl / agent.balance * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
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
                     {activeAgents.map((agent, idx) => renderAgentListItem(agent, idx))}
                 </div>
             )}

             {/* Idle Section */}
             {idleAgents.length > 0 && (
                 <div>
                     <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                         <Terminal size={10} /> {t('awaiting_orders')} ({idleAgents.length})
                     </h3>
                     {idleAgents.map((agent, idx) => renderAgentListItem(agent, activeAgents.length + idx))}
                 </div>
             )}

             {/* Graveyard Section */}
             {deadAgents.length > 0 && (
                 <div>
                     <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                         <Skull size={10} /> {t('decommissioned')} ({deadAgents.length})
                     </h3>
                     {deadAgents.map((agent, idx) => renderAgentListItem(agent, activeAgents.length + idleAgents.length + idx))}
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

         {/* SCENARIO D: DASHBOARD OVERVIEW - Default view when no agent selected */}
         {selection !== 'FABRICATE' && !selectedAgent && (
             <div className="flex-1 relative z-10">
                 <AgentsDashboard
                     agents={agents.filter(a => a.owner === 'USER')}
                     onSelectAgent={(id) => {
                         setSelection(id);
                         setShowDetailOnMobile(true);
                     }}
                     onMintNew={handleStartFabrication}
                 />
             </div>
         )}

         {/* SCENARIO A: FABRICATION TERMINAL - Compact Single Screen */}
         {selection === 'FABRICATE' && (
             <div className="flex-1 flex flex-col p-3 lg:p-4 relative z-10 overflow-hidden">
                 {/* Step 1: Config - Compact Layout */}
                 {(fabricationStep === 'IDLE' || fabricationStep === 'CONFIG') && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                        <div className="max-w-md w-full">
                            {/* Compact Header */}
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#836EF9] to-[#00FF9D] rounded-xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(131,110,249,0.4)]">
                                    <Bot size={24} className="text-white" />
                                </div>
                                <h2 className="text-xl font-display font-bold text-white">{t('neural_foundry')}</h2>
                            </div>

                            {/* Compact Form Card */}
                            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
                                {/* Agent Name Input */}
                                 <div className="space-y-1">
                                     <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                         <Sparkles size={12} className="text-[#836EF9]" />
                                         {t('agent_name')}
                                     </label>
                                     <div className="relative">
                                         <input
                                             type="text"
                                             value={nameHint}
                                             onChange={(e) => setNameHint(e.target.value)}
                                             placeholder={t('agent_name_placeholder')}
                                             className="w-full bg-black/50 border-2 border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600 focus:border-[#836EF9] focus:outline-none transition-all"
                                         />
                                        {nameHint && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <CheckCircle2 size={16} className="text-[#00FF9D]" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Twitter Handle Input */}
                                 <div className="space-y-1">
                                     <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                         <AtSign size={12} className="text-[#836EF9]" />
                                         {t('twitter_optional')}
                                     </label>
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">@</span>
                                         <input
                                             type="text"
                                             value={twitterHandle}
                                             onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
                                             placeholder={t('twitter_placeholder')}
                                             className="w-full bg-black/50 border-2 border-slate-700 rounded-lg py-2.5 pl-7 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-[#836EF9] focus:outline-none transition-all"
                                         />
                                     </div>
                                 </div>

                                {/* Cost & Action - Compact */}
                                 <div className="pt-3 border-t border-slate-800 space-y-3">
                                     <div className="flex items-center justify-between">
                                         <span className="text-xs text-slate-400">{t('cost')}</span>
                                         <div className="flex items-center gap-1">
                                             <span className="text-lg font-mono font-bold text-white">{FABRICATION_COST}</span>
                                             <span className="text-xs text-slate-500">$MON</span>
                                         </div>
                                     </div>

                                     <button
                                         onClick={handleConfirmFabrication}
                                         disabled={walletBalance < FABRICATION_COST}
                                         className="w-full py-3 text-sm font-bold bg-gradient-to-r from-[#836EF9] to-[#00FF9D] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg text-black flex items-center justify-center gap-2"
                                     >
                                         {walletBalance < FABRICATION_COST ? (
                                             <>
                                                 <AlertTriangle size={16} /> {t('insufficient')}
                                             </>
                                         ) : (
                                             <>
                                                 <Zap size={16} /> {t('mint_agent')}
                                             </>
                                         )}
                                     </button>
                                 </div>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Step 2: Minting Loading with Progress */}
                 {fabricationStep === 'GENERATING' && (
                     <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                         <MintingLoader onComplete={handleMintingComplete} agentName={nameHint || 'Neural Agent'} />
                     </div>
                 )}

                 {/* Step 3: 3D NFT Card Reveal with Flip Animation */}
                 {fabricationStep === 'REVEAL' && generatedAgent && (
                     <div className="flex-1 flex flex-col items-center justify-center animate-fade-in overflow-y-auto py-8">
                         <NFT3DCard
                            agent={generatedAgent}
                            userName={nameHint}
                            nftNumber={agents.length + 1}
                            minterTwitter={twitterHandle}
                            onDeployNow={handleAcceptAgent}
                         />
                     </div>
                 )}
             </div>
         )}

         {/* UNIFIED AGENT DETAIL PAGE - All statuses in one module */}
         {selectedAgent && (
             <div className="flex-1 flex flex-col p-4 lg:p-6 relative z-10 animate-fade-in overflow-y-auto">
                 {/* Agent Header Card - Different styles based on status */}
                 <div className={`rounded-2xl p-4 lg:p-6 mb-4 border ${
                     selectedAgent.status === 'LIQUIDATED'
                         ? 'bg-red-900/10 border-red-500/30'
                         : 'bg-[#0f111a] border-slate-800'
                 }`}>
                     <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                         {/* Avatar */}
                         <div className={`relative w-20 h-20 lg:w-24 lg:h-24 shrink-0 mx-auto lg:mx-0 ${
                             selectedAgent.status === 'LIQUIDATED' ? 'grayscale opacity-50' : ''
                         }`}>
                             <div className={`w-full h-full rounded-2xl bg-black border-2 overflow-hidden shadow-lg ${
                                 selectedAgent.status === 'LIQUIDATED' ? 'border-red-500/30' : 'border-slate-700'
                             }`}>
                                 <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${selectedAgent.avatarSeed}`} className="w-full h-full object-cover" />
                             </div>
                             {selectedAgent.status === 'ACTIVE' && (
                                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00FF9D] border-2 border-[#050508] rounded-full animate-pulse" />
                             )}
                             {selectedAgent.status === 'LIQUIDATED' && (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <Skull size={32} className="text-red-500" />
                                 </div>
                             )}
                         </div>

                         {/* Info */}
                         <div className="flex-1 text-center lg:text-left">
                             <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2 justify-center lg:justify-start">
                                 <h2 className="text-xl lg:text-2xl font-display font-bold text-white">{selectedAgent.name}</h2>
                                 {selectedAgent.twitterHandle && (
                                     <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20 inline-flex items-center gap-1 w-fit mx-auto lg:mx-0">
                                         <AtSign size={10} /> {selectedAgent.twitterHandle}
                                     </span>
                                 )}
                             </div>
                             <p className="text-sm text-slate-400 italic mb-3">"{selectedAgent.bio}"</p>
                             <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                 <span className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300 border border-slate-700">
                                     {selectedAgent.strategy}
                                 </span>
                                 {selectedAgent.status === 'ACTIVE' && (
                                     <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/30">
                                         Active
                                     </span>
                                 )}
                                 {selectedAgent.status === 'IDLE' && (selectedAgent.wins > 0 || selectedAgent.losses > 0) && (
                                     <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600/20 text-slate-400 border border-slate-600/30">
                                         Idle
                                     </span>
                                 )}
                                 {selectedAgent.status === 'LIQUIDATED' && (
                                     <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                         Liquidated
                                     </span>
                                 )}
                                 {selectedAgent.status === 'ACTIVE' && (
                                     <span className={`text-xs font-bold px-2 py-1.5 rounded ${selectedAgent.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : selectedAgent.direction === 'SHORT' ? 'bg-rose-500/20 text-rose-400' : 'bg-[#836EF9]/20 text-[#836EF9]'}`}>
                                         {selectedAgent.direction} {selectedAgent.leverage}X
                                     </span>
                                 )}
                             </div>
                         </div>

                         {/* Financial Stats - Different for each status */}
                         <div className="text-center lg:text-right shrink-0 space-y-2">
                             {selectedAgent.status === 'ACTIVE' ? (
                                 <>
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">Live PnL</p>
                                         <p className={`text-2xl lg:text-3xl font-mono font-bold ${selectedAgent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                                             {selectedAgent.pnl > 0 ? '+' : ''}{selectedAgent.pnl.toFixed(2)} $MON
                                         </p>
                                     </div>
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">Balance</p>
                                         <p className="text-lg font-mono font-bold text-white">{selectedAgent.balance.toFixed(2)} $MON</p>
                                     </div>
                                     {/* ROI */}
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">ROI</p>
                                         <p className={`text-sm font-mono font-bold ${selectedAgent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                                             {selectedAgent.pnl >= 0 ? '+' : ''}{((selectedAgent.pnl / (selectedAgent.balance - selectedAgent.pnl + 0.001)) * 100).toFixed(2)}%
                                         </p>
                                     </div>
                                 </>
                             ) : selectedAgent.status === 'LIQUIDATED' ? (
                                 <>
                                     <div>
                                         <p className="text-xs text-red-400 uppercase tracking-widest">Final Status</p>
                                         <p className="text-2xl lg:text-3xl font-mono font-bold text-red-500">
                                             SIGNAL LOST
                                         </p>
                                     </div>
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">Collateral</p>
                                         <p className="text-lg font-mono font-bold text-red-400">0 $MON</p>
                                     </div>
                                 </>
                             ) : (
                                 <>
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">Final PnL</p>
                                         <p className={`text-2xl lg:text-3xl font-mono font-bold ${selectedAgent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                             {selectedAgent.pnl > 0 ? '+' : ''}{selectedAgent.pnl.toFixed(2)} $MON
                                         </p>
                                     </div>
                                     <div>
                                         <p className="text-xs text-slate-500 uppercase tracking-widest">Returned</p>
                                         <p className="text-lg font-mono font-bold text-white">{selectedAgent.balance.toFixed(2)} $MON</p>
                                     </div>
                                     {/* ROI for exited agents */}
                                     {selectedAgent.wins + selectedAgent.losses > 0 && (
                                         <div>
                                             <p className="text-xs text-slate-500 uppercase tracking-widest">Session ROI</p>
                                             <p className={`text-sm font-mono font-bold ${selectedAgent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                 {selectedAgent.pnl >= 0 ? '+' : ''}{((selectedAgent.pnl / (selectedAgent.balance - selectedAgent.pnl + 0.001)) * 100).toFixed(2)}%
                                             </p>
                                         </div>
                                     )}
                                 </>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Collateral Health Bar - Only for ACTIVE agents */}
                 {selectedAgent.status === 'ACTIVE' && (
                     <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 mb-4">
                         <div className="flex justify-between items-center mb-2">
                             <p className="text-xs text-slate-500 uppercase tracking-wider">Collateral Health</p>
                             <p className="text-xs font-mono text-slate-400">{Math.min(100, (selectedAgent.balance / 1000) * 100).toFixed(0)}%</p>
                         </div>
                         <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div
                                 className={`h-full transition-all duration-500 ${
                                     selectedAgent.balance < 200 ? 'bg-red-500 animate-pulse' :
                                     selectedAgent.balance < 500 ? 'bg-amber-500' :
                                     selectedAgent.direction === 'LONG' ? 'bg-[#00FF9D]' :
                                     selectedAgent.direction === 'SHORT' ? 'bg-[#FF0055]' :
                                     'bg-[#836EF9]'
                                 }`}
                                 style={{ width: `${Math.min(100, (selectedAgent.balance / 1000) * 100)}%` }}
                             />
                         </div>
                         <p className="text-[10px] text-slate-600 mt-1">Based on initial 1000 $MON collateral scale</p>
                     </div>
                 )}

                 {/* Performance Stats - Hidden for LIQUIDATED if no trades */}
                 {(selectedAgent.status !== 'LIQUIDATED' || selectedAgent.wins + selectedAgent.losses > 0) && (
                     <div className="grid grid-cols-4 gap-3 mb-4">
                         <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 text-center">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wins</p>
                             <p className="text-2xl font-bold text-emerald-400">{selectedAgent.wins}</p>
                         </div>
                         <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 text-center">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Losses</p>
                             <p className="text-2xl font-bold text-rose-400">{selectedAgent.losses}</p>
                         </div>
                         <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 text-center">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Win Rate</p>
                             <p className="text-2xl font-bold text-[#836EF9]">
                                 {selectedAgent.wins + selectedAgent.losses > 0
                                     ? Math.round((selectedAgent.wins / (selectedAgent.wins + selectedAgent.losses)) * 100)
                                     : 0}%
                             </p>
                         </div>
                         {/* Ranking - calculated from agents prop */}
                         <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 text-center">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Rank</p>
                             <p className="text-2xl font-bold text-yellow-400">
                                 #{agents.filter(a => a.status === 'ACTIVE' && a.pnl > selectedAgent.pnl).length + 1}
                             </p>
                         </div>
                     </div>
                 )}

                 {/* Agent Configuration */}
                 <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 mb-4">
                     <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                         <Brain size={18} className="text-[#836EF9]" />
                         Agent Configuration
                     </h3>

                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="bg-slate-900/50 rounded-lg p-3">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Strategy</p>
                             <p className="text-sm font-bold text-white">{selectedAgent.strategy}</p>
                         </div>
                         <div className="bg-slate-900/50 rounded-lg p-3">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Risk Level</p>
                             <p className="text-sm font-bold text-white">{selectedAgent.riskLevel}</p>
                         </div>
                         {selectedAgent.status === 'ACTIVE' ? (
                             <>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Direction</p>
                                     <p className="text-sm font-bold text-white">{selectedAgent.direction}</p>
                                 </div>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Leverage</p>
                                     <p className="text-sm font-bold text-white">{selectedAgent.leverage}X</p>
                                 </div>
                             </>
                         ) : selectedAgent.status === 'LIQUIDATED' ? (
                             <>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                     <p className="text-sm font-bold text-red-400">Destroyed</p>
                                 </div>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Trades</p>
                                     <p className="text-sm font-bold text-white">{selectedAgent.wins + selectedAgent.losses}</p>
                                 </div>
                             </>
                         ) : (
                             <>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                     <p className="text-sm font-bold text-slate-400">Exited Arena</p>
                                 </div>
                                 <div className="bg-slate-900/50 rounded-lg p-3">
                                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Trades</p>
                                     <p className="text-sm font-bold text-white">{selectedAgent.wins + selectedAgent.losses}</p>
                                 </div>
                             </>
                         )}
                     </div>
                 </div>

                 {/* IDLE Agent: Deploy Section */}
                 {selectedAgent.status === 'IDLE' && (
                     <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 mb-4">
                         <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                             <Rocket size={18} className="text-[#836EF9]" />
                             {t('deploy_section')}
                         </h3>

                         {/* Direction Selection */}
                         <div className="mb-4">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                                 <Crosshair size={14} /> {t('direction')}
                             </label>
                             <div className="grid grid-cols-3 gap-3">
                                 <button
                                     onClick={() => setDeployDirection('AUTO')}
                                     className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                         deployDirection === 'AUTO'
                                         ? 'bg-[#836EF9]/20 border-[#836EF9]'
                                         : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                     }`}
                                 >
                                     <Brain size={18} className={deployDirection === 'AUTO' ? 'text-[#836EF9]' : 'text-slate-500'} />
                                     <span className={`text-xs font-bold ${deployDirection === 'AUTO' ? 'text-white' : 'text-slate-400'}`}>AUTO</span>
                                 </button>
                                 <button
                                     onClick={() => setDeployDirection('LONG')}
                                     className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                         deployDirection === 'LONG'
                                         ? 'bg-emerald-500/10 border-emerald-500'
                                         : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                     }`}
                                 >
                                     <TrendingUp size={18} className={deployDirection === 'LONG' ? 'text-emerald-400' : 'text-slate-500'} />
                                     <span className={`text-xs font-bold ${deployDirection === 'LONG' ? 'text-white' : 'text-slate-400'}`}>LONG</span>
                                 </button>
                                 <button
                                     onClick={() => setDeployDirection('SHORT')}
                                     className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                         deployDirection === 'SHORT'
                                         ? 'bg-rose-500/10 border-rose-500'
                                         : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                     }`}
                                 >
                                     <TrendingDown size={18} className={deployDirection === 'SHORT' ? 'text-rose-400' : 'text-slate-500'} />
                                     <span className={`text-xs font-bold ${deployDirection === 'SHORT' ? 'text-white' : 'text-slate-400'}`}>SHORT</span>
                                 </button>
                             </div>
                         </div>

                         {/* Leverage & Collateral */}
                         <div className="grid grid-cols-2 gap-4 mb-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('leverage')}</label>
                                 <input
                                     type="range"
                                     min="1"
                                     max="20"
                                     value={deployLeverage}
                                     onChange={(e) => setDeployLeverage(parseInt(e.target.value))}
                                     className="w-full h-2 bg-slate-800 rounded-lg accent-[#836EF9]"
                                 />
                                 <p className="text-center text-sm font-mono text-white mt-1">{deployLeverage}x</p>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('collateral')}</label>
                                 <input
                                     type="range"
                                     min={MIN_COLLATERAL}
                                     max={Math.max(MIN_COLLATERAL, walletBalance)}
                                     step="10"
                                     value={deployCollateral}
                                     onChange={(e) => setDeployCollateral(parseInt(e.target.value))}
                                     className="w-full h-2 bg-slate-800 rounded-lg accent-[#836EF9]"
                                 />
                                 <p className="text-center text-sm font-mono text-white mt-1">{deployCollateral} $MON</p>
                             </div>
                         </div>

                         {/* Deploy Button */}
                         <Button
                             onClick={() => handleDeployClick(selectedAgent.id)}
                             disabled={walletBalance < deployCollateral || deployCollateral < MIN_COLLATERAL}
                             className="w-full py-3 text-base font-bold bg-gradient-to-r from-[#836EF9] to-[#00FF9D] hover:opacity-90 text-black disabled:opacity-50 rounded-xl"
                         >
                             {walletBalance < deployCollateral ? t('insufficient_balance') : `${t('deploy_with')} ${deployCollateral} $MON`}
                         </Button>
                     </div>
                 )}

                 {/* ACTIVE Agent: Strategy Chat Section */}
                 {selectedAgent.status === 'ACTIVE' && (
                     <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 mb-4">
                         <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                             <MessageSquare size={18} className="text-[#00FF9D]" />
                             {t('neural_link')}
                         </h3>

                         {/* Chat History */}
                         <div className="bg-black/40 rounded-xl border border-slate-800 p-3 mb-3 h-32 overflow-y-auto custom-scrollbar">
                             {chatHistory.length === 0 ? (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                     <Bot size={24} className="mb-1" />
                                     <p className="text-xs">{t('chat_placeholder')}</p>
                                 </div>
                             ) : (
                                 <div className="space-y-2">
                                     {chatHistory.map((msg, i) => (
                                         <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                             <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${
                                                 msg.role === 'user'
                                                 ? 'bg-[#836EF9]/20 border border-[#836EF9]/40 text-white'
                                                 : 'bg-slate-800 border border-slate-700 text-slate-200 font-mono'
                                             }`}>
                                                 {msg.text}
                                             </div>
                                         </div>
                                     ))}
                                     {isChatLoading && (
                                         <div className="flex justify-start">
                                             <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                                 <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-bounce"></div>
                                                 <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-bounce delay-75"></div>
                                                 <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-bounce delay-150"></div>
                                                 <span className="text-[10px] text-[#00FF9D] ml-1">{t('agent_typing')}</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>

                         {/* Input Area */}
                         <div className="flex gap-2">
                             <input
                                 type="text"
                                 value={chatInput}
                                 onChange={(e) => setChatInput(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleStrategyChat()}
                                 placeholder={t('chat_placeholder')}
                                 className="flex-1 bg-black border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00FF9D] focus:outline-none transition-colors"
                             />
                             <button
                                 onClick={handleStrategyChat}
                                 disabled={isChatLoading || !chatInput.trim()}
                                 className="px-3 bg-[#00FF9D] hover:bg-[#00cc7d] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                             >
                                 <Send size={16} />
                             </button>
                         </div>
                         <p className="text-[10px] text-slate-600 mt-2 text-center">
                             {t('current_strategy')}: {selectedAgent.strategy}
                         </p>
                     </div>
                 )}

                 {/* Actions - Different for each status */}
                 <div className="mt-auto">
                     {selectedAgent.status === 'ACTIVE' ? (
                         <div className="grid grid-cols-2 gap-3">
                             <Button
                                 onClick={() => handleSocialShare(selectedAgent)}
                                 variant="secondary"
                                 className="h-12"
                             >
                                 {t('share_status')}
                             </Button>
                             <Button
                                 onClick={() => handleWithdrawClick(selectedAgent)}
                                 className="h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                             >
                                 {t('withdraw')}
                             </Button>
                         </div>
                     ) : (
                         <Button
                             onClick={() => handleSocialShare(selectedAgent)}
                             variant="secondary"
                             className="h-12 w-full"
                         >
                             {selectedAgent.status === 'IDLE' ? t('share_agent') : t('share_report')}
                         </Button>
                     )}
                 </div>
             </div>
         )}

      </div>

      {/* Withdraw Confirmation Modal - Enhanced */}
      {withdrawModalOpen && withdrawingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('confirm_withdraw')}</h3>
                <p className="text-sm text-slate-400">{withdrawingAgent.name}</p>
              </div>
            </div>

            {/* Agent Stats Summary */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-800">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('current_balance')}</p>
                  <p className="text-xl font-mono font-bold text-white">{withdrawingAgent.balance.toFixed(2)} $MON</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">PnL</p>
                  <p className={`text-xl font-mono font-bold ${withdrawingAgent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {withdrawingAgent.pnl > 0 ? '+' : ''}{withdrawingAgent.pnl.toFixed(2)} $MON
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('win_rate')}</p>
                  <p className="text-sm font-mono font-bold text-white">
                    {withdrawingAgent.wins + withdrawingAgent.losses > 0
                      ? Math.round((withdrawingAgent.wins / (withdrawingAgent.wins + withdrawingAgent.losses)) * 100)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('total_trades')}</p>
                  <p className="text-sm font-mono font-bold text-white">{withdrawingAgent.wins + withdrawingAgent.losses}</p>
                </div>
              </div>
            </div>

            {/* Amount to Receive */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
              <p className="text-xs text-emerald-500/70 uppercase tracking-wider mb-1">{t('to_receive')}</p>
              <p className="text-3xl font-mono font-bold text-emerald-400">{withdrawingAgent.balance.toFixed(2)} $MON</p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-500/80">
                {t('withdraw_warning')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleCancelWithdraw}
                variant="secondary"
                className="flex-1 h-12"
                disabled={withdrawLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleConfirmWithdraw}
                className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                disabled={withdrawLoading}
              >
                {withdrawLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {t('processing')}
                  </span>
                ) : (
                  t('confirm')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Success Toast - Enhanced with Transfer Animation */}
      {withdrawSuccess.show && (
        <div className="fixed top-20 right-4 z-[100] animate-fade-in">
          <div className="bg-[#0f111a] border border-emerald-500/50 rounded-xl p-4 shadow-2xl shadow-emerald-500/20 min-w-[320px]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t('withdraw_success')}</p>
                <p className="text-xs text-slate-400">{withdrawSuccess.agentName}</p>
              </div>
            </div>

            {/* Transfer Animation */}
            <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                {/* From */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mb-1">
                    <Bot size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-500">Agent</span>
                </div>

                {/* Transfer Arrow & Amount */}
                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="relative w-full h-6 flex items-center justify-center">
                    {/* Animated arrow */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-slate-600 via-emerald-500 to-emerald-400"></div>
                    </div>
                    <ArrowRight size={16} className="text-emerald-400 relative z-10 animate-bounce" />
                  </div>
                  <div className="text-emerald-400 font-mono font-bold text-sm animate-pulse">
                    +{withdrawSuccess.amount.toFixed(2)} $MON
                  </div>
                </div>

                {/* To */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1 animate-pulse">
                    <Wallet size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-emerald-400">Wallet</span>
                </div>
              </div>
            </div>

            {/* Balance Update */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Wallet Balance Updated</span>
              <span className="text-emerald-400 font-mono">+{withdrawSuccess.amount.toFixed(2)} $MON</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};