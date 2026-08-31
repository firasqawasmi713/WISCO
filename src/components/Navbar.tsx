import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  FileSpreadsheet, 
  ShieldCheck,
  Calendar,
  Coins,
  Globe,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronDown,
  Check,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { NavTab, LanguageCode, UserProfile, AppSettings, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { CURRENCIES } from '../constants/currencies';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  user: UserProfile | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSignOut: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  user,
  settings,
  onUpdateSettings,
  onSignOut,
  onOpenPrivacyPolicy
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currencySelectorOpen, setCurrencySelectorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  // Click away listener to automatically close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setCurrencySelectorOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setCurrencySelectorOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const tabTitles: Record<NavTab, { title: string; sub: string }> = {
    dashboard: { title: t.dashboard, sub: t.financialOverview },
    clients: { title: t.clients, sub: t.clientsSubtitle },
    invoices: { title: t.invoices, sub: t.invoicesSubtitle },
    spendings: { title: t.spendings, sub: t.spendingsSubtitle },
    events: { title: t.events, sub: t.eventsSubtitle },
    reports: { title: t.reports, sub: t.reportsSubtitle },
    account: { title: t.account, sub: t.accountSubtitle }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'clients', label: t.clients, icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: t.invoices, icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'spendings', label: t.spendings, icon: <Wallet className="w-5 h-5" /> },
    { id: 'events', label: t.events, icon: <Calendar className="w-5 h-5" /> },
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> }
  ];

  const popularCurrencies: CurrencyCode[] = ['JOD', 'USD', 'EUR', 'SAR', 'AED', 'GBP'];
  const allCurrenciesList = Object.keys(CURRENCIES) as CurrencyCode[];

  // Initials for avatar
  const userInitials = user?.displayName
    ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AW';

  const handleCurrencyChange = (curr: CurrencyCode) => {
    onUpdateSettings({ currency: curr });
    setCurrencySelectorOpen(false);
  };

  const handleLanguageToggle = (targetLang: LanguageCode) => {
    if (settings.language !== targetLang) {
      onUpdateSettings({ language: targetLang });
    }
  };

  const handleDarkModeToggle = () => {
    onUpdateSettings({ darkMode: !settings.darkMode });
  };

  const handleNavigateSettings = () => {
    onSelectTab('account');
    setDropdownOpen(false);
  };

  const handleSignOutClick = () => {
    setDropdownOpen(false);
    onSignOut();
  };

  return (
    <>
      {/* Top Header Bar */}
      <header 
        id="app-top-navbar"
        className="sticky top-0 z-30 bg-white dark:bg-[#071326] border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between transition-colors duration-200 shrink-0"
      >
        {/* Left: View Title and Live Update Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Logo icon */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F284E] dark:bg-blue-600 flex items-center justify-center font-black text-sm text-[#38BDF8] shadow-md border border-sky-400/30">
              W
            </div>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0F284E] dark:text-white tracking-tight leading-none">
              {tabTitles[currentTab]?.title || t.dashboard}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {tabTitles[currentTab]?.sub}
            </p>
          </div>
        </div>

        {/* Right: Privacy Policy & Interactive Account Dropdown Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Policy Quick Trigger */}
          <button
            id="navbar-btn-policy"
            type="button"
            onClick={onOpenPrivacyPolicy}
            title={t.readPrivacyPolicy}
            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Interactive Account Dropdown Anchor */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="navbar-btn-user-account"
              type="button"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              onClick={() => setDropdownOpen(prev => !prev)}
              title={isArabic ? 'قائمة الحساب والتفضيلات' : 'Account & Preferences Menu'}
              className={`flex items-center space-x-2.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer group border select-none ${
                dropdownOpen || currentTab === 'account'
                  ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="text-right rtl:text-left hidden sm:block">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                  {isArabic ? 'الحساب' : 'Account'}
                </p>
                <p className="text-xs font-bold text-[#0F284E] dark:text-sky-300 group-hover:text-blue-600 dark:group-hover:text-white transition-colors max-w-[130px] truncate">
                  {user?.displayName || (isArabic ? 'حساب المستخدم' : 'Alexander Whislly')}
                </p>
              </div>

              {/* User Avatar Badge */}
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 shadow-sm flex items-center justify-center text-white font-black text-xs transition-transform group-hover:scale-105 shrink-0 ${
                dropdownOpen || currentTab === 'account'
                  ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-300 dark:ring-blue-800'
                  : 'bg-[#0F284E] dark:bg-blue-600 group-hover:bg-blue-600 border-white dark:border-slate-700'
              }`}>
                {userInitials}
              </div>

              {/* Animated Chevron Indicator */}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
            </button>

            {/* Floating Dropdown Menu Panel */}
            {dropdownOpen && (
              <div 
                id="account-dropdown-menu"
                className="absolute right-0 top-full mt-2 rtl:right-auto rtl:left-0 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* 1. Header Profile Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F284E] dark:bg-blue-600 border border-blue-400/30 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.displayName || (isArabic ? 'مستخدم ويسكو' : 'WISCO User')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || (isArabic ? 'جلسة نشطة' : 'Active Session')}
                    </p>
                    {user?.companyName && (
                      <p className="text-[10px] text-blue-600 dark:text-sky-400 font-medium truncate mt-0.5">
                        {user.companyName}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Menu Item: Settings View */}
                <button
                  id="dropdown-btn-settings"
                  type="button"
                  onClick={handleNavigateSettings}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left rtl:text-right transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                        {t.settingsNav || (isArabic ? 'الإعدادات' : 'Settings')}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isArabic ? 'إدارة الشركة، الفواتير والتفضيلات' : 'Agency profile, billing & preferences'}
                      </p>
                    </div>
                  </div>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors" />
                </button>

                {/* 3. Menu Item: Currency Selector & Quick Switcher */}
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t.quickCurrency || (isArabic ? 'العملة' : 'Currency')}
                      </span>
                    </div>

                    {/* Active Currency Badge / Toggle Full List */}
                    <button
                      id="dropdown-currency-toggle-btn"
                      type="button"
                      onClick={() => setCurrencySelectorOpen(prev => !prev)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800/60 hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
                    >
                      <span>{settings.currency} ({CURRENCIES[settings.currency]?.symbol})</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${currencySelectorOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Quick Select Buttons */}
                  {!currencySelectorOpen ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {popularCurrencies.map((curr) => {
                        const isSelected = settings.currency === curr;
                        return (
                          <button
                            key={curr}
                            id={`dropdown-currency-quick-${curr}`}
                            type="button"
                            onClick={() => handleCurrencyChange(curr)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {curr}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Expandable Full Currencies List */
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                      {allCurrenciesList.map((curr) => {
                        const isSelected = settings.currency === curr;
                        const currConfig = CURRENCIES[curr];
                        return (
                          <button
                            key={curr}
                            id={`dropdown-currency-full-${curr}`}
                            type="button"
                            onClick={() => handleCurrencyChange(curr)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold text-left rtl:text-right flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
                            }`}
                          >
                            <span className="truncate">{curr} ({currConfig.symbol})</span>
                            {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Menu Item: Language Switcher (EN / AR) */}
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t.quickLanguage || (isArabic ? 'اللغة' : 'Language')}
                    </span>
                  </div>

                  {/* Language Toggle Options */}
                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                      id="dropdown-lang-en"
                      type="button"
                      onClick={() => handleLanguageToggle('en')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        settings.language === 'en'
                          ? 'bg-[#0F284E] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      id="dropdown-lang-ar"
                      type="button"
                      onClick={() => handleLanguageToggle('ar')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        settings.language === 'ar'
                          ? 'bg-[#0F284E] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      عربي
                    </button>
                  </div>
                </div>

                {/* 5. Menu Item: Dark Mode Toggle Switch */}
                <div 
                  id="dropdown-dark-mode-row"
                  onClick={handleDarkModeToggle}
                  className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      settings.darkMode
                        ? 'bg-blue-950/80 text-sky-400 border border-blue-800/50'
                        : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                    }`}>
                      {settings.darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t.quickDarkMode || (isArabic ? 'الوضع الليلي' : 'Dark Mode')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {settings.darkMode ? (t.switchOn || 'ON') : (t.switchOff || 'OFF')}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch Component */}
                  <button
                    id="dropdown-switch-dark-mode"
                    type="button"
                    role="switch"
                    aria-checked={settings.darkMode}
                    aria-label="Toggle Dark Mode"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDarkModeToggle();
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out text-slate-700 ${
                        settings.darkMode 
                          ? 'translate-x-5 rtl:-translate-x-5 bg-slate-900 text-sky-300' 
                          : 'translate-x-0 rtl:translate-x-0 bg-white text-amber-500'
                      }`}
                    >
                      {settings.darkMode ? (
                        <Moon className="w-2.5 h-2.5 text-blue-600 dark:text-sky-300" />
                      ) : (
                        <Sun className="w-2.5 h-2.5 text-amber-500" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Divider Line */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

                {/* 6. Menu Item: Sign Out (Visually separated with red accent) */}
                <button
                  id="dropdown-btn-signout"
                  type="button"
                  onClick={handleSignOutClick}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left rtl:text-right transition-all cursor-pointer font-bold group"
                >
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/60 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold">{t.signOut}</p>
                    <p className="text-[10px] text-red-400 dark:text-red-300/70 font-normal">
                      {isArabic ? 'إنهاء الجلسة والعودة لتسجيل الدخول' : 'End session & return to login'}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Account tab removed) */}
      <div 
        id="mobile-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                active
                  ? 'text-blue-600 dark:text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
