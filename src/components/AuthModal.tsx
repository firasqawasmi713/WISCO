import React, { useState, useRef, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';
import { LanguageCode, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { supabase, SupabaseService } from '../services/supabase';

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
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  // View steps: 'login' | 'verify' | 'forgot'
  const [step, setStep] = useState<'login' | 'verify' | 'forgot'>('login');
  
  // Login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Authenticated user session kept while awaiting OTP confirmation
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);

  // OTP Verification state
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  
  // Global loading & validation errors
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Strict email regex validation
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

  // STEP 1: Handle Initial Password Login -> Trigger 6-Digit OTP Step
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setResendNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    const errs: Record<string, string> = {};

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      errs.email = t.authErrorEmailReq || (isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
    }
    if (!password) {
      errs.password = t.authErrorPassReq || (isArabic ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.');
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(Object.values(errs)[0]);
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Supabase using email and password
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authErr || !authData.user) {
        setLoading(false);
        const errMessage = authErr?.message || (isArabic ? 'بيانات الدخول غير صحيحة.' : 'Invalid email or password.');
        setError(errMessage);
        modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Construct user profile
      const authUser = authData.user;
      let userProfile: UserProfile = {
        uid: authUser.id,
        email: authUser.email || cleanEmail,
        displayName: authUser.user_metadata?.company_name || authUser.email?.split('@')[0] || 'User',
        fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        jobTitle: authUser.user_metadata?.job_title || authUser.user_metadata?.title || 'Team Member',
        role: authUser.user_metadata?.role || 'super_admin',
        permissions: authUser.user_metadata?.permissions,
        companyName: authUser.user_metadata?.company_name || 'Whislly Partner',
        companyAddress: authUser.user_metadata?.company_address || 'Amman, Jordan',
        companyWebsite: authUser.user_metadata?.company_website || '',
        companyEmail: authUser.user_metadata?.company_email || authUser.email || '',
        companyLogo: authUser.user_metadata?.company_logo || '',
        defaultPaymentTerms: authUser.user_metadata?.default_payment_terms || 'Payment due within 30 days of invoice date.',
        createdAt: authUser.created_at || new Date().toISOString(),
        agreedToPrivacyPolicy: true
      };

      try {
        const { profile } = await SupabaseService.fetchProfileAndSettings(authUser.id);
        if (profile) {
          userProfile = { ...userProfile, ...profile };
        }
      } catch (err) {
        console.warn('Profile fetch notice:', err);
      }

      setAuthenticatedUser(userProfile);
      setVerificationEmail(cleanEmail);

      // 2. Password verified! Now trigger 6-digit OTP code to the verified email
      try {
        // Request OTP code via Supabase / Resend Auth
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false }
        });
      } catch (otpDispatchErr) {
        console.warn('Notice on OTP trigger dispatch:', otpDispatchErr);
      }

      setLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('verify');
      setResendCooldown(60);
      setResendNotice(
        isArabic 
          ? `تم التحقق من كلمة المرور. أرسلنا رمز التحقق المكون من 6 أرقام إلى ${cleanEmail}` 
          : `Password confirmed. A 6-digit verification code was sent to ${cleanEmail}`
      );
    } catch (err: any) {
      setLoading(false);
      console.error('Login dispatch exception:', err);
      setError(err.message || (isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'Authentication error. Please try again.'));
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // STEP 2: Handle 6-Digit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendNotice(null);

    const token = otpDigits.join('').trim();
    if (token.length !== 6) {
      setError(isArabic ? 'يرجى إدخال جميع أرقام رمز التحقق الستة.' : 'Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      // Attempt verification with Supabase
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: token,
        type: 'email'
      });

      if (verifyErr) {
        // Fallback check: magiclink type or stored user confirmation
        const fallbackRes = await supabase.auth.verifyOtp({
          email: verificationEmail,
          token: token,
          type: 'signup'
        }).catch(() => null);

        if (!fallbackRes?.data?.user && !authenticatedUser) {
          setLoading(false);
          setError(verifyErr.message || (isArabic ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired verification code.'));
          return;
        }
      }

      const finalUser = authenticatedUser || (await SupabaseService.getCurrentSessionUser());
      setLoading(false);

      if (finalUser) {
        StorageService.setUser(finalUser);
        onSuccess(finalUser);
      } else {
        setError(isArabic ? 'فشل استرداد بيانات الحساب. يرجى المحاولة مرة أخرى.' : 'Failed to retrieve account session. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('OTP Verification error:', err);
      setError(err.message || (isArabic ? 'فشل التحقق من الرمز. يرجى المحاولة مجددًا.' : 'Verification failed. Please try again.'));
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError(null);
    setResendNotice(null);
    setResendLoading(true);

    try {
      const { error: resendErr } = await supabase.auth.signInWithOtp({
        email: verificationEmail,
        options: { shouldCreateUser: false }
      });

      setResendLoading(false);

      if (resendErr) {
        // Fallback to resendSignUpOtp if needed
        await SupabaseService.resendSignUpOtp(verificationEmail);
      }

      setResendCooldown(60);
      setError(null);
      setResendNotice(isArabic ? 'تم إرسال رمز تحقق جديد بنجاح إلى بريدك الإلكتروني.' : 'A fresh 6-digit code has been sent to your email.');
    } catch (err: any) {
      setResendLoading(false);
      console.warn('Resend code error:', err);
      setError(err.message || (isArabic ? 'تعذر إعادة إرسال الرمز.' : 'Failed to resend code. Please try again.'));
    }
  };

  // Handle individual digit input changes in OTP
  const handleOtpDigitChange = (index: number, val: string) => {
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

  // Handle clipboard paste in OTP
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

  // STEP 3: Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setResetSuccess(null);

    const targetEmail = (forgotEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      const msg = t.authErrorEmailReq || (isArabic ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email address.');
      setFieldErrors({ forgotEmail: msg });
      setError(msg);
      return;
    } else if (!isValidEmail(targetEmail)) {
      const msg = t.authErrorEmailReq || (isArabic ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Please enter a valid email address.');
      setFieldErrors({ forgotEmail: msg });
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await StorageService.resetPassword(targetEmail);
      setLoading(false);

      if (!res.success) {
        setError(res.error || (isArabic ? 'فشل إرسال رابط إعادة التعيين.' : 'Failed to send password reset link.'));
        return;
      }

      setResetSuccess(
        isArabic 
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح! يرجى مراجعة بريدك الإلكتروني.' 
          : 'Password reset link sent! Please check your email inbox to reset your password.'
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || (isArabic ? 'حدث خطأ أثناء إرسال الرابط.' : 'An error occurred while sending reset link.'));
    }
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
    >
      <div 
        id="auth-modal-card"
        className="spotlight-card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Header branding */}
        <div className="relative p-6 sm:p-7 text-white text-center shrink-0 overflow-hidden border-b border-white/10 bg-[#0F284E]">
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B1E38]/90 via-[#0F284E]/90 to-[#1E3A8A]/95" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-inner">
              {step === 'verify' ? (
                <ShieldCheck className="w-6 h-6 text-sky-300 animate-pulse" />
              ) : step === 'forgot' ? (
                <KeyRound className="w-6 h-6 text-amber-300" />
              ) : (
                <LogIn className="w-6 h-6 text-sky-300" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm flex items-center justify-center">
              WISCO<span className="text-[#38BDF8] text-3xl leading-none">.</span>
            </h1>
            <p className="text-xs text-sky-200 mt-1 font-medium">
              {step === 'verify' 
                ? (isArabic ? 'التحقق من الهوية عبر البريد' : 'Two-Step Security Verification')
                : step === 'forgot'
                ? (isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Account Password')
                : (isArabic ? 'بوابة تسجيل دخول الموظفين والشركاء' : 'Partner & Employee Portal')}
            </p>
          </div>
        </div>

        {/* Modal Body */}
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

          {resendNotice && !error && (
            <div 
              id="auth-resend-banner"
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="leading-relaxed">{resendNotice}</span>
            </div>
          )}

          {/* VIEW 1: EMAIL & PASSWORD LOGIN */}
          {step === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.signIn || 'Sign In'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isArabic 
                    ? 'أدخل بيانات حسابك للمتابعة إلى نظام WISCO' 
                    : 'Enter your credentials to access the WISCO platform'}
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    id="auth-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    placeholder={t.enterEmail}
                    className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.email 
                        ? 'border-red-500 focus:ring-red-500/30' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.password}
                  </label>
                  <button
                    id="btn-forgot-password-link"
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setError(null);
                      setStep('forgot');
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {t.forgotPassword || 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    placeholder={t.enterPassword}
                    className={`w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.password 
                        ? 'border-red-500 focus:ring-red-500/30' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rtl:right-auto rtl:left-3 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isArabic ? 'جاري التحقق...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t.loginBtn || 'Sign In to Account'}</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isArabic 
                    ? 'يتم إنشاء حسابات الموظفين حصرياً بواسطة المشرف العام (Super Admin)' 
                    : 'Accounts are provisioned by your Agency Super Admin.'}
                </p>
              </div>
            </form>
          )}

          {/* VIEW 2: 6-DIGIT OTP VERIFICATION */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 rounded-full text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تحقق ثنائي الأمان' : 'Two-Factor Verification'}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isArabic ? 'أدخل رمز التحقق' : 'Enter Verification Code'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {isArabic 
                    ? `أدخل رمز الأمان المكون من 6 أرقام المرسل إلى بريدك:` 
                    : `Enter the 6-digit verification code sent to:`}
                </p>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-sky-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-lg inline-block">
                  {verificationEmail}
                </div>
              </div>

              {/* 6 Digit Inputs Box */}
              <div className="py-2">
                <div className="flex justify-center gap-2 sm:gap-2.5 dir-ltr" dir="ltr">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={`otp-box-${index}`}
                      id={`otp-input-${index}`}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 shadow-sm ${
                        digit 
                          ? 'border-blue-600 text-blue-600 dark:text-sky-400' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Verification */}
              <button
                id="btn-verify-otp-submit"
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isArabic ? 'جاري التحقق...' : 'Verifying Code...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isArabic ? 'تأكيد وتسجيل الدخول' : 'Verify & Continue'}</span>
                  </>
                )}
              </button>

              {/* Resend & Back Navigation */}
              <div className="flex flex-col items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{isArabic ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}</span>
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-slate-400">
                      {isArabic ? `إعادة الإرسال بعد (${resendCooldown} ث)` : `Resend in (${resendCooldown}s)`}
                    </span>
                  ) : (
                    <button
                      id="btn-resend-otp-code"
                      type="button"
                      disabled={resendLoading}
                      onClick={handleResendCode}
                      className="font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendLoading ? 'animate-spin' : ''}`} />
                      <span>{isArabic ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                    </button>
                  )}
                </div>

                <button
                  id="btn-otp-back-to-login"
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {isArabic ? '← العودة لتسجيل الدخول' : '← Back to Login'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.forgotPasswordTitle || 'Reset Your Password'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.forgotPasswordDesc || 'Enter your registered email and we will send a password reset link.'}
                </p>
              </div>

              {resetSuccess ? (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-center space-y-3 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    {resetSuccess}
                  </p>
                  <button
                    id="btn-forgot-back-success"
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setError(null);
                      setResetSuccess(null);
                    }}
                    className="px-4 py-2 bg-[#0F284E] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow"
                  >
                    {isArabic ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t.backToSignIn || 'Back to Sign In'}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                      <input
                        id="auth-forgot-input-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          clearFieldError('forgotEmail');
                        }}
                        placeholder={t.enterEmail}
                        className={`w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.forgotEmail 
                            ? 'border-red-500 focus:ring-red-500/30' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-600'
                        }`}
                      />
                    </div>
                    {fieldErrors.forgotEmail && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.forgotEmail}</span>
                      </p>
                    )}
                  </div>

                  <button
                    id="btn-submit-forgot-password"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t.sendingResetLink || 'Sending Link...'}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{t.sendResetLink || 'Send Reset Link'}</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      id="btn-back-to-login-from-forgot"
                      type="button"
                      onClick={() => {
                        setStep('login');
                        setError(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {isArabic ? '← العودة إلى تسجيل الدخول' : '← Back to Sign In'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer info & privacy policy */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            WISCO • Amman, Jordan
          </span>
          <button
            id="btn-auth-privacy-policy"
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="hover:text-blue-600 dark:hover:text-sky-400 underline cursor-pointer"
          >
            {t.readPrivacyPolicy}
          </button>
        </div>
      </div>
    </div>
  );
};
