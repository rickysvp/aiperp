import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Database, Shield, Zap, Brain, Terminal } from 'lucide-react';

interface AIGeneratingProps {
  logs: string[];
}

export const AIGenerating: React.FC<AIGeneratingProps> = ({ logs }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // 根据日志数量计算进度
    const targetProgress = Math.min((logs.length / 10) * 100, 100);
    setProgress(targetProgress);
  }, [logs]);

  const getIcon = (index: number) => {
    const icons = [
      <Cpu size={14} key={0} />,
      <Database size={14} key={1} />,
      <Activity size={14} key={2} />,
      <Brain size={14} key={3} />,
      <Zap size={14} key={4} />,
      <Shield size={14} key={5} />,
      <Terminal size={14} key={6} />,
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col items-center justify-center p-6">
      {/* AI核心动画 */}
      <div className="relative w-32 h-32 mb-6">
        {/* 外圈 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#836EF9]/30 animate-[spin_8s_linear_infinite]"></div>
        
        {/* 中圈 */}
        <div className="absolute inset-3 rounded-full border border-[#00FF9D]/20 animate-[spin_6s_linear_infinite_reverse]"></div>
        
        {/* 内核 */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center shadow-[0_0_30px_rgba(131,110,249,0.5)]">
          <Brain size={32} className="text-white animate-pulse" />
        </div>
        
        {/* 轨道点 */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#00FF9D] rounded-full shadow-[0_0_10px_#00FF9D]"></div>
        </div>
        <div className="absolute inset-0 animate-[spin_5s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#836EF9] rounded-full shadow-[0_0_10px_#836EF9]"></div>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-bold text-white mb-2">
        <span className="text-[#836EF9]">AI</span>
        <span className="text-[#00FF9D]"> Synthesis</span>
      </h3>
      <p className="text-xs text-slate-400 mb-6">Generating neural agent...</p>

      {/* 进度条 */}
      <div className="w-full max-w-[280px] h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* 专业代码框 */}
      <div className="w-full max-w-[320px] bg-[#0a0b14] rounded-lg border border-[#836EF9]/20 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0f111a] border-b border-[#836EF9]/10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
          </div>
          <span className="text-[10px] text-slate-500 ml-2 font-mono">neural_synthesis.py</span>
        </div>
        
        {/* 代码内容 - 只显示一次 */}
        <div className="p-3 space-y-2 max-h-[180px] overflow-hidden">
          {logs.slice(0, 10).map((log, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 text-[11px] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-[#836EF9]/40 font-mono w-5">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[#836EF9]">{getIcon(i)}</span>
              <span className="text-slate-300 font-mono truncate">{log}</span>
            </div>
          ))}
          
          {/* 完成后的对勾 */}
          {logs.length >= 10 && (
            <div className="flex items-center gap-3 text-[11px] pt-2 border-t border-[#836EF9]/10">
              <span className="text-[#836EF9]/40 font-mono w-5">11</span>
              <span className="text-[#00FF9D]">✓</span>
              <span className="text-[#00FF9D] font-mono">Synthesis complete</span>
            </div>
          )}
        </div>
      </div>

      {/* 状态指示 */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${logs.length >= 10 ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`}></div>
        <span className="text-xs text-slate-400">
          {logs.length >= 10 ? 'Ready to mint' : 'Processing...'}
        </span>
      </div>
    </div>
  );
};
