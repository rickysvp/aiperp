import React, { useState } from 'react';
import { Button } from './Button';
import { BrainCircuit, Mail, Wallet as WalletIcon, X, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';

interface AuthModalProps {
  onLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'options' | 'email'>('options');
  const [isLoading, setIsLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin(`${provider.toLowerCase()}@gmail.com`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0f111a] border border-[#836EF9]/30 rounded-2xl shadow-[0_0_50px_rgba(131,110,249,0.2)] overflow-hidden relative">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#836EF9] via-[#00FF9D] to-[#FF0055]" />
        
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-[#1a1d2d] rounded-2xl flex items-center justify-center mb-4 border border-[#836EF9]/20 shadow-lg">
                    <BrainCircuit className="text-[#836EF9]" size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">{t('welcome')}</h2>
                <p className="text-slate-400 text-sm">{t('auth_subtitle')}</p>
            </div>

            {step === 'options' ? (
                <div className="space-y-3">
                    <button 
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        {t('continue_google')}
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('X')}
                        className="w-full py-3 px-4 bg-black border border-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-colors"
                    >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        {t('continue_x')}
                    </button>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f111a] px-2 text-slate-500">Or</span></div>
                    </div>
                    <button 
                        onClick={() => setStep('email')}
                        className="w-full py-3 px-4 bg-[#1a1d2d] border border-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#252a40] transition-colors"
                    >
                        <Mail size={18} />
                        {t('continue_email')}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('email_label')}</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-[#030305] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#836EF9] focus:outline-none transition-colors"
                        />
                    </div>
                    <Button type="submit" isLoading={isLoading} className="w-full py-3">
                        {t('send_code')}
                    </Button>
                    <button 
                        type="button" 
                        onClick={() => setStep('options')}
                        className="w-full text-xs text-slate-500 hover:text-white mt-2"
                    >
                        {t('back_options')}
                    </button>
                </form>
            )}

            <div className="mt-6 text-center space-y-2">
                <p className="text-[10px] text-slate-600">
                    {t('terms')} <br/>
                    Powered by <span className="text-[#836EF9] font-bold">Privy</span> (Simulation)
                </p>
                <button onClick={() => setShowLegal(true)} className="text-[10px] text-slate-500 hover:text-[#836EF9] underline flex items-center justify-center gap-1 w-full">
                    <Shield size={10} /> {t('legal_link')}
                </button>
            </div>
        </div>
      </div>
    </div>
    {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
    </>
  );
};
