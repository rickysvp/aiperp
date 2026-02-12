import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Check, ScrollText, Globe, Scale, AlertTriangle, FileCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegalModalProps {
  onClose: () => void;
  requireAcceptance?: boolean;
  onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ 
  onClose, 
  requireAcceptance = false,
  onAccept 
}) => {
  const { t, language } = useLanguage();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'risk'>('terms');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolled(true);
      }
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0f111a] border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-[#0f111a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#836EF9]/20 flex items-center justify-center">
              <Scale className="text-[#836EF9]" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">{t('legal_title')}</h2>
              <p className="text-xs text-slate-500">{t('legal_subtitle')}</p>
            </div>
          </div>
          {!requireAcceptance && (
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/30">
          {[
            { id: 'terms', label: t('legal_tab_terms'), icon: ScrollText },
            { id: 'privacy', label: t('legal_tab_privacy'), icon: ShieldAlert },
            { id: 'risk', label: t('legal_tab_risk'), icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#836EF9]/10 text-[#836EF9] border-b-2 border-[#836EF9]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6 text-sm text-slate-300"
        >
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t('legal_effective_date')}</p>
                <p className="text-white">{t('legal_effective_date_value')}</p>
              </div>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#836EF9]/20 text-[#836EF9] flex items-center justify-center text-xs">1</span>
                  {t('legal_terms_1_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_terms_1_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#836EF9]/20 text-[#836EF9] flex items-center justify-center text-xs">2</span>
                  {t('legal_terms_2_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_terms_2_text')}</p>
                <ul className="list-disc list-inside pl-8 space-y-1 text-slate-400">
                  <li>{t('legal_terms_2_item1')}</li>
                  <li>{t('legal_terms_2_item2')}</li>
                  <li>{t('legal_terms_2_item3')}</li>
                  <li>{t('legal_terms_2_item4')}</li>
                  <li>{t('legal_terms_2_item5')}</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#836EF9]/20 text-[#836EF9] flex items-center justify-center text-xs">3</span>
                  {t('legal_terms_3_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_terms_3_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#836EF9]/20 text-[#836EF9] flex items-center justify-center text-xs">4</span>
                  {t('legal_terms_4_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_terms_4_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#836EF9]/20 text-[#836EF9] flex items-center justify-center text-xs">5</span>
                  {t('legal_terms_5_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_terms_5_text')}</p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t('legal_privacy_commitment')}</p>
                <p className="text-white">{t('legal_privacy_commitment_text')}</p>
              </div>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <ShieldAlert size={18} className="text-[#836EF9]" />
                  {t('legal_privacy_1_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_privacy_1_text')}</p>
                <ul className="list-disc list-inside pl-8 space-y-1 text-slate-400">
                  <li>{t('legal_privacy_1_item1')}</li>
                  <li>{t('legal_privacy_1_item2')}</li>
                  <li>{t('legal_privacy_1_item3')}</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Globe size={18} className="text-[#836EF9]" />
                  {t('legal_privacy_2_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_privacy_2_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <FileCheck size={18} className="text-[#836EF9]" />
                  {t('legal_privacy_3_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_privacy_3_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Scale size={18} className="text-[#836EF9]" />
                  {t('legal_privacy_4_title')}
                </h3>
                <p className="leading-relaxed pl-8">{t('legal_privacy_4_text')}</p>
              </section>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-red-400 mb-1">{t('legal_risk_warning_title')}</p>
                    <p className="text-red-300/80 text-sm">{t('legal_risk_warning_text')}</p>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg">{t('legal_risk_1_title')}</h3>
                <p className="leading-relaxed">{t('legal_risk_1_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg">{t('legal_risk_2_title')}</h3>
                <p className="leading-relaxed">{t('legal_risk_2_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg">{t('legal_risk_3_title')}</h3>
                <p className="leading-relaxed">{t('legal_risk_3_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg">{t('legal_risk_4_title')}</h3>
                <p className="leading-relaxed">{t('legal_risk_4_text')}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-white text-lg">{t('legal_risk_5_title')}</h3>
                <p className="leading-relaxed">{t('legal_risk_5_text')}</p>
              </section>
            </div>
          )}

          <div className="border-t border-slate-800 pt-6 mt-6">
            <p className="text-xs text-slate-500">
              {t('legal_contact')}: legal@aiperp.fun | {t('legal_last_updated')}: {t('legal_last_updated_value')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4">
          {requireAcceptance && (
            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <button
                onClick={() => setAccepted(!accepted)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                  accepted 
                    ? 'bg-[#836EF9] border-[#836EF9]' 
                    : 'border-slate-600 hover:border-[#836EF9]'
                }`}
              >
                {accepted && <Check size={14} className="text-white" />}
              </button>
              <label className="text-sm text-slate-300 cursor-pointer" onClick={() => setAccepted(!accepted)}>
                {t('legal_accept_checkbox')}
              </label>
            </div>
          )}

          <div className="flex gap-3">
            {requireAcceptance ? (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
                >
                  {t('legal_decline')}
                </button>
                <button 
                  onClick={handleAccept}
                  disabled={!accepted || !hasScrolled}
                  className={`flex-1 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    accepted && hasScrolled
                      ? 'bg-[#836EF9] hover:bg-[#6c56e0] text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileCheck size={18} />
                  {t('legal_accept')}
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-3 bg-[#836EF9] hover:bg-[#6c56e0] text-white font-semibold rounded-xl transition-colors uppercase tracking-wider"
              >
                {t('legal_close')}
              </button>
            )}
          </div>
          
          {requireAcceptance && !hasScrolled && (
            <p className="text-xs text-center text-amber-400">
              {t('legal_scroll_notice')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
