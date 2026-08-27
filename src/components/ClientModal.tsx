import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Briefcase, Calendar, FileText, Check, AlertCircle } from 'lucide-react';
import { ClientProject, LanguageCode, CurrencyCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { formatCurrency, CURRENCIES } from '../constants/currencies';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<ClientProject, 'id' | 'createdAt'>, existingId?: string) => void;
  editingClient?: ClientProject | null;
  lang: LanguageCode;
  currency: CurrencyCode;
}

const CATEGORIES = [
  'Mobile App Development',
  'UI/UX & Web Development',
  'UI/UX Design',
  'Cloud Consulting & DevOps',
  'Custom Software Architecture',
  'Brand Strategy & Identity',
  'AI & Data Engineering',
  'Cybersecurity & Auditing',
  'E-Commerce Solutions',
  'Marketing & Growth'
];

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClient,
  lang,
  currency
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [project, setProject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cost, setCost] = useState<number | ''>(5000);
  const [operatingExpenses, setOperatingExpenses] = useState<number | ''>(1000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ClientProject['status']>('In Progress');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      setCompanyName(editingClient.companyName || '');
      setEmail(editingClient.email || '');
      setPhone(editingClient.phone || '');
      setAddress(editingClient.address || '');
      setProject(editingClient.project || '');
      setCategory(editingClient.category || CATEGORIES[0]);
      setCost(editingClient.cost);
      setOperatingExpenses(editingClient.operatingExpenses);
      setStartDate(editingClient.startDate || new Date().toISOString().split('T')[0]);
      setDueDate(editingClient.dueDate || '');
      setStatus(editingClient.status || 'In Progress');
      setNotes(editingClient.notes || '');
    } else {
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setProject('');
      setCategory(CATEGORIES[0]);
      setCost(7500);
      setOperatingExpenses(1200);
      setStartDate(new Date().toISOString().split('T')[0]);
      
      const future = new Date();
      future.setDate(future.getDate() + 45);
      setDueDate(future.toISOString().split('T')[0]);
      
      setStatus('In Progress');
      setNotes('');
    }
    setError(null);
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم العميل.' : 'Please enter client name.');
      return;
    }
    if (!companyName.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم الشركة.' : 'Please enter company name.');
      return;
    }
    if (!project.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال عنوان المشروع.' : 'Please enter project title.');
      return;
    }
    if (cost === '' || Number(cost) < 0) {
      setError(lang === 'ar' ? 'يرجى إدخال قيمة صحيحة لتكلفة المشروع.' : 'Please enter a valid project cost.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        project: project.trim(),
        category,
        cost: Number(cost),
        operatingExpenses: Number(operatingExpenses) || 0,
        startDate,
        dueDate: dueDate || undefined,
        status,
        notes: notes.trim()
      },
      editingClient ? editingClient.id : undefined
    );
    onClose();
  };

  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  return (
    <div 
      id="client-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="client-modal-card"
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingClient ? t.editClient : t.addClientProject}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.autoInvoiceNotice}
              </p>
            </div>
          </div>
          <button
            id="btn-close-client-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.clientName} *
              </label>
              <input
                id="input-client-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tariq Al-Mansoor"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.companyName} *
              </label>
              <input
                id="input-client-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Capital Holding"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.projectTitle} *
              </label>
              <input
                id="input-client-project"
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. Fintech Mobile Application"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.projectCategory}
              </label>
              <select
                id="select-client-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financials: Cost & Operating Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-[#0F284E] dark:text-sky-400 mb-1">
                {t.costOfProject} ({currencySymbol}) *
              </label>
              <div className="relative">
                <input
                  id="input-client-cost"
                  type="number"
                  min="0"
                  step="any"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                {t.operatingExpensesShort} ({currencySymbol})
              </label>
              <div className="relative">
                <input
                  id="input-client-expenses"
                  type="number"
                  min="0"
                  step="any"
                  value={operatingExpenses}
                  onChange={(e) => setOperatingExpenses(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.startDate}
              </label>
              <input
                id="input-client-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.dueDate}
              </label>
              <input
                id="input-client-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.status}
              </label>
              <select
                id="select-client-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientProject['status'])}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.clientEmail}
              </label>
              <input
                id="input-client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.clientPhone}
              </label>
              <input
                id="input-client-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+962 79 000 0000"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.notes}
            </label>
            <textarea
              id="input-client-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Milestones, technical requirements, or payment terms..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3">
            <button
              id="btn-cancel-client-modal"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="btn-submit-client-modal"
              type="submit"
              className="px-6 py-2.5 bg-[#0F284E] hover:bg-[#1E3A8A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveClient}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
