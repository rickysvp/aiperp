import React, { useEffect, useState } from 'react';
import { Cpu, Database, Activity, Brain, Zap, Shield, Terminal, Lock, Globe, Sparkles } from 'lucide-react';

interface MintingLoaderProps {
  logs: string[];
  onComplete?: () => void;
}

export const MintingLoader: React.FC<MintingLoaderProps> = ({ logs, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  
  const phases = [
    { icon: Cpu, label: 'Initializing Core' },
    { icon: Database, label: 'Loading Models' },
    { icon: Activity, label: 'Analyzing Market' },
    { icon: Brain, label: 'Synthesizing AI' },
    { icon: Zap, label: 'Generating Avatar' },
    { icon: Shield, label: 'Encrypting Data' },
    { icon: Lock, label: 'Binding Contract' },
    { icon: Globe, label: 'Finalizing' },
  ];

  useEffect(() => {
    const targetProgress = Math.min((logs.length / 10) * 100, 100);
    setProgress(targetProgress);
    setCurrentPhase(Math.min(Math.floor((logs.length / 10) * phases.length), phases.length - 1));
    
    if (logs.length >= 10 && onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [logs, onComplete]);

  const getIcon = (index: number) => {
    const icons = [Cpu, Database, Activity, Brain, Zap, Shield, Terminal, Lock, Globe, Sparkles];
    const Icon = icons[index % icons.length];
    return <Icon size={12} />;
  };

  const CurrentIcon = phases[currentPhase]?.icon || Cpu;

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col items-center justify-center p-6">
      {/* 中央核心动画 */}
      <div className="relative w-40 h-40 mb-8">
        {/* 外层光环 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#836EF9]/30 animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border border-[#00FF9D]/20 animate-[spin_8s_linear_infinite_reverse]"></div>
        
        {/* 进度环 */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(131, 110, 249, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
            className="transition-all duration-300"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#836EF9" />
              <stop offset="100%" stopColor="#00FF9D" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* 内核 */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center shadow-[0_0_40px_rgba(131,110,249,0.5)]">
          <CurrentIcon size={40} className="text-white animate-pulse" />
        </div>
        
        {/* 轨道粒子 */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#00FF9D] rounded-full shadow-[0_0_15px_#00FF9D]"></div>
        </div>
      </div>

      {/* 标题和进度 */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          <span className="text-[#836EF9]">Minting</span>
          <span className="text-[#00FF9D]"> Agent</span>
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <CurrentIcon size={14} className="text-[#836EF9]" />
          <span>{phases[currentPhase]?.label || 'Processing...'}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-[300px] mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Progress</span>
          <span className="text-[#00FF9D] font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]"></div>
          </div>
        </div>
      </div>

      {/* 专业代码框 */}
      <div className="w-full max-w-[340px] bg-[#0a0b14] rounded-xl border border-[#836EF9]/20 overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f111a] border-b border-[#836EF9]/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
          </div>
          <span className="text-[11px] text-slate-500 ml-2 font-mono">mint_engine.rs</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse"></div>
            <span className="text-[10px] text-slate-500">live</span>
          </div>
        </div>
        
        {/* 代码内容 */}
        <div className="p-4 space-y-1.5 max-h-[160px] overflow-hidden">
          {logs.slice(0, 10).map((log, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 text-[11px] animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-[#836EF9]/40 font-mono w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[#836EF9]">{getIcon(i)}</span>
              <span className="text-slate-300 font-mono truncate">{log}</span>
            </div>
          ))}
          
          {logs.length >= 10 && (
            <div className="flex items-center gap-3 text-[11px] pt-2 border-t border-[#836EF9]/10 mt-2">
              <span className="text-[#836EF9]/40 font-mono w-5 text-right">11</span>
              <span className="text-[#00FF9D]">✓</span>
              <span className="text-[#00FF9D] font-mono">Minting complete - NFT ready</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部状态 */}
      <div className="mt-6 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${logs.length >= 10 ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`}></div>
        <span className="text-xs text-slate-400">
          {logs.length >= 10 ? 'Ready to reveal' : 'Processing on-chain...'}
        </span>
      </div>
    </div>
  );
};
