import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { Sparkles, Rocket, AtSign, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

// 稀有度颜色配置
const rarityConfig = {
  legendary: {
    border: 'border-amber-500/50',
    glow: 'from-amber-500/30 via-yellow-500/30 to-amber-500/30',
    topBar: 'from-amber-500 via-yellow-400 to-amber-500',
    shadow: 'shadow-amber-500/20',
  },
  epic: {
    border: 'border-purple-500/50',
    glow: 'from-purple-500/30 via-pink-500/30 to-purple-500/30',
    topBar: 'from-purple-500 via-pink-400 to-purple-500',
    shadow: 'shadow-purple-500/20',
  },
  rare: {
    border: 'border-blue-500/50',
    glow: 'from-blue-500/30 via-cyan-500/30 to-blue-500/30',
    topBar: 'from-blue-500 via-cyan-400 to-blue-500',
    shadow: 'shadow-blue-500/20',
  },
  common: {
    border: 'border-[#836EF9]/40',
    glow: 'from-[#836EF9]/30 via-[#00FF9D]/30 to-[#836EF9]/30',
    topBar: 'from-[#836EF9] via-[#00FF9D] to-[#836EF9]',
    shadow: 'shadow-[#836EF9]/20',
  },
};

export const NFT3DCard: React.FC<NFT3DCardProps> = ({ agent, userName, nftNumber, minterTwitter, onDeployNow }) => {
  const { t } = useLanguage();
  const [isFlipping, setIsFlipping] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // 根据NFT编号决定稀有度（示例逻辑）
  const getRarity = (num: number) => {
    if (num <= 100) return 'legendary';
    if (num <= 500) return 'epic';
    if (num <= 1000) return 'rare';
    return 'common';
  };

  const rarity = getRarity(nftNumber);
  const colors = rarityConfig[rarity];

  useEffect(() => {
    const flipTimer = setTimeout(() => {
      setIsFlipping(false);
    }, 1500);

    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 800);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const strategyColor = agent.direction === 'LONG' ? 'text-emerald-400' : agent.direction === 'SHORT' ? 'text-rose-400' : 'text-violet-400';
  const strategyBg = agent.direction === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/30' : agent.direction === 'SHORT' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-violet-500/10 border-violet-500/30';
  const strategyDesc = strategyDescriptions[agent.strategy];

  return (
    <div className="relative w-full max-w-[320px] mx-auto perspective-1000">
      {/* 背景光效 - 根据稀有度变色 */}
      <div className={`absolute -inset-4 bg-gradient-to-r ${colors.glow} rounded-3xl blur-2xl opacity-50 animate-pulse`}></div>

      {/* 3D翻转容器 */}
      <div
        className="relative transition-transform duration-[1500ms] ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipping ? 'rotateY(360deg)' : 'rotateY(0deg)',
        }}
      >
        {/* NFT卡片主体 - 根据稀有度变色 */}
        <div className={`relative bg-gradient-to-br from-[#13141f] via-[#0a0b14] to-[#13141f] rounded-2xl overflow-hidden border-2 ${colors.border} ${colors.shadow} shadow-2xl`}>
          {/* 顶部光条 - 根据稀有度变色 */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colors.topBar}`}></div>

          {/* 图像区域 */}
          <div className="p-5 pb-0">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#836EF9]/30 to-[#00FF9D]/30 p-[3px]">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0a0b14]">
                {/* 动态边框效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#836EF9]/20 via-transparent to-[#00FF9D]/20 animate-pulse"></div>

                {/* 角落装饰 */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#836EF9] z-10"></div>
                <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#836EF9] z-10"></div>
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#836EF9] z-10"></div>
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#836EF9] z-10"></div>

                {/* Agent图像 */}
                <img
                  src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />

                {/* 扫描线效果 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#836EF9]/10 to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>

          {/* 信息区域 */}
          <div className={`p-5 pt-4 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* 名称 */}
            <div className="mb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#00FF9D]" />
                {userName || agent.name}
              </h3>
            </div>

            {/* 编号和MintedBy */}
            <div className="flex items-center justify-between text-[11px] mb-4">
              <span className="text-slate-500 font-mono">AIperp #{String(nftNumber).padStart(4, '0')}</span>
              {minterTwitter && (
                <span className="text-slate-400 flex items-center gap-1">
                  <AtSign size={11} className="text-[#836EF9]" />
                  {minterTwitter}
                </span>
              )}
            </div>

            {/* 策略偏好 */}
            <div className={`rounded-xl p-3 mb-4 border ${strategyBg}`}>
              <div className="flex items-start gap-3">
                <Brain size={16} className={`${strategyColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t('strategy')}</p>
                  <p className="text-sm font-bold text-white truncate">{agent.strategy}</p>
                  {strategyDesc && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{strategyDesc}</p>
                  )}
                </div>
                {agent.direction === 'LONG' ? (
                  <TrendingUp size={18} className="text-emerald-400 flex-shrink-0" />
                ) : agent.direction === 'SHORT' ? (
                  <TrendingDown size={18} className="text-rose-400 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 border border-violet-400/50 flex-shrink-0"></div>
                )}
              </div>
            </div>

            {/* Deploy按钮 */}
            <button
              onClick={onDeployNow}
              className="w-full py-3.5 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#836EF9]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <Rocket size={18} className="group-hover:translate-x-0.5 transition-transform" />
              {t('deploy_to_arena')}
            </button>
          </div>

          {/* 底部装饰 */}
          <div className="h-1 bg-gradient-to-r from-transparent via-[#836EF9]/60 to-transparent"></div>
        </div>
      </div>

      {/* 外发光粒子 */}
      <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#00FF9D] rounded-full blur-lg opacity-60 animate-pulse"></div>
      <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-[#836EF9] rounded-full blur-lg opacity-60 animate-pulse delay-300"></div>
      <div className="absolute top-1/2 -right-4 w-3 h-3 bg-[#836EF9]/50 rounded-full blur-md animate-pulse delay-500"></div>
      <div className="absolute top-1/3 -left-4 w-4 h-4 bg-[#00FF9D]/50 rounded-full blur-md animate-pulse delay-700"></div>
    </div>
  );
};
