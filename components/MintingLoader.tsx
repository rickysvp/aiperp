import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MintingLoaderProps {
  onComplete?: () => void;
  agentName?: string;
}

const CODE_LINES = [
  { text: 'npm install ai-agent@latest', status: 'done' },
  { text: 'import { NeuralAgent } from "@aiperp/core"', status: 'done' },
  { text: 'const agent = new NeuralAgent()', status: 'done' },
  { text: 'await agent.loadModel("gemini-3-pro")', status: 'done' },
  { text: 'agent.configure({ strategy: "adaptive" })', status: 'done' },
  { text: 'const marketData = await fetchMarketAnalysis()', status: 'done' },
  { text: 'agent.train(marketData)', status: 'done' },
  { text: 'const avatar = generatePixelAvatar()', status: 'done' },
  { text: 'agent.encryptIdentity()', status: 'done' },
  { text: 'await agent.deployToBlockchain()', status: 'done' },
  { text: 'const nft = await mintAgentNFT(agent)', status: 'done' },
  { text: 'console.log("Agent ready for battle!")', status: 'done' },
];

const TOTAL_DURATION = 3000;

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete, agentName }) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Generate matrix rain characters
  useEffect(() => {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const interval = setInterval(() => {
      const newChars = Array.from({ length: 50 }, () => chars[Math.floor(Math.random() * chars.length)]);
      setMatrixChars(newChars);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Typing animation
  useEffect(() => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(Math.round(progressPercent));

      const lineProgress = (elapsed / TOTAL_DURATION) * CODE_LINES.length;
      const targetLine = Math.floor(lineProgress);
      const charProgress = lineProgress - targetLine;

      if (targetLine < CODE_LINES.length && targetLine >= 0) {
        setCurrentLineIndex(targetLine);
        const lineObj = CODE_LINES[targetLine];
        if (!lineObj) {
          requestAnimationFrame(animate);
          return;
        }
        const currentLine = lineObj.text;
        const charsToShow = Math.floor(currentLine.length * charProgress);
        setCurrentCharIndex(charsToShow);

        const newDisplayedLines = CODE_LINES.slice(0, targetLine).map(l => l.text);
        if (charsToShow > 0) {
          newDisplayedLines.push(currentLine.slice(0, charsToShow));
        }
        setDisplayedLines(newDisplayedLines);
      } else if (targetLine >= CODE_LINES.length) {
        setDisplayedLines(CODE_LINES.map(l => l.text));
        setIsComplete(true);
        setTimeout(() => onCompleteRef.current?.(), 500);
        return;
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col p-4 overflow-hidden bg-black">
      {/* Matrix Rain Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 font-mono text-[10px] text-[#00FF41] leading-none">
          {Array.from({ length: 20 }).map((_, row) => (
            <div key={row} className="whitespace-pre opacity-30" style={{ animationDelay: `${row * 0.1}s` }}>
              {matrixChars.slice(row * 2, row * 2 + 25).join(' ')}
            </div>
          ))}
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[#00FF41]" />
            <span className="text-xs font-mono text-[#00FF41]">aiperp_fabrication.exe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#00FF41]' : 'bg-[#00FF41] animate-pulse'}`} />
            <span className="text-xs font-mono text-[#00FF41]">{progress}%</span>
          </div>
        </div>
        
        {/* Progress Bar - Matrix Style */}
        <div className="h-1.5 bg-[#003300] rounded-full overflow-hidden border border-[#00FF41]/30">
          <div 
            className="h-full bg-[#00FF41] rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, boxShadow: '0 0 10px #00FF41' }}
          />
        </div>
      </div>

      {/* Main Terminal Window */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 bg-[#0a0a0a] border border-[#00FF41]/40 rounded-lg overflow-hidden"
        style={{ boxShadow: '0 0 20px rgba(0,255,65,0.1), inset 0 0 20px rgba(0,255,65,0.05)' }}
      >
        {/* Terminal Header */}
        <div className="px-3 py-1.5 border-b border-[#00FF41]/30 bg-[#0f0f0f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-[#00FF41]" />
            <span className="text-[10px] font-mono text-[#00FF41]/70">root@aiperp:~/fabrication</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-900/50 border border-red-700/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-900/50 border border-yellow-700/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-900/50 border border-[#00FF41]/50" />
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-3 font-mono text-xs overflow-y-auto h-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00FF41 #0a0a0a' }}>
          {/* Welcome Message */}
          <div className="text-[#00FF41]/50 mb-3 space-y-0.5">
            <div>{`>`} {t('minting_title')}</div>
            <div>{`>`} {t('minting_init')}</div>
            <div>{`>`} {t('minting_target')}: {agentName || 'Neural Agent'}</div>
            <div className="text-[#00FF41]/30">{'─'.repeat(50)}</div>
          </div>

          {/* Code Lines */}
          <div className="space-y-1">
            {displayedLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#00FF41]/50 shrink-0">{`>`}</span>
                <span className="text-[#00FF41]">{line}</span>
                {idx === displayedLines.length - 1 && !isComplete && (
                  <span className="inline-block w-2 h-4 bg-[#00FF41] ml-1 animate-pulse" />
                )}
                {idx < currentLineIndex && (
                  <CheckCircle2 size={12} className="text-[#00FF41] ml-1 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Current Line Being Typed */}
          {!isComplete && currentCharIndex > 0 && currentLineIndex === displayedLines.length && (
            <div className="flex items-start gap-2 mt-1">
              <span className="text-[#00FF41]/50 shrink-0">{`>`}</span>
              <span className="text-[#00FF41]">
                {CODE_LINES[currentLineIndex]?.text.slice(0, currentCharIndex)}
                <span className="inline-block w-2 h-4 bg-[#00FF41] ml-0.5 animate-pulse" />
              </span>
            </div>
          )}

          {/* Complete Message */}
          {isComplete && (
            <div className="mt-4 space-y-2">
              <div className="text-[#00FF41]/30">{'─'.repeat(50)}</div>
              <div className="flex items-center gap-2 text-[#00FF41]">
                <CheckCircle2 size={16} />
                <span className="font-bold">{t('minting_success')}</span>
              </div>
              <div className="text-[#00FF41]/70">{`>`} {t('minting_ready')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="relative z-10 mt-3 flex items-center justify-between text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-2 text-[#00FF41]/60">
          <span>{t('minting_sys_online')}</span>
          <span className="text-[#00FF41]/30">|</span>
          <span>{t('minting_mem')}</span>
          <span className="text-[#00FF41]/30">|</span>
          <span>{t('minting_net')}</span>
        </div>
        <div className="text-[#00FF41]">
          {isComplete ? t('minting_status_ready') : `${t('minting_executing')}: ${currentLineIndex + 1}/${CODE_LINES.length}`}
        </div>
      </div>
    </div>
  );
};
