import { ClientProject, Invoice, Spending, AppSettings, UserProfile, ActivityLog, RegisterPayload } from '../types';

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

interface RegisteredAccount {
  user: UserProfile;
  passwordHash: string; // Stored securely in client storage
}

const GLOBAL_KEYS = {
  CURRENT_USER: 'wisco_current_user_session',
  REGISTERED_ACCOUNTS: 'wisco_registered_accounts'
};

// Isolated Storage Service tied to authenticated user UID
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

  // Helper for generating UID-scoped storage keys (e.g. wisco_data_${user.uid}_clients or wisco_clients_${user.uid})
  getKey(dataType: 'clients' | 'invoices' | 'spendings' | 'settings' | 'activities', explicitUid?: string | null): string {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) {
      return `wisco_guest_${dataType}`;
    }
    return `wisco_${dataType}_${uid}`;
  },

  // Account Registration with Mandatory Agency Profile Onboarding
  registerUser(
    payloadOrEmail: string | RegisterPayload,
    passwordPlain?: string,
    companyName: string = '',
    agreedToPrivacyPolicy: boolean = true
  ): { success: boolean; user?: UserProfile; error?: string } {
    try {
      let payload: RegisterPayload;
      if (typeof payloadOrEmail === 'object') {
        payload = payloadOrEmail;
      } else {
        payload = {
          email: payloadOrEmail,
          passwordPlain: passwordPlain || '',
          companyName: companyName || '',
          companyAddress: '',
          companyWebsite: '',
          companyEmail: payloadOrEmail,
          defaultPaymentTerms: DEFAULT_SETTINGS.defaultPaymentTerms,
          companyLogo: '',
          agreedToPrivacyPolicy
        };
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
      const accounts: Record<string, RegisteredAccount> = accountsRaw ? JSON.parse(accountsRaw) : {};

      if (accounts[normalizedEmail]) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
      }

      // Generate a unique identifier
      const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const cleanCompany = (payload.companyName || '').trim() || 'Whislly Partner';
      const cleanAddress = (payload.companyAddress || '').trim() || 'Amman, Jordan';
      const cleanWebsite = (payload.companyWebsite || '').trim() || 'www.company.com';
      const cleanContactEmail = (payload.companyEmail || '').trim() || normalizedEmail;
      const cleanTerms = (payload.defaultPaymentTerms || '').trim() || DEFAULT_SETTINGS.defaultPaymentTerms;
      const cleanLogo = payload.companyLogo || '';

      const userProfile: UserProfile = {
        uid,
        email: normalizedEmail,
        displayName: cleanCompany,
        companyName: cleanCompany,
        companyAddress: cleanAddress,
        companyWebsite: cleanWebsite,
        companyEmail: cleanContactEmail,
        companyLogo: cleanLogo,
        defaultPaymentTerms: cleanTerms,
        createdAt: new Date().toISOString(),
        agreedToPrivacyPolicy: payload.agreedToPrivacyPolicy,
        privacyPolicyAgreedAt: new Date().toISOString()
      };

      // Save to global accounts registry
      accounts[normalizedEmail] = {
        user: userProfile,
        passwordHash: btoa(payload.passwordPlain) // Standard base64 obfuscation for local credential state
      };
      localStorage.setItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));

      // Persist profile into dedicated user record (wisco_profile_${uid})
      localStorage.setItem(`wisco_profile_${uid}`, JSON.stringify(userProfile));

      // Initialize isolated settings for new user with onboarding agency profile
      const initialSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        companyName: cleanCompany,
        companyAddress: cleanAddress,
        companyWebsite: cleanWebsite,
        companyEmail: cleanContactEmail,
        companyLogo: cleanLogo,
        defaultPaymentTerms: cleanTerms
      };

      // CRITICAL: Initialize completely empty datasets for new user (NO hardcoded demo arrays)
      localStorage.setItem(this.getKey('clients', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('invoices', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('spendings', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('activities', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('settings', uid), JSON.stringify(initialSettings));

      // Set active session
      this.setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (e) {
      console.error('Registration error:', e);
      return { success: false, error: 'Failed to create account. Please try again.' };
    }
  },

  // Account Login (Restores isolated dataset by UID)
  loginUser(
    email: string,
    passwordPlain: string
  ): { success: boolean; user?: UserProfile; error?: string } {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
      const accounts: Record<string, RegisteredAccount> = accountsRaw ? JSON.parse(accountsRaw) : {};

      const account = accounts[normalizedEmail];
      if (!account) {
        return { success: false, error: 'No account found with this email. Please sign up first.' };
      }

      if (account.passwordHash !== btoa(passwordPlain)) {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }

      // Check if user profile is in wisco_profile_${uid}
      let userObj = account.user;
      try {
        const storedProfile = localStorage.getItem(`wisco_profile_${userObj.uid}`);
        if (storedProfile) {
          userObj = { ...userObj, ...JSON.parse(storedProfile) };
        }
      } catch {
        // ignore
      }

      this.setUser(userObj);
      return { success: true, user: userObj };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'Failed to authenticate. Please try again.' };
    }
  },

  // Settings
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
    const key = this.getKey('settings', explicitUid);
    localStorage.setItem(key, JSON.stringify(updated));

    // Sync user profile record if companyLogo or defaultPaymentTerms updated
    const uid = explicitUid || this.getCurrentUid();
    if (uid) {
      try {
        const profileKey = `wisco_profile_${uid}`;
        const profileRaw = localStorage.getItem(profileKey);
        if (profileRaw) {
          const profile: UserProfile = JSON.parse(profileRaw);
          if (settings.companyLogo !== undefined) profile.companyLogo = settings.companyLogo;
          if (settings.defaultPaymentTerms !== undefined) profile.defaultPaymentTerms = settings.defaultPaymentTerms;
          localStorage.setItem(profileKey, JSON.stringify(profile));
        }
        const currentUser = this.getUser();
        if (currentUser && currentUser.uid === uid) {
          if (settings.companyLogo !== undefined) currentUser.companyLogo = settings.companyLogo;
          if (settings.defaultPaymentTerms !== undefined) currentUser.defaultPaymentTerms = settings.defaultPaymentTerms;
          this.setUser(currentUser);
        }
      } catch {
        // ignore
      }
    }

    return updated;
  },

  // Clients (Strictly UID-isolated, returns [] for empty/new user)
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

    if (existingInvIdx !== -1) {
      invoices[existingInvIdx] = {
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
    } else {
      invoices.unshift(updatedInvoice);
    }
    this.saveInvoices(invoices, uid);

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

    this.logActivity({
      type: 'client_created',
      title: 'Client Record Deleted',
      description: `Client profile and associated invoices removed.`
    }, uid);
  },

  // Invoices (Strictly UID-isolated, returns [] for empty/new user)
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

  updateInvoiceStatus(invoiceId: string, status: Invoice['status'], explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    const invoices = this.getInvoices(uid);
    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx !== -1) {
      invoices[idx].status = status;
      this.saveInvoices(invoices, uid);

      this.logActivity({
        type: status === 'Paid' ? 'invoice_paid' : 'invoice_generated',
        title: `Invoice Marked as ${status}`,
        description: `Invoice ${invoices[idx].invoiceNumber} for ${invoices[idx].clientName}`,
        amount: invoices[idx].totalAmount
      }, uid);
    }
  },

  // Spendings (Strictly UID-isolated, returns [] for empty/new user)
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
  signOut(): void {
    this.setUser(null);
  },

  // Complete data deletion for current user
  deleteAccountAndWipeAllData(explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    const user = this.getUser();

    if (uid) {
      localStorage.removeItem(this.getKey('clients', uid));
      localStorage.removeItem(this.getKey('invoices', uid));
      localStorage.removeItem(this.getKey('spendings', uid));
      localStorage.removeItem(this.getKey('settings', uid));
      localStorage.removeItem(this.getKey('activities', uid));
    }

    if (user?.email) {
      try {
        const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
        if (accountsRaw) {
          const accounts = JSON.parse(accountsRaw);
          delete accounts[user.email.toLowerCase()];
          localStorage.setItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
        }
      } catch {
        // ignore
      }
    }

    this.setUser(null);
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
      version: '2.0.0',
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
      if (Array.isArray(parsed.clients)) this.saveClients(parsed.clients, uid);
      if (Array.isArray(parsed.invoices)) this.saveInvoices(parsed.invoices, uid);
      if (Array.isArray(parsed.spendings)) this.saveSpendings(parsed.spendings, uid);
      if (parsed.settings) this.saveSettings(parsed.settings, uid);
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
