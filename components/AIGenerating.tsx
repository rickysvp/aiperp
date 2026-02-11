import React from 'react';

interface AIGeneratingProps {
  logs: string[];
}

export const AIGenerating: React.FC<AIGeneratingProps> = ({ logs }) => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 核心AI核心动画 */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* 外层光环 */}
        <div className="absolute inset-0 rounded-full border-2 border-[#836EF9]/30 animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border-2 border-[#00FF9D]/20 animate-[spin_3s_linear_infinite_reverse]"></div>
        
        {/* 脉冲波纹 */}
        <div className="absolute inset-0 rounded-full bg-[#836EF9]/10 animate-ping"></div>
        <div className="absolute inset-4 rounded-full bg-[#836EF9]/20 animate-pulse"></div>
        
        {/* 核心 */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#836EF9] via-[#00FF9D] to-[#836EF9] animate-pulse flex items-center justify-center">
          <div className="text-white font-bold text-2xl">AI</div>
        </div>
        
        {/* 轨道粒子 */}
        <div className="absolute inset-0 animate-[spin_2s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#00FF9D] rounded-full shadow-[0_0_10px_#00FF9D]"></div>
        </div>
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#836EF9] rounded-full shadow-[0_0_10px_#836EF9]"></div>
        </div>
      </div>

      {/* 标题 */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-1">
          <span className="text-[#836EF9]">AI</span> 
          <span className="text-[#00FF9D]">Generating</span>
        </h3>
        <p className="text-xs text-slate-400">Neural synthesis in progress...</p>
      </div>

      {/* 进度条 */}
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] animate-[loading_0.8s_ease-in-out]"></div>
        {/* 光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]"></div>
      </div>

      {/* 科技日志 */}
      <div className="bg-black/60 border border-[#836EF9]/30 rounded-lg p-3 font-mono text-xs">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#836EF9]/20">
          <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-pulse"></div>
          <span className="text-[#836EF9] uppercase tracking-wider">Neural Core</span>
          <span className="text-slate-600 ml-auto">v2.1.0</span>
        </div>
        <div className="space-y-1 h-16 overflow-hidden">
          {logs.slice(-3).map((log, i) => (
            <div 
              key={i} 
              className="text-[#00FF9D] flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-[#836EF9]">{'>'}</span>
              <span className="opacity-80">{log}</span>
              <span className="text-slate-600 ml-auto text-[10px]">{`0${i + 1}`}</span>
            </div>
          ))}
          {/* 闪烁光标 */}
          <div className="text-[#836EF9] flex items-center gap-2">
            <span>{'>'}</span>
            <span className="w-2 h-4 bg-[#00FF9D] animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* 数据流装饰 */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="w-1 h-1 bg-[#836EF9] rounded-full animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          ></div>
        ))}
      </div>
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="w-1 h-1 bg-[#00FF9D] rounded-full animate-pulse"
            style={{ animationDelay: `${i * 100 + 50}ms` }}
          ></div>
        ))}
      </div>
    </div>
  );
};
