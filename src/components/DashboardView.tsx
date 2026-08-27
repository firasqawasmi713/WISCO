import React, { useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ReceiptText, 
  Wallet, 
  Briefcase, 
  ArrowUpRight, 
  PlusCircle, 
  Clock, 
  DollarSign, 
  Building2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { ClientProject, Invoice, Spending, CurrencyCode, LanguageCode, NavTab, ActivityLog } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency, CURRENCIES } from '../constants/currencies';

Chart.register(...registerables);

interface DashboardViewProps {
  clients: ClientProject[];
  invoices: Invoice[];
  spendings: Spending[];
  activities?: ActivityLog[];
  currency: CurrencyCode;
  lang: LanguageCode;
  darkMode?: boolean;
  onNavigate: (tab: NavTab) => void;
  onAddClient?: () => void;
  onOpenAddClient?: () => void;
  onAddSpending?: () => void;
  onOpenAddSpending?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  invoices,
  spendings,
  currency,
  lang,
  darkMode = false,
  onNavigate,
  onAddClient,
  onOpenAddClient,
  onAddSpending,
  onOpenAddSpending
}) => {
  const handleAddClientAction = onAddClient || onOpenAddClient || (() => onNavigate('clients'));
  const handleAddSpendingAction = onAddSpending || onOpenAddSpending || (() => onNavigate('spendings'));
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const revExpensesChartRef = useRef<HTMLCanvasElement | null>(null);
  const revExpensesChartInstance = useRef<Chart | null>(null);

  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);

  // Financial Calculations
  const totalRevenue = clients.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const totalOperatingExpenses = clients.reduce((sum, c) => sum + (Number(c.operatingExpenses) || 0), 0);
  const totalSpendings = spendings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalAllExpenses = totalOperatingExpenses + totalSpendings;
  const netProfit = totalRevenue - totalAllExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Group by category for project breakdown chart
  const categoryTotals: Record<string, number> = {};
  clients.forEach((c) => {
    const cat = c.category || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(c.cost) || 0);
  });

  const catLabels = Object.keys(categoryTotals);
  const catData = Object.values(categoryTotals);

  // Monthly breakdown for Bar/Line chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = Array(12).fill(0);
  const monthlyExpenses = Array(12).fill(0);

  clients.forEach((c) => {
    if (c.startDate) {
      const monthIdx = new Date(c.startDate).getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyRevenue[monthIdx] += Number(c.cost) || 0;
        monthlyExpenses[monthIdx] += Number(c.operatingExpenses) || 0;
      }
    }
  });

  spendings.forEach((s) => {
    if (s.date) {
      const monthIdx = new Date(s.date).getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyExpenses[monthIdx] += Number(s.amount) || 0;
      }
    }
  });

  // Render Charts
  useEffect(() => {
    const textColor = darkMode ? '#94a3b8' : '#475569';
    const gridColor = darkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';
    const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;

    // Destroy existing instances
    if (revExpensesChartInstance.current) {
      revExpensesChartInstance.current.destroy();
    }
    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }

    // Monthly Rev vs Exp Chart
    if (revExpensesChartRef.current) {
      const ctx = revExpensesChartRef.current.getContext('2d');
      if (ctx) {
        revExpensesChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [
              {
                label: t.grossRevenue,
                data: monthlyRevenue,
                backgroundColor: 'rgba(37, 99, 235, 0.9)',
                borderColor: '#2563eb',
                borderRadius: 6,
                borderWidth: 1,
                barPercentage: 0.65
              },
              {
                label: t.totalSpendings,
                data: monthlyExpenses,
                backgroundColor: 'rgba(56, 189, 248, 0.85)',
                borderColor: '#38bdf8',
                borderRadius: 6,
                borderWidth: 1,
                barPercentage: 0.65
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans, Cairo', size: 12, weight: 600 },
                  usePointStyle: true,
                  boxWidth: 8
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const val = Number(context.parsed.y) || 0;
                    return ` ${context.dataset.label}: ${formatCurrency(val, currency, isArabic)}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans', size: 11 },
                  callback: (val) => `${currencyConfig.symbol}${val}`
                }
              }
            }
          }
        });
      }
    }

    // Category Doughnut Chart
    if (categoryChartRef.current) {
      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        categoryChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels.length > 0 ? catLabels : ['No Projects'],
            datasets: [
              {
                data: catData.length > 0 ? catData : [1],
                backgroundColor: [
                  '#2563eb',
                  '#38bdf8',
                  '#10b981',
                  '#f59e0b',
                  '#8b5cf6',
                  '#ec4899',
                  '#64748b'
                ],
                borderWidth: darkMode ? 2 : 2,
                borderColor: darkMode ? '#0f172a' : '#ffffff',
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans, Cairo', size: 11, weight: 500 },
                  usePointStyle: true,
                  boxWidth: 6,
                  padding: 12
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const val = Number(context.raw) || 0;
                    return ` ${context.label}: ${formatCurrency(val, currency, isArabic)}`;
                  }
                }
              }
            },
            cutout: '70%'
          }
        });
      }
    }

    return () => {
      if (revExpensesChartInstance.current) revExpensesChartInstance.current.destroy();
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
    };
  }, [clients, spendings, currency, darkMode, lang]);

  return (
    <div id="dashboard-view-root" className="space-y-6 pb-12">
      {/* Welcome Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#0F284E] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-sky-200 mb-3 border border-white/15">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.calculatedRealtime}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            WISCO Financial Suite
          </h2>
          <p className="text-sm text-sky-100/90 mt-1.5 leading-relaxed">
            {t.financialOverview} • Whislly Agency Amman
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            id="dash-btn-add-client"
            onClick={handleAddClientAction}
            className="px-4 py-2.5 bg-white text-[#0F284E] hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>{t.addClientProject}</span>
          </button>
          <button
            id="dash-btn-add-spending"
            onClick={handleAddSpendingAction}
            className="px-4 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-sky-300" />
            <span>{t.addSpending}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Dynamic KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div 
          id="kpi-card-total-revenue"
          className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            {t.totalRevenue}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0F284E] dark:text-white tracking-tight">
            {formatCurrency(totalRevenue, currency, isArabic)}
          </h3>
          <p className="text-emerald-500 dark:text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
            <span>↑</span>
            <span>{clients.length} {t.clients} • Active Contracts</span>
          </p>
        </div>

        {/* Total Direct Spendings */}
        <div 
          id="kpi-card-total-spendings"
          className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            {t.totalSpendings}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0F284E] dark:text-white tracking-tight">
            {formatCurrency(totalSpendings, currency, isArabic)}
          </h3>
          <p className="text-slate-400 dark:text-slate-400 text-xs font-bold mt-2">
            {spendings.length} active ledger items
          </p>
        </div>

        {/* Operating Expenses */}
        <div 
          id="kpi-card-operating-expenses"
          className="spotlight-card bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            {t.totalOperatingExpenses}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0F284E] dark:text-white tracking-tight">
            {formatCurrency(totalOperatingExpenses, currency, isArabic)}
          </h3>
          <p className="text-slate-400 dark:text-slate-400 text-xs font-bold mt-2 truncate">
            Scope & Deliverable Overhead
          </p>
        </div>

        {/* Net Profit - Featured Dark Card */}
        <div 
          id="kpi-card-net-profit"
          className="spotlight-card bg-[#0F284E] dark:bg-[#071326] p-6 rounded-2xl shadow-lg border border-slate-800 dark:border-slate-800 text-white transition-all hover:shadow-xl"
        >
          <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            {t.netProfit}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#38BDF8] tracking-tight">
            {formatCurrency(netProfit, currency, isArabic)}
          </h3>
          <p className="text-blue-300 text-xs font-bold mt-2">
            Margin: {profitMarginPercent}%
          </p>
        </div>
      </div>

      {/* Interactive Charts Section (Chart.js) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs. Expenses (Bar/Line) */}
        <div 
          id="dash-chart-revenue-expenses-card"
          className="spotlight-card lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h4 className="font-bold text-lg text-[#0F284E] dark:text-white">
              {t.revenueVsExpenses}
            </h4>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <span className="w-3 h-3 bg-[#2563EB] rounded-full"></span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.grossRevenue}</span>
              </div>
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse ml-3 rtl:mr-3">
                <span className="w-3 h-3 bg-[#38BDF8] rounded-full"></span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.totalSpendings}</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full relative">
            <canvas ref={revExpensesChartRef} id="canvas-rev-expenses" />
          </div>
        </div>

        {/* Project Breakdown (Doughnut) */}
        <div 
          id="dash-chart-project-breakdown-card"
          className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.projectBreakdown}
              </h3>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full relative my-auto">
            <canvas ref={categoryChartRef} id="canvas-category-breakdown" />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {clients.length} active client project streams
          </div>
        </div>
      </div>

      {/* Recent Activity & Latest Clients Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Clients */}
        <div 
          id="dash-latest-clients-card"
          className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.projectBreakdown}
              </h3>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full relative my-auto">
            <canvas ref={categoryChartRef} id="canvas-category-breakdown" />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {clients.length} active client project streams
          </div>
        </div>
      </div>

      {/* Recent Activity & Latest Clients Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Clients */}
        <div 
          id="dash-latest-clients-card"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-lg text-[#0F284E] dark:text-white">
                {t.recentClients}
              </h4>
              <button
                id="dash-btn-view-all-clients-link"
                onClick={() => onNavigate('clients')}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {clients.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <p>{isArabic ? 'لا توجد مشاريع عملاء مسجلة حتى الآن' : 'No client projects onboarded yet.'}</p>
                  <button
                    onClick={handleAddClientAction}
                    className="mt-2 text-blue-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    {isArabic ? '+ إضافة أول مشروع' : '+ Add your first client project'}
                  </button>
                </div>
              ) : (
                clients.slice(0, 4).map((client, idx) => {
                  const badgeColors = [
                    'bg-orange-100 text-orange-600 dark:bg-orange-950/70 dark:text-orange-300',
                    'bg-purple-100 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300',
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300',
                    'bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300'
                  ];
                  const colorClass = badgeColors[idx % badgeColors.length];
                  const initials = client.name
                    ? client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'CL';

                  return (
                    <div
                      key={client.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {client.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {client.companyName} • {client.project}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-[#0F284E] dark:text-sky-300 shrink-0">
                        {formatCurrency(client.cost, currency, isArabic)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            id="dash-btn-view-all-clients"
            onClick={() => onNavigate('clients')}
            className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/80 text-[#0F284E] dark:text-sky-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 uppercase tracking-widest transition-all cursor-pointer"
          >
            {isArabic ? 'عرض كافة العملاء' : 'View All Clients'}
          </button>
        </div>

        {/* Recent Spendings & Activity */}
        <div 
          id="dash-recent-activity-card"
          className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-lg text-[#0F284E] dark:text-white">
                {t.recentSpendings}
              </h4>
              <button
                id="dash-btn-view-all-spendings-link"
                onClick={() => onNavigate('spendings')}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {spendings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <p>{isArabic ? 'لا توجد مصاريف مسجلة حتى الآن' : 'No direct spendings logged yet.'}</p>
                  <button
                    onClick={handleAddSpendingAction}
                    className="mt-2 text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    {isArabic ? '+ تسجيل أول مصروف' : '+ Log your first expense'}
                  </button>
                </div>
              ) : (
                spendings.slice(0, 4).map((spending) => (
                  <div
                    key={spending.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {spending.item}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {spending.resellerName} • {spending.category}
                        </p>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(spending.amount, currency, isArabic)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {spending.date}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            id="dash-btn-view-all-spendings"
            onClick={() => onNavigate('spendings')}
            className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/80 text-[#0F284E] dark:text-sky-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 uppercase tracking-widest transition-all cursor-pointer"
          >
            {isArabic ? 'عرض سجل المصاريف' : 'View All Spendings'}
          </button>
        </div>
      </div>
    </div>
  );
};
