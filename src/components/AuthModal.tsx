import React, { useState, useRef } from 'react';
import { 
  Mail, 
  Lock, 
  UserCheck, 
  Shield, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';
import { LanguageCode, UserProfile, RegisterPayload } from '../types';
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
  const isArabic = lang === 'ar';
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Agency Profile Onboarding Fields (Mandatory)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    'Payment due within 30 days of invoice date. Bank wire transfer or credit card accepted.'
  );
  
  // Optional Agency Logo
  const [companyLogo, setCompanyLogo] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  
  // Legal
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(isArabic ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 360;
        const maxHeight = 160;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
          setCompanyLogo(compressed);
        } else {
          setCompanyLogo(result);
        }
        setLogoUploading(false);
      };
      img.onerror = () => {
        setCompanyLogo(result);
        setLogoUploading(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (tab === 'signin') {
      if (!email || !emailRegex.test(email.trim())) {
        setError(t.authErrorEmailReq);
        return;
      }

      if (!password || password.length < 6) {
        setError(t.authErrorPassReq);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const res = StorageService.loginUser(email, password);
        setLoading(false);
        if (!res.success || !res.user) {
          setError(res.error || (isArabic ? 'بيانات الدخول غير صحيحة.' : 'Invalid credentials.'));
          return;
        }
        onSuccess(res.user);
      }, 300);
    } else {
      // SIGN UP VALIDATION
      if (!email || !emailRegex.test(email.trim())) {
        setError(t.authErrorEmailReq);
        return;
      }

      if (!password || password.length < 6) {
        setError(t.authErrorPassReq);
        return;
      }

      if (password !== confirmPassword) {
        setError(t.authErrorPassMatch || (isArabic ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.'));
        return;
      }

      if (!companyName.trim()) {
        setError(t.authErrorCompanyReq || (isArabic ? 'اسم الشركة / الوكالة مطلوب.' : 'Agency / Company Name is required.'));
        return;
      }

      if (!companyAddress.trim()) {
        setError(t.authErrorLocationReq || (isArabic ? 'موقع المقر الرئيسي (المدينة، الدولة) مطلوب.' : 'Headquarters Location (City, Country) is required.'));
        return;
      }

      if (!companyWebsite.trim()) {
        setError(t.authErrorWebsiteReq || (isArabic ? 'الموقع الإلكتروني الرسمي مطلوب.' : 'Official Website URL is required.'));
        return;
      }

      if (!companyEmail || !emailRegex.test(companyEmail.trim())) {
        setError(t.authErrorContactEmailReq || (isArabic ? 'بريد التواصل والدعم مطلوب وبصيغة صحيحة.' : 'A valid Contact / Support Email is required.'));
        return;
      }

      if (!defaultPaymentTerms.trim()) {
        setError(t.authErrorPaymentTermsReq || (isArabic ? 'شروط الدفع الافتراضية للفواتير مطلوبة.' : 'Default invoice payment terms are required.'));
        return;
      }

      if (!agreedPolicy) {
        setError(t.authErrorPolicyReq);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const payload: RegisterPayload = {
          email: email.trim(),
          passwordPlain: password,
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
          companyWebsite: companyWebsite.trim(),
          companyEmail: companyEmail.trim(),
          defaultPaymentTerms: defaultPaymentTerms.trim(),
          companyLogo,
          agreedToPrivacyPolicy: agreedPolicy
        };

        const res = StorageService.registerUser(payload);
        setLoading(false);
        if (!res.success || !res.user) {
          setError(res.error || (isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'Failed to create account.'));
          return;
        }
        onSuccess(res.user);
      }, 350);
    }
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
    >
      <div 
        id="auth-modal-card"
        className={`spotlight-card w-full ${tab === 'signup' ? 'max-w-2xl my-6' : 'max-w-md'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col`}
      >
        {/* Header branding */}
        <div className="bg-gradient-to-br from-[#0F284E] via-[#1E3A8A] to-[#2563EB] p-6 sm:p-7 text-white text-center relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-2.5 shadow-inner">
            <span className="text-2xl font-black tracking-wider text-sky-300">W</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">WISCO</h1>
          <p className="text-xs text-sky-200 mt-0.5 font-medium">
            {t.appTagline}
          </p>

          {/* Tab Selector */}
          <div className="mt-5 flex bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10 max-w-sm mx-auto">
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

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div 
              id="auth-error-banner"
              className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SIGN IN VIEW */}
            {tab === 'signin' && (
              <div className="space-y-4">
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
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>

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
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SIGN UP ONBOARDING VIEW */}
            {tab === 'signup' && (
              <div className="space-y-6">
                
                {/* 1. Account Credentials */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>{isArabic ? '1. بيانات تسجيل الدخول' : '1. Account Credentials'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.email} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="auth-input-signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (!companyEmail) setCompanyEmail(e.target.value);
                        }}
                        placeholder={t.enterEmail}
                        required
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.password} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="auth-input-signup-pass"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.confirmPassword} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="auth-input-signup-confirm-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Agency Profile (One-Time Setup Notice) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      <span>{t.onboardingSectionTitle || '2. Agency Profile (One-Time Setup)'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                      {isArabic ? 'يُقفل بعد التسجيل' : 'Locked Post-Registration'}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      {t.onboardingSectionDesc || 'These agency identity records are permanently locked after registration to ensure invoice compliance and audit integrity.'}
                    </span>
                  </div>

                  {/* Profile Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Agency Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.agencyName} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
                        <input
                          id="auth-input-agency-name"
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Whislly Media & Design"
                          required
                          className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Headquarters Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.headquartersLocation} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
                        <input
                          id="auth-input-agency-location"
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder={t.headquartersLocationPlaceholder || 'e.g. Amman, Jordan'}
                          required
                          className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Official Website */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.officialWebsite} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
                        <input
                          id="auth-input-agency-website"
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder={t.officialWebsitePlaceholder || 'e.g. www.agency.com'}
                          required
                          className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Contact / Support Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contactSupportEmail} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
                        <input
                          id="auth-input-agency-email"
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder={t.contactSupportEmailPlaceholder || 'e.g. billing@agency.com'}
                          required
                          className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.initialPaymentTerms} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 rtl:left-auto rtl:right-3" />
                      <textarea
                        id="auth-input-payment-terms"
                        rows={2}
                        value={defaultPaymentTerms}
                        onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                        placeholder={t.initialPaymentTermsPlaceholder || 'Payment due within 30 days of invoice date...'}
                        required
                        className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isArabic 
                        ? 'ملاحظة: يمكنك تعديل شروط الدفع وشعار الشركة في أي وقت لاحقاً من تبويب الحساب.' 
                        : 'Note: Payment terms and agency logo remain editable anytime in the Account settings.'}
                    </p>
                  </div>

                  {/* Optional Agency Logo Upload */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {companyLogo ? (
                            <img 
                              src={companyLogo} 
                              alt="Logo preview" 
                              className="w-full h-full object-contain p-1"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <span>{t.optionalAgencyLogo}</span>
                            {companyLogo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            PNG, JPG, SVG, WebP (Max 5MB)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <input
                          id="input-signup-logo-file"
                          type="file"
                          accept="image/*"
                          ref={logoInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          className="hidden"
                        />
                        <button
                          id="btn-signup-upload-logo"
                          type="button"
                          disabled={logoUploading}
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-sky-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{companyLogo ? t.changeLogo : t.uploadLogo}</span>
                        </button>
                        {companyLogo && (
                          <button
                            id="btn-signup-remove-logo"
                            type="button"
                            onClick={handleRemoveLogo}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-red-50 hover:text-red-600 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Mandatory Policy Agreement */}
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
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{tab === 'signin' ? t.loginBtn : (isArabic ? 'إنشاء حساب الوكالة' : 'Create Agency Account')}</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Isolated UID Storage Vault & AES Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
