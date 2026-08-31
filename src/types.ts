export type NavTab = 'dashboard' | 'clients' | 'invoices' | 'spendings' | 'events' | 'reports' | 'account';
export type TabType = NavTab;

export type EventType = 'Event' | 'Task' | 'Meeting' | 'Other' | 'event' | 'task' | 'meeting' | 'other' | 'milestone' | 'deadline';
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  allDay: boolean;
  category: string;
  color: string;
  priority: EventPriority;
  isPinned: boolean;
  isCompleted?: boolean;
  status?: string;
  location?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CurrencyCode = 
  | 'USD' 
  | 'JOD' 
  | 'EUR' 
  | 'GBP' 
  | 'AED' 
  | 'SAR' 
  | 'KWD' 
  | 'CAD' 
  | 'QAR' 
  | 'BHD' 
  | 'OMR' 
  | 'AUD' 
  | 'JPY' 
  | 'TRY' 
  | 'CHF' 
  | 'EGP';

export type LanguageCode = 'en' | 'ar';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameAr: string;
  rateToUSD: number; // For multi-currency estimation/conversion
  position: 'prefix' | 'suffix';
  decimalPlaces: number;
}

export interface ClientProject {
  id: string;
  name: string;
  companyName: string;
  email?: string;
  phone?: string;
  address?: string;
  project: string;
  category: string;
  cost: number;
  operatingExpenses: number;
  startDate: string;
  dueDate?: string;
  status: 'In Progress' | 'Completed' | 'Pending' | 'On Hold';
  notes?: string;
  createdAt: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  companyName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectName: string;
  projectCategory: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // percentage e.g. 0% or 16%
  taxAmount: number;
  operatingExpenses: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
}

export type SpendingCategory = 
  | 'Software & Subscriptions'
  | 'Hosting & Cloud'
  | 'Hardware & Equipment'
  | 'Office & Workspace'
  | 'Marketing & Advertising'
  | 'Contractors & Payroll'
  | 'Legal & Licenses'
  | 'Travel & Logistics'
  | 'Utilities & Internet'
  | 'Other';

export interface Spending {
  id: string;
  item: string; // Item or Service
  purpose: string;
  amount: number;
  resellerName: string;
  category: SpendingCategory;
  date: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'PayPal' | 'Other';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyLogo?: string;
  defaultPaymentTerms?: string;
  createdAt: string;
  agreedToPrivacyPolicy: boolean;
  privacyPolicyAgreedAt?: string;
}

export interface RegisterPayload {
  email: string;
  passwordPlain: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companyEmail: string;
  defaultPaymentTerms: string;
  companyLogo?: string;
  agreedToPrivacyPolicy: boolean;
}

export interface AppSettings {
  currency: CurrencyCode;
  language: LanguageCode;
  darkMode: boolean;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyLogo?: string;
  taxRate: number;
  defaultPaymentTerms: string;
}

export interface ActivityLog {
  id: string;
  type: 'client_created' | 'invoice_generated' | 'spending_added' | 'invoice_paid';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}
