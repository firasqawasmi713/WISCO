import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  FileSpreadsheet, 
  ShieldCheck
} from 'lucide-react';
import { NavTab, LanguageCode, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  user: UserProfile | null;
  onOpenPrivacyPolicy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  user,
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
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> }
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

        {/* Right: User Profile / Name Option (Access Account Tab) */}
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

          {/* User Welcome Block & Avatar Circle - Access Account Settings */}
          <button
            id="navbar-btn-user-account"
            type="button"
            onClick={() => onSelectTab('account')}
            title={lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
            className={`flex items-center space-x-2.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer group border ${
              currentTab === 'account'
                ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-sm'
                : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-right rtl:text-left hidden sm:block">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                {lang === 'ar' ? 'الحساب' : 'Account'}
              </p>
              <p className="text-xs font-bold text-[#0F284E] dark:text-sky-300 group-hover:text-blue-600 dark:group-hover:text-white transition-colors max-w-[140px] truncate">
                {user?.displayName || (lang === 'ar' ? 'حساب المستخدم' : 'Alexander Whislly')}
              </p>
            </div>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 shadow-sm flex items-center justify-center text-white font-black text-xs transition-transform group-hover:scale-105 shrink-0 ${
              currentTab === 'account'
                ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-300 dark:ring-blue-800'
                : 'bg-[#0F284E] dark:bg-blue-600 group-hover:bg-blue-600 border-white dark:border-slate-700'
            }`}>
              {user?.displayName 
                ? user.displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                : 'AW'}
            </div>
          </button>
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
