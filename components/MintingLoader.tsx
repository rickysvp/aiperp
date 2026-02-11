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
  { id: 'init', icon: Cpu, label: 'Initialize', code: 'npm install ai-agent@latest', duration: 250 },
  { id: 'import', icon: Database, label: 'Load Core', code: 'import { NeuralAgent } from "@aiperp/core"', duration: 200 },
  { id: 'create', icon: Brain, label: 'Create', code: 'const agent = new NeuralAgent()', duration: 200 },
  { id: 'model', icon: Database, label: 'Load Model', code: 'await agent.loadModel("gemini-3-pro")', duration: 300 },
  { id: 'config', icon: Cpu, label: 'Configure', code: 'agent.configure({ strategy: "adaptive" })', duration: 200 },
  { id: 'market', icon: Database, label: 'Fetch Data', code: 'const marketData = await fetchMarketAnalysis()', duration: 350 },
  { id: 'train', icon: Brain, label: 'Train', code: 'agent.train(marketData)', duration: 400 },
  { id: 'avatar', icon: Sparkles, label: 'Render', code: 'const avatar = generatePixelAvatar()', duration: 300 },
  { id: 'encrypt', icon: Lock, label: 'Encrypt', code: 'agent.encryptIdentity()', duration: 250 },
  { id: 'deploy', icon: Rocket, label: 'Deploy', code: 'await agent.deployToBlockchain()', duration: 350 },
  { id: 'mint', icon: Database, label: 'Mint NFT', code: 'const nft = await mintAgentNFT(agent)', duration: 300 },
  { id: 'ready', icon: CheckCircle2, label: 'Ready', code: 'console.log("Agent ready!")', duration: 200 },
];

const TOTAL_DURATION = STEPS.reduce((sum, step) => sum + step.duration, 0);

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete, agentName }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [currentCode, setCurrentCode] = useState('');
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

  const currentStep = STEPS[currentStepIndex];
  const CurrentIcon = currentStep?.icon || CheckCircle2;

  return (
    <div className="relative w-full h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="relative z-10 mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center shadow-lg shadow-[#836EF9]/20">
              <Terminal size={20} className="text-black" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fabricating Agent</h3>
              <p className="text-xs text-slate-400">{agentName || 'Neural Agent'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`} />
            <span className="text-xs font-mono text-slate-400">{isComplete ? 'COMPLETE' : 'PROCESSING'}</span>
          </div>
        </div>
        
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] to-[#00FF9D] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
          <span>Step {Math.min(currentStepIndex + 1, STEPS.length)}/{STEPS.length}</span>
          <span className={isComplete ? 'text-[#00FF9D]' : 'text-[#836EF9]'}>{progress}%</span>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="relative z-10 flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left: Steps Grid */}
        <div className="bg-[#0a0b14] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-slate-800 bg-[#0f111a]">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Pipeline</span>
          </div>
          <div className="p-3 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            <div className="grid grid-cols-1 gap-2">
              {STEPS.map((step, idx) => {
                const isActive = idx === currentStepIndex && !isComplete;
                const isDone = completedSteps.has(step.id) || (isComplete && idx < STEPS.length);
                const Icon = step.icon;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#836EF9]/20 border border-[#836EF9]/40' 
                        : isDone 
                          ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/20' 
                          : 'bg-slate-800/30 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-[#836EF9] text-white shadow-lg shadow-[#836EF9]/30' 
                        : isDone 
                          ? 'bg-[#00FF9D] text-black' 
                          : 'bg-slate-800 text-slate-600'
                    }`}>
                      <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate ${
                        isActive ? 'text-white' : isDone ? 'text-[#00FF9D]' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="w-4 h-4 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {isDone && !isActive && (
                      <CheckCircle2 size={16} className="text-[#00FF9D] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Terminal */}
        <div className="bg-[#0a0b14] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-slate-800 bg-[#0f111a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#00FF9D]" />
              <span className="text-xs font-mono text-slate-500">terminal</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>
          
          <div className="p-4 font-mono text-sm flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            {/* Welcome */}
            <div className="text-slate-500 space-y-1 mb-4">
              <div>AIperp Agent Fabrication Engine v2.0</div>
              <div className="text-[#836EF9]">Initializing neural synthesis protocol...</div>
            </div>

            {/* Current Step Display */}
            {!isComplete && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#836EF9]">
                  <CurrentIcon size={16} className="animate-pulse" />
                  <span className="text-sm uppercase tracking-wider font-bold">{currentStep?.label}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-[#836EF9]">➜</span>
                  <span className="text-slate-400">~</span>
                  <span className="text-white break-all">
                    {currentCode}
                    <span 
                      className={`inline-block w-2 h-5 bg-[#00FF9D] ml-1 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </span>
                </div>
              </div>
            )}

            {/* Complete Message */}
            {isComplete && (
              <div className="flex items-center gap-2 text-[#00FF9D] animate-fade-in">
                <CheckCircle2 size={20} />
                <span className="font-bold text-base">Agent fabrication complete!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-4 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#836EF9]" />
          <span>v2.0.4-stable</span>
        </div>
        <span className="text-[#00FF9D]">{completedSteps.size}/{STEPS.length} steps completed</span>
      </div>
    </div>
  );
};
