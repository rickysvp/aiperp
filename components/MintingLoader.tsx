import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Database, Brain, Lock, Rocket, Sparkles } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void;
  agentName?: string;
}

interface Step {
  id: string;
  icon: React.ElementType;
  label: string;
  code: string;
  duration: number;
}

const STEPS: Step[] = [
  { id: 'init', icon: Cpu, label: 'Initializing', code: 'npm install ai-agent@latest', duration: 250 },
  { id: 'import', icon: Database, label: 'Loading Core', code: 'import { NeuralAgent } from "@aiperp/core"', duration: 200 },
  { id: 'create', icon: Brain, label: 'Creating Instance', code: 'const agent = new NeuralAgent()', duration: 200 },
  { id: 'model', icon: Database, label: 'Loading Model', code: 'await agent.loadModel("gemini-3-pro")', duration: 300 },
  { id: 'config', icon: Cpu, label: 'Configuring', code: 'agent.configure({ strategy: "adaptive" })', duration: 200 },
  { id: 'market', icon: Database, label: 'Fetching Data', code: 'const marketData = await fetchMarketAnalysis()', duration: 350 },
  { id: 'train', icon: Brain, label: 'Training', code: 'agent.train(marketData)', duration: 400 },
  { id: 'avatar', icon: Sparkles, label: 'Rendering Avatar', code: 'const avatar = generatePixelAvatar()', duration: 300 },
  { id: 'encrypt', icon: Lock, label: 'Encrypting', code: 'agent.encryptIdentity()', duration: 250 },
  { id: 'deploy', icon: Rocket, label: 'Deploying', code: 'await agent.deployToBlockchain()', duration: 350 },
  { id: 'mint', icon: Database, label: 'Minting NFT', code: 'const nft = await mintAgentNFT(agent)', duration: 300 },
  { id: 'ready', icon: CheckCircle2, label: 'Ready', code: 'console.log("Agent ready for battle!")', duration: 200 },
];

const TOTAL_DURATION = STEPS.reduce((sum, step) => sum + step.duration, 0);

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete, agentName }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [currentCode, setCurrentCode] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let stepStartTime = performance.now();
    let currentStepIdx = 0;
    let codeCharIndex = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - stepStartTime;
      const currentStep = STEPS[currentStepIdx];
      
      const stepsBeforeDuration = STEPS.slice(0, currentStepIdx).reduce((sum, s) => sum + s.duration, 0);
      const stepProgress = Math.min(elapsed / currentStep.duration, 1);
      const totalProgress = ((stepsBeforeDuration + currentStep.duration * stepProgress) / TOTAL_DURATION) * 100;
      
      setProgress(Math.round(totalProgress));
      setCurrentStepIndex(currentStepIdx);

      const code = currentStep.code;
      const charsToShow = Math.floor(code.length * stepProgress);
      if (charsToShow !== codeCharIndex) {
        codeCharIndex = charsToShow;
        setCurrentCode(code.slice(0, charsToShow));
      }

      if (elapsed >= currentStep.duration) {
        setCompletedSteps(prev => new Set([...prev, currentStep.id]));
        
        if (currentStepIdx < STEPS.length - 1) {
          currentStepIdx++;
          stepStartTime = currentTime;
          codeCharIndex = 0;
          setCurrentCode('');
        } else {
          setIsComplete(true);
          setProgress(100);
          setTimeout(() => {
            onCompleteRef.current?.();
          }, 300);
          return;
        }
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
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
  }, [currentStepIndex, currentCode]);

  const currentStep = STEPS[currentStepIndex];
  const CurrentIcon = currentStep?.icon || CheckCircle2;

  return (
    <div className="relative w-full h-full flex flex-col p-3 overflow-hidden">
      {/* Header - Compact */}
      <div className="relative z-10 mb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center">
              <Terminal size={14} className="text-black" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Fabricating Agent</h3>
              <p className="text-[10px] text-slate-400">{agentName || 'Neural Agent'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`} />
            <span className="text-[10px] font-mono text-slate-400">{isComplete ? 'DONE' : 'WORKING'}</span>
          </div>
        </div>
        
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
          <span>{Math.min(currentStepIndex + 1, STEPS.length)}/{STEPS.length}</span>
          <span className={isComplete ? 'text-[#00FF9D]' : 'text-[#836EF9]'}>{progress}%</span>
        </div>
      </div>

      {/* Steps List - Compact Grid */}
      <div className="relative z-10 flex-1 bg-[#0a0b14] border border-slate-800 rounded-lg overflow-hidden min-h-0">
        <div className="p-2 border-b border-slate-800 bg-[#0f111a] shrink-0">
          <span className="text-[9px] font-mono text-slate-500 uppercase">Execution Pipeline</span>
        </div>
        <div 
          ref={containerRef}
          className="p-2 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex && !isComplete;
              const isDone = completedSteps.has(step.id) || (isComplete && idx < STEPS.length);
              const Icon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#836EF9]/20 border border-[#836EF9]/40' 
                      : isDone 
                        ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/20' 
                        : 'bg-slate-800/20 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    isActive 
                      ? 'bg-[#836EF9] text-white' 
                      : isDone 
                        ? 'bg-[#00FF9D] text-black' 
                        : 'bg-slate-800 text-slate-600'
                  }`}>
                    <Icon size={10} className={isActive ? 'animate-pulse' : ''} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-bold truncate ${
                      isActive ? 'text-white' : isDone ? 'text-[#00FF9D]' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="w-3 h-3 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  {isDone && !isActive && (
                    <CheckCircle2 size={12} className="text-[#00FF9D] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          
          {isComplete && (
            <div className="flex items-center gap-2 p-2 text-[#00FF9D] animate-fade-in mt-2">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-bold">Agent fabrication complete!</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal - Current Step */}
      <div className="relative z-10 mt-2 bg-[#0a0b14] border border-slate-800 rounded-lg overflow-hidden shrink-0">
        <div className="p-1.5 border-b border-slate-800 bg-[#0f111a] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal size={10} className="text-[#00FF9D]" />
            <span className="text-[9px] font-mono text-slate-500">terminal</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>
        
        <div className="p-2.5 font-mono text-[10px]">
          {!isComplete ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#836EF9]">
                <CurrentIcon size={10} className="animate-pulse" />
                <span className="uppercase tracking-wider">{currentStep?.label}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#836EF9]">➜</span>
                <span className="text-slate-400">~</span>
                <span className="text-white break-all">
                  {currentCode}
                  <span 
                    className={`inline-block w-1.5 h-3 bg-[#00FF9D] ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                  />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#00FF9D]">
              <CheckCircle2 size={12} />
              <span>Ready for deployment</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#836EF9]" />
          <span>v2.0.4</span>
        </div>
        <span className="text-[#00FF9D]">{completedSteps.size}/{STEPS.length} steps</span>
      </div>
    </div>
  );
};
