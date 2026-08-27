import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck,
  CreditCard,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';
import { Invoice, AppSettings, LanguageCode, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency } from '../constants/currencies';
import { exportInvoiceToPdf } from '../services/pdf';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  lang: LanguageCode;
  currency: CurrencyCode;
  onUpdateStatus?: (invoiceId: string, status: Invoice['status']) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  settings,
  lang,
  currency,
  onUpdateStatus
}) => {
  const [downloading, setDownloading] = useState(false);
  if (!isOpen || !invoice) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await exportInvoiceToPdf('invoice-printable-container', invoice.invoiceNumber);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="invoice-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="invoice-detail-modal-card"
        className="w-full max-w-3xl max-h-[95vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Modal Controls Header (Non-printable) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {invoice.invoiceNumber}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              invoice.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : invoice.status === 'Pending'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <button
                id="btn-toggle-invoice-paid-modal"
                onClick={() => onUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Pending' : 'Paid')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {invoice.status === 'Paid' ? t.markAsPending : t.markAsPaid}
              </button>
            )}

            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              title={t.printInvoice}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              id="btn-download-pdf-invoice"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-1.5 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? t.generatingPdf : t.downloadPdf}</span>
            </button>

            <button
              id="btn-close-invoice-detail-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans" id="invoice-printable">
          <div id="invoice-printable-container" className="p-4 sm:p-6 bg-white text-slate-900 max-w-2xl mx-auto space-y-8">
            
            {/* Top Brand & Agency Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900/10 pb-6">
              <div>
                {settings.companyLogo && (
                  <div className="mb-3">
                    <img 
                      id="invoice-rendered-company-logo"
                      src={settings.companyLogo} 
                      alt={settings.companyName || 'Company Logo'} 
                      className="max-h-16 max-w-[220px] object-contain rounded-lg shadow-sm border border-slate-200/80 p-1 bg-white"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-2">
                  {!settings.companyLogo && (
                    <div className="w-10 h-10 rounded-xl bg-[#0F284E] text-white flex items-center justify-center font-black text-xl shadow-sm">
                      {settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'W'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-[#0F284E] tracking-tight">
                      {settings.companyName || 'Whislly Solutions Ltd.'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      WISCO Financial & Client Invoicing
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5 mt-3">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{settings.companyAddress || 'King Hussein Business Park, Amman, Jordan'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{settings.companyEmail || 'Info@whislly.com'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>{settings.companyWebsite || 'www.whislly.com'}</span>
                  </p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="sm:text-right rtl:sm:text-left space-y-1">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-black uppercase tracking-wider mb-2">
                  INVOICE / فاتورة
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">{t.issueDate}:</span> {invoice.issueDate}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">{t.dueDate}:</span> {invoice.dueDate}
                </div>
              </div>
            </div>

            {/* Bill To & Project Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                  {t.billTo}
                </span>
                <div className="text-base font-extrabold text-slate-900">
                  {invoice.clientName}
                </div>
                <div className="text-sm font-semibold text-[#0F284E]">
                  {invoice.companyName}
                </div>
                {invoice.clientEmail && (
                  <div className="text-xs text-slate-600 mt-1">{invoice.clientEmail}</div>
                )}
                {invoice.clientPhone && (
                  <div className="text-xs text-slate-600">{invoice.clientPhone}</div>
                )}
                {invoice.clientAddress && (
                  <div className="text-xs text-slate-600 mt-0.5">{invoice.clientAddress}</div>
                )}
              </div>

              <div className="sm:text-right rtl:sm:text-left">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Project Details
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {invoice.projectName}
                </div>
                <div className="text-xs text-blue-600 font-semibold mt-0.5">
                  Category: {invoice.projectCategory}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Status: {invoice.status}</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-700">
                    <th className="py-3 px-4">{t.description}</th>
                    <th className="py-3 px-3 text-center">{t.quantity}</th>
                    <th className="py-3 px-4 text-right rtl:text-left">{t.unitPrice}</th>
                    <th className="py-3 px-4 text-right rtl:text-left">{t.itemTotal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right rtl:text-left text-slate-700 font-medium">
                          {formatCurrency(item.unitPrice, currency, isArabic)}
                        </td>
                        <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-slate-900">
                          {formatCurrency(item.total, currency, isArabic)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {invoice.projectName} Scope & Deliverables
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-700">1</td>
                      <td className="py-3.5 px-4 text-right rtl:text-left text-slate-700 font-medium">
                        {formatCurrency(invoice.subtotal, currency, isArabic)}
                      </td>
                      <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-slate-900">
                        {formatCurrency(invoice.subtotal, currency, isArabic)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations and Subtotals */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
              <div className="sm:max-w-xs space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    {t.paymentTerms}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {invoice.paymentTerms || settings.defaultPaymentTerms}
                  </p>
                </div>
                {invoice.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                      {t.invoiceNotes}
                    </h4>
                    <p className="text-xs text-slate-500 italic">
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Totals box */}
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>{t.subtotal}:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(invoice.subtotal, currency, isArabic)}
                  </span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(invoice.taxAmount, currency, isArabic)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                  <span>{t.totalAmount}:</span>
                  <span className="text-base font-extrabold text-[#0F284E]">
                    {formatCurrency(invoice.totalAmount, currency, isArabic)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Agency Signoff / Footer */}
            <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">
                Thank you for choosing Whislly (Amman, Jordan).
              </p>
              <p>For questions regarding this invoice, contact {settings.companyEmail || 'Info@whislly.com'}</p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end gap-3 print:hidden">
          <button
            id="btn-close-invoice-modal-bottom"
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
