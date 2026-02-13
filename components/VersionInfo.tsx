import React from 'react';
import { Github, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const VersionInfo: React.FC = () => {
  const { t } = useLanguage();
  const version = 'v1.3.0';
  const buildDate = '2025-02-14';

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-black/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-4 text-xs">
          {/* Version */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t('version')}</span>
            <span className="font-mono font-bold text-[#836EF9]">{version}</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-3 bg-slate-700"></div>
          
          {/* Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://aiperp.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="Production"
            >
              <Globe size={12} />
              <span className="hidden sm:inline">{t('prod')}</span>
            </a>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="Development"
            >
              <span className="font-mono text-[10px]">{t('dev')}</span>
            </a>
            <a 
              href="https://github.com/rickysvp/aiperp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
