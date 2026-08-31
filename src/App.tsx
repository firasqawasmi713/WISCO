/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase, SupabaseService } from './services/supabase';
import { TRANSLATIONS } from './constants/translations';
import { CheckCircle2, AlertCircle, RefreshCw, Loader2, CloudCheck } from 'lucide-react';

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
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getCachedSettings());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  const [clients, setClients] = useState<ClientProject[]>(() => StorageService.getCachedClients());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getCachedInvoices());
  const [spendings, setSpendings] = useState<Spending[]>(() => StorageService.getCachedSpendings());

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

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

  // Interactive Spotlight Glow Cursor Tracking
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest?.<HTMLElement>('.spotlight-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  // Central Database Fetch from Supabase using authenticated user's ID
  const fetchSupabaseData = useCallback(async (targetUid: string) => {
    setIsSyncing(true);
    try {
      const [dbClients, dbInvoices, dbSpendings, appSettings] = await Promise.all([
        StorageService.getClients(targetUid),
        StorageService.getInvoices(targetUid),
        StorageService.getSpendings(targetUid),
        StorageService.getSettings(targetUid)
      ]);

      setClients(dbClients);
      setInvoices(dbInvoices);
      setSpendings(dbSpendings);
      setSettings(appSettings);
    } catch (err) {
      console.warn('Supabase fetch error:', err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Supabase Session Lifecycle & Initial Mount Fetch
  useEffect(() => {
    let isMounted = true;

    async function initializeSessionAndData() {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const uid = session.user.id;
          
          let userProfile: UserProfile = {
            uid,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.company_name || session.user.email?.split('@')[0] || 'Partner',
            companyName: session.user.user_metadata?.company_name || 'Whislly Partner',
            companyAddress: session.user.user_metadata?.company_address || 'Amman, Jordan',
            companyWebsite: session.user.user_metadata?.company_website || 'www.company.com',
            companyEmail: session.user.user_metadata?.company_email || session.user.email || '',
            companyLogo: session.user.user_metadata?.company_logo || '',
            defaultPaymentTerms: session.user.user_metadata?.default_payment_terms || 'Payment due within 30 days of invoice date.',
            createdAt: session.user.created_at || new Date().toISOString(),
            agreedToPrivacyPolicy: true
          };

          const profileRes = await SupabaseService.fetchProfileAndSettings(uid);
          if (profileRes.profile) {
            userProfile = { ...userProfile, ...profileRes.profile };
          }

          if (isMounted) {
            setUser(userProfile);
            StorageService.setUser(userProfile);
            setAuthModalOpen(false);
          }

          await fetchSupabaseData(uid);
        } else {
          // No active auth session
          if (isMounted) {
            setUser(null);
            setClients([]);
            setInvoices([]);
            setSpendings([]);
            setIsLoading(false);
            setAuthModalOpen(true);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    initializeSessionAndData();

    // Listen to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        if (isMounted) {
          await fetchSupabaseData(uid);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setClients([]);
          setInvoices([]);
          setSpendings([]);
          setAuthModalOpen(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchSupabaseData]);

  // Sync state helper
  const reloadData = async (uid?: string | null) => {
    const effectiveUid = uid !== undefined ? uid : user?.uid;
    if (effectiveUid) {
      await fetchSupabaseData(effectiveUid);
    }
  };

  // 4. Client Handlers with Direct Supabase Persistence
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setClientModalOpen(true);
  };

  const handleOpenEditClient = (client: ClientProject) => {
    setEditingClient(client);
    setClientModalOpen(true);
  };

  const handleSaveClient = async (clientData: Omit<ClientProject, 'id' | 'createdAt'>, existingId?: string) => {
    try {
      setIsSyncing(true);
      const targetUid = user?.uid;

      if (existingId) {
        const fullClient: ClientProject = {
          ...clientData,
          id: existingId,
          createdAt: editingClient?.createdAt || new Date().toISOString()
        };
        await StorageService.updateClient(fullClient, targetUid);
      } else {
        await StorageService.addClient(clientData, targetUid);
      }

      // Re-fetch clean dataset from Supabase
      if (targetUid) {
        const [updatedClients, updatedInvoices] = await Promise.all([
          StorageService.getClients(targetUid),
          StorageService.getInvoices(targetUid)
        ]);
        setClients(updatedClients);
        setInvoices(updatedInvoices);
      }

      showToast(
        settings.language === 'ar' ? 'تم حفظ المشروع وتحديث قاعدة البيانات بنجاح' : 'Client project saved and database updated',
        'success'
      );
    } catch (err: any) {
      console.error('Error saving client:', err);
      showToast(
        settings.language === 'ar' ? 'حدث خطأ أثناء حفظ المشروع' : 'Error saving client project',
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteClient = (client: ClientProject) => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف مشروع العميل' : 'Delete Client Project',
      message: isAr
        ? `هل أنت متأكد من حذف "${client.name} - ${client.project}"؟ سيتم حذف الفواتير المرتبطة أيضًا.`
        : `Are you sure you want to remove "${client.name} - ${client.project}"? This will also remove the associated invoice.`,
      onConfirm: async () => {
        try {
          setIsSyncing(true);
          const targetUid = user?.uid;
          await StorageService.deleteClient(client.id, targetUid);
          if (targetUid) {
            const [updatedClients, updatedInvoices] = await Promise.all([
              StorageService.getClients(targetUid),
              StorageService.getInvoices(targetUid)
            ]);
            setClients(updatedClients);
            setInvoices(updatedInvoices);
          }
          showToast(
            settings.language === 'ar' ? 'تم حذف المشروع بنجاح' : 'Client project deleted',
            'info'
          );
        } catch (err) {
          console.error('Delete client error:', err);
        } finally {
          setIsSyncing(false);
        }
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

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      setIsSyncing(true);
      const targetUid = user?.uid;
      await StorageService.updateInvoiceStatus(invoiceId, status, targetUid);
      if (targetUid) {
        const freshInvoices = await StorageService.getInvoices(targetUid);
        setInvoices(freshInvoices);
      }
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(prev => prev ? { ...prev, status } : null);
      }
      showToast(
        settings.language === 'ar' ? `تم تحديث حالة الفاتورة إلى: ${status}` : `Invoice status updated to ${status}`,
        'success'
      );
    } catch (err) {
      console.error('Update invoice error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. Spending Handlers with Direct Supabase Persistence
  const handleOpenAddSpending = () => {
    setEditingSpending(null);
    setSpendingModalOpen(true);
  };

  const handleOpenEditSpending = (spending: Spending) => {
    setEditingSpending(spending);
    setSpendingModalOpen(true);
  };

  const handleSaveSpending = async (spendingData: Omit<Spending, 'id' | 'createdAt'>, existingId?: string) => {
    try {
      setIsSyncing(true);
      const targetUid = user?.uid;

      if (existingId) {
        const fullSpending: Spending = {
          ...spendingData,
          id: existingId,
          createdAt: editingSpending?.createdAt || new Date().toISOString()
        };
        await StorageService.updateSpending(fullSpending, targetUid);
      } else {
        await StorageService.addSpending(spendingData, targetUid);
      }

      if (targetUid) {
        const freshSpendings = await StorageService.getSpendings(targetUid);
        setSpendings(freshSpendings);
      }

      showToast(
        settings.language === 'ar' ? 'تم حفظ المصروف ومزامنته مع Supabase بنجاح' : 'Spending expense saved and synced to Supabase',
        'success'
      );
    } catch (err: any) {
      console.error('Error saving spending:', err);
      showToast(
        settings.language === 'ar' ? 'حدث خطأ أثناء حفظ المصروف' : 'Error saving spending',
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSpending = (spending: Spending) => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف المصروف' : 'Delete Spending',
      message: isAr
        ? `هل أنت متأكد من حذف مصروف "${spending.item}" بقيمة ${spending.amount}؟`
        : `Are you sure you want to delete "${spending.item}" ($${spending.amount})?`,
      onConfirm: async () => {
        try {
          setIsSyncing(true);
          const targetUid = user?.uid;
          await StorageService.deleteSpending(spending.id, targetUid);
          if (targetUid) {
            const freshSpendings = await StorageService.getSpendings(targetUid);
            setSpendings(freshSpendings);
          }
          showToast(
            settings.language === 'ar' ? 'تم حذف المصروف بنجاح' : 'Spending expense deleted',
            'info'
          );
        } catch (err) {
          console.error('Delete spending error:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // 7. Account & Settings Handlers
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await StorageService.updateSettings(newSettings, user?.uid);
    setSettings(updated);
    const freshUser = StorageService.getUser();
    if (freshUser) {
      setUser(freshUser);
    }
    showToast(
      settings.language === 'ar' ? 'تم حفظ الإعدادات ومعلومات الوكالة بنجاح' : 'Agency settings updated successfully',
      'success'
    );
  };

  const handleAuthSuccess = async (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
    await fetchSupabaseData(authenticatedUser.uid);
    showToast(
      settings.language === 'ar' ? `مرحباً بك، ${authenticatedUser.companyName || authenticatedUser.displayName}` : `Welcome back, ${authenticatedUser.companyName || authenticatedUser.displayName}`,
      'success'
    );
  };

  // Strict session & memory clearing on sign out
  const handleSignOut = async () => {
    await StorageService.logoutUser();
    setUser(null);
    setClients([]);
    setInvoices([]);
    setSpendings([]);
    setSelectedInvoice(null);
    setEditingClient(null);
    setEditingSpending(null);
    setCurrentTab('dashboard');
    setAuthModalOpen(true);
  };

  const handleDeleteAccount = () => {
    const isAr = settings.language === 'ar';
    setDeleteConfirm({
      isOpen: true,
      title: isAr ? 'حذف الحساب والبيانات نهائياً' : 'Permanently Delete Account & Data',
      message: isAr
        ? 'بموجب البند 6 من سياسة الخصوصية، سيتم مسح جميع بياناتك وسجلاتك المالية ومشاريعك نهائياً من قاعدة البيانات والذاكرة.'
        : 'In accordance with Section 6 of the Privacy Policy, all your clients, invoices, spendings, and profile credentials will be permanently erased from Supabase and memory.',
      onConfirm: async () => {
        if (!user?.uid) return;
        setIsSyncing(true);
        await SupabaseService.wipeAllUserData(user.uid);
        await StorageService.logoutUser();
        setUser(null);
        setClients([]);
        setInvoices([]);
        setSpendings([]);
        setSelectedInvoice(null);
        setEditingClient(null);
        setEditingSpending(null);
        setIsSyncing(false);
        setAuthModalOpen(true);
      }
    });
  };

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.cost || 0), 0);

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#071326] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div 
          id="global-toast-notification"
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 transition-all animate-bounce duration-300 text-sm font-medium ${
            toast.type === 'success' 
              ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100' 
              : toast.type === 'error'
              ? 'bg-rose-900/90 border-rose-500/40 text-rose-100'
              : 'bg-slate-900/90 border-slate-700 text-slate-100'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-400 shrink-0 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        lang={settings.language}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
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
          onOpenPrivacyPolicy={() => setPrivacyPolicyOpen(true)}
          totalRevenue={totalRevenue}
          currency={settings.currency}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium">
                {settings.language === 'ar' ? 'جاري استرجاع البيانات من Supabase...' : 'Fetching live records from Supabase...'}
              </p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  clients={clients}
                  invoices={invoices}
                  spendings={spendings}
                  currency={settings.currency}
                  lang={settings.language}
                  darkMode={settings.darkMode}
                  isSyncing={isSyncing}
                  onRefresh={() => reloadData(user?.uid)}
                  onNavigate={setCurrentTab}
                  onAddClient={handleOpenAddClient}
                  onOpenAddClient={handleOpenAddClient}
                  onAddSpending={handleOpenAddSpending}
                  onOpenAddSpending={handleOpenAddSpending}
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
                  onReloadAllData={() => reloadData(user?.uid)}
                  lang={settings.language}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Privacy Notice Footer for compliance */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-3 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#0F284E] dark:text-sky-400">WISCO</span>
          <span>•</span>
          <span>Whislly Financial Engine (Amman, Jordan)</span>
          {isSyncing ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{settings.language === 'ar' ? 'مزامنة...' : 'Syncing...'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CloudCheck className="w-3 h-3" />
              <span>{settings.language === 'ar' ? 'متصل بقاعدة البيانات' : 'Supabase Synced'}</span>
            </span>
          )}
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
