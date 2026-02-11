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

  // Main animation effect
  useEffect(() => {
    let stepStartTime = performance.now();
    let currentStepIdx = 0;
    let codeCharIndex = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - stepStartTime;
      const currentStep = STEPS[currentStepIdx];
      
      // Calculate overall progress
      const stepsBeforeDuration = STEPS.slice(0, currentStepIdx).reduce((sum, s) => sum + s.duration, 0);
      const stepProgress = Math.min(elapsed / currentStep.duration, 1);
      const totalProgress = ((stepsBeforeDuration + currentStep.duration * stepProgress) / TOTAL_DURATION) * 100;
      
      setProgress(Math.round(totalProgress));
      setCurrentStepIndex(currentStepIdx);

      // Type code animation
      const code = currentStep.code;
      const charsToShow = Math.floor(code.length * stepProgress);
      if (charsToShow !== codeCharIndex) {
        codeCharIndex = charsToShow;
        setCurrentCode(code.slice(0, charsToShow));
      }

      // Check if step is complete
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

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentStepIndex, currentCode]);

  const currentStep = STEPS[currentStepIndex];
  const CurrentIcon = currentStep?.icon || CheckCircle2;

  return (
    <div className="relative w-full max-w-2xl mx-auto h-full flex flex-col items-center justify-center p-4 lg:p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(131, 110, 249, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(131, 110, 249, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#836EF9]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#00FF9D]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center shadow-lg shadow-[#836EF9]/20">
              <Terminal size={20} className="text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fabricating Agent</h3>
              <p className="text-xs text-slate-400">{agentName || 'Neural Agent'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#00FF9D]' : 'bg-[#836EF9] animate-pulse'}`} />
            <span className="text-xs font-mono text-slate-400">{isComplete ? 'COMPLETE' : 'PROCESSING'}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden backdrop-blur">
          <div 
            className="h-full bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] rounded-full transition-all duration-100"
            style={{ 
              width: `${progress}%`,
              backgroundSize: '200% 100%',
              animation: isComplete ? 'none' : 'gradient-shift 2s linear infinite'
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
          <span>Step {Math.min(currentStepIndex + 1, STEPS.length)}/{STEPS.length}</span>
          <span className={isComplete ? 'text-[#00FF9D]' : 'text-[#836EF9]'}>{progress}%</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Steps List */}
        <div className="bg-[#0a0b14]/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur">
          <div className="p-3 border-b border-slate-800 bg-[#0f111a]">
            <span className="text-xs font-mono text-slate-500">EXECUTION PIPELINE</span>
          </div>
          <div 
            ref={containerRef}
            className="p-3 space-y-2 overflow-y-auto h-[200px] lg:h-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
          >
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex && !isComplete;
              const isDone = completedSteps.has(step.id) || (isComplete && idx < STEPS.length);
              const Icon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#836EF9]/20 border border-[#836EF9]/40' 
                      : isDone 
                        ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/30' 
                        : 'bg-slate-800/30 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-[#836EF9] text-white shadow-lg shadow-[#836EF9]/30' 
                      : isDone 
                        ? 'bg-[#00FF9D] text-black' 
                        : 'bg-slate-800 text-slate-600'
                  }`}>
                    <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${
                      isActive ? 'text-white' : isDone ? 'text-[#00FF9D]' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </div>
                    {isActive && (
                      <div className="text-[10px] font-mono text-[#836EF9] truncate">
                        {step.code}
                      </div>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="w-4 h-4 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
                  )}
                  {isDone && !isActive && (
                    <CheckCircle2 size={16} className="text-[#00FF9D]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Terminal */}
        <div className="bg-[#0a0b14]/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-[#0f111a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#00FF9D]" />
              <span className="text-xs font-mono text-slate-500">terminal</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
          </div>
          
          <div className="p-4 font-mono text-xs space-y-3 flex-1">
            {/* Welcome */}
            <div className="text-slate-500 space-y-1">
              <div>AIperp Agent Fabrication Engine v2.0</div>
              <div className="text-[#836EF9]">Initializing neural synthesis protocol...</div>
            </div>

            {/* Current Step Display */}
            {!isComplete && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-[#836EF9]">
                  <CurrentIcon size={14} className="animate-pulse" />
                  <span className="text-xs uppercase tracking-wider">{currentStep?.label}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-[#836EF9]">➜</span>
                  <span className="text-slate-400">~</span>
                  <span className="text-white">
                    {currentCode}
                    <span 
                      className={`inline-block w-2 h-4 bg-[#00FF9D] ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </span>
                </div>
              </div>
            )}

            {/* Complete Message */}
            {isComplete && (
              <div className="flex items-center gap-2 text-[#00FF9D] animate-fade-in pt-2">
                <CheckCircle2 size={16} />
                <span className="font-bold">Agent fabrication complete!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="relative z-10 mt-4 flex items-center gap-6 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#836EF9]" />
          <span>v2.0.4-stable</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <span>{new Date().toLocaleTimeString()}</span>
        <div className="w-px h-3 bg-slate-700" />
        <span className="text-[#00FF9D]">{completedSteps.size}/{STEPS.length} steps</span>
      </div>
    </div>
  );
};
