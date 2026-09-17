import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Wallet, 
  Calendar,
  FileSpreadsheet, 
  ShieldCheck,
  Folder,
  ChevronDown
} from 'lucide-react';
import { NavTab, LanguageCode, UserProfile, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: LanguageCode;
  user?: UserProfile | null;
  onOpenPrivacyPolicy: () => void;
  totalRevenue: number;
  currency: CurrencyCode;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onOpenPrivacyPolicy,
  totalRevenue,
  currency
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  // Collapsible group state (expanded by default)
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  // 1. Top-Level Dashboard Item
  const dashboardItem: NavItem = {
    id: 'dashboard',
    label: t.dashboard,
    icon: <LayoutDashboard className="w-5 h-5" />
  };

  // 2. Operations Group (Clients, Invoices)
  const operationsItems: NavItem[] = [
    { id: 'clients', label: t.clients, icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: t.invoices, icon: <ReceiptText className="w-5 h-5" /> }
  ];

  // 3. Workspace Group (Spendings, Reports, Events, Drive)
  const workspaceItems: NavItem[] = [
    { 
      id: 'spendings', 
      label: isArabic ? t.spendings : `${t.spendings} (Expenses)`, 
      icon: <Wallet className="w-5 h-5" /> 
    },
    { id: 'reports', label: t.reports, icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'events', label: t.events, icon: <Calendar className="w-5 h-5" /> },
    { id: 'drive', label: t.drive || 'Drive', icon: <Folder className="w-5 h-5" /> }
  ];

  const renderNavButton = (item: NavItem) => {
    const active = currentTab === item.id;
    return (
      <button
        key={item.id}
        id={`sidebar-nav-${item.id}`}
        onClick={() => onSelectTab(item.id)}
        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
          active
            ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-white shrink-0'}>
          {item.icon}
        </span>
        <span className="flex-1 text-left rtl:text-right font-semibold truncate">{item.label}</span>
      </button>
    );
  };

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

      {/* Grouped Navigation */}
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto py-2 custom-scrollbar">
        {/* Top-Level Dashboard */}
        <div className="space-y-1">
          {renderNavButton(dashboardItem)}
        </div>

        {/* Section 1: Operations */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => setOperationsOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400/90 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
              <span>{t.operations || 'Operations'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-md font-mono text-slate-400 group-hover:text-slate-200">
                {operationsItems.length}
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  operationsOpen ? 'transform rotate-0' : 'transform -rotate-90 rtl:rotate-90'
                }`}
              />
            </div>
          </button>

          {operationsOpen && (
            <div className="space-y-1 pl-1 rtl:pl-0 rtl:pr-1 transition-all">
              {operationsItems.map(renderNavButton)}
            </div>
          )}
        </div>

        {/* Section 2: Workspace */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => setWorkspaceOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400/90 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
              <span>{t.workspace || 'Workspace'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-md font-mono text-slate-400 group-hover:text-slate-200">
                {workspaceItems.length}
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  workspaceOpen ? 'transform rotate-0' : 'transform -rotate-90 rtl:rotate-90'
                }`}
              />
            </div>
          </button>

          {workspaceOpen && (
            <div className="space-y-1 pl-1 rtl:pl-0 rtl:pr-1 transition-all">
              {workspaceItems.map(renderNavButton)}
            </div>
          )}
        </div>
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
  );
};
