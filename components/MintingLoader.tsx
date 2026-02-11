import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2 } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void;
}

const CODE_SNIPPETS = [
  { cmd: 'npm install ai-agent@latest', output: '' },
  { cmd: 'import { NeuralAgent } from "@aiperp/core"', output: '' },
  { cmd: 'const agent = new NeuralAgent()', output: '' },
  { cmd: 'await agent.loadModel("gemini-3-pro")', output: '' },
  { cmd: 'agent.configure({ strategy: "adaptive" })', output: '' },
  { cmd: 'const marketData = await fetchMarketAnalysis()', output: '' },
  { cmd: 'agent.train(marketData)', output: '' },
  { cmd: 'const avatar = generatePixelAvatar()', output: '' },
  { cmd: 'agent.encryptIdentity()', output: '' },
  { cmd: 'await agent.deployToBlockchain()', output: '' },
  { cmd: 'const nft = await mintAgentNFT(agent)', output: '' },
  { cmd: 'console.log("Agent ready for battle!")', output: '' },
];

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<{ cmd: string; output: string; status: 'typing' | 'done' }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const isRunningRef = useRef(false);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Main typing animation effect
  useEffect(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const typeLine = async (lineIndex: number) => {
      if (lineIndex >= CODE_SNIPPETS.length) {
        setIsComplete(true);
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 800);
        return;
      }

      const snippet = CODE_SNIPPETS[lineIndex];
      setCurrentLine(lineIndex);
      
      // Add new line with typing status
      setDisplayedLines(prev => [...prev, { cmd: '', output: '', status: 'typing' }]);

      // Type command character by character
      for (let i = 0; i <= snippet.cmd.length; i++) {
        await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
        setDisplayedLines(prev => {
          const newLines = [...prev];
          if (newLines[lineIndex]) {
            newLines[lineIndex] = { 
              ...newLines[lineIndex], 
              cmd: snippet.cmd.slice(0, i),
              status: 'typing'
            };
          }
          return newLines;
        });
      }

      // Show output after a brief pause
      await new Promise(r => setTimeout(r, 200));
      
      setDisplayedLines(prev => {
        const newLines = [...prev];
        if (newLines[lineIndex]) {
          newLines[lineIndex] = { 
            cmd: snippet.cmd, 
            output: snippet.output,
            status: 'done'
          };
        }
        return newLines;
      });

      // Move to next line
      setTimeout(() => typeLine(lineIndex + 1), 150);
    };

    typeLine(0);

    return () => {
      isRunningRef.current = false;
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
  }, [displayedLines]);

  const progress = Math.round((currentLine / CODE_SNIPPETS.length) * 100);

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
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] transition-all duration-300"
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
          className="p-4 h-[280px] overflow-y-auto font-mono text-xs space-y-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          {/* Welcome Message */}
          <div className="text-slate-500 mb-3">
            <div>AIperp Agent Fabrication Engine v2.0</div>
            <div>Initializing neural synthesis protocol...</div>
          </div>

          {displayedLines.map((line, idx) => (
            <div key={idx} className="space-y-0.5">
              {/* Command Line */}
              <div className="flex items-start gap-2">
                <span className="text-[#836EF9] shrink-0">➜</span>
                <span className="text-slate-400 shrink-0">~</span>
                <span className="text-white break-all">
                  {line.cmd}
                  {idx === currentLine && line.status === 'typing' && !isComplete && (
                    <span 
                      className={`inline-block w-2 h-4 bg-[#00FF9D] ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                </span>
              </div>
              
              {/* Output Line */}
              {line.output && (
                <div className="pl-4 text-[#00FF9D]/80 text-[11px]">
                  {line.output}
                </div>
              )}
            </div>
          ))}

          {/* Current Input Line */}
          {isComplete && (
            <div className="flex items-center gap-2 mt-2">
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
