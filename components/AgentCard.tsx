import React from 'react';
import { Agent } from '../types';
import { Activity, Share2, Brain, Ban, ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PnLChart } from './PnLChart';

interface AgentCardProps {
  agent: Agent;
  isCompact?: boolean;
  onRetire?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  showChart?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = React.memo(({ 
  agent, 
  isCompact = false, 
  onRetire, 
  onWithdraw,
  showChart = false
}) => {
  const { t } = useLanguage();
  const isLong = agent.direction === 'LONG';
  const isAuto = agent.direction === 'AUTO';
  const isIdle = agent.status === 'IDLE';
  const isActive = agent.status === 'ACTIVE';
  const isUser = agent.owner === 'USER';
  
  const totalGames = agent.wins + agent.losses;
  const winRate = totalGames > 0 ? Math.round((agent.wins / totalGames) * 100) : 0;

  // Visual Styles - NFT Card Theme
  const themeColor = isAuto ? 'text-violet-400' : isLong ? 'text-emerald-400' : 'text-rose-400';
  const borderColor = isActive 
    ? isAuto ? 'border-violet-500/50' : isLong ? 'border-emerald-500/50' : 'border-rose-500/50'
    : 'border-slate-700';
  
  const glowShadow = isActive 
    ? isAuto ? 'shadow-[0_0_30px_rgba(139,92,246,0.2)]' : isLong ? 'shadow-[0_0_30px_rgba(52,211,153,0.2)]' : 'shadow-[0_0_30px_rgba(251,113,133,0.2)]'
    : '';

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      let text = '';
      if (isActive) {
          text = `My NFT Agent ${agent.name} is battling in @AIperp Arena! ${agent.direction} ${agent.leverage}x with ${agent.balance.toFixed(0)} MON. Join the fight! 🎮 #AIperp #NFT`;
      } else if (agent.pnl > 0) {
          text = `Just minted my AI Agent NFT ${agent.name} on @AIperp! Strategy: ${agent.strategy}. Ready to deploy! 🚀 #AIperp #NFT`;
      } else {
          text = `Check out my AI Agent ${agent.name} on @AIperp Arena! 🎮 #AIperp #NFT`;
      }
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const handleMinterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent.minterTwitter) {
      window.open(`https://twitter.com/${agent.minterTwitter.replace('@', '')}`, '_blank');
    }
  };

  // Compact View (for Lists)
  if (isCompact) {
    return (
      <div className={`relative flex items-center gap-3 p-3 rounded-xl border bg-[#0f111a] hover:bg-[#1a1d2d] transition-all cursor-pointer group overflow-hidden ${
        isActive 
          ? isAuto ? 'border-l-4 border-l-violet-500' : isLong ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
          : 'border-l-4 border-l-slate-600'
      }`}>
        
        {/* NFT Avatar */}
        <div className={`w-12 h-12 rounded-xl bg-black border-2 overflow-hidden shrink-0 ${
          isActive 
            ? isAuto ? 'border-violet-500' : isLong ? 'border-emerald-500' : 'border-rose-500'
            : 'border-slate-600'
        }`}>
           <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
           <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-bold truncate ${isUser ? 'text-white' : 'text-slate-300'}`}>{agent.name}</span>
              {isActive && (
                <span className={`text-xs font-mono ${agent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)}
                </span>
              )}
           </div>
           
           <div className="flex items-center gap-2 text-xs text-slate-500">
              {isActive ? (
                <>
                  <span className={themeColor}>{agent.direction} {agent.leverage}x</span>
                  <span className="text-slate-600">|</span>
                  <span>{agent.balance.toFixed(0)} MON</span>
                </>
              ) : (
                <span className="text-amber-400">{t('standby')}</span>
              )}
           </div>
        </div>
      </div>
    );
  }

  // NFT Card View
  return (
    <div className={`relative rounded-2xl border ${borderColor} ${glowShadow} overflow-hidden transition-all duration-300 group bg-gradient-to-b from-[#0f111a] to-[#050508]`}>
        
        {/* NFT Image Section - Large and prominent */}
        <div className="relative aspect-square w-full overflow-hidden">
            {/* Background gradient */}
            <div className={`absolute inset-0 ${
              isActive 
                ? isAuto ? 'bg-gradient-to-br from-violet-900/30 to-transparent' : isLong ? 'bg-gradient-to-br from-emerald-900/30 to-transparent' : 'bg-gradient-to-br from-rose-900/30 to-transparent'
                : 'bg-gradient-to-br from-slate-800/30 to-transparent'
            }`} />
            
            {/* NFT Image */}
            <div className="absolute inset-4 flex items-center justify-center">
                <div className={`w-full h-full rounded-2xl bg-black border-4 overflow-hidden shadow-2xl ${
                  isActive 
                    ? isAuto ? 'border-violet-500' : isLong ? 'border-emerald-500' : 'border-rose-500'
                    : 'border-slate-600'
                }`}>
                    <img 
                      src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`} 
                      className="w-full h-full object-cover"
                      alt={agent.name}
                    />
                </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
                {isActive ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border ${
                      isAuto ? 'border-violet-500 text-violet-400' : isLong ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'
                    }`}>
                        <Activity size={12} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-amber-500 text-amber-400">
                        <span className="text-xs font-bold uppercase tracking-wider">{t('standby')}</span>
                    </div>
                )}
            </div>

            {/* Share Button */}
            <div className="absolute top-4 left-4 z-10">
                <button 
                  onClick={handleShare} 
                  className="p-2 bg-black/60 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/10"
                >
                    <Share2 size={16} />
                </button>
            </div>
        </div>

        {/* NFT Info Section */}
        <div className="p-4 space-y-4">
            {/* Name & ID */}
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white leading-tight truncate">{agent.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">#{agent.id.slice(0,6)}</p>
                </div>
                {isUser && (
                    <span className="bg-violet-500/20 text-violet-400 text-[10px] font-bold px-2 py-1 rounded border border-violet-500/30 shrink-0 ml-2">
                        {t('you')}
                  </span>
                )}
            </div>

            {/* Minted By - Twitter Link */}
            {agent.minterTwitter && (
                <div 
                    onClick={handleMinterClick}
                    className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-blue-400 transition-colors group/minter"
                >
                    <span className="text-slate-500">{t('minted_by')}</span>
                    <span className="flex items-center gap-1 text-blue-400 font-medium">
                        @{agent.minterTwitter.replace('@', '')}
                        <ExternalLink size={10} className="opacity-0 group-hover/minter:opacity-100 transition-opacity" />
                    </span>
                </div>
            )}

            {/* 24h PnL Chart - Only show when showChart is true and agent has history */}
            {showChart && agent.pnlHistory && agent.pnlHistory.length > 0 && (
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">24h PnL</span>
                        <span className={`text-xs font-mono font-bold ${agent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)} MON
                        </span>
                    </div>
                    <PnLChart data={agent.pnlHistory} width={240} height={60} />
                </div>
            )}

            {/* Core Stats - Only show for active agents */}
            {isActive && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Position</div>
                        <div className={`font-mono text-sm font-bold ${themeColor} flex items-center gap-1`}>
                            {isAuto ? <TrendingUp size={12} /> : isLong ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {agent.direction} {agent.leverage}x
                        </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Margin</div>
                        <div className="font-mono text-sm font-bold text-white">
                            {agent.balance.toFixed(0)} MON
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy - Always visible */}
            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                <Brain size={14} className="text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300 truncate">{agent.strategy}</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
                {/* Withdraw button for active agents */}
                {isActive && onWithdraw && (
                    <button 
                        onClick={() => onWithdraw(agent.id)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-bold uppercase transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('withdraw_exit')}
                    </button>
                )}
                
                {/* Retire button for idle agents */}
                {isIdle && onRetire && (
                    <button 
                        onClick={() => onRetire(agent.id)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-bold uppercase transition-colors"
                    >
                        <Ban size={16} /> {t('deactivate')}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
});
