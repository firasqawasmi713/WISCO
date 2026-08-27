import React, { useState } from 'react';
import { Mail, Lock, UserCheck, Shield, AlertCircle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';
import { LanguageCode, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  lang: LanguageCode;
  onOpenPrivacyPolicy: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  lang,
  onOpenPrivacyPolicy
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError(t.authErrorEmailReq);
      return;
    }

    if (!password || password.length < 6) {
      setError(t.authErrorPassReq);
      return;
    }

    if (tab === 'signup') {
      if (password !== confirmPassword) {
        setError(lang === 'ar' ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.');
        return;
      }
      if (!agreedPolicy) {
        setError(t.authErrorPolicyReq);
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      const userProfile: UserProfile = {
        uid: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        displayName: email.split('@')[0],
        companyName: companyName.trim() || 'Whislly Partner',
        createdAt: new Date().toISOString(),
        agreedToPrivacyPolicy: tab === 'signup' ? agreedPolicy : true,
        privacyPolicyAgreedAt: new Date().toISOString()
      };

      StorageService.setUser(userProfile);
      setLoading(false);
      onSuccess(userProfile);
    }, 400);
  };

  const handleQuickDemo = () => {
    const demoUser: UserProfile = {
      uid: 'usr_demo_vip',
      email: 'founder@whislly.com',
      displayName: 'Finance Director',
      companyName: 'Whislly Global',
      createdAt: '2026-08-27T08:00:00.000Z',
      agreedToPrivacyPolicy: true,
      privacyPolicyAgreedAt: '2026-08-27T08:00:00.000Z'
    };
    StorageService.setUser(demoUser);
    onSuccess(demoUser);
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div 
        id="auth-modal-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header branding */}
        <div className="bg-gradient-to-br from-[#0F284E] via-[#1E3A8A] to-[#2563EB] p-8 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
            <span className="text-2xl font-black tracking-wider text-sky-300">W</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">WISCO</h1>
          <p className="text-xs text-sky-200 mt-1 font-medium">
            {t.appTagline}
          </p>

          {/* Tab Selector */}
          <div className="mt-6 flex bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'signin' 
                  ? 'bg-white text-[#0F284E] shadow-md' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {t.signIn}
            </button>
            <button
              id="tab-btn-signup"
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'signup' 
                  ? 'bg-white text-[#0F284E] shadow-md' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {t.signUp}
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div 
              id="auth-error-banner"
              className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                <input
                  id="auth-input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.enterEmail}
                  required
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.companyName}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    id="auth-input-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Whislly Agency / Studio"
                    className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                <input
                  id="auth-input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.enterPassword}
                  required
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    id="auth-input-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.enterPassword}
                    required
                    className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Mandatory Policy Agreement for Signup */}
            {tab === 'signup' && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  <input
                    id="checkbox-privacy-policy"
                    type="checkbox"
                    checked={agreedPolicy}
                    onChange={(e) => setAgreedPolicy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    {t.agreeToPolicy}{' '}
                    <button
                      id="link-open-privacy-policy"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenPrivacyPolicy();
                      }}
                      className="font-bold text-blue-600 dark:text-sky-400 underline hover:text-blue-700 cursor-pointer"
                    >
                      ({t.readPrivacyPolicy})
                    </button>
                  </span>
                </label>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{tab === 'signin' ? t.loginBtn : t.signupBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Shortcut */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              id="btn-quick-demo-login"
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>{t.demoLogin}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Encrypted with Local Vault & Firebase BaaS Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
