/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TabType, 
  ClientProject, 
  Invoice, 
  Spending, 
  AppSettings, 
  UserProfile, 
  InvoiceStatus 
} from './types';
import { StorageService } from './services/storage';
import { TRANSLATIONS } from './constants/translations';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ClientModal } from './components/ClientModal';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { SpendingsView } from './components/SpendingsView';
import { SpendingModal } from './components/SpendingModal';
import { ReportsView } from './components/ReportsView';
import { AccountView } from './components/AccountView';
import { AuthModal } from './components/AuthModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export default function App() {
  // 1. Initial State
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getUser());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  const [clients, setClients] = useState<ClientProject[]>(() => StorageService.getClients());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getInvoices());
  const [spendings, setSpendings] = useState<Spending[]>(() => StorageService.getSpendings());

  // 2. Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState<boolean>(false);
  
  const [clientModalOpen, setClientModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientProject | null>(null);

  const [spendingModalOpen, setSpendingModalOpen] = useState<boolean>(false);
  const [editingSpending, setEditingSpending] = useState<Spending | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 3. Synchronize Dark Mode and RTL / LTR document attributes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    root.lang = settings.language;
  }, [settings.darkMode, settings.language]);

  // Sync state helper
  const reloadData = () => {
    setClients(StorageService.getClients());
    setInvoices(StorageService.getInvoices());
    setSpendings(StorageService.getSpendings());
    setSettings(StorageService.getSettings());
  };

  // 4. Client Handlers
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setClientModalOpen(true);
  };

  const handleOpenEditClient = (client: ClientProject) => {
    setEditingClient(client);
    setClientModalOpen(true);
  };

  const handleSaveClient = (clientData: Omit<ClientProject, 'id' | 'createdAt'>, existingId?: string) => {
    StorageService.saveClient(clientData, existingId);
    reloadData();
  };

  const handleDeleteClient = (client: ClientProject) => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف مشروع العميل' : 'Delete Client Project',
      message: isAr
        ? `هل أنت متأكد من حذف "${client.name} - ${client.project}"؟ سيتم حذف الفواتير المرتبطة أيضًا.`
        : `Are you sure you want to remove "${client.name} - ${client.project}"? This will also remove the associated invoice.`,
      onConfirm: () => {
        StorageService.deleteClient(client.id);
        reloadData();
      }
    });
  };

  const handleViewInvoiceForClient = (clientId: string) => {
    const inv = invoices.find((i) => i.clientId === clientId);
    if (inv) {
      setSelectedInvoice(inv);
      setInvoiceModalOpen(true);
    } else {
      setCurrentTab('invoices');
    }
  };

  // 5. Invoice Handlers
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalOpen(true);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    StorageService.updateInvoiceStatus(invoiceId, status);
    reloadData();
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(prev => prev ? { ...prev, status } : null);
    }
  };

  // 6. Spending Handlers
  const handleOpenAddSpending = () => {
    setEditingSpending(null);
    setSpendingModalOpen(true);
  };

  const handleOpenEditSpending = (spending: Spending) => {
    setEditingSpending(spending);
    setSpendingModalOpen(true);
  };

  const handleSaveSpending = (spendingData: Omit<Spending, 'id' | 'createdAt'>, existingId?: string) => {
    StorageService.saveSpending(spendingData, existingId);
    reloadData();
  };

  const handleDeleteSpending = (spending: Spending) => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف المصروف' : 'Delete Spending',
      message: isAr
        ? `هل أنت متأكد من حذف مصروف "${spending.item}" بقيمة ${spending.amount}؟`
        : `Are you sure you want to delete "${spending.item}" ($${spending.amount})?`,
      onConfirm: () => {
        StorageService.deleteSpending(spending.id);
        reloadData();
      }
    });
  };

  // 7. Account & Settings Handlers
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = StorageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
  };

  const handleSignOut = () => {
    StorageService.saveUser(null);
    setUser(null);
    setAuthModalOpen(true);
  };

  const handleDeleteAccount = () => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف الحساب والبيانات نهائياً' : 'Permanently Delete Account & Data',
      message: isAr
        ? 'بموجب البند 6 من سياسة الخصوصية، سيتم مسح جميع بياناتك وسجلاتك المالية ومشاريعك نهائياً من الذاكرة المحلية.'
        : 'In accordance with Section 6 of the Privacy Policy (Data Retention & Deletion), all your clients, invoices, spendings, and profile credentials will be permanently erased.',
      onConfirm: () => {
        StorageService.clearAllData();
        setUser(null);
        reloadData();
        setAuthModalOpen(true);
      }
    });
  };

  const handleResetSampleData = () => {
    StorageService.resetToSampleData();
    reloadData();
  };

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.cost || 0), 0);

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#071326] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        lang={settings.language}
        onToggleLanguage={() => handleUpdateSettings({ language: settings.language === 'en' ? 'ar' : 'en' })}
        currency={settings.currency}
        onChangeCurrency={(newCurrency) => handleUpdateSettings({ currency: newCurrency })}
        darkMode={settings.darkMode}
        onToggleDarkMode={() => handleUpdateSettings({ darkMode: !settings.darkMode })}
        onSignOut={handleSignOut}
        onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          lang={settings.language}
          user={user}
          onSignOut={handleSignOut}
          onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
          totalRevenue={totalRevenue}
          currency={settings.currency}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              invoices={invoices}
              spendings={spendings}
              currency={settings.currency}
              lang={settings.language}
              onNavigate={setCurrentTab}
              onAddClient={handleOpenAddClient}
              onAddSpending={handleOpenAddSpending}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clients={clients}
              currency={settings.currency}
              lang={settings.language}
              onAddClient={handleOpenAddClient}
              onEditClient={handleOpenEditClient}
              onDeleteClient={handleDeleteClient}
              onViewInvoice={handleViewInvoiceForClient}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              currency={settings.currency}
              lang={settings.language}
              onViewInvoice={handleViewInvoice}
              onUpdateStatus={handleUpdateInvoiceStatus}
            />
          )}

          {currentTab === 'spendings' && (
            <SpendingsView
              spendings={spendings}
              currency={settings.currency}
              lang={settings.language}
              onAddSpending={handleOpenAddSpending}
              onEditSpending={handleOpenEditSpending}
              onDeleteSpending={handleDeleteSpending}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              clients={clients}
              invoices={invoices}
              spendings={spendings}
              currency={settings.currency}
              lang={settings.language}
              settings={settings}
            />
          )}

          {currentTab === 'account' && (
            <AccountView
              user={user}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onSignOut={handleSignOut}
              onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
              onDeleteAccount={handleDeleteAccount}
              onResetSampleData={handleResetSampleData}
              onReloadAllData={reloadData}
              lang={settings.language}
            />
          )}
        </main>
      </div>

      {/* Floating Privacy Notice Footer for compliance */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-3 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#0F284E] dark:text-sky-400">WISCO</span>
          <span>•</span>
          <span>Whislly Financial Engine (Amman, Jordan)</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button
            id="footer-btn-privacy-policy"
            onClick={() => setPrivacyPolicyOpen(true)}
            className="text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            {t.privacyPolicy} (Effective Aug 27, 2026)
          </button>
          <span>•</span>
          <span>© 2026 Whislly. All rights reserved.</span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
        lang={settings.language}
      />

      <PrivacyPolicyModal
        isOpen={privacyPolicyOpen}
        onClose={() => setPrivacyPolicyOpen(false)}
        onAccept={() => setPrivacyPolicyOpen(false)}
        lang={settings.language}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
        lang={settings.language}
        currency={settings.currency}
      />

      <SpendingModal
        isOpen={spendingModalOpen}
        onClose={() => setSpendingModalOpen(false)}
        onSave={handleSaveSpending}
        editingSpending={editingSpending}
        lang={settings.language}
        currency={settings.currency}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        settings={settings}
        lang={settings.language}
        currency={settings.currency}
        onUpdateStatus={handleUpdateInvoiceStatus}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        lang={settings.language}
      />
    </div>
  );
}
