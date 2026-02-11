import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Agent, Direction, MarketState } from '../types';
import { Button } from './Button';
import { Bot, Plus, User, Zap, Crosshair, ChevronRight, Activity, AtSign, Shield, Skull, TrendingUp, TrendingDown, Swords, Terminal, AlertTriangle, Wind, Scan, CheckCircle2, ArrowLeft, Coins, MessageSquare, Send, Brain, Sparkles, Rocket, X, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { refineAgentStrategy } from '../services/geminiService';
import { AgentCard } from './AgentCard';
import { MintingLoader } from './MintingLoader';
import { NFT3DCard } from './NFT3DCard';

interface AgentsProps {
  agents: Agent[];
  market: MarketState;
  onMint: (twitterHandle?: string, nameHint?: string) => Promise<Agent | null>;
  onDeploy: (agentId: string, direction: Direction, leverage: number, collateral: number) => Promise<void>;
  onWithdraw: (agentId: string) => Promise<void>;
  walletBalance: number;
  shouldHighlightFab?: boolean;
}

const FABRICATION_COST = 100;
const MIN_COLLATERAL = 100;

export const Agents: React.FC<AgentsProps> = ({ agents, market, onMint, onDeploy, onWithdraw, walletBalance, shouldHighlightFab }) => {
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

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawingAgent, setWithdrawingAgent] = useState<Agent | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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

  const handleWithdrawClick = (agent: Agent) => {
    setWithdrawingAgent(agent);
    setWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawingAgent) return;
    
    setWithdrawLoading(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    await onWithdraw(withdrawingAgent.id);
    
    setWithdrawLoading(false);
    setWithdrawModalOpen(false);
    setWithdrawingAgent(null);
  };

  const handleCancelWithdraw = () => {
    setWithdrawModalOpen(false);
    setWithdrawingAgent(null);
  };

  const handleAcceptAgent = () => {
      if (generatedAgent) {
          setSelection(generatedAgent.id);
          // 直接进入部署页面，不清空状态
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
                                        Agent Name
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={nameHint}
                                            onChange={(e) => setNameHint(e.target.value)}
                                            placeholder="e.g. CyberWolf..."
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
                                        Twitter (Optional)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">@</span>
                                        <input 
                                            type="text"
                                            value={twitterHandle}
                                            onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
                                            placeholder="username"
                                            className="w-full bg-black/50 border-2 border-slate-700 rounded-lg py-2.5 pl-7 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-[#836EF9] focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Cost & Action - Compact */}
                                <div className="pt-3 border-t border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">Cost</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-mono font-bold text-white">{FABRICATION_COST}</span>
                                            <span className="text-xs text-slate-500">$MON</span>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        onClick={handleConfirmFabrication}
                                        disabled={walletBalance < FABRICATION_COST || !nameHint.trim()}
                                        className="w-full py-3 text-sm font-display bg-gradient-to-r from-[#836EF9] to-[#00FF9D] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg"
                                    >
                                        {walletBalance < FABRICATION_COST ? (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <AlertTriangle size={16} /> Insufficient
                                            </span>
                                        ) : !nameHint.trim() ? (
                                            <span>Enter Name</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <Zap size={16} /> Mint Agent
                                            </span>
                                        )}
                                    </Button>
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

         {/* SCENARIO B: DEPLOYMENT CONSOLE (IDLE AGENT) - Optimized */}
         {selectedAgent && selectedAgent.status === 'IDLE' && (
             <div className="flex-1 flex flex-col p-4 lg:p-6 relative z-10 animate-fade-in overflow-y-auto">
                 {/* Agent Header Card */}
                 <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 mb-6">
                     <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                         {/* Avatar */}
                         <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-black border-2 border-slate-700 overflow-hidden shadow-lg shrink-0 mx-auto lg:mx-0">
                             <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAgent.avatarSeed}`} className="w-full h-full object-cover" />
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
                                 <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs border border-amber-500/20 font-medium">
                                     {t('standby')}
                                 </span>
                             </div>
                         </div>
                         
                         {/* Balance */}
                         <div className="text-center lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6">
                             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('net_balance')}</p>
                             <p className="text-2xl font-mono font-bold text-white">{walletBalance.toLocaleString()}</p>
                             <p className="text-xs text-slate-500">$MON</p>
                         </div>
                     </div>
                 </div>
                 
                 {/* Tabs - Modern Style */}
                 <div className="flex gap-2 mb-6 bg-black/40 p-1.5 rounded-2xl w-fit mx-auto lg:mx-0 border border-slate-800">
                    <button 
                        onClick={() => setActiveTab('DEPLOY')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'DEPLOY' ? 'bg-[#836EF9] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Rocket size={16} /> {t('deploy_unit')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('CHAT')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'CHAT' ? 'bg-[#00FF9D] text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={16} /> {t('neural_link')}
                    </button>
                 </div>

                 {/* TAB CONTENT: DEPLOYMENT - Optimized Layout */}
                 {activeTab === 'DEPLOY' && (
                    <div className="flex-1 animate-fade-in">
                        {/* Direction Selection - Compact */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Crosshair size={14} /> {t('strategy_vector')}
                            </label>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {/* Auto */}
                                <button 
                                    onClick={() => setDeployDirection('AUTO')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        deployDirection === 'AUTO'
                                        ? 'bg-[#836EF9]/20 border-[#836EF9] shadow-[0_0_20px_rgba(131,110,249,0.2)]'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <Brain size={20} className={deployDirection === 'AUTO' ? 'text-[#836EF9]' : 'text-slate-500'} />
                                    <span className={`text-sm font-bold ${deployDirection === 'AUTO' ? 'text-white' : 'text-slate-400'}`}>{t('auto')}</span>
                                </button>
                                
                                {/* Long */}
                                <button 
                                    onClick={() => setDeployDirection('LONG')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        deployDirection === 'LONG'
                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <TrendingUp size={20} className={deployDirection === 'LONG' ? 'text-emerald-400' : 'text-slate-500'} />
                                    <span className={`text-sm font-bold ${deployDirection === 'LONG' ? 'text-white' : 'text-slate-400'}`}>{t('long')}</span>
                                </button>
                                
                                {/* Short */}
                                <button 
                                    onClick={() => setDeployDirection('SHORT')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        deployDirection === 'SHORT'
                                        ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(251,113,133,0.2)]'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <TrendingDown size={20} className={deployDirection === 'SHORT' ? 'text-rose-400' : 'text-slate-500'} />
                                    <span className={`text-sm font-bold ${deployDirection === 'SHORT' ? 'text-white' : 'text-slate-400'}`}>{t('short')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Sliders Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Leverage */}
                            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Zap size={14} /> Leverage
                                    </label>
                                    <span className={`text-xl font-mono font-bold ${deployLeverage > 10 ? 'text-rose-400' : deployLeverage > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
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
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>1x</span>
                                    <span>10x</span>
                                    <span>20x</span>
                                </div>
                            </div>

                            {/* Margin */}
                            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Coins size={14} /> Margin
                                    </label>
                                    <span className="text-xl font-mono font-bold text-white">{deployCollateral.toLocaleString()}</span>
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
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>{MIN_COLLATERAL}</span>
                                    <span>Available: {walletBalance.toLocaleString()}</span>
                                </div>
                                {walletBalance < MIN_COLLATERAL && (
                                    <p className="text-xs text-red-500 mt-2">{t('min_funds')}</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-[#0f111a] to-black border border-slate-800 rounded-2xl p-5 mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Position Summary</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-black/50 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Direction</p>
                                    <p className={`text-lg font-bold ${deployDirection === 'AUTO' ? 'text-violet-400' : deployDirection === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {deployDirection}
                                    </p>
                                </div>
                                <div className="bg-black/50 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Leverage</p>
                                    <p className="text-lg font-bold text-white">{deployLeverage}x</p>
                                </div>
                                <div className="bg-black/50 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Margin</p>
                                    <p className="text-lg font-bold text-white">{deployCollateral.toLocaleString()} $MON</p>
                                </div>
                                <div className="bg-black/50 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Position Size</p>
                                    <p className="text-lg font-bold text-[#836EF9]">{(deployCollateral * deployLeverage).toLocaleString()} $MON</p>
                                </div>
                            </div>
                            
                            {/* Liquidation Warning */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-rose-400">
                                    <AlertTriangle size={14} />
                                    <span className="text-xs font-bold uppercase">Est. Liquidation</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-mono font-bold">${liqPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                                    <p className={`text-[10px] ${distToLiq < 2 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                        {distToLiq.toFixed(2)}% {t('away')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deploy Button */}
                        <Button 
                            onClick={() => handleDeployClick(selectedAgent.id)}
                            disabled={walletBalance < deployCollateral || deployCollateral < MIN_COLLATERAL}
                            className="w-full py-4 text-lg font-display bg-gradient-to-r from-[#836EF9] to-[#00FF9D] hover:opacity-90 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                        >
                            {walletBalance < deployCollateral ? (
                                <span className="flex items-center justify-center gap-2">
                                    <AlertTriangle size={20} /> Insufficient Balance
                                </span>
                            ) : deployCollateral < MIN_COLLATERAL ? (
                                <span>Minimum {MIN_COLLATERAL} $MON Required</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Rocket size={20} /> {t('deploy_unit')}
                                </span>
                            )}
                        </Button>
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
                     <Button 
                        onClick={() => handleWithdrawClick(selectedAgent)}
                        className="h-14 text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-black"
                     >
                        Withdraw & Exit Arena
                     </Button>
                 </div>
             </div>
         )}

         {/* SCENARIO D: EXITED (IDLE after active) - Show Deploy Page */}
         {selectedAgent && selectedAgent.status === 'IDLE' && (selectedAgent.wins > 0 || selectedAgent.losses > 0) && (
             <div className="flex-1 flex flex-col p-4 lg:p-6 relative z-10 animate-fade-in overflow-y-auto">
                 {/* Agent Header Card */}
                 <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 mb-4">
                     <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                         {/* Avatar */}
                         <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-black border-2 border-slate-700 overflow-hidden shadow-lg shrink-0 mx-auto lg:mx-0">
                             <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAgent.avatarSeed}`} className="w-full h-full object-cover" />
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
                                 <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs border border-emerald-500/20 font-medium">
                                     Exited Arena
                                 </span>
                             </div>
                         </div>
                         
                         {/* PnL Display */}
                         <div className="text-center lg:text-right shrink-0">
                             <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Final PnL</p>
                             <p className={`text-2xl lg:text-3xl font-mono font-bold ${selectedAgent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {selectedAgent.pnl > 0 ? '+' : ''}{selectedAgent.pnl.toFixed(2)} $MON
                             </p>
                         </div>
                     </div>
                 </div>

                 {/* Performance Stats */}
                 <div className="grid grid-cols-3 gap-3 mb-4">
                     <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3 text-center">
                         <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Wins</p>
                         <p className="text-xl font-bold text-emerald-400">{selectedAgent.wins}</p>
                     </div>
                     <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3 text-center">
                         <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Losses</p>
                         <p className="text-xl font-bold text-rose-400">{selectedAgent.losses}</p>
                     </div>
                     <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3 text-center">
                         <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Win Rate</p>
                         <p className="text-xl font-bold text-[#836EF9]">
                             {selectedAgent.wins + selectedAgent.losses > 0 
                                 ? Math.round((selectedAgent.wins / (selectedAgent.wins + selectedAgent.losses)) * 100) 
                                 : 0}%
                         </p>
                     </div>
                 </div>

                 {/* Deploy Configuration */}
                 <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 lg:p-6 flex-1">
                     <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                         <Rocket size={20} className="text-[#00FF9D]" />
                         Redeploy to Arena
                     </h3>
                     
                     {/* Direction Selection */}
                     <div className="mb-6">
                         <label className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Direction</label>
                         <div className="grid grid-cols-3 gap-2">
                             {(['AUTO', 'LONG', 'SHORT'] as Direction[]).map((dir) => (
                                 <button
                                     key={dir}
                                     onClick={() => setDeployDirection(dir)}
                                     className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                         deployDirection === dir
                                             ? dir === 'LONG' ? 'bg-emerald-500 text-black' : dir === 'SHORT' ? 'bg-rose-500 text-white' : 'bg-[#836EF9] text-white'
                                             : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                     }`}
                                 >
                                     {dir}
                                 </button>
                             ))}
                         </div>
                     </div>
                     
                     {/* Leverage Slider */}
                     <div className="mb-6">
                         <div className="flex justify-between items-center mb-3">
                             <label className="text-xs text-slate-500 uppercase tracking-wider">Leverage</label>
                             <span className="text-lg font-mono font-bold text-[#00FF9D]">{deployLeverage}X</span>
                         </div>
                         <input
                             type="range"
                             min="1"
                             max="100"
                             value={deployLeverage}
                             onChange={(e) => setDeployLeverage(Number(e.target.value))}
                             className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9D]"
                         />
                         <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                             <span>1X</span>
                             <span>50X</span>
                             <span>100X</span>
                         </div>
                     </div>
                     
                     {/* Collateral Input */}
                     <div className="mb-6">
                         <div className="flex justify-between items-center mb-3">
                             <label className="text-xs text-slate-500 uppercase tracking-wider">Collateral</label>
                             <span className="text-xs text-slate-500">Balance: {walletBalance} $MON</span>
                         </div>
                         <div className="relative">
                             <input
                                 type="number"
                                 value={deployCollateral}
                                 onChange={(e) => setDeployCollateral(Math.max(0, Number(e.target.value)))}
                                 className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-[#00FF9D] focus:outline-none transition-colors"
                             />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$MON</span>
                         </div>
                     </div>
                     
                     {/* Deploy Button */}
                     <Button
                         onClick={() => handleDeployClick(selectedAgent.id)}
                         disabled={deployCollateral < 50 || deployCollateral > walletBalance}
                         className="w-full h-14 text-base uppercase tracking-wider bg-gradient-to-r from-[#836EF9] to-[#00FF9D] text-black font-bold hover:opacity-90 disabled:opacity-50"
                     >
                         <Rocket size={18} className="mr-2" />
                         Deploy to Arena
                     </Button>
                     
                     {deployCollateral < 50 && (
                         <p className="text-xs text-rose-500 mt-2 text-center">Minimum collateral is 50 $MON</p>
                     )}
                     
                     {/* Share Button */}
                     <div className="mt-4 flex gap-2">
                         <Button 
                             onClick={() => handleSocialShare(selectedAgent)} 
                             variant="secondary"
                             className="flex-1 h-12 text-sm"
                         >
                             Share Results
                         </Button>
                     </div>
                 </div>
             </div>
         )}

         {/* SCENARIO E: GRAVEYARD (LIQUIDATED) - Deprecated */}
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

      {/* Withdraw Confirmation Modal */}
      {withdrawModalOpen && withdrawingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Wallet size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
                  <p className="text-xs text-slate-400">{withdrawingAgent.name}</p>
                </div>
              </div>
              <button 
                onClick={handleCancelWithdraw}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount Display */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Current Balance</span>
                <span className="text-xl font-mono font-bold text-white">{withdrawingAgent.balance.toFixed(2)} $MON</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">PnL</span>
                <span className={`text-sm font-mono font-bold ${withdrawingAgent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {withdrawingAgent.pnl >= 0 ? '+' : ''}{withdrawingAgent.pnl.toFixed(2)} $MON
                </span>
              </div>
              <div className="h-px bg-slate-800 my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">To Receive</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">{withdrawingAgent.balance.toFixed(2)} $MON</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-500/80">
                Withdrawing will exit your agent from the arena. You can redeploy later with new collateral.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleCancelWithdraw}
                variant="secondary"
                className="h-12"
                disabled={withdrawLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmWithdraw}
                className="h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                disabled={withdrawLoading}
              >
                {withdrawLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Confirm Withdraw'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};