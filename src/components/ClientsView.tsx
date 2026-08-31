import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Receipt, 
  DollarSign, 
  Briefcase, 
  Calendar,
  Building2,
  FolderOpen
} from 'lucide-react';
import { ClientProject, CurrencyCode, LanguageCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';
import { TableListSkeleton } from './SkeletonLoaders';

interface ClientsViewProps {
  clients: ClientProject[];
  currency: CurrencyCode;
  lang: LanguageCode;
  onAddClient: () => void;
  onEditClient: (client: ClientProject) => void;
  onDeleteClient: (client: ClientProject) => void;
  onViewInvoice: (clientId: string) => void;
  isLoading?: boolean;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  currency,
  lang,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onViewInvoice,
  isLoading = false
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  if (isLoading) {
    return <TableListSkeleton headersCount={5} rowsCount={5} />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = Array.from(new Set(clients.map((c) => c.category))).filter(Boolean);

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPortfolioCost = clients.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
  const totalPortfolioExpenses = clients.reduce((sum, c) => sum + (Number(c.operatingExpenses) || 0), 0);

  return (
    <div id="clients-view-root" className="space-y-6 pb-12">
      {/* Header with Search & Add Button */}
      <div className="spotlight-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.clientRoster}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {clients.length} {t.clients} • {formatCurrency(totalPortfolioCost, currency, isArabic)} {t.totalRevenue}
          </p>
        </div>

        <button
          id="btn-add-client-project-top"
          onClick={onAddClient}
          className="px-5 py-2.5 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addClientProject}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
          <input
            id="input-search-clients"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchClients}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <select
            id="select-filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">{t.filterByCategory}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Roster Table (Desktop) / Card Grid (Mobile) */}
      {filteredClients.length === 0 ? (
        <div className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-sm font-medium">{t.noClientsFound}</p>
        </div>
      ) : (
        <div className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">{t.clientName}</th>
                  <th className="py-4 px-6">{t.companyName}</th>
                  <th className="py-4 px-6">{t.projectTitle}</th>
                  <th className="py-4 px-6">{t.projectCategory}</th>
                  <th className="py-4 px-6 text-right rtl:text-left">{t.costOfProject}</th>
                  <th className="py-4 px-6 text-right rtl:text-left">{t.operatingExpensesShort}</th>
                  <th className="py-4 px-6 text-center">{t.status}</th>
                  <th className="py-4 px-6 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Client Name */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <span>{client.name}</span>
                          {client.email && (
                            <div className="text-[10px] text-slate-400 font-normal">{client.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {client.companyName}
                    </td>

                    {/* Project */}
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      {client.project}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {client.category}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="py-4 px-6 font-extrabold text-[#0F284E] dark:text-sky-400 text-right rtl:text-left">
                      {formatCurrency(client.cost, currency, isArabic)}
                    </td>

                    {/* Operating Expenses */}
                    <td className="py-4 px-6 font-bold text-amber-600 dark:text-amber-400 text-right rtl:text-left">
                      {formatCurrency(client.operatingExpenses, currency, isArabic)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        client.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : client.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {client.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-view-invoice-for-${client.id}`}
                          onClick={() => onViewInvoice(client.id)}
                          title={t.viewInvoice}
                          className="p-1.5 text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-client-${client.id}`}
                          onClick={() => onEditClient(client)}
                          title={t.editClient}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-client-${client.id}`}
                          onClick={() => onDeleteClient(client)}
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

          {/* Mobile & Tablet Card Grid */}
          <div className="lg:hidden p-4 space-y-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {client.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {client.companyName}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    client.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.projectTitle}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{client.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.projectCategory}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{client.category}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">{t.costOfProject}:</span>
                    <span className="font-extrabold text-[#0F284E] dark:text-sky-400 text-sm">
                      {formatCurrency(client.cost, currency, isArabic)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t.operatingExpensesShort}:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(client.operatingExpenses, currency, isArabic)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    id={`mobile-btn-invoice-${client.id}`}
                    onClick={() => onViewInvoice(client.id)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t.invoices}</span>
                  </button>
                  <button
                    id={`mobile-btn-edit-${client.id}`}
                    onClick={() => onEditClient(client)}
                    className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    id={`mobile-btn-delete-${client.id}`}
                    onClick={() => onDeleteClient(client)}
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
