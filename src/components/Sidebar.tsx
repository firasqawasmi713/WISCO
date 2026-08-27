import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  FileSpreadsheet, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Building
} from 'lucide-react';
import { NavTab, LanguageCode, UserProfile, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  user: UserProfile | null;
  onSignOut: () => void;
  onOpenPrivacyPolicy: () => void;
  totalRevenue: number;
  currency: CurrencyCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  user,
  onSignOut,
  onOpenPrivacyPolicy,
  totalRevenue,
  currency
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'clients', label: t.clients, icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: t.invoices, icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'spendings', label: t.spendings, icon: <Wallet className="w-5 h-5" /> },
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'account', label: t.account, icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <aside 
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0F284E] dark:bg-[#071326] text-white h-screen sticky top-0 border-r border-slate-800/80 shrink-0 select-none transition-colors duration-300 z-20"
    >
      {/* Brand Header */}
      <div className="p-7 border-b border-white/10 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tighter flex items-center">
            WISCO<span className="text-[#38BDF8] text-3xl leading-none">.</span>
          </h1>
          <p className="text-[#38BDF8] text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">
            {t.appTagline || 'Finance Engine'}
          </p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2563EB]/40 text-sky-200 border border-sky-400/30 rounded-md">
          v2.6
        </span>
      </div>

      {/* Mini Financial Health Capsule */}
      <div className="mx-4 my-4 p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">{t.totalRevenue}</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live
          </span>
        </div>
        <div className="text-xl font-black text-[#38BDF8] tracking-tight">
          {formatCurrency(totalRevenue, currency, isArabic)}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-2">
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                active
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left rtl:text-right font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info & User */}
      <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
        {/* Privacy policy trigger */}
        <button
          id="sidebar-btn-privacy-policy"
          onClick={onOpenPrivacyPolicy}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-sky-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.readPrivacyPolicy}</span>
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            Whislly
          </span>
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">
                {user?.displayName || 'Whislly Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'Active Session'}
              </div>
            </div>
          </div>
          <button
            id="sidebar-btn-signout"
            onClick={onSignOut}
            title={t.signOut}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
