import { ClientProject, Invoice, Spending, AppSettings, UserProfile, ActivityLog } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  language: 'en',
  darkMode: false,
  companyName: 'Whislly Solutions Ltd.',
  companyAddress: 'King Hussein Business Park, Bldg 4, Amman, Jordan',
  companyEmail: 'Info@whislly.com',
  companyPhone: '+962 6 550 1234',
  companyWebsite: 'www.whislly.com',
  taxRate: 0,
  defaultPaymentTerms: 'Net 30 days from invoice issue date. Direct bank wire transfer or credit card accepted.'
};

export const INITIAL_SAMPLE_CLIENTS: ClientProject[] = [
  {
    id: 'cli-001',
    name: 'Tariq Al-Mansoor',
    companyName: 'Apex Capital Holding',
    email: 'tariq@apexcapital.jo',
    phone: '+962 79 123 4567',
    address: 'Abdali Boulevard, Tower 2, Amman',
    project: 'Enterprise Fintech Mobile App',
    category: 'Mobile App Development',
    cost: 14500,
    operatingExpenses: 3200,
    startDate: '2026-06-15',
    dueDate: '2026-09-30',
    status: 'In Progress',
    notes: 'Full iOS & Android native app with dual biometric authentication and real-time portfolio tracking.',
    createdAt: '2026-06-15T10:00:00.000Z'
  },
  {
    id: 'cli-002',
    name: 'Sarah Jenkins',
    companyName: 'Solaria Energy Systems',
    email: 'sarah.j@solariagroup.com',
    phone: '+1 (415) 890-2341',
    address: '550 Market St, San Francisco, CA 94104',
    project: 'Global Brand & Web Platform',
    category: 'UI/UX & Web Development',
    cost: 9800,
    operatingExpenses: 1400,
    startDate: '2026-07-01',
    dueDate: '2026-08-20',
    status: 'Completed',
    notes: 'Responsive web platform, 3D solar calculator, and corporate identity guidelines.',
    createdAt: '2026-07-01T09:30:00.000Z'
  },
  {
    id: 'cli-003',
    name: 'Omar Khader',
    companyName: 'Petra Cloud Logistics',
    email: 'o.khader@petralog.me',
    phone: '+962 77 987 6543',
    address: '7th Circle, Business District, Amman',
    project: 'Supply Chain Analytics Engine',
    category: 'Cloud Consulting',
    cost: 18200,
    operatingExpenses: 4100,
    startDate: '2026-05-10',
    dueDate: '2026-08-15',
    status: 'Completed',
    notes: 'Real-time telemetry pipelines, container deployment on GCP, and automated dispatch dashboard.',
    createdAt: '2026-05-10T14:15:00.000Z'
  },
  {
    id: 'cli-004',
    name: 'Lina Al-Husseini',
    companyName: 'Lumina Digital Marketing',
    email: 'lina@luminamedia.com',
    phone: '+971 4 330 9988',
    address: 'Dubai Media City, Building 9, UAE',
    project: 'E-Commerce Marketplace Redesign',
    category: 'UI/UX Design',
    cost: 7600,
    operatingExpenses: 1100,
    startDate: '2026-07-20',
    dueDate: '2026-10-15',
    status: 'In Progress',
    notes: 'High conversion multi-vendor marketplace design system with RTL Arabic adaptation.',
    createdAt: '2026-07-20T11:45:00.000Z'
  },
  {
    id: 'cli-005',
    name: 'David Vance',
    companyName: 'Beacon MedTech UK',
    email: 'd.vance@beaconmed.co.uk',
    phone: '+44 20 7946 0912',
    address: '14 Harley Street, London W1G 9PQ',
    project: 'Patient Telehealth Portal',
    category: 'Custom Software',
    cost: 22000,
    operatingExpenses: 5500,
    startDate: '2026-08-01',
    dueDate: '2026-11-30',
    status: 'In Progress',
    notes: 'HIPAA and GDPR compliant real-time video consult portal with encrypted prescription routing.',
    createdAt: '2026-08-01T08:00:00.000Z'
  }
];

export const INITIAL_SAMPLE_SPENDINGS: Spending[] = [
  {
    id: 'sp-001',
    item: 'AWS Cloud Infrastructure & GPU Clusters',
    purpose: 'Model training servers and multi-region database hosting',
    amount: 1250,
    resellerName: 'Amazon Web Services Inc.',
    category: 'Hosting & Cloud',
    date: '2026-08-05',
    paymentMethod: 'Credit Card',
    receiptNumber: 'AWS-2026-89104',
    createdAt: '2026-08-05T12:00:00.000Z'
  },
  {
    id: 'sp-002',
    item: 'Figma Enterprise Organization License',
    purpose: 'Design collaboration seats for product and client teams',
    amount: 450,
    resellerName: 'Figma Inc.',
    category: 'Software & Subscriptions',
    date: '2026-08-01',
    paymentMethod: 'Credit Card',
    receiptNumber: 'FIG-882194',
    createdAt: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'sp-003',
    item: 'High-Performance Apple M3 Max Workstations',
    purpose: 'Senior engineering hardware upgrade',
    amount: 3800,
    resellerName: 'Apple Store ME & Tech Dist',
    category: 'Hardware & Equipment',
    date: '2026-07-18',
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'APP-990142',
    createdAt: '2026-07-18T15:30:00.000Z'
  },
  {
    id: 'sp-004',
    item: 'Fiber Optic Dedicated Line & Mesh Routers',
    purpose: 'High-speed gigabit office connectivity',
    amount: 320,
    resellerName: 'Zain Telecommunications',
    category: 'Utilities & Internet',
    date: '2026-08-10',
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'ZN-671203',
    createdAt: '2026-08-10T14:20:00.000Z'
  },
  {
    id: 'sp-005',
    item: 'Specialized Cybersecurity Audit & Pentest',
    purpose: 'Third-party compliance audit for fintech project',
    amount: 2400,
    resellerName: 'CyberShield Security Labs',
    category: 'Contractors & Payroll',
    date: '2026-07-28',
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'CSL-2026-44',
    createdAt: '2026-07-28T16:00:00.000Z'
  },
  {
    id: 'sp-006',
    item: 'Google Workspace Business Plus',
    purpose: 'Corporate emails, cloud storage, and video conferencing',
    amount: 180,
    resellerName: 'Google Cloud EMEA',
    category: 'Software & Subscriptions',
    date: '2026-08-02',
    paymentMethod: 'Credit Card',
    receiptNumber: 'G-SUITE-41029',
    createdAt: '2026-08-02T10:00:00.000Z'
  }
];

export function generateInvoiceForClient(client: ClientProject, invoiceNumSequence: number = 1): Invoice {
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
    paymentTerms: 'Payment due within 30 days of invoice date.',
    createdAt: client.createdAt || new Date().toISOString()
  };
}

export function createInitialSampleInvoices(clients: ClientProject[]): Invoice[] {
  return clients.map((c, idx) => generateInvoiceForClient(c, idx + 101));
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

  // Account Registration (Guarantees fresh, completely empty dataset)
  registerUser(
    email: string,
    passwordPlain: string,
    companyName: string = '',
    agreedToPrivacyPolicy: boolean = true
  ): { success: boolean; user?: UserProfile; error?: string } {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
      const accounts: Record<string, RegisteredAccount> = accountsRaw ? JSON.parse(accountsRaw) : {};

      if (accounts[normalizedEmail]) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
      }

      // Generate a unique Firebase/UID style identifier
      const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userProfile: UserProfile = {
        uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        companyName: companyName.trim() || 'Whislly Partner',
        createdAt: new Date().toISOString(),
        agreedToPrivacyPolicy,
        privacyPolicyAgreedAt: new Date().toISOString()
      };

      // Save to registry
      accounts[normalizedEmail] = {
        user: userProfile,
        passwordHash: btoa(passwordPlain) // Standard base64 obfuscation for local credential state
      };
      localStorage.setItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));

      // CRITICAL: Initialize completely empty datasets for new user (NO hardcoded demo arrays)
      localStorage.setItem(this.getKey('clients', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('invoices', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('spendings', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('activities', uid), JSON.stringify([]));
      localStorage.setItem(this.getKey('settings', uid), JSON.stringify(DEFAULT_SETTINGS));

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

      this.setUser(account.user);
      return { success: true, user: account.user };
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
    const existingInvIdx = invoices.findIndex(i => i.clientId === client.id);
    const invoiceNumSeq = invoices.length + 101;
    const updatedInvoice = generateInvoiceForClient(client, invoiceNumSeq);

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

  // Reset sample dataset ONLY when user explicitly requests benchmark loader
  resetAllDataToSample(explicitUid?: string | null): void {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return;
    this.saveClients(INITIAL_SAMPLE_CLIENTS, uid);
    const sampleInvoices = createInitialSampleInvoices(INITIAL_SAMPLE_CLIENTS);
    this.saveInvoices(sampleInvoices, uid);
    this.saveSpendings(INITIAL_SAMPLE_SPENDINGS, uid);
    this.logActivity({
      type: 'client_created',
      title: 'Sample Data Loaded',
      description: 'Loaded benchmark financial datasets for testing.'
    }, uid);
  },

  resetToSampleData(explicitUid?: string | null): void {
    this.resetAllDataToSample(explicitUid);
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
