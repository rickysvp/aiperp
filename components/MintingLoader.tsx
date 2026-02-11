import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Cpu, Database, Zap, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface MintingLoaderProps {
  onComplete?: () => void;
}

const STEPS = [
  { icon: Cpu, label: 'Initializing', code: 'import neural_network as nn' },
  { icon: Database, label: 'Loading Model', code: 'agent.load_weights("gemini-v3")' },
  { icon: Zap, label: 'Analyzing', code: 'strategy = analyze_market()' },
  { icon: Lock, label: 'Encrypting', code: 'encrypt_identity()' },
  { icon: Terminal, label: 'Minting', code: 'mint_nft()' },
];

export const MintingLoader: React.FC<MintingLoaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const runStep = useCallback((stepIndex: number) => {
    if (stepIndex >= STEPS.length) {
      setIsComplete(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
      return;
    }

    setCurrentStep(stepIndex);
    
    // Each step takes 400ms
    const stepDuration = 400;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const stepProgress = Math.min((elapsed / stepDuration) * 100, 100);
      const totalProgress = ((stepIndex + stepProgress / 100) / STEPS.length) * 100;
      
      setProgress(totalProgress);

      if (stepProgress < 100) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => runStep(stepIndex + 1), 100);
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  useEffect(() => {
    runStep(0);
  }, [runStep]);

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col items-center justify-center p-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#836EF9]/10 to-transparent rounded-3xl" />
      
      {/* Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#836EF9]/10 border border-[#836EF9]/30 mb-4">
          <Sparkles size={14} className="text-[#00FF9D]" />
          <span className="text-xs font-bold text-[#836EF9] uppercase tracking-wider">
            {isComplete ? 'Complete' : 'Minting Agent'}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white">
          {isComplete ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 size={28} className="text-[#00FF9D]" />
              Ready!
            </span>
          ) : (
            <span className="animate-pulse">Creating Agent...</span>
          )}
        </h3>
      </div>

      {/* Progress Steps */}
      <div className="relative z-10 w-full max-w-[280px] space-y-3 mb-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep && !isComplete;
          const isDone = index < currentStep || isComplete;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-[#836EF9]/20 border border-[#836EF9]/40' 
                  : isDone 
                    ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/30' 
                    : 'bg-slate-800/50 border border-slate-700/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isActive 
                  ? 'bg-[#836EF9] text-white' 
                  : isDone 
                    ? 'bg-[#00FF9D] text-black' 
                    : 'bg-slate-700 text-slate-500'
              }`}>
                {isDone && !isActive ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  isActive ? 'text-white' : isDone ? 'text-[#00FF9D]' : 'text-slate-500'
                }`}>
                  {step.label}
                </div>
                {isActive && (
                  <div className="text-[10px] font-mono text-[#836EF9] truncate mt-0.5">
                    {step.code}
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className="w-4 h-4 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 w-full max-w-[280px]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-mono">Progress</span>
          <span className="font-mono text-[#00FF9D]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#836EF9] rounded-full transition-all duration-100 ease-linear"
            style={{ 
              width: `${progress}%`,
              backgroundSize: '200% 100%',
              animation: isComplete ? 'none' : 'gradient-shift 2s linear infinite'
            }}
          />
        </div>
      </div>

      {/* Terminal decoration */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-slate-600 font-mono">
        <Terminal size={10} />
        <span>aiperp_engine_v2.0</span>
      </div>
    </div>
  );
};
