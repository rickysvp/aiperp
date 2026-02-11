import React, { useRef, useEffect, useState } from 'react';

interface AIGeneratingProps {
  logs: string[];
}

export const AIGenerating: React.FC<AIGeneratingProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // 当所有日志显示完毕后，显示loading
    if (logs.length >= 10) {
      setShowLoading(true);
    }
  }, [logs]);

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col">
      {/* 代码终端区域 */}
      <div className="flex-1 mx-4 mt-4 mb-4 min-h-0">
        <div className="bg-black/90 border border-[#836EF9]/30 rounded-lg h-full flex flex-col overflow-hidden">
          {/* 终端头部 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#836EF9]/20 bg-[#0a0b14]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-[#836EF9] text-xs ml-2 font-mono">neural-core — zsh</span>
          </div>
          
          {/* 代码内容 */}
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
            
            {/* Loading状态 */}
            {showLoading && (
              <div className="mt-4 flex items-center gap-3 text-[#836EF9]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="text-xs">Synthesizing neural pathways...</span>
              </div>
            )}
            
            {/* 闪烁光标 */}
            {!showLoading && (
              <div className="text-[#836EF9] flex items-center gap-2">
                <span className="text-[#836EF9]/60">$</span>
                <span className="w-2 h-4 bg-[#00FF9D] animate-pulse"></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
