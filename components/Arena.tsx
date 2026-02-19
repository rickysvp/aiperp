import React, { useState } from 'react';
import { MarketState, Agent, BattleLog, LootEvent, AssetSymbol } from '../types';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { Battlefield } from './Battlefield';
import { Sword, Zap, Activity, Shield, Skull, Crosshair } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ArenaProps {
  market: MarketState;
  agents: Agent[];
  logs: BattleLog[];
  lastLootEvent: LootEvent | null;
  selectedAsset: AssetSymbol;
  onAssetChange: (asset: AssetSymbol) => void;
}

// --- Internal Component: Battle Roster Item ---
// Specialized view just for the Arena lists (Combat Focused)
const BattleRosterItem = React.memo(({ agent, expanded, onClick }: { agent: Agent, expanded: boolean, onClick: () => void }) => {
    const { t } = useLanguage();
    const isUser = agent.owner === 'USER';
    const isLong = agent.direction === 'LONG';
    const isAuto = agent.direction === 'AUTO';
    const isRekt = agent.status === 'LIQUIDATED';
    
    // Theme Colors
    const themeColor = isAuto ? 'text-[#836EF9]' : isLong ? 'text-[#00FF9D]' : 'text-[#FF0055]';
    const borderColor = isAuto ? 'border-[#836EF9]' : isLong ? 'border-[#00FF9D]' : 'border-[#FF0055]';
    const barColor = isAuto ? 'bg-[#836EF9]' : isLong ? 'bg-[#00FF9D]' : 'bg-[#FF0055]';
    
    // Health / Collateral Percentage (Visually capped at 1000 MON for scale)
    const currentEquity = agent.balance + agent.pnl;
    const hpPercent = Math.min(100, (Math.max(0, currentEquity) / 1000) * 100);
    const roi = agent.balance > 0 ? (agent.pnl / agent.balance) * 100 : 0;

    return (
        <div 
            onClick={onClick}
            className={`relative flex flex-col gap-2 p-2 mb-1.5 rounded border-l-2 transition-all cursor-pointer ${borderColor} ${isUser ? 'bg-[#836EF9]/10 border-r border-t border-b border-r-[#836EF9] border-t-[#836EF9]/30 border-b-[#836EF9]/30' : 'bg-[#0f111a]/60 border-r border-r-transparent'} ${expanded ? 'bg-white/10' : 'hover:bg-white/5'}`}
        >
            <div className="flex items-center gap-3">
                {/* User Indicator */}
                {isUser && (
                    <div className="absolute -top-2 -right-1 bg-[#836EF9] text-white text-[8px] font-bold px-1.5 rounded shadow-lg z-10">
                        {t('you')}
                    </div>
                )}

                {/* Avatar & Leverage */}
                <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded bg-black border border-white/10 overflow-hidden ${isRekt ? 'grayscale opacity-50' : ''}`}>
                        <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover opacity-90" loading="lazy" />
                    </div>
                    {!isRekt && (
                        <div className={`absolute -bottom-1 -right-1 px-1 rounded-sm text-[8px] font-bold bg-black border border-white/20 ${themeColor}`}>
                            {agent.leverage}x
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-xs font-bold font-display truncate pr-2 ${isUser ? 'text-white' : 'text-slate-400'}`}>
                            {agent.name}
                        </span>
                        <span className={`font-mono text-[10px] font-bold ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                            {agent.pnl >= 0 ? '+' : ''}{agent.pnl.toFixed(0)} <span className="text-[8px] opacity-60">MON</span>
                        </span>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-0.5">
                        <div 
                            className={`h-full ${barColor}`} 
                            style={{ width: `${hpPercent}%` }} 
                        />
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span className="truncate max-w-[60px]">{agent.strategy}</span>
                        <span>{Math.max(0, currentEquity).toFixed(0)} MON</span>
                    </div>
                </div>
            </div>

            {/* EXPANDED DETAILS */}
            {expanded && (
                <div className="mt-1 pt-2 border-t border-white/10 grid grid-cols-3 gap-1 animate-fade-in">
                    <div className="bg-black/40 p-1.5 rounded">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{t('roi_24h')}</span>
                        <span className={`block font-mono text-[10px] font-bold ${roi >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                            {roi.toFixed(2)}%
                        </span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{t('session_pnl')}</span>
                        <span className={`block font-mono text-[10px] font-bold ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                            {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(1)}
                        </span>
                    </div>
                    <div className="bg-black/40 p-1.5 rounded">
                        <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{t('margin')}</span>
                        <span className="block font-mono text-[10px] font-bold text-white">
                            {(agent.balance / 1000 * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});


export const Arena: React.FC<ArenaProps> = ({ market, agents, logs, lastLootEvent }) => {
  const { t } = useLanguage();
  const [mobileListTab, setMobileListTab] = useState<'LONG' | 'SHORT'>('LONG');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Filter agents by MON asset only
  const activeAgents = agents.filter(a => a.status === 'ACTIVE' && a.asset === 'MON');

  // Sort Logic: User Agents First, then by Balance descending
  const sortAgents = (a: Agent, b: Agent) => {
      if (a.owner === 'USER') return -1;
      if (b.owner === 'USER') return 1;
      return b.balance - a.balance;
  };

  const longs = activeAgents.filter(a => a.direction === 'LONG' || (a.direction === 'AUTO' && market.trend === 'UP')).sort(sortAgents);
  const shorts = activeAgents.filter(a => a.direction === 'SHORT' || (a.direction === 'AUTO' && market.trend !== 'UP')).sort(sortAgents);

  // Calculate Total Staked (Pool Size)
  const totalLongStaked = longs.reduce((acc, a) => acc + a.balance, 0);
  const totalShortStaked = shorts.reduce((acc, a) => acc + a.balance, 0);
  
  const handleItemClick = (id: string) => {
      setExpandedAgentId(prev => prev === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full pb-6 lg:pb-0">
      
      {/* LEFT COLUMN (Desktop): Long Roster */}
      <div className="lg:col-span-3 hidden lg:flex flex-col h-full overflow-hidden rounded-xl border border-[#00FF9D]/20 bg-[#00FF9D]/5">
        {/* Roster Header */}
        <div className="p-3 border-b border-[#00FF9D]/20 bg-[#00FF9D]/10 backdrop-blur-sm">
             <div className="flex items-center justify-between mb-1">
                 <h3 className="text-[#00FF9D] font-display font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" /> {t('alliance')}
                 </h3>
                 <span className="text-[#00FF9D] text-xs font-bold">{longs.length} {t('units')}</span>
             </div>
             <div className="flex justify-between items-end">
                 <span className="text-[10px] text-[#00FF9D]/60 uppercase">{t('total_staked')}</span>
                 <span className="text-sm font-mono font-bold text-white">{totalLongStaked.toLocaleString()} <span className="text-[10px] text-slate-400">MON</span></span>
             </div>
        </div>
        
        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {longs.map(agent => (
                <BattleRosterItem 
                    key={agent.id} 
                    agent={agent} 
                    expanded={expandedAgentId === agent.id}
                    onClick={() => handleItemClick(agent.id)}
                />
            ))}
        </div>
      </div>

      {/* CENTER COLUMN: The Visual Arena & Mobile Lists */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        {/* Price Header & Asset Selector */}
        <div className="glass-panel p-4 lg:p-5 rounded-2xl relative overflow-visible z-20">


            <div className="relative z-10 flex items-center">
              {/* Left: Asset Display & Price - 固定宽度 */}
              <div className="flex-shrink-0 w-[140px] lg:w-[180px]">
                <div className="relative mb-1">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-[#836EF9]" />
                        <span>MON{t('asset_perp')}</span>
                    </div>
                </div>

                <div className="text-lg lg:text-2xl font-mono font-bold tracking-tighter text-white">
                  {market.price > 0 ? (
                    (() => {
                      // Determine decimal places based on price magnitude
                      let decimals = 2;
                      if (market.price < 1) decimals = 6;
                      else if (market.price < 100) decimals = 4;
                      else if (market.price < 1000) decimals = 2;
                      else decimals = 2;
                      
                      return `$${market.price.toLocaleString(undefined, { 
                        minimumFractionDigits: decimals, 
                        maximumFractionDigits: decimals 
                      })}`;
                    })()
                  ) : (
                    <span className="text-slate-500 animate-pulse">Loading...</span>
                  )}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Right: Mini Chart & Trend */}
              <div className="flex items-center gap-4 flex-shrink-0">
                 <div className="h-[40px] w-[80px] lg:h-[52px] lg:w-[110px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={market.history}>
                          <defs>
                          <linearGradient id="miniChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={market.lastChangePct >= 0 ? '#00FF9D' : '#FF0055'} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={market.lastChangePct >= 0 ? '#00FF9D' : '#FF0055'} stopOpacity={0}/>
                          </linearGradient>
                          </defs>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Area
                          type="monotone"
                          dataKey="price"
                          stroke={market.lastChangePct >= 0 ? '#00FF9D' : '#FF0055'}
                          strokeWidth={2}
                          fill="url(#miniChart)"
                          isAnimationActive={false}
                          />
                      </AreaChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="text-right w-[60px] lg:w-[70px]">
                   <span className={`block text-sm lg:text-base font-mono font-bold ${market.lastChangePct >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                     {market.lastChangePct >= 0 ? '+' : ''}{market.lastChangePct.toFixed(2)}%
                   </span>
                   <span className={`text-[10px] font-bold tracking-wider uppercase ${market.trend === 'UP' ? 'text-[#00FF9D]/70' : market.trend === 'DOWN' ? 'text-[#FF0055]/70' : 'text-slate-500'}`}>
                     {market.trend === 'UP' ? t('bullish') : market.trend === 'DOWN' ? t('bearish') : t('flat')}
                   </span>
                 </div>
              </div>
            </div>
        </div>

        {/* THE BATTLEFIELD */}
        <Battlefield agents={agents} market={market} lootEvent={lastLootEvent} logs={logs} />
        
        {/* MOBILE ONLY: Lists Tab Switcher */}
        <div className="lg:hidden mt-2">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 mb-4">
                <button 
                    onClick={() => setMobileListTab('LONG')}
                    className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        mobileListTab === 'LONG' 
                        ? 'bg-[#00FF9D]/10 text-[#00FF9D] shadow-lg border border-[#00FF9D]/20' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Zap size={14} /> {t('alliance')} ({longs.length})
                </button>
                <button 
                    onClick={() => setMobileListTab('SHORT')}
                    className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        mobileListTab === 'SHORT' 
                        ? 'bg-[#FF0055]/10 text-[#FF0055] shadow-lg border border-[#FF0055]/20' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Zap size={14} /> {t('syndicate')} ({shorts.length})
                </button>
            </div>

            <div className="space-y-2 h-[300px] overflow-y-auto custom-scrollbar">
                {mobileListTab === 'LONG' ? (
                    longs.map(agent => (
                        <BattleRosterItem 
                            key={agent.id} 
                            agent={agent} 
                            expanded={expandedAgentId === agent.id}
                            onClick={() => handleItemClick(agent.id)}
                        />
                    ))
                ) : (
                    shorts.map(agent => (
                        <BattleRosterItem 
                            key={agent.id} 
                            agent={agent} 
                            expanded={expandedAgentId === agent.id}
                            onClick={() => handleItemClick(agent.id)}
                        />
                    ))
                )}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN (Desktop): Short Roster */}
      <div className="lg:col-span-3 hidden lg:flex flex-col h-full overflow-hidden rounded-xl border border-[#FF0055]/20 bg-[#FF0055]/5">
         {/* Roster Header */}
         <div className="p-3 border-b border-[#FF0055]/20 bg-[#FF0055]/10 backdrop-blur-sm">
             <div className="flex items-center justify-between mb-1">
                 <h3 className="text-[#FF0055] font-display font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
                    <Crosshair className="w-4 h-4" /> {t('syndicate')}
                 </h3>
                 <span className="text-[#FF0055] text-xs font-bold">{shorts.length} {t('units')}</span>
             </div>
             <div className="flex justify-between items-end">
                 <span className="text-[10px] text-[#FF0055]/60 uppercase">{t('total_staked')}</span>
                 <span className="text-sm font-mono font-bold text-white">{totalShortStaked.toLocaleString()} <span className="text-[10px] text-slate-400">MON</span></span>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {shorts.map(agent => (
                 <BattleRosterItem 
                    key={agent.id} 
                    agent={agent} 
                    expanded={expandedAgentId === agent.id}
                    onClick={() => handleItemClick(agent.id)}
                 />
            ))}
        </div>
      </div>
    </div>
  );
};