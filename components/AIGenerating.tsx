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
      <div className="flex-shrink-0 pt-6 pb-4">
        <div className="relative w-20 h-20 mx-auto">
          {/* 外层光环 */}
          <div className="absolute inset-0 rounded-full border-2 border-[#836EF9]/30 animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-full border border-[#00FF9D]/20 animate-[spin_2s_linear_infinite_reverse]"></div>
          
          {/* 脉冲波纹 */}
          <div className="absolute inset-0 rounded-full bg-[#836EF9]/10 animate-ping"></div>
          
          {/* 核心 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center">
            <div className="text-white font-bold text-lg">AI</div>
          </div>
          
          {/* 轨道粒子 */}
          <div className="absolute inset-0 animate-[spin_1.5s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#00FF9D] rounded-full shadow-[0_0_8px_#00FF9D]"></div>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mt-4">
          <h3 className="text-lg font-bold text-white">
            <span className="text-[#836EF9]">Synthesizing</span>
            <span className="text-[#00FF9D]"> Agent</span>
          </h3>
        </div>
      </div>

      {/* 可滚动的代码日志区域 */}
      <div className="flex-1 mx-4 mb-4 min-h-0">
        <div className="bg-black/80 border border-[#836EF9]/30 rounded-lg h-full flex flex-col overflow-hidden">
          {/* 终端头部 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#836EF9]/20 bg-[#0a0b14]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-[#836EF9] text-xs ml-2 font-mono">neural-core — zsh</span>
          </div>
          
          {/* 可滚动的日志内容 */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 scrollbar-thin scrollbar-thumb-[#836EF9]/30 scrollbar-track-transparent"
          >
            {logs.map((log, i) => (
              <div 
                key={i} 
                className="text-[#00FF9D]/90 flex items-start gap-2"
              >
                <span className="text-[#836EF9]/60 flex-shrink-0">$</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
            {/* 闪烁光标 */}
            <div className="text-[#836EF9] flex items-center gap-2">
              <span className="text-[#836EF9]/60">$</span>
              <span className="w-2 h-4 bg-[#00FF9D] animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
