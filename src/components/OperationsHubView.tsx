import React from 'react';
import { 
  Users, 
  ReceiptText, 
  ArrowRight, 
  ArrowLeft,
  Plus, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ClientProject, Invoice, NavTab, LanguageCode, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';

interface OperationsHubViewProps {
  clients: ClientProject[];
  invoices: Invoice[];
  currency: CurrencyCode;
  lang: LanguageCode;
  onNavigate: (tab: NavTab) => void;
  onAddClient?: () => void;
}

export const OperationsHubView: React.FC<OperationsHubViewProps> = ({
  clients,
  invoices,
  currency,
  lang,
  onNavigate,
  onAddClient
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const totalContractValue = clients.reduce((sum, c) => sum + (c.cost || 0), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const totalBilled = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div id="operations-hub-view" className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div 
        id="operations-hub-header"
        className="bg-gradient-to-r from-[#0F284E] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-200">
              <Briefcase className="w-3.5 h-3.5 text-sky-300" />
              <span>{isArabic ? 'بوابة إدارة الأعمال' : 'Business Operations'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isArabic ? 'مركز العمليات التشغيلية' : 'Operations Hub'}
            </h2>
            <p className="text-sm text-sky-100 max-w-2xl leading-relaxed">
              {isArabic 
                ? 'لوحة الإشراف المتكاملة لإدارة حسابات العملاء، خطوط العقود التجارية، وتوليد الفواتير ومتابعة التحصيلات.' 
                : 'Your command center for client relationship pipelines, commercial contracts, and official accounts receivable billing.'}
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">
                {isArabic ? 'قيمة العقود النشطة' : 'Active Contracts'}
              </p>
              <p className="text-lg font-black text-white">
                {formatCurrency(totalContractValue, currency, isArabic)}
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">
                {isArabic ? 'المستحقات المعلقة' : 'Outstanding Bills'}
              </p>
              <p className="text-lg font-black text-amber-300">
                {formatCurrency(totalOutstanding, currency, isArabic)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Large Action Cards: Clients & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Clients */}
        <div 
          id="operations-card-clients"
          onClick={() => onNavigate('clients')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 border border-blue-200/60 dark:border-blue-900/40">
                <Building2 className="w-3.5 h-3.5" />
                <span>{clients.length} {isArabic ? 'عملاء مسجلين' : 'Clients'}</span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                {t.clients}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'إدارة حسابات الشركات والعملاء، متابعة نقاط الاتصال، العقود التجارية، ونسب الإنجاز وتسليم المشاريع.'
                  : 'Manage client portfolios, organizational points of contact, ongoing contract deliverables, and pipeline revenues.'}
              </p>
            </div>

            {/* Micro stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isArabic ? 'إجمالي المشاريع' : 'Active Portfolios'}
                </p>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                  {clients.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isArabic ? 'متوسط قيمة العقد' : 'Avg Contract'}
                </p>
                <p className="text-base font-extrabold text-blue-600 dark:text-sky-400 mt-0.5">
                  {formatCurrency(clients.length ? totalContractValue / clients.length : 0, currency, isArabic)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 mt-4 flex items-center justify-between gap-3">
            {onAddClient && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClient();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'عميل جديد' : 'New Client'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('clients');
              }}
              className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'فتح صفحة العملاء' : 'Open Clients'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Invoices */}
        <div 
          id="operations-card-invoices"
          onClick={() => onNavigate('invoices')}
          className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-sm group-hover:scale-105 transition-transform">
                <ReceiptText className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
                <FileText className="w-3.5 h-3.5" />
                <span>{invoices.length} {isArabic ? 'فواتير مصدرة' : 'Invoices'}</span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t.invoices}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isArabic
                  ? 'إصدار الفواتير الضريبية والرسمية، تسجيل الدفعات المسددة، وتتبع المبالغ المستحقة وطباعة تقارير PDF.'
                  : 'Issue official tax invoices, record payment receipts, track overdue accounts, and print professional billing PDFs.'}
              </p>
            </div>

            {/* Micro stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>{isArabic ? 'المسددة' : 'Paid Invoices'}</span>
                </p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {paidInvoices.length} ({formatCurrency(totalPaid, currency, isArabic)})
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{isArabic ? 'المعلقة' : 'Unpaid'}</span>
                </p>
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {unpaidInvoices.length} ({formatCurrency(totalOutstanding, currency, isArabic)})
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('invoices');
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            >
              <span>{isArabic ? 'فتح نظام الفواتير' : 'Open Invoices'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsHubView;
