import React from 'react';
import { Agent } from '../types';
import { Trophy, Medal, Twitter, TrendingUp, Skull, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LeaderboardProps {
  agents: Agent[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ agents }) => {
  const { t } = useLanguage();
  // Filter only Active or recently Liquidated (but high PnL) agents
  // Sort by PnL descending
  const sortedAgents = [...agents]
    .filter(a => a.status !== 'IDLE') // Only show fighters
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 100); // Top 100

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
    if (index === 1) return <Medal className="text-gray-300" size={24} />;
    if (index === 2) return <Medal className="text-amber-700" size={24} />;
    return <span className="font-mono font-bold text-slate-500 text-lg">#{index + 1}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto">
       <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <Trophy className="text-yellow-500" size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">{t('hall_of_legends')}</h2>
                    <p className="text-slate-400">{t('legends_subtitle')}</p>
                </div>
            </div>
            
            <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('season_pool')}</p>
                <p className="text-2xl font-mono font-bold text-[#836EF9] text-shadow-glow">2,500,000 $MON</p>
            </div>
       </div>

       <div className="bg-[#0f111a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
           {/* Header */}
           <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-black/40 text-xs font-bold text-slate-500 uppercase tracking-wider">
               <div className="col-span-1 text-center">{t('rank')}</div>
               <div className="col-span-5 md:col-span-4">{t('agent_commander')}</div>
               <div className="col-span-2 hidden md:block">{t('status')}</div>
               <div className="col-span-3 md:col-span-2 text-right">{t('pnl')} ($MON)</div>
               <div className="col-span-3 text-right">{t('roi')}</div>
           </div>

           {/* List */}
           <div className="divide-y divide-slate-800/50">
               {sortedAgents.map((agent, index) => {
                   const isTop3 = index < 3;
                   const roi = agent.balance > 0 ? (agent.pnl / (agent.balance - agent.pnl)) * 100 : 0;
                   
                   return (
                       <div 
                        key={agent.id} 
                        className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/5 ${agent.owner === 'USER' ? 'bg-[#836EF9]/5' : ''}`}
                       >
                           {/* Rank */}
                           <div className="col-span-1 flex justify-center">
                               {getRankIcon(index)}
                           </div>

                           {/* Agent Profile */}
                           <div className="col-span-5 md:col-span-4 flex items-center gap-3 overflow-hidden">
                               <div className="relative w-10 h-10 rounded-lg bg-slate-800 shrink-0 overflow-hidden border border-white/10">
                                   <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
                                   {agent.owner === 'USER' && (
                                       <div className="absolute bottom-0 left-0 w-full h-1 bg-[#836EF9]" />
                                   )}
                               </div>
                               <div className="min-w-0">
                                   <div className="flex items-center gap-2">
                                       <h4 className={`font-bold text-sm truncate ${isTop3 ? 'text-white' : 'text-slate-300'}`}>{agent.name}</h4>
                                       {agent.twitterHandle && (
                                           <a 
                                            href={`https://twitter.com/${agent.twitterHandle}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[#1DA1F2] hover:text-[#1DA1F2]/80"
                                           >
                                               <Twitter size={12} fill="currentColor" />
                                           </a>
                                       )}
                                   </div>
                                   <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                       <span className="bg-slate-800 px-1 rounded">{agent.strategy}</span>
                                       <span className={`${agent.direction === 'LONG' ? 'text-[#00FF9D]' : agent.direction === 'SHORT' ? 'text-[#FF0055]' : 'text-[#836EF9]'}`}>{agent.leverage}X</span>
                                   </div>
                               </div>
                           </div>

                           {/* Status */}
                           <div className="col-span-2 hidden md:flex items-center gap-2">
                               {agent.status === 'ACTIVE' ? (
                                   <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#00FF9D] bg-[#00FF9D]/10 px-2 py-0.5 rounded-full border border-[#00FF9D]/20">
                                       <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
                                       {t('live')}
                                   </span>
                               ) : (
                                   <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                       <Skull size={10} />
                                       {t('rekt')}
                                   </span>
                               )}
                           </div>

                           {/* PnL */}
                           <div className={`col-span-3 md:col-span-2 text-right font-mono font-bold ${agent.pnl > 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                               {agent.pnl > 0 ? '+' : ''}{agent.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                           </div>

                           {/* ROI */}
                           <div className="col-span-3 text-right">
                               <div className="flex flex-col items-end">
                                   <span className={`text-sm font-bold ${roi >= 0 ? 'text-white' : 'text-slate-400'}`}>
                                       {roi.toFixed(1)}%
                                   </span>
                                   {isTop3 && (
                                       <span className="text-[9px] text-yellow-500/80 uppercase tracking-wider">Legendary</span>
                                   )}
                               </div>
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>
    </div>
  );
};