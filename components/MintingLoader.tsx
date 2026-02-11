import React, { useEffect, useState } from 'react';
import { Brain, Terminal, Cpu, Database, Zap, Lock } from 'lucide-react';

interface MintingLoaderProps {
  logs: string[];
}

// 光粒子组件
const Particle: React.FC<{ delay: number; color: string; size: number; duration: number }> = ({ delay, color, size, duration }) => (
  <div
    className="absolute rounded-full animate-pulse"
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animationDelay: `${delay}ms`,
      animationDuration: `${duration}ms`,
      opacity: 0.6,
    }}
  />
);

export const MintingLoader: React.FC<MintingLoaderProps> = ({ logs }) => {
  const [progress, setProgress] = useState(0);
  const [currentCode, setCurrentCode] = useState('');

  const codeSnippets = [
    'import neural_network as nn',
    'agent = nn.Agent(config)',
    'agent.load_weights("gemini-v3")',
    'strategy = analyze_market()',
    'avatar = render_pixel_art()',
    'encrypt_identity()',
    'bind_contract()',
    'mint_nft()',
  ];

  useEffect(() => {
    const targetProgress = Math.min((logs.length / 10) * 100, 100);
    setProgress(targetProgress);

    // 根据进度更新当前显示的代码
    const codeIndex = Math.min(Math.floor((logs.length / 10) * codeSnippets.length), codeSnippets.length - 1);
    setCurrentCode(codeSnippets[codeIndex]);
  }, [logs]);

  const getIcon = (index: number) => {
    const icons = [Cpu, Database, Terminal, Brain, Zap, Lock];
    const Icon = icons[index % icons.length];
    return <Icon size={12} className="text-[#00FF9D]" />;
  };

  // 生成随机粒子
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    color: Math.random() > 0.5 ? '#836EF9' : '#00FF9D',
    size: Math.random() * 4 + 2,
    duration: Math.random() * 2000 + 2000,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  }));

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col items-center justify-center p-8">
      {/* 背景光粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-pulse"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
            }}
          >
            <Particle delay={p.delay} color={p.color} size={p.size} duration={p.duration} />
          </div>
        ))}
      </div>

      {/* 中央核心动画 */}
      <div className="relative w-36 h-36 mb-8">
        {/* 多层旋转光环 */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#836EF9]/40 animate-[spin_12s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border border-[#00FF9D]/30 animate-[spin_8s_linear_infinite_reverse]"></div>
        <div className="absolute inset-4 rounded-full border border-dotted border-[#836EF9]/20 animate-[spin_6s_linear_infinite]"></div>

        {/* 脉冲波纹 */}
        <div className="absolute inset-0 rounded-full bg-[#836EF9]/5 animate-ping"></div>

        {/* 进度环 */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="60"
            fill="none"
            stroke="rgba(131, 110, 249, 0.15)"
            strokeWidth="4"
          />
          <circle
            cx="72"
            cy="72"
            r="60"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#836EF9" />
              <stop offset="50%" stopColor="#00FF9D" />
              <stop offset="100%" stopColor="#836EF9" />
            </linearGradient>
          </defs>
        </svg>

        {/* 内核 */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#836EF9] via-[#836EF9]/80 to-[#00FF9D] flex items-center justify-center shadow-[0_0_40px_rgba(131,110,249,0.6)]">
          <Brain size={40} className="text-white animate-pulse" />
        </div>

        {/* 轨道粒子 */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#00FF9D] rounded-full shadow-[0_0_15px_#00FF9D]"></div>
        </div>
        <div className="absolute inset-0 animate-[spin_5s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#836EF9] rounded-full shadow-[0_0_10px_#836EF9]"></div>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
        <span className="text-[#836EF9]">Minting</span>
        <span className="text-[#00FF9D]">Agent</span>
      </h3>
      <p className="text-xs text-slate-400 mb-6">{Math.round(progress)}% Complete</p>

      {/* 代码展示框 */}
      <div className="w-full max-w-[280px] bg-[#0a0b14]/80 backdrop-blur-sm rounded-lg border border-[#836EF9]/30 overflow-hidden mb-6">
        {/* 头部 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0f111a] border-b border-[#836EF9]/20">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
          </div>
          <Terminal size={12} className="text-[#836EF9] ml-2" />
          <span className="text-[10px] text-slate-500 font-mono">mint_engine.py</span>
        </div>

        {/* 代码内容 */}
        <div className="p-3 space-y-1.5">
          {logs.slice(0, 8).map((log, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[10px] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-[#836EF9]/40 font-mono w-4">{i + 1}</span>
              <span className="text-[#836EF9]">{getIcon(i)}</span>
              <span className="text-slate-300 font-mono truncate">{log}</span>
            </div>
          ))}

          {/* 当前执行的高亮代码行 */}
          {currentCode && (
            <div className="flex items-center gap-2 text-[10px] pt-2 border-t border-[#836EF9]/20 mt-2">
              <span className="text-[#00FF9D]/40 font-mono w-4">&gt;</span>
              <span className="text-[#00FF9D] animate-pulse">▸</span>
              <span className="text-[#00FF9D] font-mono">{currentCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-[240px] h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] transition-all duration-300 ease-out rounded-full relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};
