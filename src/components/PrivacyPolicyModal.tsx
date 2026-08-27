import React from 'react';
import { X, ShieldCheck, Check } from 'lucide-react';
import { PRIVACY_POLICY_SECTIONS } from '../constants/privacyPolicy';
import { TRANSLATIONS } from '../constants/translations';
import { LanguageCode } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <div 
      id="privacy-policy-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="privacy-policy-modal-container"
        className="spotlight-card relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {t.privacyPolicyTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.privacyPolicySub}
              </p>
            </div>
          </div>
          <button
            id="btn-close-privacy-policy-x"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body with exact legal text */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100/80 dark:border-blue-900/40 text-xs font-semibold text-blue-800 dark:text-blue-300">
            Last Updated: August 27, 2026 • Official Terms & Disclosures for WISCO
          </div>

          {PRIVACY_POLICY_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-base font-bold text-[#0F284E] dark:text-sky-400">
                {section.title}
              </h3>
              <div className="whitespace-pre-line text-slate-600 dark:text-slate-300 text-sm">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer with Prominent "Done" Button */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end items-center gap-3">
          <button
            id="btn-done-privacy-policy"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t.done}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
