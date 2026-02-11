import React, { useState } from 'react';
import { Bot, Zap, Swords, ChevronRight, X, ArrowRightCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
  onFinish: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Bot size={64} className="text-[#836EF9]" />,
      title: t('ob_step1_title'),
      text: t('ob_step1_text')
    },
    {
      icon: <Zap size={64} className="text-[#00FF9D]" />,
      title: t('ob_step2_title'),
      text: t('ob_step2_text')
    },
    {
      icon: <Swords size={64} className="text-[#FF0055]" />,
      title: t('ob_step3_title'),
      text: t('ob_step3_text')
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f111a] border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div 
                className="h-full bg-[#836EF9] transition-all duration-300" 
                style={{ width: `${((step + 1) / steps.length) * 100}%` }} 
            />
        </div>

        <button onClick={onFinish} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            {t('ob_skip')}
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-4">
            <div className="mb-8 p-6 bg-slate-900/50 rounded-full border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {steps[step].icon}
            </div>
            
            <h2 className="text-3xl font-display font-bold text-white mb-4 animate-fade-in">
                {steps[step].title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm animate-fade-in">
                {steps[step].text}
            </p>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center">
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-white' : 'bg-slate-700'}`} 
                    />
                ))}
            </div>
            
            <button 
                onClick={handleNext}
                className="py-3 px-8 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 group"
            >
                {step === steps.length - 1 ? (
                    <span className="flex items-center gap-2">
                         {t('ob_finish')} <ArrowRightCircle size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        {t('ob_next')} <ChevronRight size={18} />
                    </span>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
