import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Coins, 
  Globe, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Database, 
  Trash2, 
  LogOut, 
  Download, 
  Upload, 
  Building2, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle,
  FileCheck,
  Image as ImageIcon,
  ImagePlus,
  Trash,
  UploadCloud,
  Lock,
  FileText,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AppSettings, CurrencyCode, LanguageCode, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { CURRENCIES } from '../constants/currencies';
import { StorageService } from '../services/storage';

interface AccountViewProps {
  user: UserProfile | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSignOut: () => void;
  onOpenPrivacyPolicy: () => void;
  onDeleteAccount: () => void;
  onReloadAllData: () => void;
  lang: LanguageCode;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  settings,
  onUpdateSettings,
  onSignOut,
  onOpenPrivacyPolicy,
  onDeleteAccount,
  onReloadAllData,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Agency Profile Data (Locked Agency Information)
  const lockedAgencyName = settings.companyName || user?.companyName || 'Whislly Partner';
  const lockedLocation = settings.companyAddress || user?.companyAddress || 'Amman, Jordan';
  const lockedWebsite = settings.companyWebsite || user?.companyWebsite || 'www.company.com';
  const lockedContactEmail = settings.companyEmail || user?.companyEmail || user?.email || 'contact@agency.com';

  // Editable Profile Exceptions
  const [companyLogo, setCompanyLogo] = useState(settings.companyLogo || user?.companyLogo || '');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(settings.defaultPaymentTerms || user?.defaultPaymentTerms || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Sync state if settings prop updates externally
  useEffect(() => {
    setCompanyLogo(settings.companyLogo || user?.companyLogo || '');
    setDefaultPaymentTerms(settings.defaultPaymentTerms || user?.defaultPaymentTerms || '');
  }, [settings.companyLogo, settings.defaultPaymentTerms, user?.companyLogo, user?.defaultPaymentTerms]);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(isArabic ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // If image is large, compress via offscreen canvas
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 200;
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
          const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
          setCompanyLogo(compressedDataUrl);
          onUpdateSettings({ companyLogo: compressedDataUrl });
        } else {
          setCompanyLogo(result);
          onUpdateSettings({ companyLogo: result });
        }
        setLogoUploading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      };
      img.onerror = () => {
        setCompanyLogo(result);
        onUpdateSettings({ companyLogo: result });
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
    onUpdateSettings({ companyLogo: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePaymentTerms = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      defaultPaymentTerms: defaultPaymentTerms.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup(user?.uid);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WISCO_Backup_${user?.uid || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFullBackup(content, user?.uid);
      if (success) {
        setImportStatus('Backup restored successfully!');
        onReloadAllData();
      } else {
        setImportStatus('Invalid backup file format.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div id="account-view-root" className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.accountTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.accountSubtitle}
          </p>
        </div>

        <button
          id="btn-account-privacy-policy-top"
          onClick={onOpenPrivacyPolicy}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t.readPrivacyPolicy} (Whislly)</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">
          {t.userProfile}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
              {lockedAgencyName ? lockedAgencyName.charAt(0).toUpperCase() : 'W'}
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lockedAgencyName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-900/50">
                  <Lock className="w-2.5 h-2.5" />
                  {t.lockedBadge || 'Locked Record'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'admin@agency.com'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <FileCheck className="w-3 h-3" />
                <span>Privacy Policy Agreed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-account-sign-out"
              onClick={onSignOut}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agency Billing Profile & Locked Details */}
      <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.agencyProfileSettings}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> {isArabic ? 'بيانات مؤكدة ومقفلة' : 'Verified & Locked'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isArabic ? 'معلومات الشركة الرسمية المطبوعة على فواتير PDF الصادرة' : 'Official agency credentials printed on generated invoices'}
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="self-start sm:self-center px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/60 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> {isArabic ? 'تم حفظ التعديلات' : 'Changes Saved'}
            </span>
          )}
        </div>

        {/* Informational locked notice */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t.agencyLockedExplanation || 'Core agency credentials (Name, Location, Website, Contact Email) were established during onboarding and are permanently locked for invoice integrity and financial auditing. You may update your Agency Logo and Default Payment Terms at any time below.'}
          </p>
        </div>

        {/* 1. Locked / Read-Only Agency Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Agency Name (Locked) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{t.agencyName}</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> {t.lockedBadge || 'Locked'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {lockedAgencyName}
            </div>
          </div>

          {/* Headquarters Location (Locked) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{t.headquartersLocation || 'Headquarters Location'}</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> {t.lockedBadge || 'Locked'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {lockedLocation}
            </div>
          </div>

          {/* Official Website (Locked) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{t.officialWebsite || 'Official Website URL'}</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> {t.lockedBadge || 'Locked'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {lockedWebsite}
            </div>
          </div>

          {/* Contact / Support Email (Locked) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{t.contactSupportEmail || 'Contact / Support Email'}</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> {t.lockedBadge || 'Locked'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {lockedContactEmail}
            </div>
          </div>
        </div>

        {/* 2. Editable Exception #1: Company Logo Upload & Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Preview box */}
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt="Company Logo Preview" 
                    className="w-full h-full object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center p-1">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-[9px] font-semibold">No Logo</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>{isArabic ? 'شعار الشركة / المؤسسة (قابل للتعديل)' : 'Company / Agency Logo (Editable)'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                  {isArabic 
                    ? 'يتم تحديث هذا الشعار تلقائيًا في ترويسة جميع الفواتير الصادرة وملفات PDF.' 
                    : 'This logo will automatically appear in the header of all generated invoices and PDF downloads.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: PNG, JPG, SVG, WebP (Max 5MB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <input
                id="input-company-logo-file"
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                ref={logoInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                className="hidden"
              />
              <button
                id="btn-upload-company-logo"
                type="button"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{companyLogo ? (isArabic ? 'تغيير الشعار' : 'Change Logo') : (isArabic ? 'رفع الشعار' : 'Upload Logo')}</span>
              </button>

              {companyLogo && (
                <button
                  id="btn-remove-company-logo"
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-2 bg-slate-200 hover:bg-red-50 hover:text-red-600 dark:bg-slate-700 dark:hover:bg-red-950/60 dark:hover:text-red-400 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Remove Logo"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'حذف' : 'Remove'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Editable Exception #2: Default Payment Terms */}
        <form onSubmit={handleSavePaymentTerms} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>{t.paymentTerms} ({isArabic ? 'قابل للتعديل' : 'Editable'})</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {isArabic ? 'تطبق تلقائياً على كل فاتورة جديدة' : 'Applies to all newly generated invoices'}
            </span>
          </div>

          <textarea
            id="input-setting-default-payment-terms"
            rows={3}
            value={defaultPaymentTerms}
            onChange={(e) => setDefaultPaymentTerms(e.target.value)}
            placeholder="Payment due within 30 days of invoice date..."
            required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex justify-end pt-1">
            <button
              id="btn-save-agency-settings"
              type="submit"
              className="px-5 py-2.5 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.savePaymentTermsBtn || t.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Settings Grid: Currency, Language, Theme, Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Currency Selector */}
        <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.currencySetting}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.currencySettingDesc}
              </p>
            </div>
          </div>

          <select
            id="account-select-currency"
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value as CurrencyCode })}
            className="w-full mt-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            {Object.values(CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} — {isArabic ? curr.nameAr : curr.name} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Language & Direction */}
        <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.languageSetting}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.languageSettingDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              id="account-btn-lang-en"
              type="button"
              onClick={() => onUpdateSettings({ language: 'en' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                settings.language === 'en'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              English (LTR)
            </button>
            <button
              id="account-btn-lang-ar"
              type="button"
              onClick={() => onUpdateSettings({ language: 'ar' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                settings.language === 'ar'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              العربية (RTL)
            </button>
          </div>
        </div>

        {/* 3. Appearance Theme */}
        <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.appearanceSetting}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.appearanceSettingDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              id="account-btn-theme-light"
              type="button"
              onClick={() => onUpdateSettings({ darkMode: false })}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                !settings.darkMode
                  ? 'bg-[#0F284E] text-white border-[#0F284E] shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.themeLight}</span>
            </button>
            <button
              id="account-btn-theme-dark"
              type="button"
              onClick={() => onUpdateSettings({ darkMode: true })}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                settings.darkMode
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-300" />
              <span>{t.themeDark}</span>
            </button>
          </div>
        </div>

        {/* 4. Storage Engine Status */}
        <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dataStorageMode}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.storageModeLocal}
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Vault active with instant zero-latency caching & Firebase SDK readiness.</span>
          </div>
        </div>
      </div>

      {/* Data Management & Section 6 Account Deletion */}
      <div className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          {t.dataManagement}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.dataManagementDesc}
        </p>

        {importStatus && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export JSON backup */}
          <button
            id="btn-export-backup-json"
            onClick={handleExportBackup}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left rtl:text-right transition-all cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{t.exportJsonBackup}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Download encrypted JSON backup to your disk.
            </p>
          </button>

          {/* Import JSON backup */}
          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              id="btn-trigger-import-json"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left rtl:text-right transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>{t.importJsonBackup}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Restore clients, spendings, and invoices.
              </p>
            </button>
          </div>
        </div>

        {/* Delete Account (Privacy Policy Section 6) */}
        <div className="mt-6 pt-6 border-t border-red-100 dark:border-red-950/60 p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>{t.deleteAccountBtn}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {t.deleteAccountDesc}
              </p>
            </div>

            <button
              id="btn-delete-account-trigger"
              type="button"
              onClick={onDeleteAccount}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.deleteAccountBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
