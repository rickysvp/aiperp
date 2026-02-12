import React, { useState } from 'react';
import { Button } from './Button';
import { BrainCircuit, Mail, Wallet as WalletIcon, X, Shield, Check, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';

interface AuthModalProps {
  onLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'options' | 'email' | 'legal'>('options');
  const [isLoading, setIsLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if user has accepted legal terms
    const accepted = localStorage.getItem('aipers_legal_accepted');
    if (!accepted) {
      setPendingProvider('email');
      setStep('legal');
      return;
    }
    proceedWithLogin(email);
  };

  const handleSocialLogin = (provider: string) => {
    // Check if user has accepted legal terms
    const accepted = localStorage.getItem('aipers_legal_accepted');
    if (!accepted) {
      setPendingProvider(provider);
      setStep('legal');
      return;
    }
    proceedWithSocialLogin(provider);
  };

  const proceedWithLogin = (userEmail: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin(userEmail);
      setIsLoading(false);
    }, 1500);
  };

  const proceedWithSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin(`${provider.toLowerCase()}@gmail.com`);
      setIsLoading(false);
    }, 1500);
  };

  const handleLegalAccept = () => {
    localStorage.setItem('aipers_legal_accepted', 'true');
    setHasAcceptedLegal(true);
    setStep('options');
    
    // Proceed with the pending login
    if (pendingProvider === 'email') {
      proceedWithLogin(email);
    } else if (pendingProvider) {
      proceedWithSocialLogin(pendingProvider);
    }
    setPendingProvider(null);
  };

  const handleLegalDecline = () => {
    setStep('options');
    setPendingProvider(null);
  };

  // Legal acceptance step
  if (step === 'legal') {
    return (
      <LegalModal 
        onClose={handleLegalDecline}
        requireAcceptance={true}
        onAccept={handleLegalAccept}
      />
    );
  }

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
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        {isLoading ? t('processing') : t('continue_google')}
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('X')}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-black border border-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        {isLoading ? t('processing') : t('continue_x')}
                    </button>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f111a] px-2 text-slate-500">Or</span></div>
                    </div>
                    <button 
                        onClick={() => setStep('email')}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-[#1a1d2d] border border-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#252a40] transition-colors disabled:opacity-50"
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
                            disabled={isLoading}
                            className="w-full bg-[#030305] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#836EF9] focus:outline-none transition-colors disabled:opacity-50"
                        />
                    </div>
                    <Button type="submit" isLoading={isLoading} className="w-full py-3">
                        {t('send_code')}
                    </Button>
                    <button 
                        type="button" 
                        onClick={() => setStep('options')}
                        disabled={isLoading}
                        className="w-full text-xs text-slate-500 hover:text-white mt-2 disabled:opacity-50"
                    >
                        {t('back_options')}
                    </button>
                </form>
            )}

            <div className="mt-6 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <p className="text-[10px] text-slate-400">
                        {t('legal_required_notice')}
                    </p>
                </div>
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
