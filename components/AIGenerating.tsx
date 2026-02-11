import React, { useRef, useEffect } from 'react';

interface AIGeneratingProps {
  logs: string[];
}

export const AIGenerating: React.FC<AIGeneratingProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col">
      {/* 核心AI动画 - 固定在顶部 */}
      <div className="flex-shrink-0 pt-4">
        <div className="relative w-24 h-24 mx-auto mb-4">
          {/* 外层光环 */}
          <div className="absolute inset-0 rounded-full border-2 border-[#836EF9]/30 animate-[spin_4s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-full border-2 border-[#00FF9D]/20 animate-[spin_3s_linear_infinite_reverse]"></div>
          
          {/* 脉冲波纹 */}
          <div className="absolute inset-0 rounded-full bg-[#836EF9]/10 animate-ping"></div>
          <div className="absolute inset-4 rounded-full bg-[#836EF9]/20 animate-pulse"></div>
          
          {/* 核心 */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#836EF9] via-[#00FF9D] to-[#836EF9] animate-pulse flex items-center justify-center">
            <div className="text-white font-bold text-xl">AI</div>
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
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-white mb-1">
            <span className="text-[#836EF9]">AI</span> 
            <span className="text-[#00FF9D]">Generating</span>
          </h3>
          <p className="text-xs text-slate-400">Neural synthesis in progress...</p>
        </div>

        {/* 进度条 */}
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3 mx-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] animate-[loading_0.8s_ease-in-out]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]"></div>
        </div>
      </div>

      {/* 可滚动的代码日志区域 */}
      <div className="flex-1 mx-4 mb-4 min-h-0">
        <div className="bg-black/80 border border-[#836EF9]/30 rounded-lg h-full flex flex-col overflow-hidden">
          {/* 终端头部 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#836EF9]/20 bg-[#0f111a]">
            <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-pulse"></div>
            <span className="text-[#836EF9] text-xs uppercase tracking-wider font-mono">Neural Core</span>
            <span className="text-slate-600 text-xs ml-auto font-mono">v2.1.0</span>
          </div>
          
          {/* 可滚动的日志内容 */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-[#836EF9]/30 scrollbar-track-transparent"
          >
            {logs.map((log, i) => (
              <div 
                key={i} 
                className="text-[#00FF9D] flex items-start gap-2 animate-fade-in"
              >
                <span className="text-[#836EF9] flex-shrink-0">{'>'}</span>
                <span className="opacity-80 break-all">{log}</span>
              </div>
            ))}
            {/* 闪烁光标 */}
            <div className="text-[#836EF9] flex items-center gap-2">
              <span>{'>'}</span>
              <span className="w-2 h-4 bg-[#00FF9D] animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
