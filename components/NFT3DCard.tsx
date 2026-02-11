import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { Sparkles, Rocket, Crown, AtSign, TrendingUp, TrendingDown, Brain } from 'lucide-react';

interface NFT3DCardProps {
  agent: Agent;
  userName: string;
  nftNumber: number;
  minterTwitter: string;
  onDeployNow: () => void;
}

const strategyDescriptions: Record<string, string> = {
  'Momentum Surfer': 'Rides market momentum with precision timing',
  'Contrarian Alpha': 'Buys when others panic sell',
  'Scalping Ninja': 'High-frequency micro trades',
  'Trend Follower': 'Follows established trends',
  'Mean Reversion': 'Capitalizes on price corrections',
  'Breakout Hunter': 'Targets key resistance breakouts',
  'Arbitrage Bot': 'Exploits price inefficiencies',
  'Grid Trader': 'Systematic range-bound trading',
};

export const NFT3DCard: React.FC<NFT3DCardProps> = ({ agent, userName, nftNumber, minterTwitter, onDeployNow }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const strategyColor = agent.direction === 'LONG' ? 'text-emerald-400' : agent.direction === 'SHORT' ? 'text-rose-400' : 'text-violet-400';
  const strategyBg = agent.direction === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/30' : agent.direction === 'SHORT' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-violet-500/10 border-violet-500/30';
  const strategyDesc = strategyDescriptions[agent.strategy];

  return (
    <div className={`relative w-full max-w-[300px] mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* 背景光晕 */}
      <div className="absolute -inset-3 bg-gradient-to-r from-[#836EF9]/20 via-[#00FF9D]/20 to-[#836EF9]/20 rounded-2xl blur-xl opacity-60"></div>

      {/* NFT卡片 */}
      <div className="relative bg-[#0a0b14] rounded-xl overflow-hidden border border-[#836EF9]/30 shadow-2xl">
        {/* 顶部渐变条 */}
        <div className="h-1 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9]"></div>

        {/* 稀有度徽章 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
          <Crown size={10} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase">Legendary</span>
        </div>

        {/* 图像区域 */}
        <div className="p-4 pb-0">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#836EF9]/20 to-[#00FF9D]/20 p-[2px]">
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#0a0b14]">
              {/* 角落装饰 */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-[#836EF9]/60 z-10"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-[#836EF9]/60 z-10"></div>

              {/* Agent图像 */}
              <img
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-4 pt-3">
          {/* 名称 */}
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="text-[#00FF9D]" />
            {userName || agent.name}
          </h3>

          {/* 编号和MintedBy */}
          <div className="flex items-center justify-between text-[10px] mb-3">
            <span className="text-slate-500 font-mono">#{String(nftNumber).padStart(4, '0')}</span>
            {minterTwitter && (
              <span className="text-slate-400 flex items-center gap-1">
                <AtSign size={10} className="text-[#836EF9]" />
                {minterTwitter}
              </span>
            )}
          </div>

          {/* 策略偏好 */}
          <div className={`rounded-lg p-2.5 mb-3 border ${strategyBg}`}>
            <div className="flex items-start gap-2">
              <Brain size={14} className={`${strategyColor} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-400 uppercase">Strategy</p>
                <p className="text-xs font-bold text-white truncate">{agent.strategy}</p>
                {strategyDesc && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{strategyDesc}</p>
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
            className="w-full py-3 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-lg text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Rocket size={16} />
            Deploy to Arena
          </button>
        </div>
      </div>
    </div>
  );
};
