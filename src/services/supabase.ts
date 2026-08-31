import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ClientProject, 
  Invoice, 
  Spending, 
  UserProfile, 
  AppSettings, 
  InvoiceStatus,
  RegisterPayload
} from '../types';

// Default Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://cplbrwzfgfvqfuolfowt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbGJyd3pmZ2Z2cWZ1b2xmb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTc0MjksImV4cCI6MjEwMzQzMzQyOX0.S7fMNaYKYnt7QnMI_3DGuUSFyQdbAzsKZwFfTt5Y78g';

export const SUPABASE_URL: string = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

// Environment variable validation & health check
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ [WISCO Supabase Warning]: Supabase URL or Anon Key is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
} else {
  console.info('⚡ [WISCO Supabase]: Supabase client configured for PostgreSQL database connection:', SUPABASE_URL);
}

// Support both CDN window.supabase and npm module createClient
declare global {
  interface Window {
    supabase?: {
      createClient: (url: string, key: string) => SupabaseClient;
    };
  }
}

export const supabase: SupabaseClient = 
  (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

// ==========================================
// Database Row Mappers (Postgres <-> TypeScript)
// ==========================================

export function mapClientFromRow(row: any): ClientProject {
  return {
    id: String(row.id || ''),
    name: row.name || '',
    companyName: row.company_name || row.companyName || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    project: row.project || '',
    category: row.category || 'General',
    cost: Number(row.cost || 0),
    operatingExpenses: Number(row.operating_expenses || row.operatingExpenses || 0),
    startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
    dueDate: row.due_date || row.end_date || row.dueDate || '',
    status: row.status || 'In Progress',
    notes: row.notes || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function mapClientToRow(client: Partial<ClientProject>, userId: string): Record<string, any> {
  const cleanId = client.id || `cli-${Date.now()}`;
  const startDate = client.startDate || new Date().toISOString().split('T')[0];
  const dueDate = client.dueDate || null;
  
  return {
    id: cleanId,
    user_id: userId,
    name: client.name || '',
    company_name: client.companyName || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    project: client.project || '',
    category: client.category || 'General',
    cost: Number(client.cost || 0),
    operating_expenses: Number(client.operatingExpenses ?? 0),
    start_date: startDate,
    due_date: dueDate,
    end_date: dueDate,
    status: client.status || 'In Progress',
    notes: client.notes || '',
    created_at: client.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function mapInvoiceFromRow(row: any): Invoice {
  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) {
    items = [];
  }

  return {
    id: String(row.id || ''),
    invoiceNumber: row.invoice_number || row.invoiceNumber || 'INV-001',
    clientId: String(row.client_id || row.clientId || ''),
    clientName: row.client_name || row.clientName || '',
    companyName: row.company_name || row.companyName || '',
    clientEmail: row.client_email || row.clientEmail || '',
    clientPhone: row.client_phone || row.clientPhone || '',
    clientAddress: row.client_address || row.clientAddress || '',
    projectName: row.project_name || row.projectName || '',
    projectCategory: row.project_category || row.projectCategory || '',
    issueDate: row.issue_date || row.issueDate || new Date().toISOString().split('T')[0],
    dueDate: row.due_date || row.dueDate || '',
    items,
    subtotal: Number(row.subtotal || 0),
    taxRate: Number(row.tax_rate ?? row.taxRate ?? 0),
    taxAmount: Number(row.tax_amount ?? row.taxAmount ?? 0),
    operatingExpenses: Number(row.operating_expenses ?? row.operatingExpenses ?? 0),
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
    status: row.status || 'Pending',
    notes: row.notes || '',
    paymentTerms: row.payment_terms || row.paymentTerms || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function mapInvoiceToRow(invoice: Partial<Invoice>, userId: string): Record<string, any> {
  const cleanId = invoice.id || `inv-${Date.now()}`;
  return {
    id: cleanId,
    user_id: userId,
    invoice_number: invoice.invoiceNumber || 'INV-001',
    client_id: invoice.clientId || null,
    client_name: invoice.clientName || '',
    company_name: invoice.companyName || '',
    client_email: invoice.clientEmail || '',
    client_phone: invoice.clientPhone || '',
    client_address: invoice.clientAddress || '',
    project_name: invoice.projectName || '',
    project_category: invoice.projectCategory || '',
    issue_date: invoice.issueDate || new Date().toISOString().split('T')[0],
    due_date: invoice.dueDate || null,
    items: invoice.items || [],
    subtotal: Number(invoice.subtotal || 0),
    tax_rate: Number(invoice.taxRate ?? 0),
    tax_amount: Number(invoice.taxAmount ?? 0),
    operating_expenses: Number(invoice.operatingExpenses ?? 0),
    total_amount: Number(invoice.totalAmount || 0),
    status: invoice.status || 'Pending',
    notes: invoice.notes || '',
    payment_terms: invoice.paymentTerms || '',
    created_at: invoice.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function mapSpendingFromRow(row: any): Spending {
  return {
    id: String(row.id || ''),
    item: row.item || '',
    purpose: row.purpose || '',
    amount: Number(row.amount || 0),
    resellerName: row.reseller_name || row.resellerName || '',
    category: row.category || 'Other',
    date: row.date || new Date().toISOString().split('T')[0],
    paymentMethod: row.payment_method || row.paymentMethod || 'Credit Card',
    receiptNumber: row.receipt_number || row.receiptNumber || '',
    notes: row.notes || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function mapSpendingToRow(spending: Partial<Spending>, userId: string): Record<string, any> {
  const cleanId = spending.id || `sp-${Date.now()}`;
  return {
    id: cleanId,
    user_id: userId,
    item: spending.item || '',
    purpose: spending.purpose || '',
    amount: Number(spending.amount || 0),
    reseller_name: spending.resellerName || '',
    category: spending.category || 'Other',
    date: spending.date || new Date().toISOString().split('T')[0],
    payment_method: spending.paymentMethod || 'Credit Card',
    receipt_number: spending.receiptNumber || '',
    notes: spending.notes || '',
    created_at: spending.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function mapProfileFromRow(row: any): { profile: UserProfile; settings: Partial<AppSettings> } {
  const uid = row.id || row.user_id || '';
  const email = row.email || row.company_email || '';
  const companyName = row.company_name || 'Whislly Partner';
  const companyAddress = row.company_address || 'Amman, Jordan';
  const companyWebsite = row.company_website || '';
  const companyEmail = row.company_email || email;
  const companyPhone = row.company_phone || row.phone || '';
  const companyLogo = row.company_logo || '';
  const defaultPaymentTerms = row.default_payment_terms || 'Payment due within 30 days of invoice date.';

  const profile: UserProfile = {
    uid,
    email,
    displayName: companyName,
    companyName,
    companyAddress,
    companyWebsite,
    companyEmail,
    companyLogo,
    defaultPaymentTerms,
    createdAt: row.created_at || new Date().toISOString(),
    agreedToPrivacyPolicy: Boolean(row.agreed_to_privacy_policy ?? true),
    privacyPolicyAgreedAt: row.created_at || new Date().toISOString()
  };

  const settings: Partial<AppSettings> = {
    companyName,
    companyAddress,
    companyWebsite,
    companyEmail,
    companyPhone,
    companyLogo,
    defaultPaymentTerms,
    currency: row.currency || 'USD',
    language: row.language || 'en',
    darkMode: Boolean(row.dark_mode ?? false),
    taxRate: Number(row.tax_rate ?? 0)
  };

  return { profile, settings };
}

// ==========================================
// Centralized Supabase Database Operations
// ==========================================

export const SupabaseService = {
  client: supabase,

  // 1. Auth Operations
  async signUp(
    payload: RegisterPayload
  ): Promise<{ success: boolean; requiresVerification?: boolean; user?: UserProfile; error?: string }> {
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      const cleanPass = payload.passwordPlain;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            company_name: payload.companyName.trim(),
            company_address: payload.companyAddress.trim(),
            company_website: payload.companyWebsite?.trim() || '',
            company_email: (payload.companyEmail || payload.email).trim().toLowerCase(),
            company_logo: payload.companyLogo || '',
            default_payment_terms: payload.defaultPaymentTerms.trim(),
            agreed_to_privacy_policy: true
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const authUser = data.user;
      if (!authUser) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      if (data.session && authUser) {
        const userProfile: UserProfile = {
          uid: authUser.id,
          email: authUser.email || cleanEmail,
          displayName: payload.companyName,
          companyName: payload.companyName,
          companyAddress: payload.companyAddress,
          companyWebsite: payload.companyWebsite || '',
          companyEmail: payload.companyEmail || cleanEmail,
          companyLogo: payload.companyLogo || '',
          defaultPaymentTerms: payload.defaultPaymentTerms,
          createdAt: authUser.created_at || new Date().toISOString(),
          agreedToPrivacyPolicy: true,
          privacyPolicyAgreedAt: new Date().toISOString()
        };

        // Create profile in database
        await this.updateProfileAndSettings(authUser.id, userProfile, {
          companyName: payload.companyName,
          companyAddress: payload.companyAddress,
          companyWebsite: payload.companyWebsite || '',
          companyEmail: payload.companyEmail || cleanEmail,
          companyLogo: payload.companyLogo || '',
          defaultPaymentTerms: payload.defaultPaymentTerms,
          currency: 'USD',
          language: 'en',
          darkMode: false,
          taxRate: 0
        });

        return { success: true, requiresVerification: false, user: userProfile };
      }

      return {
        success: true,
        requiresVerification: true,
        user: undefined
      };
    } catch (e: any) {
      console.error('Supabase signUp error:', e);
      return { success: false, error: e.message || 'Registration failed.' };
    }
  },

  async verifyOtp(
    email: string, 
    token: string,
    pendingProfile?: Partial<RegisterPayload>
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const authUser = data.user;
      if (!authUser) {
        return { success: false, error: 'Verification failed. Please check your 6-digit code and try again.' };
      }

      const meta = authUser.user_metadata || {};
      const companyName = pendingProfile?.companyName || meta.company_name || meta.agency_name || cleanEmail.split('@')[0];
      const companyAddress = pendingProfile?.companyAddress || meta.company_address || meta.location || '';
      const companyWebsite = pendingProfile?.companyWebsite || meta.company_website || meta.website || '';
      const companyEmail = pendingProfile?.companyEmail || meta.company_email || meta.contact_email || cleanEmail;
      const defaultPaymentTerms = pendingProfile?.defaultPaymentTerms || meta.default_payment_terms || 'Payment due within 30 days of invoice date.';
      const companyLogo = pendingProfile?.companyLogo || meta.company_logo || '';

      const userProfile: UserProfile = {
        uid: authUser.id,
        email: authUser.email || cleanEmail,
        displayName: companyName,
        companyName,
        companyAddress,
        companyWebsite,
        companyEmail,
        companyLogo,
        defaultPaymentTerms,
        createdAt: authUser.created_at || new Date().toISOString(),
        agreedToPrivacyPolicy: true,
        privacyPolicyAgreedAt: new Date().toISOString()
      };

      await this.updateProfileAndSettings(authUser.id, userProfile, {
        companyName,
        companyAddress,
        companyWebsite,
        companyEmail,
        companyLogo,
        defaultPaymentTerms,
        currency: 'USD',
        language: 'en',
        darkMode: false,
        taxRate: 0
      });

      return { success: true, user: userProfile };
    } catch (e: any) {
      console.error('Supabase verifyOtp error:', e);
      return { success: false, error: e.message || 'Verification failed. Please try again.' };
    }
  },

  async resendSignUpOtp(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.error('Supabase resend OTP error:', e);
      return { success: false, error: e.message || 'Failed to resend verification code.' };
    }
  },

  async signIn(email: string, passwordPlain: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: passwordPlain
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const authUser = data.user;
      if (!authUser) {
        return { success: false, error: 'Authentication failed.' };
      }

      let userProfile: UserProfile = {
        uid: authUser.id,
        email: authUser.email || email,
        displayName: authUser.user_metadata?.company_name || authUser.email?.split('@')[0] || 'User',
        companyName: authUser.user_metadata?.company_name || 'Whislly Partner',
        companyAddress: authUser.user_metadata?.company_address || 'Amman, Jordan',
        companyWebsite: authUser.user_metadata?.company_website || 'www.company.com',
        companyEmail: authUser.user_metadata?.company_email || authUser.email || '',
        companyLogo: authUser.user_metadata?.company_logo || '',
        defaultPaymentTerms: authUser.user_metadata?.default_payment_terms || 'Payment due within 30 days of invoice date.',
        createdAt: authUser.created_at || new Date().toISOString(),
        agreedToPrivacyPolicy: true,
        privacyPolicyAgreedAt: authUser.created_at
      };

      try {
        const { profile } = await this.fetchProfileAndSettings(authUser.id);
        if (profile) {
          userProfile = { ...userProfile, ...profile };
        }
      } catch (err) {
        console.warn('Profile fetch notice:', err);
      }

      return { success: true, user: userProfile };
    } catch (e: any) {
      console.error('Supabase sign in error:', e);
      return { success: false, error: e.message || 'Failed to sign in.' };
    }
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut error:', error);
      }
      return { success: true };
    } catch (e: any) {
      console.error('Sign out exception:', e);
      return { success: false, error: e.message };
    }
  },

  async resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.error('Reset password error:', e);
      return { success: false, error: e.message || 'Failed to send password reset email.' };
    }
  },

  async getCurrentSessionUser(): Promise<UserProfile | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      let userProfile: UserProfile = {
        uid: authUser.id,
        email: authUser.email || '',
        displayName: authUser.user_metadata?.company_name || authUser.email?.split('@')[0] || 'User',
        companyName: authUser.user_metadata?.company_name || '',
        companyAddress: authUser.user_metadata?.company_address || '',
        companyWebsite: authUser.user_metadata?.company_website || '',
        companyEmail: authUser.user_metadata?.company_email || authUser.email || '',
        companyLogo: authUser.user_metadata?.company_logo || '',
        defaultPaymentTerms: authUser.user_metadata?.default_payment_terms || '',
        createdAt: authUser.created_at || new Date().toISOString(),
        agreedToPrivacyPolicy: true
      };

      try {
        const { profile } = await this.fetchProfileAndSettings(authUser.id);
        if (profile) {
          userProfile = { ...userProfile, ...profile };
        }
      } catch {
        // use metadata
      }

      return userProfile;
    } catch (e) {
      console.warn('Error checking session user:', e);
      return null;
    }
  },

  // 2. Profiles / Settings Database Operations
  async fetchProfileAndSettings(userId: string): Promise<{ profile: UserProfile | null; settings: Partial<AppSettings> | null }> {
    try {
      // 1. Try user_settings table
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsData) {
        const parsed = mapProfileFromRow(settingsData);
        return { profile: parsed.profile, settings: parsed.settings };
      }

      // 2. Fallback to profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .maybeSingle();

      if (profileData) {
        const parsed = mapProfileFromRow(profileData);
        return { profile: parsed.profile, settings: parsed.settings };
      }

      return { profile: null, settings: null };
    } catch (e) {
      console.warn('fetchProfileAndSettings error:', e);
      return { profile: null, settings: null };
    }
  },

  async updateProfileAndSettings(userId: string, profile: Partial<UserProfile>, settings?: Partial<AppSettings>): Promise<boolean> {
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      if (profile.email) payload.company_email = profile.email;
      if (profile.companyName) payload.company_name = profile.companyName;
      if (profile.companyAddress) payload.company_address = profile.companyAddress;
      if (profile.companyWebsite) payload.company_website = profile.companyWebsite;
      if (profile.companyEmail) payload.company_email = profile.companyEmail;
      if (profile.companyLogo !== undefined) payload.company_logo = profile.companyLogo;
      if (profile.defaultPaymentTerms !== undefined) payload.default_payment_terms = profile.defaultPaymentTerms;

      if (settings) {
        if (settings.currency) payload.currency = settings.currency;
        if (settings.language) payload.language = settings.language;
        if (settings.darkMode !== undefined) payload.dark_mode = settings.darkMode;
        if (settings.taxRate !== undefined) payload.tax_rate = settings.taxRate;
        if (settings.companyLogo !== undefined) payload.company_logo = settings.companyLogo;
        if (settings.defaultPaymentTerms !== undefined) payload.default_payment_terms = settings.defaultPaymentTerms;
      }

      // Upsert to user_settings
      const res1 = await supabase
        .from('user_settings')
        .upsert(payload);

      // Upsert to profiles as well with id
      await supabase
        .from('profiles')
        .upsert({ ...payload, id: userId });

      return !res1.error;
    } catch (e) {
      console.warn('updateProfileAndSettings exception:', e);
      return false;
    }
  },

  // 3. Clients Database Operations (Strict user_id filtering)
  async fetchClients(userId: string): Promise<ClientProject[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchClients error:', error.message);
        return [];
      }

      return (data || []).map(mapClientFromRow);
    } catch (e) {
      console.error('fetchClients exception:', e);
      return [];
    }
  },

  async upsertClient(client: ClientProject, userId: string): Promise<ClientProject | null> {
    try {
      const row = mapClientToRow(client, userId);
      const { data, error } = await supabase
        .from('clients')
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.error('Supabase upsertClient error:', error.message);
        return null;
      }
      return mapClientFromRow(data);
    } catch (e) {
      console.error('upsertClient exception:', e);
      return null;
    }
  },

  async deleteClient(clientId: string, userId: string): Promise<boolean> {
    try {
      // First delete associated invoices to maintain referential cleanliness
      await supabase
        .from('invoices')
        .delete()
        .eq('user_id', userId)
        .eq('client_id', clientId);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('user_id', userId)
        .eq('id', clientId);

      if (error) {
        console.error('Supabase deleteClient error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('deleteClient exception:', e);
      return false;
    }
  },

  // 4. Invoices Database Operations (Strict user_id filtering)
  async fetchInvoices(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchInvoices error:', error.message);
        return [];
      }

      return (data || []).map(mapInvoiceFromRow);
    } catch (e) {
      console.error('fetchInvoices exception:', e);
      return [];
    }
  },

  async upsertInvoice(invoice: Invoice, userId: string): Promise<Invoice | null> {
    try {
      const row = mapInvoiceToRow(invoice, userId);
      const { data, error } = await supabase
        .from('invoices')
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.error('Supabase upsertInvoice error:', error.message);
        return null;
      }
      return mapInvoiceFromRow(data);
    } catch (e) {
      console.error('upsertInvoice exception:', e);
      return null;
    }
  },

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', invoiceId);

      if (error) {
        console.error('Supabase updateInvoiceStatus error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('updateInvoiceStatus exception:', e);
      return false;
    }
  },

  async deleteInvoice(invoiceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('user_id', userId)
        .eq('id', invoiceId);

      if (error) {
        console.error('Supabase deleteInvoice error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('deleteInvoice exception:', e);
      return false;
    }
  },

  // 5. Spendings Database Operations (Strict user_id filtering)
  async fetchSpendings(userId: string): Promise<Spending[]> {
    try {
      const { data, error } = await supabase
        .from('spendings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchSpendings error:', error.message);
        return [];
      }

      return (data || []).map(mapSpendingFromRow);
    } catch (e) {
      console.error('fetchSpendings exception:', e);
      return [];
    }
  },

  async upsertSpending(spending: Spending, userId: string): Promise<Spending | null> {
    try {
      const row = mapSpendingToRow(spending, userId);
      const { data, error } = await supabase
        .from('spendings')
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.error('Supabase upsertSpending error:', error.message);
        return null;
      }
      return mapSpendingFromRow(data);
    } catch (e) {
      console.error('upsertSpending exception:', e);
      return null;
    }
  },

  async deleteSpending(spendingId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('spendings')
        .delete()
        .eq('user_id', userId)
        .eq('id', spendingId);

      if (error) {
        console.error('Supabase deleteSpending error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('deleteSpending exception:', e);
      return false;
    }
  },

  // 6. Complete Data Deletion / Wipe (Section 6 Privacy & Account Deletion)
  async wipeAllUserData(userId: string): Promise<boolean> {
    try {
      await Promise.allSettled([
        supabase.from('invoices').delete().eq('user_id', userId),
        supabase.from('clients').delete().eq('user_id', userId),
        supabase.from('spendings').delete().eq('user_id', userId),
        supabase.from('user_settings').delete().eq('user_id', userId),
        supabase.from('profiles').delete().eq('user_id', userId)
      ]);
      return true;
    } catch (e) {
      console.error('wipeAllUserData exception:', e);
      return false;
    }
  }
};
