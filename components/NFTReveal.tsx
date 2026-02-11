import React from 'react';
import { Agent } from '../types';
import { Sparkles, Zap, Shield, Star, Hexagon, Crown } from 'lucide-react';

interface NFTRevealProps {
  agent: Agent;
  onAddToFleet: () => void;
  onCreateAnother: () => void;
}

export const NFTReveal: React.FC<NFTRevealProps> = ({ agent, onAddToFleet, onCreateAnother }) => {
  const isAuto = agent.direction === 'AUTO';
  const themeColor = isAuto ? 'violet' : agent.direction === 'LONG' ? 'emerald' : 'rose';
  const themeHex = isAuto ? '#836EF9' : agent.direction === 'LONG' ? '#10B981' : '#FB7185';
  
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#836EF9]/20 via-transparent to-[#00FF9D]/20 blur-3xl"></div>
      
      {/* NFT卡片容器 */}
      <div className="relative bg-gradient-to-b from-[#1a1d2d] to-[#0f111a] rounded-2xl border-2 border-[#836EF9]/50 p-1 shadow-[0_0_50px_rgba(131,110,249,0.3)]">
        {/* 内边框装饰 */}
        <div className="absolute inset-0 rounded-2xl border border-white/10"></div>
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#836EF9] to-transparent"></div>
        
        {/* 卡片内容 */}
        <div className="relative p-4">
          {/* 稀有度标识 */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] px-3 py-1 rounded-full shadow-lg">
            <Crown size={12} className="text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Legendary</span>
          </div>

          {/* NFT图像区域 */}
          <div className="relative mt-4 mb-4">
            {/* 外发光 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#836EF9]/40 to-[#00FF9D]/40 rounded-xl blur-xl"></div>
            
            {/* 图像容器 */}
            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#836EF9]/30 bg-black">
              {/* 角落装饰 */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#836EF9]"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#836EF9]"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#836EF9]"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#836EF9]"></div>
              
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

          {/* Agent信息 */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-[#00FF9D]" />
              {agent.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono">ID: #{agent.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* 属性网格 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-black/40 rounded-lg p-2 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} className="text-[#836EF9]" />
                <span className="text-[10px] text-slate-500 uppercase">Strategy</span>
              </div>
              <p className="text-xs font-bold text-white truncate">{agent.strategy}</p>
            </div>
            <div className="bg-black/40 rounded-lg p-2 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={10} className="text-[#00FF9D]" />
                <span className="text-[10px] text-slate-500 uppercase">Type</span>
              </div>
              <p className="text-xs font-bold text-white">{agent.direction}</p>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/10 pt-3">
            <span>Minted: {new Date().toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Hexagon size={10} className="text-[#836EF9]" />
              ERC-721
            </span>
          </div>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="mt-4 space-y-2">
        <button 
          onClick={onAddToFleet}
          className="w-full py-3 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-[#836EF9]/20"
        >
          <Star size={16} fill="currentColor" />
          Add to Fleet
        </button>
        <button 
          onClick={onCreateAnother}
          className="w-full py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-all"
        >
          Create Another Agent
        </button>
      </div>

      {/* 装饰粒子 */}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#00FF9D]/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#836EF9]/20 rounded-full blur-xl animate-pulse delay-300"></div>
    </div>
  );
};
