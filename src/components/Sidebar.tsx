import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  LayoutGrid, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Radar
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
  role?: string;
  permissions?: Record<string, { view: boolean; edit: boolean }>;
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
  const ChevronIcon = isArabic ? ChevronLeft : ChevronRight;

  const isOperationsActive = currentTab === 'operations' || currentTab === 'clients' || currentTab === 'invoices';
  const isWorkspaceActive = currentTab === 'workspace' || currentTab === 'spendings' || currentTab === 'reports' || currentTab === 'events' || currentTab === 'drive';

  const navButtons = [
    { 
      id: 'dashboard' as NavTab, 
      label: t.dashboard, 
      icon: <LayoutDashboard className="w-5 h-5" />,
      active: currentTab === 'dashboard',
      badge: null,
      description: isArabic ? 'لوحة البيانات' : 'Financial overview'
    },
    { 
      id: 'operations' as NavTab, 
      label: t.operations || 'Operations', 
      icon: <Briefcase className="w-5 h-5" />,
      active: isOperationsActive,
      badge: '2',
      description: isArabic ? 'العملاء والفواتير' : 'Clients & Invoices'
    },
    { 
      id: 'workspace' as NavTab, 
      label: t.workspace || 'Workspace', 
      icon: <LayoutGrid className="w-5 h-5" />,
      active: isWorkspaceActive,
      badge: '4',
      description: isArabic ? 'المصروفات، التقارير، السحاب' : 'Expenses, Reports, Drive'
    },
    { 
      id: 'leads' as NavTab, 
      label: isArabic ? 'استكشاف العملاء' : 'Lead Discovery', 
      icon: <Radar className="w-5 h-5" />,
      active: currentTab === 'leads',
      badge: 'New',
      description: isArabic ? 'استخراج أرقام الشركات' : 'Places & Phone Extractor'
    }
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

      {/* Primary Standard Navigation Buttons */}
      <nav className="flex-1 px-4 space-y-2.5 overflow-y-auto py-2">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
          {isArabic ? 'القائمة الرئيسية' : 'Main Menu'}
        </div>

        {navButtons.map((item) => {
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all cursor-pointer group ${
                item.active
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={`p-1.5 rounded-xl transition-colors ${
                item.active 
                  ? 'bg-white/15 text-white' 
                  : 'bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10'
              }`}>
                {item.icon}
              </span>

              <div className="flex-1 text-left rtl:text-right min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.active ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${
                  item.active ? 'text-sky-100' : 'text-slate-400'
                }`}>
                  {item.description}
                </p>
              </div>

              <ChevronIcon className={`w-4 h-4 shrink-0 transition-transform ${
                item.active ? 'text-white translate-x-0.5 rtl:-translate-x-0.5' : 'text-slate-500 opacity-0 group-hover:opacity-100'
              }`} />
            </button>
          );
        })}
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

export default Sidebar;
