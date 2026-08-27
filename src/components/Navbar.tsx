import React from 'react';
import { 
  Sun, 
  Moon, 
  Globe, 
  Coins, 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  FileSpreadsheet, 
  Settings,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { NavTab, LanguageCode, CurrencyCode, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { CURRENCIES } from '../constants/currencies';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  onToggleLanguage: () => void;
  currency: CurrencyCode;
  onChangeCurrency: (code: CurrencyCode) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: UserProfile | null;
  onSignOut: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLanguage,
  currency,
  onChangeCurrency,
  darkMode,
  onToggleDarkMode,
  user,
  onSignOut,
  onOpenPrivacyPolicy
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const tabTitles: Record<NavTab, { title: string; sub: string }> = {
    dashboard: { title: t.dashboard, sub: t.financialOverview },
    clients: { title: t.clients, sub: t.clientsSubtitle },
    invoices: { title: t.invoices, sub: t.invoicesSubtitle },
    spendings: { title: t.spendings, sub: t.spendingsSubtitle },
    reports: { title: t.reports, sub: t.reportsSubtitle },
    account: { title: t.account, sub: t.accountSubtitle }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'clients', label: t.clients, icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: t.invoices, icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'spendings', label: t.spendings, icon: <Wallet className="w-5 h-5" /> },
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'account', label: t.account, icon: <Settings className="w-5 h-5" /> }
  ];

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
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-[#0F284E] dark:text-white tracking-tight leading-none">
                {tabTitles[currentTab]?.title || t.dashboard}
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-200 dark:border-emerald-800/50">
                Live Update
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {tabTitles[currentTab]?.sub}
            </p>
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Currency Selector */}
          <div className="relative flex items-center">
            <label htmlFor="currency-quick-select" className="sr-only">Select Currency</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
              <Coins className="w-3.5 h-3.5 text-[#2563EB] dark:text-sky-400 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
              <select
                id="currency-quick-select"
                value={currency}
                onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1 rtl:pr-0 rtl:pl-1"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {c.code} ({lang === 'ar' ? c.nameAr : c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            id="navbar-btn-lang-toggle"
            onClick={onToggleLanguage}
            title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#2563EB] dark:text-sky-400" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="navbar-btn-theme-toggle"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Light Theme' : 'Dark Theme'}
            className="p-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#2563EB]" />
            )}
          </button>

          {/* User Welcome Block on Desktop */}
          <div className="hidden lg:flex items-center space-x-3 rtl:space-x-reverse pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right rtl:text-left">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Welcome back,</p>
              <p className="text-xs font-bold text-[#0F284E] dark:text-sky-300">
                {user?.displayName || 'Alexander Whislly'}
              </p>
            </div>
            <div className="w-9 h-9 bg-[#38BDF8] rounded-full border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-white font-bold text-xs">
              {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AW'}
            </div>
          </div>

          {/* Mobile Privacy Policy Quick Button */}
          <button
            id="navbar-btn-policy-mobile"
            onClick={onOpenPrivacyPolicy}
            title={t.readPrivacyPolicy}
            className="hidden sm:flex md:hidden p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Mobile sign out button */}
          <button
            id="navbar-btn-signout-mobile"
            onClick={onSignOut}
            title={t.signOut}
            className="md:hidden p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
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
