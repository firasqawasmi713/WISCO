import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  Tag, 
  CreditCard,
  Building,
  Filter,
  FolderOpen,
  ArrowDownRight
} from 'lucide-react';
import { Spending, SpendingCategory, CurrencyCode, LanguageCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';
import { TableListSkeleton } from './SkeletonLoaders';

interface SpendingsViewProps {
  spendings: Spending[];
  currency: CurrencyCode;
  lang: LanguageCode;
  onAddSpending: () => void;
  onEditSpending: (spending: Spending) => void;
  onDeleteSpending: (spending: Spending) => void;
  isLoading?: boolean;
}

export const SpendingsView: React.FC<SpendingsViewProps> = ({
  spendings,
  currency,
  lang,
  onAddSpending,
  onEditSpending,
  onDeleteSpending,
  isLoading = false
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  if (isLoading) {
    return <TableListSkeleton headersCount={5} rowsCount={5} />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [resellerFilter, setResellerFilter] = useState('ALL');

  const categories = Array.from(new Set(spendings.map((s) => s.category))).filter(Boolean);
  const resellers = Array.from(new Set(spendings.map((s) => s.resellerName))).filter(Boolean);

  const filteredSpendings = spendings.filter((s) => {
    const matchesSearch = 
      s.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.resellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.receiptNumber && s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesReseller = resellerFilter === 'ALL' || s.resellerName === resellerFilter;

    return matchesSearch && matchesCategory && matchesReseller;
  });

  const totalSpendingsSum = spendings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div id="spendings-view-root" className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="spotlight-card bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.spendingsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {spendings.length} {t.spendings} • {formatCurrency(totalSpendingsSum, currency, isArabic)} Total Outflow
          </p>
        </div>

        <button
          id="btn-add-spending-top"
          onClick={onAddSpending}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addSpending}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
          <input
            id="input-search-spendings"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchSpendings}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <select
            id="select-filter-spending-cat"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="ALL">{t.filterBySpendingCat}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="select-filter-reseller"
            value={resellerFilter}
            onChange={(e) => setResellerFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="ALL">All Vendors ({resellers.length})</option>
            {resellers.map((res) => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spendings Table (Desktop) / Cards (Mobile) */}
      {filteredSpendings.length === 0 ? (
        <div className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-sm font-medium">{t.noSpendingsFound}</p>
        </div>
      ) : (
        <div className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">{t.itemOrService}</th>
                  <th className="py-4 px-6">{t.resellerName}</th>
                  <th className="py-4 px-6">{t.purpose}</th>
                  <th className="py-4 px-6">{t.spendingCategory}</th>
                  <th className="py-4 px-6">{t.issueDate}</th>
                  <th className="py-4 px-6 text-right rtl:text-left">{t.amount}</th>
                  <th className="py-4 px-6 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredSpendings.map((spending) => (
                  <tr 
                    key={spending.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Item */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{spending.item}</span>
                          {spending.receiptNumber && (
                            <div className="text-[10px] text-slate-400 font-normal">#{spending.receiptNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reseller */}
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {spending.resellerName}
                    </td>

                    {/* Purpose */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 max-w-xs truncate font-medium">
                      {spending.purpose || '-'}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {spending.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {spending.date}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-extrabold text-rose-600 dark:text-rose-400 text-right rtl:text-left">
                      -{formatCurrency(spending.amount, currency, isArabic)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-edit-spending-${spending.id}`}
                          onClick={() => onEditSpending(spending)}
                          title={t.editSpending}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-spending-${spending.id}`}
                          onClick={() => onDeleteSpending(spending)}
                          title="Delete"
                          className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Cards */}
          <div className="lg:hidden p-4 space-y-4">
            {filteredSpendings.map((spending) => (
              <div 
                key={spending.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {spending.item}
                      </h3>
                      <div className="text-xs text-slate-500">{spending.resellerName}</div>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(spending.amount, currency, isArabic)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.purpose}:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{spending.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.spendingCategory}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{spending.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.issueDate}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{spending.date}</span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    id={`mobile-btn-edit-spending-${spending.id}`}
                    onClick={() => onEditSpending(spending)}
                    className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    id={`mobile-btn-delete-spending-${spending.id}`}
                    onClick={() => onDeleteSpending(spending)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
