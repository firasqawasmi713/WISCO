import { ClientProject, Invoice, Spending, AppSettings, UserProfile, ActivityLog } from '../types';

const STORAGE_KEYS = {
  USER: 'wisco_user_profile',
  CLIENTS: 'wisco_clients_data',
  INVOICES: 'wisco_invoices_data',
  SPENDINGS: 'wisco_spendings_data',
  SETTINGS: 'wisco_app_settings',
  ACTIVITIES: 'wisco_activity_logs'
};

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
  const taxRate = 0; // Default 0% (or configurable)
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

// Local Storage Helper Functions
export const StorageService = {
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  getClients(): ClientProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    // Initialize with sample
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_SAMPLE_CLIENTS));
    return INITIAL_SAMPLE_CLIENTS;
  },

  saveClients(clients: ClientProject[]): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  saveClient(clientData: Omit<ClientProject, 'id' | 'createdAt'>, existingId?: string): ClientProject {
    const clients = this.getClients();
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

    this.saveClients(clients);

    // Automatic Invoice Generation / Sync
    const invoices = this.getInvoices();
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
    this.saveInvoices(invoices);

    this.logActivity({
      type: existingId ? 'client_created' : 'client_created',
      title: existingId ? 'Client Project Updated' : 'New Client Contract Onboarded',
      description: `${client.name} (${client.companyName}) - ${client.project}`,
      amount: client.cost
    });

    return client;
  },

  deleteClient(clientId: string): void {
    const clients = this.getClients().filter(c => c.id !== clientId);
    this.saveClients(clients);

    const invoices = this.getInvoices().filter(i => i.clientId !== clientId);
    this.saveInvoices(invoices);

    this.logActivity({
      type: 'client_created',
      title: 'Client Record Deleted',
      description: `Client profile and associated invoices removed.`
    });
  },

  getInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    const clients = this.getClients();
    const initialInvoices = createInitialSampleInvoices(clients);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
    return initialInvoices;
  },

  saveInvoices(invoices: Invoice[]): void {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  updateInvoiceStatus(invoiceId: string, status: Invoice['status']): void {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx !== -1) {
      invoices[idx].status = status;
      this.saveInvoices(invoices);

      this.logActivity({
        type: status === 'Paid' ? 'invoice_paid' : 'invoice_generated',
        title: `Invoice Marked as ${status}`,
        description: `Invoice ${invoices[idx].invoiceNumber} for ${invoices[idx].clientName}`,
        amount: invoices[idx].totalAmount
      });
    }
  },

  getSpendings(): Spending[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SPENDINGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEYS.SPENDINGS, JSON.stringify(INITIAL_SAMPLE_SPENDINGS));
    return INITIAL_SAMPLE_SPENDINGS;
  },

  saveSpendings(spendings: Spending[]): void {
    localStorage.setItem(STORAGE_KEYS.SPENDINGS, JSON.stringify(spendings));
  },

  saveSpending(spendingData: Omit<Spending, 'id' | 'createdAt'>, existingId?: string): Spending {
    const spendings = this.getSpendings();
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

    this.saveSpendings(spendings);

    this.logActivity({
      type: 'spending_added',
      title: 'Spending Expense Logged',
      description: `${spending.item} - ${spending.resellerName}`,
      amount: spending.amount
    });

    return spending;
  },

  deleteSpending(spendingId: string): void {
    const spendings = this.getSpendings().filter(s => s.id !== spendingId);
    this.saveSpendings(spendings);

    this.logActivity({
      type: 'spending_added',
      title: 'Spending Record Removed',
      description: 'Expense item deleted from ledger.'
    });
  },

  saveUser(user: UserProfile | null): void {
    this.setUser(user);
  },

  clearAllData(): void {
    this.deleteAccountAndWipeAllData();
  },

  resetToSampleData(): void {
    this.resetAllDataToSample();
  },

  getActivities(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    const defaultActivities: ActivityLog[] = [
      {
        id: 'act-1',
        type: 'client_created',
        title: 'New Client Contract Onboarded',
        description: 'Tariq Al-Mansoor (Apex Capital Holding) signed for $14,500.',
        timestamp: '2026-08-25T14:30:00.000Z',
        amount: 14500
      },
      {
        id: 'act-2',
        type: 'invoice_paid',
        title: 'Invoice Paid in Full',
        description: 'Solaria Energy Systems settled Invoice INV-2026-102.',
        timestamp: '2026-08-20T11:00:00.000Z',
        amount: 9800
      },
      {
        id: 'act-3',
        type: 'spending_added',
        title: 'Infrastructure Spending Logged',
        description: 'AWS Cloud Infrastructure expense ($1,250) added.',
        timestamp: '2026-08-15T09:15:00.000Z',
        amount: 1250
      },
      {
        id: 'act-4',
        type: 'client_created',
        title: 'New Project Registered',
        description: 'Beacon MedTech UK registered Telehealth Portal ($22,000).',
        timestamp: '2026-08-01T08:00:00.000Z',
        amount: 22000
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(defaultActivities));
    return defaultActivities;
  },

  logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const activities = this.getActivities();
    const newAct: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newAct);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 30)));
  },

  resetAllDataToSample(): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_SAMPLE_CLIENTS));
    const sampleInvoices = createInitialSampleInvoices(INITIAL_SAMPLE_CLIENTS);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(sampleInvoices));
    localStorage.setItem(STORAGE_KEYS.SPENDINGS, JSON.stringify(INITIAL_SAMPLE_SPENDINGS));
    this.logActivity({
      type: 'client_created',
      title: 'Sample Data Reset',
      description: 'Loaded default benchmark data for WISCO.'
    });
  },

  deleteAccountAndWipeAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.SPENDINGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      settings: this.getSettings(),
      clients: this.getClients(),
      invoices: this.getInvoices(),
      spendings: this.getSpendings(),
      activities: this.getActivities()
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(parsed.clients));
      if (parsed.invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(parsed.invoices));
      if (parsed.spendings) localStorage.setItem(STORAGE_KEYS.SPENDINGS, JSON.stringify(parsed.spendings));
      if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      if (parsed.activities) localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(parsed.activities));
      return true;
    } catch (e) {
      console.error("Failed to import backup:", e);
      return false;
    }
  }
};
