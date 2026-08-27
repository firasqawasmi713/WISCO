import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Printer, 
  DollarSign, 
  PieChart, 
  Activity,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ClientProject, Invoice, Spending, CurrencyCode, LanguageCode, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';

interface ReportsViewProps {
  clients: ClientProject[];
  invoices: Invoice[];
  spendings: Spending[];
  currency: CurrencyCode;
  lang: LanguageCode;
  settings: AppSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  invoices,
  spendings,
  currency,
  lang,
  settings
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');

  // Total sums
  const totalRevenue = clients.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const totalOpExpenses = clients.reduce((sum, c) => sum + (Number(c.operatingExpenses) || 0), 0);
  const totalDirectSpendings = spendings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalAllCosts = totalOpExpenses + totalDirectSpendings;
  const netProfit = totalRevenue - totalAllCosts;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const expenseRatio = totalRevenue > 0 ? ((totalAllCosts / totalRevenue) * 100).toFixed(1) : '0.0';

  // Monthly buckets (12 months)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const monthlyData = monthNames.map((name, idx) => {
    let rev = 0;
    let opExp = 0;
    let directSp = 0;

    clients.forEach((c) => {
      if (c.startDate) {
        const m = new Date(c.startDate).getMonth();
        if (m === idx) {
          rev += Number(c.cost) || 0;
          opExp += Number(c.operatingExpenses) || 0;
        }
      }
    });

    spendings.forEach((s) => {
      if (s.date) {
        const m = new Date(s.date).getMonth();
        if (m === idx) {
          directSp += Number(s.amount) || 0;
        }
      }
    });

    const net = rev - (opExp + directSp);
    const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : '0.0';

    return {
      period: isArabic ? monthNamesAr[idx] : name,
      revenue: rev,
      operatingExpenses: opExp,
      spendings: directSp,
      totalCosts: opExp + directSp,
      netProfit: net,
      margin
    };
  });

  // Quarterly buckets (Q1, Q2, Q3, Q4)
  const quarterNames = ['Q1 (Jan - Mar)', 'Q2 (Apr - Jun)', 'Q3 (Jul - Sep)', 'Q4 (Oct - Dec)'];
  const quarterNamesAr = ['الربع الأول (يناير - مارس)', 'الربع الثاني (أبريل - يونيو)', 'الربع الثالث (يوليو - سبتمبر)', 'الربع الرابع (أكتوبر - ديسمبر)'];

  const quarterlyData = [0, 1, 2, 3].map((qIdx) => {
    const startM = qIdx * 3;
    const endM = startM + 2;
    let rev = 0;
    let opExp = 0;
    let directSp = 0;

    for (let m = startM; m <= endM; m++) {
      rev += monthlyData[m].revenue;
      opExp += monthlyData[m].operatingExpenses;
      directSp += monthlyData[m].spendings;
    }

    const net = rev - (opExp + directSp);
    const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : '0.0';

    return {
      period: isArabic ? quarterNamesAr[qIdx] : quarterNames[qIdx],
      revenue: rev,
      operatingExpenses: opExp,
      spendings: directSp,
      totalCosts: opExp + directSp,
      netProfit: net,
      margin
    };
  });

  const activePeriods = reportType === 'monthly' ? monthlyData.filter(d => d.revenue > 0 || d.totalCosts > 0) : quarterlyData;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="reports-view-root" className="space-y-6 pb-12">
      {/* Top Banner with Toggle */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.reportsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.reportsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Monthly vs Quarterly Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="btn-report-monthly"
              onClick={() => setReportType('monthly')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportType === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.monthlyView}
            </button>
            <button
              id="btn-report-quarterly"
              onClick={() => setReportType('quarterly')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportType === 'quarterly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.quarterlyView}
            </button>
          </div>

          <button
            id="btn-print-report"
            onClick={handlePrintReport}
            title={t.exportReport}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t.exportReport}</span>
          </button>
        </div>
      </div>

      {/* Analytics Breakdown KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t.grossRevenue}
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-sky-400">
            {formatCurrency(totalRevenue, currency, isArabic)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            100% of Total Inflow
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t.totalOperatingExpenses}
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totalOpExpenses, currency, isArabic)}
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            {totalRevenue > 0 ? ((totalOpExpenses / totalRevenue) * 100).toFixed(1) : 0}% of Gross
          </div>
        </div>

        {/* Direct Spendings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t.directSpendings}
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalDirectSpendings, currency, isArabic)}
          </div>
          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
            {totalRevenue > 0 ? ((totalDirectSpendings / totalRevenue) * 100).toFixed(1) : 0}% of Gross
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {t.netEarnings}
          </span>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
            {formatCurrency(netProfit, currency, isArabic)}
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {profitMargin}% Net Margin
          </div>
        </div>
      </div>

      {/* Breakdown Report Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {reportType === 'monthly' ? t.monthlyView : t.quarterlyView}
              </h3>
              <p className="text-xs text-slate-500">
                Detailed comparison across periods
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {Number(profitMargin) >= 40 ? t.excellentMargin : Number(profitMargin) >= 20 ? t.moderateMargin : t.lowMargin}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6">{t.period}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{t.grossRevenue}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{t.totalOperatingExpenses}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{t.directSpendings}</th>
                <th className="py-4 px-6 text-right rtl:text-left">Total Outflow</th>
                <th className="py-4 px-6 text-right rtl:text-left">{t.netEarnings}</th>
                <th className="py-4 px-6 text-center">{t.roiRate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activePeriods.map((period, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {period.period}
                  </td>
                  <td className="py-4 px-6 text-right rtl:text-left font-bold text-blue-600 dark:text-sky-400">
                    {formatCurrency(period.revenue, currency, isArabic)}
                  </td>
                  <td className="py-4 px-6 text-right rtl:text-left text-amber-600 dark:text-amber-400 font-semibold">
                    {formatCurrency(period.operatingExpenses, currency, isArabic)}
                  </td>
                  <td className="py-4 px-6 text-right rtl:text-left text-rose-600 dark:text-rose-400 font-semibold">
                    {formatCurrency(period.spendings, currency, isArabic)}
                  </td>
                  <td className="py-4 px-6 text-right rtl:text-left text-slate-700 dark:text-slate-300 font-semibold">
                    {formatCurrency(period.totalCosts, currency, isArabic)}
                  </td>
                  <td className={`py-4 px-6 text-right rtl:text-left font-black ${
                    period.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                  }`}>
                    {formatCurrency(period.netProfit, currency, isArabic)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      Number(period.margin) >= 30
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : Number(period.margin) > 0
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {period.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Grand Summary Footer */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-black text-xs">
                <td className="py-4 px-6 text-slate-900 dark:text-white uppercase">
                  {t.allTime} Total
                </td>
                <td className="py-4 px-6 text-right rtl:text-left text-blue-700 dark:text-sky-300">
                  {formatCurrency(totalRevenue, currency, isArabic)}
                </td>
                <td className="py-4 px-6 text-right rtl:text-left text-amber-700 dark:text-amber-300">
                  {formatCurrency(totalOpExpenses, currency, isArabic)}
                </td>
                <td className="py-4 px-6 text-right rtl:text-left text-rose-700 dark:text-rose-300">
                  {formatCurrency(totalDirectSpendings, currency, isArabic)}
                </td>
                <td className="py-4 px-6 text-right rtl:text-left text-slate-800 dark:text-slate-200">
                  {formatCurrency(totalAllCosts, currency, isArabic)}
                </td>
                <td className={`py-4 px-6 text-right rtl:text-left ${
                  netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700'
                }`}>
                  {formatCurrency(netProfit, currency, isArabic)}
                </td>
                <td className="py-4 px-6 text-center text-blue-700 dark:text-sky-300">
                  {profitMargin}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
