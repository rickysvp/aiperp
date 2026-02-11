import React, { useEffect, useState } from 'react';
import { Terminal, Cpu, Database, Zap, Lock } from 'lucide-react';

interface MintingLoaderProps {
  logs: string[];
}

// 光粒子组件
const Particle: React.FC<{ delay: number; color: string; size: number }> = ({ delay, color, size }) => (
  <div
    className="absolute rounded-full animate-pulse"
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animationDelay: `${delay}ms`,
      opacity: 0.5,
    }}
  />
);

export const MintingLoader: React.FC<MintingLoaderProps> = ({ logs }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 10条日志，每条80ms，总共800ms，但等待1200ms
    // 所以进度条应该在800ms时达到100%，然后保持到1200ms
    const targetProgress = Math.min((logs.length / 10) * 100, 100);
    setProgress(targetProgress);
  }, [logs]);

  const getIcon = (index: number) => {
    const icons = [Cpu, Database, Terminal, Zap, Lock];
    const Icon = icons[index % icons.length];
    return <Icon size={10} className="text-[#00FF9D]" />;
  };

  // 生成随机粒子
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1000,
    color: Math.random() > 0.5 ? '#836EF9' : '#00FF9D',
    size: Math.random() * 3 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  }));

  return (
    <div className="relative w-full max-w-sm mx-auto h-full flex flex-col items-center justify-center p-6">
      {/* 背景光粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{ left: p.left, top: p.top }}
          >
            <Particle delay={p.delay} color={p.color} size={p.size} />
          </div>
        ))}
      </div>

      {/* 简洁标题 */}
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-[#836EF9]">Minting</span>
        <span className="text-[#00FF9D]">Agent</span>
      </h3>

      {/* 代码展示框 - 更紧凑 */}
      <div className="w-full max-w-[260px] bg-[#0a0b14]/90 rounded-lg border border-[#836EF9]/20 overflow-hidden mb-4">
        {/* 头部 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f111a] border-b border-[#836EF9]/10">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          </div>
          <Terminal size={10} className="text-[#836EF9] ml-1" />
          <span className="text-[9px] text-slate-500 font-mono">engine.py</span>
        </div>

        {/* 代码内容 */}
        <div className="p-2.5 space-y-1">
          {logs.slice(0, 10).map((log, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[9px]"
            >
              <span className="text-[#836EF9]/30 font-mono w-3">{i + 1}</span>
              <span className="text-[#836EF9]">{getIcon(i)}</span>
              <span className="text-slate-400 font-mono truncate">{log.replace(/\[.*?\]\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-[200px]">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span>Progress</span>
          <span className="text-[#00FF9D] font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
