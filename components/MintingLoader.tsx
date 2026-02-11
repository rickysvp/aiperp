import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void;
}

const CODE_SNIPPETS = [
  'npm install ai-agent@latest',
  'import { NeuralAgent } from "@aiperp/core"',
  'const agent = new NeuralAgent()',
  'await agent.loadModel("gemini-3-pro")',
  'agent.configure({ strategy: "adaptive" })',
  'const marketData = await fetchMarketAnalysis()',
  'agent.train(marketData)',
  'const avatar = generatePixelAvatar()',
  'agent.encryptIdentity()',
  'await agent.deployToBlockchain()',
  'const nft = await mintAgentNFT(agent)',
  'console.log("Agent ready for battle!")',
];

// 总时长3秒，分配给12行代码
const TOTAL_DURATION = 3000; // 3秒
const TYPING_SPEED = 15; // 每字符15ms

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startTime = performance.now();
    let currentLineIndex = 0;
    let currentCharIndex = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(Math.round(progressPercent));

      // 计算应该显示到哪一行
      const lineProgress = (elapsed / TOTAL_DURATION) * CODE_SNIPPETS.length;
      const targetLineIndex = Math.floor(lineProgress);
      const lineCharProgress = lineProgress - targetLineIndex;

      // 更新显示的行
      const newDisplayedText: string[] = [];
      for (let i = 0; i < CODE_SNIPPETS.length; i++) {
        if (i < targetLineIndex) {
          // 已完成行 - 显示完整
          newDisplayedText.push(CODE_SNIPPETS[i]);
        } else if (i === targetLineIndex) {
          // 当前行 - 显示部分
          const charsToShow = Math.floor(CODE_SNIPPETS[i].length * lineCharProgress);
          newDisplayedText.push(CODE_SNIPPETS[i].slice(0, charsToShow));
        } else {
          // 未开始行 - 空
          newDisplayedText.push('');
        }
      }
      setDisplayedText(newDisplayedText);

      if (progressPercent < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 确保最后一行完整显示
        setDisplayedText(CODE_SNIPPETS);
        setIsComplete(true);
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  // 找到当前正在输入的行
  const currentLineIndex = displayedText.findIndex((text, idx) => 
    text.length > 0 && text.length < CODE_SNIPPETS[idx].length
  );
  const activeLineIndex = currentLineIndex === -1 
    ? (isComplete ? -1 : displayedText.findIndex(t => t === ''))
    : currentLineIndex;

  return (
    <div className="relative w-full max-w-lg mx-auto h-full flex flex-col items-center justify-center p-6">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="absolute inset-0 font-mono text-[8px] text-[#00FF9D] leading-tight whitespace-pre-wrap break-all">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              {'01'.repeat(80)}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[#00FF9D]" />
            <span className="text-xs font-mono text-slate-400">aiperp_terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>building_agent...</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="relative z-10 w-full bg-[#0a0b14] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#0f111a] px-3 py-2 border-b border-slate-800 flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">~/aiperp/agents</span>
          <span className="text-[10px] text-slate-600">—</span>
          <span className="text-[10px] text-[#00FF9D] font-mono">zsh</span>
        </div>

        {/* Terminal Content */}
        <div 
          ref={containerRef}
          className="p-4 h-[280px] overflow-y-auto font-mono text-xs space-y-0.5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          {/* Welcome Message */}
          <div className="text-slate-500 mb-3">
            <div>AIperp Agent Fabrication Engine v2.0</div>
            <div>Initializing neural synthesis protocol...</div>
          </div>

          {CODE_SNIPPETS.map((fullCmd, idx) => {
            const displayedCmd = displayedText[idx] || '';
            const isActive = idx === activeLineIndex;
            const isDone = displayedCmd === fullCmd;
            
            if (!displayedCmd && !isDone) return null;
            
            return (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#836EF9] shrink-0">➜</span>
                <span className="text-slate-400 shrink-0">~</span>
                <span className="text-white break-all">
                  {displayedCmd}
                  {isActive && !isComplete && (
                    <span 
                      className={`inline-block w-2 h-4 bg-[#00FF9D] ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                </span>
              </div>
            );
          })}

          {/* Complete Message */}
          {isComplete && (
            <div className="flex items-center gap-2 mt-2 animate-fade-in">
              <span className="text-[#836EF9]">➜</span>
              <span className="text-slate-400">~</span>
              <span className="text-[#00FF9D]">
                <CheckCircle2 size={14} className="inline mr-1" />
                Agent fabrication complete!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="relative z-10 mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`} />
          <span>{isComplete ? 'READY' : 'COMPILING'}</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <span>v2.0.4-stable</span>
        <div className="w-px h-3 bg-slate-700" />
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
