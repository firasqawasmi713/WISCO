import React, { useState, useRef, useEffect } from 'react';
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
  KeyRound,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
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
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Agency Profile Onboarding Fields (Website is Optional)
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

  // OTP Verification State
  const [verificationEmail, setVerificationEmail] = useState('');
  const [pendingRegisterPayload, setPendingRegisterPayload] = useState<RegisterPayload | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to verification step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

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

  // Strict email regex validation (e.g. user@domain.com)
  const isValidEmail = (emailStr: string): boolean => {
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return strictEmailRegex.test(emailStr.trim());
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setResendNotice(null);

    if (tab === 'signin') {
      const errs: Record<string, string> = {};
      if (!email.trim() || !isValidEmail(email)) {
        errs.email = t.authErrorEmailReq;
      }
      if (!password || password.length < 6) {
        errs.password = t.authErrorPassReq;
      }

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setError(Object.values(errs)[0]);
        modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setLoading(true);
      try {
        const res = await StorageService.loginUser(email, password);
        setLoading(false);
        if (!res.success || !res.user) {
          setError(res.error || (isArabic ? 'بيانات الدخول غير صحيحة.' : 'Invalid credentials.'));
          modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        onSuccess(res.user);
      } catch (err: any) {
        setLoading(false);
        setError(err.message || (isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'Authentication error.'));
        modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // SIGN UP VALIDATION WITH COMPREHENSIVE FIELD ERRORS & NOTIFICATIONS
      const errs: Record<string, string> = {};

      if (!email.trim()) {
        errs.email = isArabic ? 'يرجى إدخال البريد الإلكتروني للعمل.' : 'Please enter your work email address.';
      } else if (!isValidEmail(email)) {
        errs.email = isArabic ? 'صيغة البريد الإلكتروني غير صحيحة (user@domain.com).' : 'Email must be in valid format (user@domain.com).';
      }

      if (!password) {
        errs.password = isArabic ? 'يرجى إدخال كلمة المرور.' : 'Please enter a password.';
      } else if (password.length < 6) {
        errs.password = t.authErrorPassReq;
      }

      if (!confirmPassword) {
        errs.confirmPassword = isArabic ? 'يرجى تأكيد كلمة المرور.' : 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = t.authErrorPassMatch || (isArabic ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.');
      }

      if (!companyName.trim()) {
        errs.companyName = t.authErrorCompanyReq || (isArabic ? 'اسم الشركة / الوكالة مطلوب.' : 'Agency / Company Name is required.');
      }

      if (!companyAddress.trim()) {
        errs.companyAddress = t.authErrorLocationReq || (isArabic ? 'موقع المقر الرئيسي (المدينة، الدولة) مطلوب.' : 'Headquarters Location (City, Country) is required.');
      }

      // Note: companyWebsite is OPTIONAL per requirement.

      if (!companyEmail.trim()) {
        errs.companyEmail = isArabic ? 'يرجى إدخال بريد التواصل والدعم.' : 'Please provide a Contact / Support Email.';
      } else if (!isValidEmail(companyEmail)) {
        errs.companyEmail = t.authErrorContactEmailReq || (isArabic ? 'بريد التواصل والدعم غير صالح (user@domain.com).' : 'Invalid Contact / Support Email format (user@domain.com).');
      }

      if (!defaultPaymentTerms.trim()) {
        errs.defaultPaymentTerms = t.authErrorPaymentTermsReq || (isArabic ? 'شروط الدفع الافتراضية للفواتير مطلوبة.' : 'Default invoice payment terms are required.');
      }

      if (!agreedPolicy) {
        errs.agreedPolicy = t.authErrorPolicyReq;
      }

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        const errorList = Object.values(errs);
        setError(
          errorList.length === 1 
            ? errorList[0] 
            : (isArabic ? 'يرجى تعبئة وتصحيح الحقول المطلوبة الموضحة باللون الأحمر.' : 'Please fill in and correct the required fields marked in red.')
        );
        modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setLoading(true);
      try {
        const payload: RegisterPayload = {
          email: email.trim().toLowerCase(),
          passwordPlain: password,
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
          companyWebsite: companyWebsite.trim(),
          companyEmail: companyEmail.trim().toLowerCase(),
          defaultPaymentTerms: defaultPaymentTerms.trim(),
          companyLogo,
          agreedToPrivacyPolicy: agreedPolicy
        };

        const res = await StorageService.registerUser(payload);
        setLoading(false);

        if (!res.success) {
          setError(res.error || (isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'Failed to create account.'));
          modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Email confirmation is required by Supabase: transition to OTP verification modal
        if (res.requiresVerification || !res.user) {
          setPendingRegisterPayload(payload);
          setVerificationEmail(payload.email);
          setOtpDigits(['', '', '', '', '', '']);
          setStep('verify');
          setResendCooldown(60);
          setError(null);
          return;
        }

        // Direct session fallback if confirmation is inactive
        if (res.user) {
          onSuccess(res.user);
        }
      } catch (err: any) {
        setLoading(false);
        setError(err.message || (isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'Failed to create account.'));
        modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle individual digit change in OTP
  const handleOtpDigitChange = (index: number, val: string) => {
    // Check for paste of full 6 digits into any box
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6 && i < digitsOnly.length; i++) {
        newDigits[i] = digitsOnly[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(digitsOnly.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation in OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle full paste into OTP inputs
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = digits[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(digits.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Handle verify OTP submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendNotice(null);

    const token = otpDigits.join('').trim();
    if (token.length !== 6) {
      setError(t.invalidOtpError || (isArabic ? 'يرجى إدخال جميع أرقام رمز التحقق الستة.' : 'Please enter all 6 digits of the verification code.'));
      return;
    }

    setLoading(true);
    try {
      const res = await StorageService.verifyOtpAndCompleteRegistration(
        verificationEmail,
        token,
        pendingRegisterPayload || undefined
      );

      setLoading(false);
      if (!res.success || !res.user) {
        setError(res.error || (isArabic ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired verification code.'));
        return;
      }

      onSuccess(res.user);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || (isArabic ? 'فشل التحقق من الرمز. يرجى المحاولة مجددًا.' : 'Verification failed. Please try again.'));
    }
  };

  // Handle resend OTP code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError(null);
    setResendNotice(null);
    setResendLoading(true);

    try {
      const res = await StorageService.resendVerificationCode(verificationEmail);
      setResendLoading(false);

      if (!res.success) {
        setError(res.error || (isArabic ? 'تعذر إعادة إرسال الرمز حالياً.' : 'Unable to resend code right now.'));
        return;
      }

      setResendCooldown(60);
      setResendNotice(t.codeResentNotice || (isArabic ? 'تم إرسال رمز تحقق جديد بنجاح إلى بريدك الإلكتروني.' : 'A new verification code has been sent to your email.'));
    } catch (err: any) {
      setResendLoading(false);
      setError(err.message || (isArabic ? 'تعذر إعادة إرسال الرمز.' : 'Failed to resend code.'));
    }
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto relative"
    >
      {/* Decorative Background Hero Mesh Pattern & Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        {/* Top-center ambient glowing gradient */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-500/25 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Bottom-right accent glow */}
        <div className="absolute -bottom-32 -right-20 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        {/* Bottom-left accent glow */}
        <div className="absolute -bottom-32 -left-20 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div 
        id="auth-modal-card"
        className={`spotlight-card relative z-10 w-full ${step === 'verify' ? 'max-w-md' : tab === 'signup' ? 'max-w-2xl my-6' : 'max-w-md'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col`}
      >
        {/* Header branding */}
        <div className="bg-gradient-to-br from-[#0B1E38] via-[#0F284E] to-[#1E3A8A] p-6 sm:p-7 text-white text-center relative shrink-0 border-b border-white/10 overflow-hidden">
          {/* Subtle header ambient pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Logo Tag / Inner Badge */}
          <div className="relative z-10 inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner hover:border-white/30 transition-all">
            {step === 'verify' ? (
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/logo.png"
                  alt="WISCO Logo"
                  className="h-6 w-auto object-contain drop-shadow-sm rounded-md"
                />
                <KeyRound className="w-4 h-4 text-sky-300 animate-pulse ml-0.5" />
              </div>
            ) : (
              <img
                src="/assets/logo.png"
                alt="WISCO Logo"
                className="h-7 sm:h-8 w-auto object-contain drop-shadow-sm rounded-md"
              />
            )}
          </div>

          <h1 className="relative z-10 text-2xl font-extrabold tracking-tight flex items-center justify-center">
            WISCO<span className="text-[#38BDF8] text-3xl leading-none">.</span>
          </h1>
          <p className="relative z-10 text-xs text-sky-200 mt-0.5 font-medium">
            {t.appTagline}
          </p>

          {/* Tab Selector (Hidden during OTP step) */}
          {step === 'form' && (
            <div className="relative z-10 mt-5 flex bg-black/30 p-1 rounded-xl backdrop-blur-sm border border-white/10 max-w-sm mx-auto">
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
          )}
        </div>

        {/* Scrollable Form Body */}
        <div ref={modalBodyRef} className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div 
              id="auth-error-banner"
              className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/70 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="font-semibold leading-relaxed">{error}</div>
            </div>
          )}

          {resendNotice && (
            <div 
              id="auth-resend-banner"
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{resendNotice}</span>
            </div>
          )}

          {/* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */}
          {step === 'verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-full text-xs font-semibold text-blue-700 dark:text-sky-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.emailVerificationTitle}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.emailVerificationTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {t.emailVerificationSub}{' '}
                  <span className="font-semibold text-slate-900 dark:text-white underline decoration-blue-500 underline-offset-2">
                    {verificationEmail}
                  </span>
                </p>
              </div>

              {/* 6-Digit Numeric Inputs */}
              <div className="space-y-2">
                <label className="block text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t.enterOtpPrompt}
                </label>
                
                <div 
                  id="otp-input-group"
                  dir="ltr"
                  className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1"
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      autoComplete="one-time-code"
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold text-[#0F284E] dark:text-sky-300 bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/20 shadow-inner transition-all outline-none"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                id="btn-verify-otp-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0F284E] via-[#1E3A8A] to-[#2563EB] hover:from-[#1E3A8A] hover:to-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.verifyingCode}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.verifyAndCompleteBtn}</span>
                  </>
                )}
              </button>

              {/* Resend & Back options */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>{isArabic ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}</span>
                  
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-slate-400 dark:text-slate-500">
                      {t.resendCooldown} {resendCooldown}{t.seconds}
                    </span>
                  ) : (
                    <button
                      id="btn-resend-otp"
                      type="button"
                      disabled={resendLoading}
                      onClick={handleResendCode}
                      className="font-bold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                      <span>{resendLoading ? t.resendingCode : t.resendCodeBtn}</span>
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <button
                    id="btn-back-to-signup"
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError(null);
                      setResendNotice(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer font-medium"
                  >
                    {isArabic ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t.backToSignUp}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder={t.enterEmail}
                      className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email 
                          ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder={t.enterPassword}
                      className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password 
                          ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
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
                          clearFieldError('email');
                        }}
                        placeholder={t.enterEmail}
                        className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                          fieldErrors.email 
                            ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.password} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="auth-input-signup-pass"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearFieldError('password');
                        }}
                        placeholder="••••••••"
                        className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                          fieldErrors.password 
                            ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                        }`}
                      />
                      {fieldErrors.password && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.password}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.confirmPassword} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="auth-input-signup-confirm-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearFieldError('confirmPassword');
                        }}
                        placeholder="••••••••"
                        className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                          fieldErrors.confirmPassword 
                            ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                        }`}
                      />
                      {fieldErrors.confirmPassword && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.confirmPassword}</span>
                        </p>
                      )}
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
                          onChange={(e) => {
                            setCompanyName(e.target.value);
                            clearFieldError('companyName');
                          }}
                          placeholder="e.g. Whislly Media & Design"
                          className={`w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                            fieldErrors.companyName 
                              ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                          }`}
                        />
                      </div>
                      {fieldErrors.companyName && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.companyName}</span>
                        </p>
                      )}
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
                          onChange={(e) => {
                            setCompanyAddress(e.target.value);
                            clearFieldError('companyAddress');
                          }}
                          placeholder={t.headquartersLocationPlaceholder || 'e.g. Amman, Jordan'}
                          className={`w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                            fieldErrors.companyAddress 
                              ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                          }`}
                        />
                      </div>
                      {fieldErrors.companyAddress && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.companyAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Official Website (OPTIONAL) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <span>{t.officialWebsite}</span>{' '}
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({isArabic ? 'اختياري' : 'Optional'})
                        </span>
                      </label>
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
                        <input
                          id="auth-input-agency-website"
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder={t.officialWebsitePlaceholder || 'e.g. https://www.agency.com (Optional)'}
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
                          onChange={(e) => {
                            setCompanyEmail(e.target.value);
                            clearFieldError('companyEmail');
                          }}
                          placeholder={t.contactSupportEmailPlaceholder || 'e.g. billing@agency.com'}
                          className={`w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                            fieldErrors.companyEmail 
                              ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                          }`}
                        />
                      </div>
                      {fieldErrors.companyEmail && (
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.companyEmail}</span>
                        </p>
                      )}
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
                        onChange={(e) => {
                          setDefaultPaymentTerms(e.target.value);
                          clearFieldError('defaultPaymentTerms');
                        }}
                        placeholder={t.initialPaymentTermsPlaceholder || 'Payment due within 30 days of invoice date...'}
                        className={`w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none ${
                          fieldErrors.defaultPaymentTerms 
                            ? 'border-red-500 focus:ring-red-500/30 bg-red-50/20 dark:bg-red-950/20' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                        }`}
                      />
                    </div>
                    {fieldErrors.defaultPaymentTerms ? (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.defaultPaymentTerms}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isArabic 
                          ? 'ملاحظة: يمكنك تعديل شروط الدفع وشعار الشركة في أي وقت لاحقاً من تبويب الحساب.' 
                          : 'Note: Payment terms and agency logo remain editable anytime in the Account settings.'}
                      </p>
                    )}
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
                <div className={`p-2.5 rounded-xl transition-all ${fieldErrors.agreedPolicy ? 'bg-red-50/50 dark:bg-red-950/30 border border-red-300 dark:border-red-800' : ''}`}>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    <input
                      id="checkbox-privacy-policy"
                      type="checkbox"
                      checked={agreedPolicy}
                      onChange={(e) => {
                        setAgreedPolicy(e.target.checked);
                        clearFieldError('agreedPolicy');
                      }}
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
                  {fieldErrors.agreedPolicy && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 pl-6 rtl:pl-0 rtl:pr-6">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.agreedPolicy}</span>
                    </p>
                  )}
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
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Isolated UID Storage Vault & AES Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
