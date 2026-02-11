import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Database, Brain, Lock, Rocket, Sparkles } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void;
  agentName?: string;
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

const TOTAL_DURATION = 3000;

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete, agentName }) => {
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

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(Math.round(progressPercent));

      const lineProgress = (elapsed / TOTAL_DURATION) * CODE_SNIPPETS.length;
      const targetLineIndex = Math.floor(lineProgress);
      const lineCharProgress = lineProgress - targetLineIndex;

      const newDisplayedText: string[] = [];
      for (let i = 0; i < CODE_SNIPPETS.length; i++) {
        if (i < targetLineIndex) {
          newDisplayedText.push(CODE_SNIPPETS[i]);
        } else if (i === targetLineIndex) {
          const charsToShow = Math.floor(CODE_SNIPPETS[i].length * lineCharProgress);
          newDisplayedText.push(CODE_SNIPPETS[i].slice(0, charsToShow));
        } else {
          newDisplayedText.push('');
        }
      }
      setDisplayedText(newDisplayedText);

      if (progressPercent < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(CODE_SNIPPETS);
        setProgress(100);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  const currentLineIndex = displayedText.findIndex((text, idx) => 
    text.length > 0 && text.length < CODE_SNIPPETS[idx].length
  );
  const activeLineIndex = currentLineIndex === -1 
    ? (isComplete ? -1 : displayedText.findIndex(t => t === ''))
    : currentLineIndex;

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col items-center justify-center p-4">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="absolute inset-0 font-mono text-[6px] text-[#00FF9D] leading-tight whitespace-pre-wrap break-all">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              {'01'.repeat(60)}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[#00FF9D]" />
            <span className="text-[10px] font-mono text-slate-400">aiperp_terminal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
          <span>building_agent...</span>
          <span className={isComplete ? 'text-[#00FF9D]' : 'text-[#836EF9]'}>{progress}%</span>
        </div>
      </div>

      {/* Terminal Window - Compact */}
      <div className="relative z-10 w-full bg-[#0a0b14] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        {/* Terminal Header */}
        <div className="bg-[#0f111a] px-2 py-1.5 border-b border-slate-800 flex items-center gap-2">
          <span className="text-[9px] text-slate-500 font-mono">~/aiperp/agents</span>
          <span className="text-[9px] text-slate-600">—</span>
          <span className="text-[9px] text-[#00FF9D] font-mono">zsh</span>
        </div>

        {/* Terminal Content - Fixed height for 12 lines */}
        <div 
          ref={containerRef}
          className="p-3 h-[200px] overflow-y-auto font-mono text-[10px] space-y-0.5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          {/* Welcome Message */}
          <div className="text-slate-500 mb-2 text-[9px]">
            <div>AIperp Agent Fabrication Engine v2.0</div>
            <div className="text-[#836EF9]">Initializing neural synthesis...</div>
          </div>

          {CODE_SNIPPETS.map((fullCmd, idx) => {
            const displayedCmd = displayedText[idx] || '';
            const isActive = idx === activeLineIndex;
            
            if (!displayedCmd) return null;
            
            return (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-[#836EF9] shrink-0">➜</span>
                <span className="text-slate-400 shrink-0">~</span>
                <span className="text-white break-all">
                  {displayedCmd}
                  {isActive && !isComplete && (
                    <span 
                      className={`inline-block w-1.5 h-3 bg-[#00FF9D] ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                </span>
              </div>
            );
          })}

          {/* Complete Message */}
          {isComplete && (
            <div className="flex items-center gap-1.5 text-[#00FF9D] animate-fade-in pt-1">
              <CheckCircle2 size={12} />
              <span className="font-bold text-[10px]">Agent fabrication complete!</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="relative z-10 mt-3 flex items-center gap-4 text-[9px] text-slate-500 font-mono">
        <div className="flex items-center gap-1">
          <div className={`w-1 h-1 rounded-full ${isComplete ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`} />
          <span>{isComplete ? 'READY' : 'COMPILING'}</span>
        </div>
        <div className="w-px h-2 bg-slate-700" />
        <span>v2.0.4</span>
        <div className="w-px h-2 bg-slate-700" />
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
