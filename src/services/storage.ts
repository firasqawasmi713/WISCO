import { 
  ClientProject, 
  Invoice, 
  Spending, 
  AppSettings, 
  UserProfile, 
  ActivityLog, 
  RegisterPayload, 
  InvoiceStatus 
} from '../types';
import { 
  supabase, 
  SupabaseService, 
  mapClientFromRow, 
  mapClientToRow, 
  mapInvoiceFromRow, 
  mapInvoiceToRow, 
  mapSpendingFromRow, 
  mapSpendingToRow,
  mapProfileFromRow
} from './supabase';

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

// =========================================================================
// StorageService: Direct Supabase Database Persistence Layer with Fast Cache
// =========================================================================

export const StorageService = {
  // Session User in Local State
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(GLOBAL_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getCurrentUid(): string | null {
    const user = this.getUser();
    return user?.uid || null;
  },

  setUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(GLOBAL_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  getKey(dataType: string, explicitUid?: string | null): string {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return `wisco_guest_${dataType}`;
    return `wisco_${dataType}_${uid}`;
  },

  // -----------------------------------------------------------------------
  // 1. CLIENTS (Direct Supabase Queries)
  // -----------------------------------------------------------------------

  async getClients(explicitUid?: string | null): Promise<ClientProject[]> {
    try {
      let uid = explicitUid;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id || this.getCurrentUid();
      }

      if (!uid) {
        return this.getCachedClients(null);
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching clients from Supabase, returning cache:', error.message);
        return this.getCachedClients(uid);
      }

      const clients = (data || []).map(mapClientFromRow);
      this.saveCachedClients(clients, uid);
      return clients;
    } catch (e) {
      console.error('getClients exception:', e);
      return this.getCachedClients(explicitUid);
    }
  },

  getCachedClients(explicitUid?: string | null): ClientProject[] {
    try {
      const key = this.getKey('clients', explicitUid);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCachedClients(clients: ClientProject[], explicitUid?: string | null): void {
    try {
      const key = this.getKey('clients', explicitUid);
      localStorage.setItem(key, JSON.stringify(clients));
    } catch (e) {
      console.warn('saveCachedClients error:', e);
    }
  },

  async addClient(clientData: Omit<ClientProject, 'id' | 'createdAt'>, explicitUid?: string | null): Promise<ClientProject> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated: please sign in to create clients.');

    const newClient: ClientProject = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const row = mapClientToRow(newClient, uid);
    const { data, error } = await supabase
      .from('clients')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Supabase client insertion error:', error.message);
      throw error;
    }

    const savedClient = mapClientFromRow(data);

    // Auto-generate and persist corresponding invoice in Supabase
    try {
      const existingInvoices = await this.getInvoices(uid);
      const autoInvoice = generateInvoiceForClient(savedClient, existingInvoices.length + 1);
      const invoiceRow = mapInvoiceToRow(autoInvoice, uid);
      await supabase.from('invoices').insert([invoiceRow]);
    } catch (invErr) {
      console.warn('Auto invoice generation notice:', invErr);
    }

    // Refresh cache
    const updated = [savedClient, ...this.getCachedClients(uid).filter(c => c.id !== savedClient.id)];
    this.saveCachedClients(updated, uid);

    return savedClient;
  },

  async updateClient(client: ClientProject, explicitUid?: string | null): Promise<ClientProject> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const row = mapClientToRow(client, uid);
    const { data, error } = await supabase
      .from('clients')
      .update(row)
      .eq('user_id', uid)
      .eq('id', client.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateClient error:', error.message);
      throw error;
    }

    const updatedClient = mapClientFromRow(data);

    // Sync corresponding invoice details
    try {
      await supabase
        .from('invoices')
        .update({
          client_name: updatedClient.name,
          company_name: updatedClient.companyName,
          client_email: updatedClient.email,
          client_phone: updatedClient.phone,
          client_address: updatedClient.address,
          project_name: updatedClient.project,
          project_category: updatedClient.category,
          subtotal: updatedClient.cost,
          total_amount: updatedClient.cost,
          operating_expenses: updatedClient.operatingExpenses,
          status: updatedClient.status === 'Completed' ? 'Paid' : 'Pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', uid)
        .eq('client_id', updatedClient.id);
    } catch (e) {
      console.warn('Invoice sync notice:', e);
    }

    // Refresh cache
    const cached = this.getCachedClients(uid).map(c => c.id === updatedClient.id ? updatedClient : c);
    this.saveCachedClients(cached, uid);

    return updatedClient;
  },

  async deleteClient(clientId: string, explicitUid?: string | null): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    // Delete linked invoices first
    await supabase.from('invoices').delete().eq('user_id', uid).eq('client_id', clientId);

    const { error } = await supabase.from('clients').delete().eq('user_id', uid).eq('id', clientId);
    if (error) {
      console.error('Supabase deleteClient error:', error.message);
      return false;
    }

    const cached = this.getCachedClients(uid).filter(c => c.id !== clientId);
    this.saveCachedClients(cached, uid);
    return true;
  },

  // -----------------------------------------------------------------------
  // 2. INVOICES (Direct Supabase Queries)
  // -----------------------------------------------------------------------

  async getInvoices(explicitUid?: string | null): Promise<Invoice[]> {
    try {
      let uid = explicitUid;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id || this.getCurrentUid();
      }

      if (!uid) {
        return this.getCachedInvoices(null);
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching invoices from Supabase, returning cache:', error.message);
        return this.getCachedInvoices(uid);
      }

      const invoices = (data || []).map(mapInvoiceFromRow);
      this.saveCachedInvoices(invoices, uid);
      return invoices;
    } catch (e) {
      console.error('getInvoices exception:', e);
      return this.getCachedInvoices(explicitUid);
    }
  },

  getCachedInvoices(explicitUid?: string | null): Invoice[] {
    try {
      const key = this.getKey('invoices', explicitUid);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCachedInvoices(invoices: Invoice[], explicitUid?: string | null): void {
    try {
      const key = this.getKey('invoices', explicitUid);
      localStorage.setItem(key, JSON.stringify(invoices));
    } catch (e) {
      console.warn('saveCachedInvoices error:', e);
    }
  },

  async addInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt'>, explicitUid?: string | null): Promise<Invoice> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const row = mapInvoiceToRow(newInvoice, uid);
    const { data, error } = await supabase
      .from('invoices')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Supabase addInvoice error:', error.message);
      throw error;
    }

    const savedInvoice = mapInvoiceFromRow(data);
    const updated = [savedInvoice, ...this.getCachedInvoices(uid).filter(i => i.id !== savedInvoice.id)];
    this.saveCachedInvoices(updated, uid);
    return savedInvoice;
  },

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, explicitUid?: string | null): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', uid)
      .eq('id', invoiceId);

    if (error) {
      console.error('Supabase updateInvoiceStatus error:', error.message);
      return false;
    }

    const cached = this.getCachedInvoices(uid).map(i => i.id === invoiceId ? { ...i, status } : i);
    this.saveCachedInvoices(cached, uid);
    return true;
  },

  async deleteInvoice(invoiceId: string, explicitUid?: string | null): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', uid)
      .eq('id', invoiceId);

    if (error) {
      console.error('Supabase deleteInvoice error:', error.message);
      return false;
    }

    const cached = this.getCachedInvoices(uid).filter(i => i.id !== invoiceId);
    this.saveCachedInvoices(cached, uid);
    return true;
  },

  // -----------------------------------------------------------------------
  // 3. SPENDINGS (Direct Supabase Queries)
  // -----------------------------------------------------------------------

  async getSpendings(explicitUid?: string | null): Promise<Spending[]> {
    try {
      let uid = explicitUid;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id || this.getCurrentUid();
      }

      if (!uid) {
        return this.getCachedSpendings(null);
      }

      const { data, error } = await supabase
        .from('spendings')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching spendings from Supabase, returning cache:', error.message);
        return this.getCachedSpendings(uid);
      }

      const spendings = (data || []).map(mapSpendingFromRow);
      this.saveCachedSpendings(spendings, uid);
      return spendings;
    } catch (e) {
      console.error('getSpendings exception:', e);
      return this.getCachedSpendings(explicitUid);
    }
  },

  getCachedSpendings(explicitUid?: string | null): Spending[] {
    try {
      const key = this.getKey('spendings', explicitUid);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCachedSpendings(spendings: Spending[], explicitUid?: string | null): void {
    try {
      const key = this.getKey('spendings', explicitUid);
      localStorage.setItem(key, JSON.stringify(spendings));
    } catch (e) {
      console.warn('saveCachedSpendings error:', e);
    }
  },

  async addSpending(spendingData: Omit<Spending, 'id' | 'createdAt'>, explicitUid?: string | null): Promise<Spending> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const newSpending: Spending = {
      ...spendingData,
      id: `sp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const row = mapSpendingToRow(newSpending, uid);
    const { data, error } = await supabase
      .from('spendings')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Supabase addSpending error:', error.message);
      throw error;
    }

    const saved = mapSpendingFromRow(data);
    const updated = [saved, ...this.getCachedSpendings(uid).filter(s => s.id !== saved.id)];
    this.saveCachedSpendings(updated, uid);
    return saved;
  },

  async updateSpending(spending: Spending, explicitUid?: string | null): Promise<Spending> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const row = mapSpendingToRow(spending, uid);
    const { data, error } = await supabase
      .from('spendings')
      .update(row)
      .eq('user_id', uid)
      .eq('id', spending.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateSpending error:', error.message);
      throw error;
    }

    const updated = mapSpendingFromRow(data);
    const cached = this.getCachedSpendings(uid).map(s => s.id === updated.id ? updated : s);
    this.saveCachedSpendings(cached, uid);
    return updated;
  },

  async deleteSpending(spendingId: string, explicitUid?: string | null): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = explicitUid || user?.id || this.getCurrentUid();
    if (!uid) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('spendings')
      .delete()
      .eq('user_id', uid)
      .eq('id', spendingId);

    if (error) {
      console.error('Supabase deleteSpending error:', error.message);
      return false;
    }

    const cached = this.getCachedSpendings(uid).filter(s => s.id !== spendingId);
    this.saveCachedSpendings(cached, uid);
    return true;
  },

  // -----------------------------------------------------------------------
  // 4. SETTINGS & PROFILE (Direct Supabase Persistence)
  // -----------------------------------------------------------------------

  async getSettings(explicitUid?: string | null): Promise<AppSettings> {
    try {
      const uid = explicitUid || this.getCurrentUid();
      if (!uid) return this.getCachedSettings(null);

      const res = await SupabaseService.fetchProfileAndSettings(uid);
      if (res.settings) {
        const merged = { ...DEFAULT_SETTINGS, ...this.getCachedSettings(uid), ...res.settings };
        this.saveCachedSettings(merged, uid);
        return merged;
      }
      return this.getCachedSettings(uid);
    } catch {
      return this.getCachedSettings(explicitUid);
    }
  },

  getCachedSettings(explicitUid?: string | null): AppSettings {
    try {
      const key = this.getKey('settings', explicitUid);
      const data = localStorage.getItem(key);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveCachedSettings(settings: Partial<AppSettings>, explicitUid?: string | null): void {
    try {
      const key = this.getKey('settings', explicitUid);
      const current = this.getCachedSettings(explicitUid);
      const merged = { ...current, ...settings };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {
      console.warn('saveCachedSettings error:', e);
    }
  },

  async updateSettings(newSettings: Partial<AppSettings>, explicitUid?: string | null): Promise<AppSettings> {
    const uid = explicitUid || this.getCurrentUid();
    this.saveCachedSettings(newSettings, uid);

    if (uid) {
      await SupabaseService.updateProfileAndSettings(uid, {
        companyName: newSettings.companyName,
        companyAddress: newSettings.companyAddress,
        companyWebsite: newSettings.companyWebsite,
        companyEmail: newSettings.companyEmail,
        companyLogo: newSettings.companyLogo,
        defaultPaymentTerms: newSettings.defaultPaymentTerms
      }, newSettings);
    }

    return this.getCachedSettings(uid);
  },

  // -----------------------------------------------------------------------
  // 5. AUTH & REGISTRATION
  // -----------------------------------------------------------------------

  async registerUser(
    payload: RegisterPayload
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; user?: UserProfile; error?: string }> {
    const res = await SupabaseService.signUp(payload);
    if (!res.success) return { success: false, error: res.error };

    if (res.requiresVerification) {
      return { success: true, requiresVerification: true, email: payload.email.trim().toLowerCase() };
    }

    if (res.user) {
      this.setUser(res.user);
      this.saveCachedSettings({
        companyName: payload.companyName,
        companyAddress: payload.companyAddress,
        companyWebsite: payload.companyWebsite,
        companyEmail: payload.companyEmail,
        companyLogo: payload.companyLogo,
        defaultPaymentTerms: payload.defaultPaymentTerms
      }, res.user.uid);
      return { success: true, user: res.user };
    }

    return { success: false, error: 'Registration failed.' };
  },

  async loginUser(
    email: string, 
    passwordPlain: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const res = await SupabaseService.signIn(email, passwordPlain);
    if (!res.success || !res.user) {
      return { success: false, error: res.error || 'Invalid credentials.' };
    }

    this.setUser(res.user);
    return { success: true, user: res.user };
  },

  async verifyOtpAndCompleteRegistration(
    email: string,
    token: string,
    pendingProfile?: Partial<RegisterPayload>
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const res = await SupabaseService.verifyOtp(email, token, pendingProfile);
    if (res.success && res.user) {
      this.setUser(res.user);
    }
    return res;
  },

  async resendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    return SupabaseService.resendSignUpOtp(email);
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    return SupabaseService.resetPasswordForEmail(email);
  },

  async signOut(): Promise<void> {
    await this.logoutUser();
  },

  async deleteAccountAndWipeAllData(explicitUid?: string | null): Promise<boolean> {
    const uid = explicitUid || this.getCurrentUid();
    if (!uid) return false;
    await SupabaseService.wipeAllUserData(uid);
    await this.logoutUser();
    return true;
  },

  async logoutUser(): Promise<void> {
    await SupabaseService.signOut();
    this.setUser(null);
  },

  // -----------------------------------------------------------------------
  // 6. BACKUP IMPORT & EXPORT
  // -----------------------------------------------------------------------

  exportFullBackup(explicitUid?: string | null): string {
    const uid = explicitUid || this.getCurrentUid();
    const backupData = {
      version: '2.0-supabase',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      settings: this.getCachedSettings(uid),
      clients: this.getCachedClients(uid),
      invoices: this.getCachedInvoices(uid),
      spendings: this.getCachedSpendings(uid)
    };
    return JSON.stringify(backupData, null, 2);
  },

  async importFullBackup(jsonContent: string, explicitUid?: string | null): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonContent);
      const uid = explicitUid || this.getCurrentUid();
      if (!uid) return false;

      if (Array.isArray(parsed.clients)) {
        for (const client of parsed.clients) {
          await this.addClient(client, uid);
        }
      }

      if (Array.isArray(parsed.spendings)) {
        for (const sp of parsed.spendings) {
          await this.addSpending(sp, uid);
        }
      }

      if (parsed.settings) {
        await this.updateSettings(parsed.settings, uid);
      }

      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  }
};
