import React from 'react';
import { 
  Wallet, 
  FileSpreadsheet, 
  Calendar, 
  Folder, 
  ArrowRight, 
  ArrowLeft,
  LayoutGrid,
  TrendingDown,
  LineChart,
  Clock,
  HardDrive,
  Plus
} from 'lucide-react';
import { Spending, CalendarEvent, NavTab, LanguageCode, CurrencyCode, ClientProject, Invoice } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';

interface WorkspaceHubViewProps {
  spendings: Spending[];
  events: CalendarEvent[];
  clients: ClientProject[];
  invoices: Invoice[];
  currency: CurrencyCode;
  lang: LanguageCode;
  onNavigate: (tab: NavTab) => void;
  onAddSpending?: () => void;
  onAddEvent?: () => void;
}

export const WorkspaceHubView: React.FC<WorkspaceHubViewProps> = ({
  spendings,
  events,
  clients,
  invoices,
  currency,
  lang,
  onNavigate,
  onAddSpending,
  onAddEvent
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const totalSpent = spendings.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalInvoiced = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const netMargin = totalInvoiced - totalSpent;

  return (
    <div id="workspace-hub-view" className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div 
        id="workspace-hub-header"
        className="bg-gradient-to-r from-[#0F284E] via-[#1E293B] to-[#334155] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-200">
              <LayoutGrid className="w-3.5 h-3.5 text-sky-300" />
              <span>{isArabic ? 'أدوات مساحة العمل والإنتاجية' : 'Workspace & Productivity'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isArabic ? 'مركز مساحة العمل (Workspace)' : 'Workspace Hub'}
            </h2>
            <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
              {isArabic 
                ? 'بيئة العمل الشاملة لإدارة النفقات التشغيلية، توليد التقارير والتحليلات المالية، جدولة الفعاليات والمهام، وحفظ الملفات السحابية.' 
                : 'Your integrated workspace to log business expenses, audit P&L reports, coordinate calendar deadlines, and manage your cloud drive.'}
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                {isArabic ? 'إجمالي المصروفات' : 'Total Spendings'}
              </p>
              <p className="text-lg font-black text-rose-300">
                {formatCurrency(totalSpent, currency, isArabic)}
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                {isArabic ? 'صافي التدفق المالي' : 'Net Flow (Paid - Spent)'}
              </p>
              <p className={`text-lg font-black ${netMargin >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatCurrency(netMargin, currency, isArabic)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Four Clean Action Cards: Spendings, Reports, Events, Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Spendings */}
        <div 
          id="workspace-card-spendings"
          onClick={() => onNavigate('spendings')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{spendings.length} {isArabic ? 'مصروف مسجل' : 'Items'}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {isArabic ? t.spendings : `${t.spendings} (Expenses)`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'تسجيل ومتابعة التكاليف التشغيلية، فواتير الموردين، ورواتب واشتراكات الفريق مع تصنيف النفقات.'
                  : 'Record and track operational overheads, software subscriptions, vendor bills, and category budgets.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isArabic ? 'إجمالي المبالغ المنفقة' : 'Total Expense Outflows'}
              </span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalSpent, currency, isArabic)}
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60">
            {onAddSpending && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSpending();
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'مصروف جديد' : 'New Expense'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('spendings');
              }}
              className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'فتح المصروفات' : 'Open Spendings'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Reports */}
        <div 
          id="workspace-card-reports"
          onClick={() => onNavigate('reports')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 border border-blue-200/60 dark:border-blue-900/40">
                <LineChart className="w-3.5 h-3.5" />
                <span>{isArabic ? 'ميزانية الأرباح' : 'P&L Statement'}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                {t.reports}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'تحليل التدفق النقدي، مقارنة الإيرادات بالمصروفات، ومراقبة هوامش الربح مع إمكانية التصدير والطباعة.'
                  : 'Analyze cash flow trends, compare income vs expenses, and review quarterly profit & loss statements.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isArabic ? 'صافي هامش الربح' : 'Net Operating Profit'}
              </span>
              <span className={`text-sm font-bold ${netMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(netMargin, currency, isArabic)}
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('reports');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'عرض التقارير' : 'Open Reports'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Events */}
        <div 
          id="workspace-card-events"
          onClick={() => onNavigate('events')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
                <Clock className="w-3.5 h-3.5" />
                <span>{events.length} {isArabic ? 'فعالية مجدولة' : 'Events'}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {t.events}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'التقويم التفاعلي لمواعيد تسليم المشاريع، اجتماعات العملاء، ومتابعة المهام المثبتة عالية الأولوية.'
                  : 'Interactive calendar to plan delivery milestones, coordinate client calls, and track prioritized tasks.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isArabic ? 'المهام والمواعيد' : 'Scheduled Tasks'}
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {events.length} {isArabic ? 'عناصر' : 'Deadlines'}
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60">
            {onAddEvent && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddEvent();
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'موعد جديد' : 'New Event'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('events');
              }}
              className="ml-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'فتح التقويم' : 'Open Events'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 4: Drive */}
        <div 
          id="workspace-card-drive"
          onClick={() => onNavigate('drive')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/40">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Supabase Storage</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {t.drive || 'Drive'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'رفع وتخزين وتنزيل المستندات، ملفات العقود، الصور، الفواتير، والأرشيف الشخصي بأمان في التخزين السحابي.'
                  : 'Securely upload, organize, preview, and download project files, agreements, and assets in your personal cloud.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isArabic ? 'المستودع السحابي' : 'Storage Bucket'}
              </span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">
                user-drive
              </span>
            </div>
          </div>

          <div className="pt-5 mt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('drive');
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'فتح الملفات السحابية' : 'Open Drive'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHubView;
