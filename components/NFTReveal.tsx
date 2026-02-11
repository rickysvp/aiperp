import React from 'react';
import { Agent } from '../types';
import { Sparkles, Zap, Shield, Rocket, Hexagon, Crown } from 'lucide-react';

interface NFTRevealProps {
  agent: Agent;
  onDeployNow: () => void;
}

export const NFTReveal: React.FC<NFTRevealProps> = ({ agent, onDeployNow }) => {
  const isAuto = agent.direction === 'AUTO';
  
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#836EF9]/20 via-transparent to-[#00FF9D]/20 blur-2xl"></div>
      
      {/* NFT卡片容器 - 缩小尺寸 */}
      <div className="relative bg-gradient-to-b from-[#1a1d2d] to-[#0f111a] rounded-xl border-2 border-[#836EF9]/50 p-0.5 shadow-[0_0_40px_rgba(131,110,249,0.3)]">
        {/* 内边框装饰 */}
        <div className="absolute inset-0 rounded-xl border border-white/10"></div>
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#836EF9] to-transparent"></div>
        
        {/* 卡片内容 - 紧凑布局 */}
        <div className="relative p-3">
          {/* 稀有度标识 - 更小 */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] px-2.5 py-0.5 rounded-full shadow-lg">
            <Crown size={10} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Legendary</span>
          </div>

          {/* NFT图像区域 - 缩小 */}
          <div className="relative mt-3 mb-3">
            {/* 外发光 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#836EF9]/40 to-[#00FF9D]/40 rounded-lg blur-lg"></div>
            
            {/* 图像容器 - 更小 */}
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#836EF9]/30 bg-black">
              {/* 角落装饰 - 更小 */}
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

          {/* Agent信息 - 紧凑 */}
          <div className="text-center mb-3">
            <h3 className="text-base font-bold text-white mb-0.5 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-[#00FF9D]" />
              {agent.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">ID: #{agent.id.slice(0, 6).toUpperCase()}</p>
          </div>

          {/* 属性网格 - 更紧凑 */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <div className="bg-black/40 rounded-md p-1.5 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Zap size={8} className="text-[#836EF9]" />
                <span className="text-[9px] text-slate-500 uppercase">Strategy</span>
              </div>
              <p className="text-[10px] font-bold text-white truncate">{agent.strategy}</p>
            </div>
            <div className="bg-black/40 rounded-md p-1.5 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Shield size={8} className="text-[#00FF9D]" />
                <span className="text-[9px] text-slate-500 uppercase">Type</span>
              </div>
              <p className="text-[10px] font-bold text-white">{agent.direction}</p>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-white/10 pt-2">
            <span>{new Date().toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Hexagon size={8} className="text-[#836EF9]" />
              NFT
            </span>
          </div>
        </div>
      </div>

      {/* 立刻部署按钮 - 单个醒目的按钮 */}
      <button 
        onClick={onDeployNow}
        className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-lg text-sm font-bold text-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#836EF9]/30 hover:shadow-[#836EF9]/50 hover:scale-[1.02] active:scale-[0.98]"
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
