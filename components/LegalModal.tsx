import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegalModalProps {
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0f111a] border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-[#836EF9]" /> {t('legal_title')}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-slate-300">
            <p className="text-slate-400 italic">{t('legal_intro')}</p>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">{t('legal_1_title')}</h3>
                <p>{t('legal_1_text')}</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">{t('legal_2_title')}</h3>
                <p className="text-red-400">{t('legal_2_text')}</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">{t('legal_3_title')}</h3>
                <p>{t('legal_3_text')}</p>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-4">
                <p className="text-xs text-slate-500">
                    Last Updated: October 2025. Contact: legal@aiperp.fun
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button 
                onClick={onClose}
                className="w-full py-3 bg-[#836EF9] hover:bg-[#6c56e0] text-white font-bold rounded-xl transition-colors uppercase tracking-wider"
            >
                {t('legal_close')}
            </button>
        </div>
      </div>
    </div>
  );
};
