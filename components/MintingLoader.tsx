import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Terminal, Cpu, Database, Zap, Lock, Sparkles } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void | Promise<void>;
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

const codeLines = [
  'import neural_network as nn',
  'agent = nn.Agent(config)',
  'agent.load_weights("gemini-v3")',
  'strategy = analyze_market()',
  'avatar = render_pixel_art()',
  'encrypt_identity()',
  'bind_contract()',
  'mint_nft()',
  'verify_on_chain()',
  'deploy_ready()',
];

const logMessages = [
  'Initializing neural synthesis...',
  'Loading Gemini-3 weights...',
  'Scanning blockchain shards...',
  'Analyzing market trends...',
  'Generating strategy matrix...',
  'Constructing neural pathways...',
  'Rendering pixel avatar...',
  'Encrypting identity hash...',
  'Binding smart contract...',
  'Finalizing deployment...',
];

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const duration = 2000; // 2秒总时长
  const hasCompleted = useRef(false);

  const handleComplete = useCallback(async () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    
    try {
      await onComplete?.();
    } catch (error) {
      console.error('Minting completion error:', error);
    }
  }, [onComplete]);

  useEffect(() => {
    hasCompleted.current = false;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);
      
      // 根据进度显示代码行
      const linesToShow = Math.floor((newProgress / 100) * codeLines.length);
      setVisibleLines(linesToShow);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 进度完成，触发回调
        setTimeout(() => {
          handleComplete();
        }, 200);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [handleComplete]);

  const getIcon = (index: number) => {
    const icons = [Cpu, Database, Terminal, Zap, Lock];
    const Icon = icons[index % icons.length];
    return <Icon size={10} className="text-[#00FF9D]" />;
  };

  // 生成随机粒子
  const particles = Array.from({ length: 6 }, (_, i) => ({
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

      {/* 标题 */}
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles size={16} className="text-[#00FF9D] animate-pulse" />
        <span className="text-[#836EF9]">Minting</span>
        <span className="text-[#00FF9D]">Agent</span>
      </h3>

      {/* 代码展示框 */}
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

        {/* 代码内容 - 根据进度显示 */}
        <div className="p-2.5 space-y-1">
          {codeLines.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[9px] animate-fade-in"
            >
              <span className="text-[#836EF9]/30 font-mono w-3">{i + 1}</span>
              <span className="text-[#836EF9]">{getIcon(i)}</span>
              <span className="text-slate-300 font-mono truncate">{logMessages[i]}</span>
            </div>
          ))}
          
          {/* 当前执行行指示器 */}
          {visibleLines < codeLines.length && visibleLines > 0 && (
            <div className="flex items-center gap-2 text-[9px] pt-1">
              <span className="text-[#00FF9D]/40 font-mono w-3">{visibleLines + 1}</span>
              <span className="text-[#00FF9D] animate-pulse">▸</span>
              <span className="text-[#00FF9D] font-mono">{codeLines[visibleLines]}</span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-[200px]">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span>Progress</span>
          <span className="text-[#00FF9D] font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-75 ease-linear rounded-full relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_0.5s_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
