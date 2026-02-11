import React from 'react';
import { Agent } from '../types';
import { Sparkles, Zap, Brain, Rocket, Crown, AtSign } from 'lucide-react';

interface NFTRevealProps {
  agent: Agent;
  userName: string;
  nftNumber: number;
  minterTwitter: string;
  onDeployNow: () => void;
}

export const NFTReveal: React.FC<NFTRevealProps> = ({ agent, userName, nftNumber, minterTwitter, onDeployNow }) => {
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#836EF9]/20 via-transparent to-[#00FF9D]/20 blur-2xl"></div>
      
      {/* NFT卡片容器 */}
      <div className="relative bg-gradient-to-b from-[#1a1d2d] to-[#0f111a] rounded-xl border-2 border-[#836EF9]/50 p-0.5 shadow-[0_0_40px_rgba(131,110,249,0.3)]">
        {/* 内边框装饰 */}
        <div className="absolute inset-0 rounded-xl border border-white/10"></div>
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#836EF9] to-transparent"></div>
        
        {/* 卡片内容 */}
        <div className="relative p-3">
          {/* 稀有度标识 */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] px-2.5 py-0.5 rounded-full shadow-lg">
            <Crown size={10} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Legendary</span>
          </div>

          {/* NFT图像区域 */}
          <div className="relative mt-3 mb-3">
            {/* 外发光 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#836EF9]/40 to-[#00FF9D]/40 rounded-lg blur-lg"></div>
            
            {/* 图像容器 */}
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#836EF9]/30 bg-black">
              {/* 角落装饰 */}
              <div className="absolute top-1.5 left-1.5 w-3 h-3 border-l border-t border-[#836EF9]"></div>
              <div className="absolute top-1.5 right-1.5 w-3 h-3 border-r border-t border-[#836EF9]"></div>
              <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l border-b border-[#836EF9]"></div>
              <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r border-b border-[#836EF9]"></div>
              
              {/* Agent图像 */}
              <img 
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.avatarSeed}`}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
              
              {/* 扫描线效果 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#836EF9]/10 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
          </div>

          {/* Agent名称 - 使用用户输入的名称 */}
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-white mb-0.5 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-[#00FF9D]" />
              {userName || agent.name}
            </h3>
          </div>

          {/* NFT编号 */}
          <div className="text-center mb-3">
            <span className="text-[10px] text-slate-400 font-mono">#{String(nftNumber).padStart(4, '0')}</span>
          </div>

          {/* 初始化策略偏好 */}
          <div className="bg-black/40 rounded-md p-2 border border-white/5 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain size={10} className="text-[#836EF9]" />
              <span className="text-[9px] text-slate-400 uppercase">Strategy Preference</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{agent.strategy}</p>
          </div>

          {/* 铸造者推特 */}
          {minterTwitter && (
            <div className="flex items-center justify-center gap-1 mb-2 text-[10px] text-slate-400">
              <AtSign size={10} className="text-[#836EF9]" />
              <span>{minterTwitter}</span>
            </div>
          )}

          {/* 底部AIperp.fun标识 */}
          <div className="flex items-center justify-center text-[9px] text-slate-500 border-t border-white/10 pt-2">
            <span className="flex items-center gap-1">
              <Zap size={8} className="text-[#836EF9]" />
              AIperp.fun
            </span>
          </div>
        </div>
      </div>

      {/* 立刻部署按钮 */}
      <button 
        onClick={onDeployNow}
        className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-lg text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#836EF9]/30 hover:shadow-[#836EF9]/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <Rocket size={16} />
        Deploy Now
      </button>

      {/* 装饰粒子 */}
      <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#00FF9D]/20 rounded-full blur-lg animate-pulse"></div>
      <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-[#836EF9]/20 rounded-full blur-lg animate-pulse delay-300"></div>
    </div>
  );
};
