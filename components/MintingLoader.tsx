import React, { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface MintingLoaderProps {
  logs: string[];
}

export const MintingLoader: React.FC<MintingLoaderProps> = ({ logs }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targetProgress = Math.min((logs.length / 10) * 100, 100);
    setProgress(targetProgress);
  }, [logs]);

  return (
    <div className="relative w-full max-w-sm mx-auto h-full flex flex-col items-center justify-center p-8">
      {/* 中央核心动画 */}
      <div className="relative w-32 h-32 mb-8">
        {/* 外圈 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#836EF9]/30 animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border border-[#00FF9D]/20 animate-[spin_6s_linear_infinite_reverse]"></div>

        {/* 进度环 */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="rgba(131, 110, 249, 0.1)"
            strokeWidth="3"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
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
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center shadow-[0_0_30px_rgba(131,110,249,0.4)]">
          <Brain size={36} className="text-white animate-pulse" />
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Sparkles size={18} className="text-[#00FF9D]" />
        <span className="text-[#836EF9]">Minting</span>
        <span className="text-[#00FF9D]">Agent</span>
      </h3>

      {/* 进度百分比 */}
      <div className="text-2xl font-mono font-bold text-white mb-4">
        {Math.round(progress)}%
      </div>

      {/* 简洁进度条 */}
      <div className="w-full max-w-[200px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 当前状态 */}
      <p className="mt-4 text-xs text-slate-400">
        {logs.length >= 10 ? 'Finalizing...' : 'Synthesizing neural pathways...'}
      </p>
    </div>
  );
};
