import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  Calendar, 
  FileSpreadsheet, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { NavTab, LanguageCode, UserProfile, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';
import TeamModal from './TeamModal';

interface TabPermission {
  view: boolean;
  edit: boolean;
}

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  user?: UserProfile | null;
  onOpenPrivacyPolicy: () => void;
  totalRevenue: number;
  currency: CurrencyCode;
  role?: string | null;
  permissions?: Record<string, TabPermission> | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onOpenPrivacyPolicy,
  totalRevenue,
  currency,
  role,
  permissions
}) => {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'clients', label: t.clients, icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: t.invoices, icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'spendings', label: t.spendings, icon: <Wallet className="w-5 h-5" /> },
    { id: 'events', label: t.events, icon: <Calendar className="w-5 h-5" /> },
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> }
  ];

  // If role is owner or admin, show all tabs.
  // Otherwise, filter items by permissions[tabId].view. If no permissions object exists, default to visible.
  const visibleNavItems = navItems.filter((item) => {
    if (isOwnerOrAdmin) return true;
    if (!permissions) return true;
    return permissions[item.id]?.view ?? true;
  });

  return (
    <>
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
        </div>

        {/* Mini Financial Health Capsule */}
        <div className="mx-4 my-4 p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
          <div className="text-[11px] text-slate-300 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">{t.totalRevenue}</span>
          </div>
          <div className="text-xl font-black text-[#38BDF8] tracking-tight">
            {formatCurrency(totalRevenue, currency, isArabic)}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-2">
          {visibleNavItems.map((item) => {
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

          {/* Team / Workspace Management Action (Visible only to owners and admins) */}
          {isOwnerOrAdmin && (
            <button
              type="button"
              id="sidebar-btn-manage-team"
              onClick={() => setIsTeamModalOpen(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 mt-2"
            >
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <span className="flex-1 text-left rtl:text-right font-semibold">
                {isArabic ? 'إدارة الفريق' : 'Manage Team'}
              </span>
            </button>
          )}
        </nav>

        {/* Footer Info & Privacy */}
        <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
          <button
            id="sidebar-btn-privacy-policy"
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-sky-300 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{t.readPrivacyPolicy}</span>
            </span>
            <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-slate-300 border border-white/5">
              Whislly
            </span>
          </button>
        </div>
      </aside>

      {/* Team Invitation & Management Modal */}
      {isTeamModalOpen && (
        <TeamModal onClose={() => setIsTeamModalOpen(false)} />
      )}
    </>
  );
};
