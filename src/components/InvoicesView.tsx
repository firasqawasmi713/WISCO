import React, { useState } from 'react';
import { 
  ReceiptText, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  FolderOpen,
  DollarSign
} from 'lucide-react';
import { Invoice, CurrencyCode, LanguageCode, InvoiceStatus } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';
import { exportInvoiceToPdf } from '../services/pdf';

interface InvoicesViewProps {
  invoices: Invoice[];
  currency: CurrencyCode;
  lang: LanguageCode;
  onViewInvoice: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: InvoiceStatus) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  currency,
  lang,
  onViewInvoice,
  onUpdateStatus
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const paidInvoiced = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const pendingInvoiced = totalInvoiced - paidInvoiced;

  const handleDirectDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    onViewInvoice(invoice);
    setTimeout(async () => {
      await exportInvoiceToPdf('invoice-printable-container', invoice.invoiceNumber);
      setDownloadingId(null);
    }, 400);
  };

  return (
    <div id="invoices-view-root" className="space-y-6 pb-12">
      {/* Top Banner with Stats */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.invoicesTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {invoices.length} Total Invoices • {formatCurrency(totalInvoiced, currency, isArabic)} Total Billed
          </p>
        </div>

        {/* Quick totals chips */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
              {t.statusPaid}: {formatCurrency(paidInvoiced, currency, isArabic)}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs">
            <span className="text-amber-700 dark:text-amber-300 font-bold">
              {t.statusPending}: {formatCurrency(pendingInvoiced, currency, isArabic)}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
          <input
            id="input-search-invoices"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchInvoices}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <select
            id="select-filter-invoice-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | InvoiceStatus)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Invoices ({invoices.length})</option>
            <option value="Paid">{t.statusPaid}</option>
            <option value="Pending">{t.statusPending}</option>
            <option value="Overdue">{t.statusOverdue}</option>
            <option value="Draft">{t.statusDraft}</option>
          </select>
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-sm font-medium">{t.noInvoicesFound}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">{t.invoiceId}</th>
                  <th className="py-4 px-6">{t.clientName}</th>
                  <th className="py-4 px-6">{t.projectTitle}</th>
                  <th className="py-4 px-6">{t.issueDate}</th>
                  <th className="py-4 px-6">{t.dueDate}</th>
                  <th className="py-4 px-6 text-right rtl:text-left">{t.amount}</th>
                  <th className="py-4 px-6 text-center">{t.status}</th>
                  <th className="py-4 px-6 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Invoice ID */}
                    <td className="py-4 px-6 font-extrabold text-blue-600 dark:text-sky-400">
                      {inv.invoiceNumber}
                    </td>

                    {/* Client & Company */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.clientName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.companyName}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      {inv.projectName}
                    </td>

                    {/* Issue Date */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {inv.issueDate}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {inv.dueDate}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-extrabold text-[#0F284E] dark:text-sky-400 text-right rtl:text-left">
                      {formatCurrency(inv.totalAmount, currency, isArabic)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <button
                        id={`btn-status-toggle-${inv.id}`}
                        onClick={() => onUpdateStatus(inv.id, inv.status === 'Paid' ? 'Pending' : 'Paid')}
                        title="Click to toggle status"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform active:scale-95 ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : inv.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {inv.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-view-invoice-modal-${inv.id}`}
                          onClick={() => onViewInvoice(inv)}
                          title={t.viewInvoice}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.viewInvoice}</span>
                        </button>
                        <button
                          id={`btn-export-pdf-invoice-${inv.id}`}
                          onClick={() => handleDirectDownload(inv)}
                          disabled={downloadingId === inv.id}
                          title={t.downloadPdf}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
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
            {filteredInvoices.map((inv) => (
              <div 
                key={inv.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-blue-600 dark:text-sky-400">
                      {inv.invoiceNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {inv.clientName}
                    </h3>
                    <div className="text-xs text-slate-500">{inv.companyName}</div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.projectTitle}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.issueDate}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{inv.issueDate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">{t.amount}:</span>
                    <span className="font-black text-base text-[#0F284E] dark:text-sky-400">
                      {formatCurrency(inv.totalAmount, currency, isArabic)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    id={`mobile-btn-status-toggle-${inv.id}`}
                    onClick={() => onUpdateStatus(inv.id, inv.status === 'Paid' ? 'Pending' : 'Paid')}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 underline"
                  >
                    {inv.status === 'Paid' ? t.markAsPending : t.markAsPaid}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      id={`mobile-btn-view-invoice-${inv.id}`}
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1.5 bg-[#0F284E] dark:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.viewInvoice}</span>
                    </button>
                    <button
                      id={`mobile-btn-pdf-${inv.id}`}
                      onClick={() => handleDirectDownload(inv)}
                      className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
