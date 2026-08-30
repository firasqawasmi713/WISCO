import { ClientProject, Invoice, Spending, AppSettings, UserProfile, ActivityLog, RegisterPayload, InvoiceStatus } from '../types';
import { SupabaseService } from './supabase';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  language: 'en',
  darkMode: false,
  companyName: 'Whislly Solutions Ltd.',
  companyAddress: 'King Hussein Business Park, Bldg 4, Amman, Jordan',
  companyEmail: 'Info@whislly.com',
  companyPhone: '+962 6 550 1234',
  companyWebsite: 'www.whislly.com',
  companyLogo: '',
  taxRate: 0,
  defaultPaymentTerms: 'Payment due within 30 days of invoice date. Direct bank wire transfer or credit card accepted.'
};

export function generateInvoiceForClient(
  client: ClientProject, 
  invoiceNumSequence: number = 1,
  defaultPaymentTerms?: string
): Invoice {
  const paddedSeq = String(invoiceNumSequence).padStart(3, '0');
  const now = new Date();
  const year = now.getFullYear();
  const invoiceNumber = `INV-${year}-${paddedSeq}`;
  
  const issueDate = client.startDate || new Date().toISOString().split('T')[0];
  let dueDate = client.dueDate;
  if (!dueDate) {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 30);
    dueDate = d.toISOString().split('T')[0];
  }

  const subtotal = client.cost;
  const taxRate = 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  return {
    id: `inv-${client.id.replace('cli-', '')}-${Date.now().toString().slice(-4)}`,
    invoiceNumber,
    clientId: client.id,
    clientName: client.name,
    companyName: client.companyName,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientAddress: client.address,
    projectName: client.project,
    projectCategory: client.category,
    issueDate,
    dueDate,
    items: [
      {
        id: 'item-1',
        description: `${client.project} - Complete Professional Scope & Deliverables`,
        quantity: 1,
        unitPrice: client.cost,
        total: client.cost
      }
    ],
    subtotal,
    taxRate,
    taxAmount,
    operatingExpenses: client.operatingExpenses,
    totalAmount,
    status: client.status === 'Completed' ? 'Paid' : 'Pending',
    notes: client.notes || 'Thank you for your business. Please remit payment via bank transfer.',
    paymentTerms: defaultPaymentTerms || 'Payment due within 30 days of invoice date.',
    createdAt: client.createdAt || new Date().toISOString()
  };
}

const GLOBAL_KEYS = {
  CURRENT_USER: 'wisco_current_user_session',
  REGISTERED_ACCOUNTS: 'wisco_registered_accounts'
};

// Supabase-backed Storage Service with instantaneous local caching and strict user isolation
export const StorageService = {
  // Returns currently active user session or null
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(GLOBAL_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Returns active UID or null
  getCurrentUid(): string | null {
    const user = this.getUser();
    return user?.uid || null;
  },

  // Sets or clears the active user session
  setUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(GLOBAL_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  // Helper for generating UID-scoped storage keys
  getKey(dataType: 'clients' | 'invoices' | 'spendings' | 'settings' | 'activities' | 'profile', explicitUid?: string | null): string {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) {
      return `wisco_guest_${dataType}`;
    }
    return `wisco_${dataType}_${uid}`;
  },

  // Account Registration via Supabase Auth
  async registerUser(
    payload: RegisterPayload
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; user?: UserProfile; error?: string }> {
    try {
      const res = await SupabaseService.signUp(payload);
      if (!res.success) {
        return { success: false, error: res.error || 'Registration failed.' };
      }

      if (res.requiresVerification) {
        return { 
          success: true, 
          requiresVerification: true, 
          email: payload.email.trim().toLowerCase() 
        };
      }

      if (res.user) {
        const userProfile = res.user;
        const uid = userProfile.uid;

        // Initialize local settings & user record
        const initialSettings: AppSettings = {
          ...DEFAULT_SETTINGS,
          companyName: payload.companyName || 'Whislly Partner',
          companyAddress: payload.companyAddress || 'Amman, Jordan',
          companyWebsite: payload.companyWebsite || 'www.company.com',
          companyEmail: payload.companyEmail || payload.email,
          companyLogo: payload.companyLogo || '',
          defaultPaymentTerms: payload.defaultPaymentTerms || DEFAULT_SETTINGS.defaultPaymentTerms
        };

        localStorage.setItem(this.getKey('profile', uid), JSON.stringify(userProfile));
        localStorage.setItem(this.getKey('settings', uid), JSON.stringify(initialSettings));
        localStorage.setItem(this.getKey('clients', uid), JSON.stringify([]));
        localStorage.setItem(this.getKey('invoices', uid), JSON.stringify([]));
        localStorage.setItem(this.getKey('spendings', uid), JSON.stringify([]));
        localStorage.setItem(this.getKey('activities', uid), JSON.stringify([]));

        // Set active session
        this.setUser(userProfile);

        return { success: true, user: userProfile };
      }

      return { success: true, requiresVerification: true, email: payload.email.trim().toLowerCase() };
    } catch (e: any) {
      console.error('Registration error:', e);
      return { success: false, error: e.message || 'Failed to create account. Please try again.' };
    }
  },

  // Verify 6-digit OTP and complete onboarding
  async verifyOtpAndCompleteRegistration(
    email: string,
    token: string,
    pendingPayload?: RegisterPayload
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await SupabaseService.verifySignUpOtp(email, token, pendingPayload);
      if (!res.success || !res.user) {
        return { success: false, error: res.error || 'Invalid or expired verification code.' };
      }

      const userProfile = res.user;
      const uid = userProfile.uid;

      // Initialize local settings & user record
      const initialSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        companyName: pendingPayload?.companyName || userProfile.companyName || 'Whislly Partner',
        companyAddress: pendingPayload?.companyAddress || userProfile.companyAddress || 'Amman, Jordan',
        companyWebsite: pendingPayload?.companyWebsite || userProfile.companyWebsite || 'www.company.com',
        companyEmail: pendingPayload?.companyEmail || userProfile.companyEmail || userProfile.email,
        companyLogo: pendingPayload?.companyLogo || userProfile.companyLogo || '',
        defaultPaymentTerms: pendingPayload?.defaultPaymentTerms || userProfile.defaultPaymentTerms || DEFAULT_SETTINGS.defaultPaymentTerms
      };

      localStorage.setItem(this.getKey('profile', uid), JSON.stringify(userProfile));
      localStorage.setItem(this.getKey('settings', uid), JSON.stringify(initialSettings));
      localStorage.setItem(this.getKey('clients', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('invoices', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('spendings', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('activities', uid), JSON.stringify([]));

      // Set active session
      this.setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (e: any) {
      console.error('Verify OTP error:', e);
      return { success: false, error: e.message || 'Verification failed. Please try again.' };
    }
  },

  // Resend 6-digit verification code
  async resendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await SupabaseService.resendSignUpOtp(email);
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to resend code.' };
    }
  },

  // Request password reset email
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await SupabaseService.resetPasswordForEmail(email);
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to request password reset.' };
    }
  },

  // Account Login via Supabase Auth + Sync from Supabase tables
  async loginUser(
    email: string,
    passwordPlain: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await SupabaseService.signIn(email, passwordPlain);
      if (!res.success || !res.user) {
        return { success: false, error: res.error || 'Invalid email or password.' };
      }

      const userProfile = res.user;
      const uid = userProfile.uid;

      this.setUser(userProfile);
      localStorage.setItem(this.getKey('profile', uid), JSON.stringify(userProfile));

      // Synchronize database records from Supabase tables for this user
      await this.syncFromSupabase(uid);

      return { success: true, user: userProfile };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: e.message || 'Failed to authenticate. Please try again.' };
    }
  },

  // Synchronize all data from Supabase tables (filtered strictly by user_id)
  async syncFromSupabase(userId: string): Promise<{
    clients: ClientProject[];
    invoices: Invoice[];
    spendings: Spending[];
    settings: AppSettings;
  }> {
    try {
      const [clientsData, invoicesData, spendingsData, profileData] = await Promise.all([
        SupabaseService.fetchClients(userId),
        SupabaseService.fetchInvoices(userId),
        SupabaseService.fetchSpendings(userId),
        SupabaseService.fetchProfileAndSettings(userId)
      ]);

      // Cache locally
      this.saveClients(clientsData, userId);
      this.saveInvoices(invoicesData, userId);
      this.saveSpendings(spendingsData, userId);

      if (profileData.settings) {
        this.saveSettings(profileData.settings, userId);
      }

      const currentSettings = this.getSettings(userId);
      return {
        clients: clientsData,
        invoices: invoicesData,
        spendings: spendingsData,
        settings: currentSettings
      };
    } catch (e) {
      console.warn('Supabase sync error (using local cache):', e);
      return {
        clients: this.getClients(userId),
        invoices: this.getInvoices(userId),
        spendings: this.getSpendings(userId),
        settings: this.getSettings(userId)
      };
    }
  },

  // Settings & Profile
  getSettings(explicitUid?: string | null): AppSettings {
    try {
      const key = this.getKey('settings', explicitUid);
      const data = localStorage.getItem(key);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: Partial<AppSettings>, explicitUid?: string | null): AppSettings {
    const current = this.getSettings(explicitUid);
    const updated = { ...current, ...settings };
    const uid = explicitUid || this.getCurrentUid();
    const key = this.getKey('settings', uid);
    localStorage.setItem(key, JSON.stringify(updated));

    if (uid) {
      try {
        const profileKey = this.getKey('profile', uid);
        const profileRaw = localStorage.getItem(profileKey);
        let profileObj: UserProfile = profileRaw ? JSON.parse(profileRaw) : {
          uid,
          email: updated.companyEmail || '',
          displayName: updated.companyName || 'Agency Partner',
          createdAt: new Date().toISOString(),
          agreedToPrivacyPolicy: true
        };

        if (settings.companyLogo !== undefined) profileObj.companyLogo = settings.companyLogo;
        if (settings.defaultPaymentTerms !== undefined) profileObj.defaultPaymentTerms = settings.defaultPaymentTerms;
        localStorage.setItem(profileKey, JSON.stringify(profileObj));

        const currentUser = this.getUser();
        if (currentUser && currentUser.uid === uid) {
          if (settings.companyLogo !== undefined) currentUser.companyLogo = settings.companyLogo;
          if (settings.defaultPaymentTerms !== undefined) currentUser.defaultPaymentTerms = settings.defaultPaymentTerms;
          this.setUser(currentUser);
        }

        // Asynchronously sync to Supabase profiles table
        SupabaseService.updateProfileAndSettings(uid, profileObj, updated).catch(err => {
          console.warn('Background Supabase profile update notice:', err);
        });
      } catch (err) {
        console.warn('Profile sync notice:', err);
      }
    }

    return updated;
  },

  // Clients (Strictly UID-isolated)
  getClients(explicitUid?: string | null): ClientProject[] {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return [];

    try {
      const key = this.getKey('clients', uid);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveClients(clients: ClientProject[], explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return;
    const key = this.getKey('clients', uid);
    localStorage.setItem(key, JSON.stringify(clients));
  },

  saveClient(
    clientData: Omit<ClientProject, 'id' | 'createdAt'>,
    existingId?: string,
    explicitUid?: string | null
  ): ClientProject {
    const uid = explicitUid || this.getCurrentUid();
    const clients = this.getClients(uid);
    let client: ClientProject;

    if (existingId) {
      const idx = clients.findIndex(c => c.id === existingId);
      if (idx !== -1) {
        client = {
          ...clients[idx],
          ...clientData
        };
        clients[idx] = client;
      } else {
        client = {
          ...clientData,
          id: existingId,
          createdAt: new Date().toISOString()
        };
        clients.push(client);
      }
    } else {
      client = {
        ...clientData,
        id: `cli-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      clients.unshift(client);
    }

    this.saveClients(clients, uid);

    // Synchronize auto invoice for this user
    const invoices = this.getInvoices(uid);
    const userSettings = this.getSettings(uid);
    const existingInvIdx = invoices.findIndex(i => i.clientId === client.id);
    const invoiceNumSeq = invoices.length + 101;
    const updatedInvoice = generateInvoiceForClient(client, invoiceNumSeq, userSettings.defaultPaymentTerms);

    let finalInvoice: Invoice;
    if (existingInvIdx !== -1) {
      finalInvoice = {
        ...invoices[existingInvIdx],
        clientName: client.name,
        companyName: client.companyName,
        clientEmail: client.email,
        clientPhone: client.phone,
        clientAddress: client.address,
        projectName: client.project,
        projectCategory: client.category,
        subtotal: client.cost,
        totalAmount: client.cost + (client.cost * invoices[existingInvIdx].taxRate) / 100,
        operatingExpenses: client.operatingExpenses,
        status: client.status === 'Completed' ? 'Paid' : invoices[existingInvIdx].status,
        items: [
          {
            id: invoices[existingInvIdx].items?.[0]?.id || 'item-1',
            description: `${client.project} - Complete Professional Scope & Deliverables`,
            quantity: 1,
            unitPrice: client.cost,
            total: client.cost
          }
        ]
      };
      invoices[existingInvIdx] = finalInvoice;
    } else {
      finalInvoice = updatedInvoice;
      invoices.unshift(finalInvoice);
    }
    this.saveInvoices(invoices, uid);

    // Asynchronously push to Supabase tables
    if (uid) {
      SupabaseService.upsertClient(client, uid).catch(err => {
        console.warn('Background Supabase upsertClient notice:', err);
      });
      SupabaseService.upsertInvoice(finalInvoice, uid).catch(err => {
        console.warn('Background Supabase upsertInvoice notice:', err);
      });
    }

    this.logActivity({
      type: existingId ? 'client_created' : 'client_created',
      title: existingId ? 'Client Project Updated' : 'New Client Contract Onboarded',
      description: `${client.name} (${client.companyName}) - ${client.project}`,
      amount: client.cost
    }, uid);

    return client;
  },

  deleteClient(clientId: string, explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    const clients = this.getClients(uid).filter(c => c.id !== clientId);
    this.saveClients(clients, uid);

    const invoices = this.getInvoices(uid).filter(i => i.clientId !== clientId);
    this.saveInvoices(invoices, uid);

    // Asynchronously delete from Supabase tables
    if (uid) {
      SupabaseService.deleteClient(clientId, uid).catch(err => {
        console.warn('Background Supabase deleteClient notice:', err);
      });
    }

    this.logActivity({
      type: 'client_created',
      title: 'Client Record Deleted',
      description: `Client profile and associated invoices removed.`
    }, uid);
  },

  // Invoices (Strictly UID-isolated)
  getInvoices(explicitUid?: string | null): Invoice[] {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return [];

    try {
      const key = this.getKey('invoices', uid);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveInvoices(invoices: Invoice[], explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return;
    const key = this.getKey('invoices', uid);
    localStorage.setItem(key, JSON.stringify(invoices));
  },

  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    const invoices = this.getInvoices(uid);
    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx !== -1) {
      invoices[idx].status = status;
      this.saveInvoices(invoices, uid);

      if (uid) {
        SupabaseService.updateInvoiceStatus(invoiceId, status, uid).catch(err => {
          console.warn('Background Supabase updateInvoiceStatus notice:', err);
        });
      }

      this.logActivity({
        type: status === 'Paid' ? 'invoice_paid' : 'invoice_generated',
        title: `Invoice Marked as ${status}`,
        description: `Invoice ${invoices[idx].invoiceNumber} for ${invoices[idx].clientName}`,
        amount: invoices[idx].totalAmount
      }, uid);
    }
  },

  // Spendings (Strictly UID-isolated)
  getSpendings(explicitUid?: string | null): Spending[] {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return [];

    try {
      const key = this.getKey('spendings', uid);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveSpendings(spendings: Spending[], explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return;
    const key = this.getKey('spendings', uid);
    localStorage.setItem(key, JSON.stringify(spendings));
  },

  saveSpending(
    spendingData: Omit<Spending, 'id' | 'createdAt'>,
    existingId?: string,
    explicitUid?: string | null
  ): Spending {
    const uid = explicitUid || this.getCurrentUid();
    const spendings = this.getSpendings(uid);
    let spending: Spending;

    if (existingId) {
      const idx = spendings.findIndex(s => s.id === existingId);
      if (idx !== -1) {
        spending = {
          ...spendings[idx],
          ...spendingData
        };
        spendings[idx] = spending;
      } else {
        spending = {
          ...spendingData,
          id: existingId,
          createdAt: new Date().toISOString()
        };
        spendings.push(spending);
      }
    } else {
      spending = {
        ...spendingData,
        id: `sp-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      spendings.unshift(spending);
    }

    this.saveSpendings(spendings, uid);

    if (uid) {
      SupabaseService.upsertSpending(spending, uid).catch(err => {
        console.warn('Background Supabase upsertSpending notice:', err);
      });
    }

    this.logActivity({
      type: 'spending_added',
      title: 'Spending Expense Logged',
      description: `${spending.item} - ${spending.resellerName}`,
      amount: spending.amount
    }, uid);

    return spending;
  },

  deleteSpending(spendingId: string, explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    const spendings = this.getSpendings(uid).filter(s => s.id !== spendingId);
    this.saveSpendings(spendings, uid);

    if (uid) {
      SupabaseService.deleteSpending(spendingId, uid).catch(err => {
        console.warn('Background Supabase deleteSpending notice:', err);
      });
    }

    this.logActivity({
      type: 'spending_added',
      title: 'Spending Record Removed',
      description: 'Expense item deleted from ledger.'
    }, uid);
  },

  // Activities (Strictly UID-isolated)
  getActivities(explicitUid?: string | null): ActivityLog[] {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return [];

    try {
      const key = this.getKey('activities', uid);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  },

  logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>, explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return;
    const activities = this.getActivities(uid);
    const newAct: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newAct);
    const key = this.getKey('activities', uid);
    localStorage.setItem(key, JSON.stringify(activities.slice(0, 30)));
  },

  // Sign out helper
  async signOut(): Promise<void> {
    try {
      await SupabaseService.signOut();
    } catch {
      // ignore
    }
    this.setUser(null);
  },

  // Complete data deletion for user (Section 6 Privacy & Account Deletion)
  async deleteAccountAndWipeAllData(explicitUid?: string | null): Promise<void> {
    const uid = explicitUid || this.getCurrentUid();
    
    if (uid) {
      try {
        await SupabaseService.wipeAllUserData(uid);
      } catch (err) {
        console.warn('Supabase wipe error:', err);
      }

      localStorage.removeItem(this.getKey('clients', uid));
      localStorage.removeItem(this.getKey('invoices', uid));
      localStorage.removeItem(this.getKey('spendings', uid));
      localStorage.removeItem(this.getKey('settings', uid));
      localStorage.removeItem(this.getKey('activities', uid));
      localStorage.removeItem(this.getKey('profile', uid));
    }

    await this.signOut();
  },

  clearAllData(explicitUid?: string | null): void {
    this.deleteAccountAndWipeAllData(explicitUid);
  },

  saveUser(user: UserProfile | null): void {
    this.setUser(user);
  },

  // Export / Import isolated data
  exportFullBackup(explicitUid?: string | null): string {
    const uid = explicitUid || this.getCurrentUid();
    const backup = {
      version: '3.0.0',
      backend: 'Supabase PostgreSQL',
      uid,
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      settings: this.getSettings(uid),
      clients: this.getClients(uid),
      invoices: this.getInvoices(uid),
      spendings: this.getSpendings(uid),
      activities: this.getActivities(uid)
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string, explicitUid?: string | null): boolean {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return false;
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.clients)) {
        this.saveClients(parsed.clients, uid);
        parsed.clients.forEach((c: ClientProject) => {
          SupabaseService.upsertClient(c, uid).catch(console.warn);
        });
      }
      if (Array.isArray(parsed.invoices)) {
        this.saveInvoices(parsed.invoices, uid);
        parsed.invoices.forEach((inv: Invoice) => {
          SupabaseService.upsertInvoice(inv, uid).catch(console.warn);
        });
      }
      if (Array.isArray(parsed.spendings)) {
        this.saveSpendings(parsed.spendings, uid);
        parsed.spendings.forEach((sp: Spending) => {
          SupabaseService.upsertSpending(sp, uid).catch(console.warn);
        });
      }
      if (parsed.settings) {
        this.saveSettings(parsed.settings, uid);
      }
      if (Array.isArray(parsed.activities)) {
        const key = this.getKey('activities', uid);
        localStorage.setItem(key, JSON.stringify(parsed.activities));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }
};
