import React from 'react';
import { Agent } from '../types';
import { TrendingUp, TrendingDown, Skull, Activity, Share2, Brain, Fingerprint, Ban } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AgentCardProps {
  agent: Agent;
  isCompact?: boolean;
  onRetire?: (id: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = React.memo(({ agent, isCompact = false, onRetire }) => {
  const { t } = useLanguage();
  const isLong = agent.direction === 'LONG';
  const isAuto = agent.direction === 'AUTO';
  const isDead = agent.status === 'LIQUIDATED';
  const isIdle = agent.status === 'IDLE';
  const isUser = agent.owner === 'USER';
  
  const totalGames = agent.wins + agent.losses;
  const winRate = totalGames > 0 ? Math.round((agent.wins / totalGames) * 100) : 0;

  // Visual Styles
  const themeColor = isAuto ? 'text-[#836EF9]' : isLong ? 'text-[#00FF9D]' : 'text-[#FF0055]';
  const borderColor = isDead 
    ? 'border-slate-800' 
    : isAuto
      ? 'border-[#836EF9]/50'
      : isLong 
        ? 'border-[#00FF9D]/50' 
        : 'border-[#FF0055]/50';
  
  const glowShadow = isDead ? '' : isAuto 
    ? 'shadow-[0_0_30px_rgba(131,110,249,0.15)]' 
    : isLong 
        ? 'shadow-[0_0_30px_rgba(0,255,157,0.15)]' 
        : 'shadow-[0_0_30px_rgba(255,0,85,0.15)]';

  const gradientBg = isDead
    ? 'bg-slate-900/80 grayscale'
    : `bg-gradient-to-b from-[#0f111a] to-[#050508]`;

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      let text = '';
      if (isDead) {
          text = `My agent ${agent.name} just got LIQUIDATED in @AIperp! 💀 -${agent.balance} $MON. RIP. #AIperp`;
      } else if (agent.pnl > 0) {
          text = `I'm printing money! 💸 ${agent.name} is up ${((agent.pnl/400)*100).toFixed(0)}% in @AIperp Arena. Join my faction! 🛡️ #AIperp #Monad`;
      } else {
          text = `Battling in the @AIperp Arena with ${agent.name} (${agent.direction} BTC). Join my faction to help me win! ⚔️ #Monad`;
      }
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // Compact View (for Lists)
  if (isCompact) {
    return (
      <div className={`relative flex items-center gap-3 p-2 rounded-lg border-l-2 bg-[#0f111a] hover:bg-[#1a1d2d] transition-colors cursor-pointer group overflow-hidden ${isAuto ? 'border-l-[#836EF9]' : isLong ? 'border-l-[#00FF9D]' : 'border-l-[#FF0055]'}`}>
        
        {/* Avatar */}
        <div className={`w-10 h-10 rounded bg-black border border-white/10 overflow-hidden shrink-0 ${isDead ? 'grayscale opacity-50' : ''}`}>
           <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
           <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold font-display truncate ${isUser ? 'text-white' : 'text-slate-300'}`}>{agent.name}</span>
              <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-bold ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                    {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)}
                 </span>
              </div>
           </div>
           
           {/* Mini Collateral Bar */}
           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full ${isAuto ? 'bg-[#836EF9]' : isLong ? 'bg-[#00FF9D]' : 'bg-[#FF0055]'}`} 
                 style={{ width: `${Math.min(100, (agent.balance / 1000) * 100)}%` }}
               />
           </div>
        </div>
      </div>
    );
  }

  // Full Card View
  return (
    <div className={`relative rounded-xl border ${borderColor} ${gradientBg} ${glowShadow} overflow-hidden transition-all duration-300 group`}>
        
        {/* Header Image Section */}
        <div className="relative h-32 w-full overflow-hidden border-b border-white/5">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="absolute inset-0 flex items-center justify-center p-4 gap-4">
                 <div className={`w-20 h-20 rounded-xl bg-black border-2 ${isDead ? 'border-slate-600 grayscale' : isAuto ? 'border-[#836EF9]' : isLong ? 'border-[#00FF9D]' : 'border-[#FF0055]'} overflow-hidden shadow-2xl relative z-10`}>
                      <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1 min-w-0 z-10 pt-2">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-display font-black text-white truncate leading-none">{agent.name}</h3>
                        {isUser && <span className="bg-[#836EF9] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{t('you')}</span>}
                     </div>
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/10 ${themeColor}`}>
                            {isAuto ? <Brain size={12} /> : isLong ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span className="text-[10px] font-bold tracking-wider">{agent.direction} {agent.leverage}X</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">#{agent.id.slice(0,4)}</span>
                     </div>
                 </div>
            </div>

            {/* Status Overlays */}
            {isDead && (
                 <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-[2px]">
                     <div className="border-2 border-red-500 text-red-500 px-4 py-1 text-2xl font-display font-black -rotate-12 tracking-widest uppercase shadow-[0_0_20px_red]">
                         {t('terminated')}
                     </div>
                 </div>
            )}
            
            {/* Top Right Actions */}
            <div className="absolute top-2 right-2 z-30">
                 <button onClick={handleShare} className="p-1.5 bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5">
                     <Share2 size={14} />
                 </button>
            </div>
        </div>

        {/* Body Stats */}
        <div className="p-4 space-y-4">
            {/* Strategy Chip */}
            <div className="flex justify-between items-center">
                <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                    <Activity size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-300 font-mono tracking-wide truncate max-w-[120px]">{agent.strategy}</span>
                </div>
                {isIdle && (
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider animate-pulse">{t('standby')}</span>
                )}
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/40 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">{t('pnl')}</div>
                    <div className={`font-mono text-sm font-bold ${agent.pnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                        {agent.pnl > 0 ? '+' : ''}{agent.pnl.toFixed(0)}
                    </div>
                </div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">{t('win_rate')}</div>
                    <div className={`font-mono text-sm font-bold ${winRate >= 50 ? 'text-[#00FF9D]' : 'text-slate-400'}`}>
                        {winRate}%
                    </div>
                </div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/5 text-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">{t('collateral')}</div>
                    <div className="font-mono text-sm font-bold text-white">
                        {agent.balance.toFixed(0)}
                    </div>
                </div>
            </div>

            {/* Collateral Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500">
                    <span>{t('health_collateral')}</span>
                    <span>{(agent.balance / 1000 * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${isAuto ? 'bg-[#836EF9]' : isLong ? 'bg-[#00FF9D]' : 'bg-[#FF0055]'} shadow-[0_0_8px_currentColor]`} 
                        style={{ width: `${Math.min(100, (agent.balance / 1000) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            {!isDead && isIdle && onRetire && (
                <div className="pt-2 border-t border-white/5">
                    <button 
                        onClick={() => onRetire(agent.id)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold uppercase transition-colors"
                    >
                        <Ban size={14} /> {t('deactivate')}
                    </button>
                </div>
            )}
            
            {/* Minter Info */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                    <Fingerprint size={10} />
                    <span className="uppercase">{t('minted_by')}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                    {agent.minter === 'Protocol' ? 'PROTOCOL' : agent.minter.slice(0,8)}
                </div>
            </div>
        </div>
    </div>
  );
});