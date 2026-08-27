import React, { useState, useEffect } from 'react';
import { X, Wallet, DollarSign, Building, Calendar, Tag, Check, AlertCircle, CreditCard } from 'lucide-react';
import { Spending, SpendingCategory, LanguageCode, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { CURRENCIES } from '../constants/currencies';

interface SpendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spendingData: Omit<Spending, 'id' | 'createdAt'>, existingId?: string) => void;
  editingSpending?: Spending | null;
  lang: LanguageCode;
  currency: CurrencyCode;
}

const SPENDING_CATEGORIES: SpendingCategory[] = [
  'Software & Subscriptions',
  'Hosting & Cloud',
  'Hardware & Equipment',
  'Office & Workspace',
  'Marketing & Advertising',
  'Contractors & Payroll',
  'Legal & Licenses',
  'Travel & Logistics',
  'Utilities & Internet',
  'Other'
];

export const SpendingModal: React.FC<SpendingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSpending,
  lang,
  currency
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const [item, setItem] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState<number | ''>(250);
  const [resellerName, setResellerName] = useState('');
  const [category, setCategory] = useState<SpendingCategory>(SPENDING_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<Spending['paymentMethod']>('Credit Card');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSpending) {
      setItem(editingSpending.item || '');
      setPurpose(editingSpending.purpose || '');
      setAmount(editingSpending.amount);
      setResellerName(editingSpending.resellerName || '');
      setCategory(editingSpending.category || SPENDING_CATEGORIES[0]);
      setDate(editingSpending.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(editingSpending.paymentMethod || 'Credit Card');
      setReceiptNumber(editingSpending.receiptNumber || '');
    } else {
      setItem('');
      setPurpose('');
      setAmount(150);
      setResellerName('');
      setCategory(SPENDING_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Credit Card');
      setReceiptNumber('');
    }
    setError(null);
  }, [editingSpending, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!item.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم البند أو الخدمة.' : 'Please enter item or service name.');
      return;
    }
    if (!resellerName.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المورد أو الشركة.' : 'Please enter reseller/vendor name.');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setError(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح.' : 'Please enter a valid spending amount.');
      return;
    }

    onSave(
      {
        item: item.trim(),
        purpose: purpose.trim(),
        amount: Number(amount),
        resellerName: resellerName.trim(),
        category,
        date,
        paymentMethod,
        receiptNumber: receiptNumber.trim() || undefined
      },
      editingSpending ? editingSpending.id : undefined
    );
    onClose();
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  return (
    <div 
      id="spending-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="spending-modal-card"
        className="spotlight-card w-full max-w-xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSpending ? t.editSpending : t.addSpending}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.spendingsSubtitle}
              </p>
            </div>
          </div>
          <button
            id="btn-close-spending-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.itemOrService} *
            </label>
            <input
              id="input-spending-item"
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. AWS Cloud Cluster / Figma Enterprise"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.resellerName} *
              </label>
              <input
                id="input-spending-reseller"
                type="text"
                value={resellerName}
                onChange={(e) => setResellerName(e.target.value)}
                placeholder="e.g. Amazon Web Services Inc."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                {t.spendingAmount} ({currencySymbol}) *
              </label>
              <input
                id="input-spending-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.spendingCategory}
              </label>
              <select
                id="select-spending-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SpendingCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                {SPENDING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.paymentMethod}
              </label>
              <select
                id="select-spending-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Spending['paymentMethod'])}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.issueDate}
              </label>
              <input
                id="input-spending-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.receiptNumber}
              </label>
              <input
                id="input-spending-receipt"
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. REC-2026-904"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.purpose}
            </label>
            <textarea
              id="input-spending-purpose"
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Business justification and project allocation details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3">
            <button
              id="btn-cancel-spending-modal"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="btn-submit-spending-modal"
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveSpending}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
