import React from 'react';
import { Agent } from '../types';
import { Sparkles, Rocket, Crown, AtSign, TrendingUp, TrendingDown, Brain } from 'lucide-react';

interface NFTRevealProps {
  agent: Agent;
  userName: string;
  nftNumber: number;
  minterTwitter: string;
  onDeployNow: () => void;
}

// 策略描述映射 - 更详细的描述
const strategyDescriptions: Record<string, string> = {
  'Momentum Surfer': 'Identifies strong price movements and rides the wave with precise entry and exit timing. Best for trending markets.',
  'Contrarian Alpha': 'Goes against the crowd, buying when others panic sell. Seeks undervalued assets in oversold conditions.',
  'Scalping Ninja': 'Executes rapid-fire micro trades to capture small price movements. High frequency, tight stops, consistent gains.',
  'Trend Follower': 'Analyzes market structure to follow established trends. Uses moving averages and breakout confirmations.',
  'Mean Reversion': 'Capitalizes on price deviations from historical averages. Buys dips, sells rallies in ranging markets.',
  'Breakout Hunter': 'Watches for key resistance/support levels. Enters positions when price breaks out with volume confirmation.',
  'Arbitrage Bot': 'Exploits price differences across exchanges and markets. Risk-free profit from market inefficiencies.',
  'Grid Trader': 'Places buy/sell orders at regular intervals. Profits from sideways market movements systematically.',
};

export const NFTReveal: React.FC<NFTRevealProps> = ({ agent, userName, nftNumber, minterTwitter, onDeployNow }) => {
  const strategyColor = agent.direction === 'LONG' ? 'text-emerald-400' : agent.direction === 'SHORT' ? 'text-rose-400' : 'text-violet-400';
  const strategyBg = agent.direction === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/30' : agent.direction === 'SHORT' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-violet-500/10 border-violet-500/30';
  
  const strategyDesc = strategyDescriptions[agent.strategy];
  
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      {/* 外层光晕 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] rounded-2xl blur opacity-30 animate-pulse"></div>
      
      {/* NFT卡片主体 */}
      <div className="relative bg-[#0a0b14] rounded-xl overflow-hidden border border-[#836EF9]/40">
        {/* 顶部稀有度条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9]"></div>
        
        {/* 稀有度徽章 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 px-2 py-1 rounded-full">
          <Crown size={10} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase">Legendary</span>
        </div>

        {/* 图像区域 */}
        <div className="relative p-4 pb-0">
          {/* 图像外框 */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#836EF9]/20 to-[#00FF9D]/20 p-[2px]">
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#0f111a]">
              {/* 角落装饰 */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-[#836EF9]/60 z-10"></div>
              
              {/* Agent图像 */}
              <img 
                src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
              
              {/* 扫描线 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#836EF9]/5 to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-4 pt-3">
          {/* 名称 */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#00FF9D]" />
              {userName || agent.name}
            </h3>
          </div>

          {/* 编号和MintedBy在同一行 */}
          <div className="flex items-center justify-between text-[10px] mb-3">
            <span className="text-slate-500 font-mono">#{String(nftNumber).padStart(4, '0')}</span>
            {minterTwitter && (
              <span className="text-slate-400 flex items-center gap-1">
                <AtSign size={10} className="text-[#836EF9]" />
                {minterTwitter}
              </span>
            )}
          </div>

          {/* 策略偏好 - 带详细描述 */}
          <div className={`rounded-lg p-2.5 mb-3 border ${strategyBg}`}>
            <div className="flex items-start gap-2">
              <Brain size={14} className={`${strategyColor} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Strategy</p>
                <p className="text-xs font-bold text-white truncate">{agent.strategy}</p>
                {strategyDesc && (
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{strategyDesc}</p>
                )}
              </div>
              {agent.direction === 'LONG' ? (
                <TrendingUp size={16} className="text-emerald-400 flex-shrink-0" />
              ) : agent.direction === 'SHORT' ? (
                <TrendingDown size={16} className="text-rose-400 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-violet-500/30 border border-violet-400/50 flex-shrink-0"></div>
              )}
            </div>
          </div>

          {/* Deploy按钮 */}
          <button 
            onClick={onDeployNow}
            className="w-full py-3 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-lg text-sm font-bold text-black flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#836EF9]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Rocket size={16} />
            Deploy to Arena
          </button>
        </div>

        {/* 底部装饰线 */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#836EF9]/50 to-transparent"></div>
      </div>

      {/* 外发光装饰 */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#00FF9D] rounded-full blur-md opacity-50"></div>
      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#836EF9] rounded-full blur-md opacity-50"></div>
    </div>
  );
};
