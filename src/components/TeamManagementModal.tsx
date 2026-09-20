import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  X, 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Briefcase, 
  Mail, 
  User, 
  Sparkles,
  RefreshCw,
  Search,
  ChevronRight,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UserRole, UserPermissions, LanguageCode } from '../types';
import { supabase } from '../services/supabase';

interface TeamMemberRecord {
  id: string;
  fullName: string;
  jobTitle: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt: string;
}

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  lang: LanguageCode;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lang
}) => {
  const isArabic = lang === 'ar';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('staff');

  // Fine-grained Access Checkboxes (Permissions Matrix)
  const [permissions, setPermissions] = useState<UserPermissions>({
    clients: { view: true, edit: false },
    invoices: { view: true, edit: false },
    expenses: { view: true, edit: false },
    reports: { view: false, export: false }
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword: string;
    fullName: string;
    role: string;
  } | null>(null);

  // Existing Team List
  const [teamList, setTeamList] = useState<TeamMemberRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Load initial team list or cached team
  useEffect(() => {
    if (!isOpen) return;

    // Build initial team records including current user
    const initialList: TeamMemberRecord[] = [
      {
        id: currentUser?.uid || 'super-1',
        fullName: currentUser?.fullName || currentUser?.displayName || 'Lead Partner',
        jobTitle: currentUser?.jobTitle || 'Agency Owner & Managing Director',
        email: currentUser?.email || 'admin@wisco.io',
        role: 'super_admin',
        permissions: {
          clients: { view: true, edit: true },
          invoices: { view: true, edit: true },
          expenses: { view: true, edit: true },
          reports: { view: true, export: true }
        },
        createdAt: currentUser?.createdAt || new Date().toISOString()
      }
    ];

    // Load any locally saved team members
    try {
      const saved = localStorage.getItem(`wisco_team_${currentUser?.uid || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Merge avoiding duplicates
          parsed.forEach((m: TeamMemberRecord) => {
            if (!initialList.some(item => item.email.toLowerCase() === m.email.toLowerCase())) {
              initialList.push(m);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not read cached team:', e);
    }

    setTeamList(initialList);
  }, [isOpen, currentUser]);

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = 'Wisco-';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  // Adjust permissions defaults when role changes
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'super_admin') {
      setPermissions({
        clients: { view: true, edit: true },
        invoices: { view: true, edit: true },
        expenses: { view: true, edit: true },
        reports: { view: true, export: true }
      });
    } else if (newRole === 'admin') {
      setPermissions({
        clients: { view: true, edit: true },
        invoices: { view: true, edit: true },
        expenses: { view: true, edit: true },
        reports: { view: true, export: false }
      });
    } else {
      // Staff default: View permissions
      setPermissions({
        clients: { view: true, edit: false },
        invoices: { view: true, edit: false },
        expenses: { view: true, edit: false },
        reports: { view: false, export: false }
      });
    }
  };

  const handleCheckboxChange = (
    moduleKey: 'clients' | 'invoices' | 'expenses' | 'reports',
    actionKey: 'view' | 'edit' | 'export'
  ) => {
    setPermissions((prev) => {
      const mod = prev[moduleKey] || { view: false, edit: false };
      const currentVal = Boolean((mod as any)[actionKey]);
      const updatedMod = {
        ...mod,
        [actionKey]: !currentVal
      };

      // If granting edit/export, ensure view is also enabled
      if (actionKey !== 'view' && !currentVal) {
        (updatedMod as any).view = true;
      }
      // If revoking view, also revoke edit/export
      if (actionKey === 'view' && currentVal) {
        if ('edit' in updatedMod) (updatedMod as any).edit = false;
        if ('export' in updatedMod) (updatedMod as any).export = false;
      }

      return {
        ...prev,
        [moduleKey]: updatedMod
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setCreatedCredentials(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanTitle = jobTitle.trim();
    const cleanPassword = tempPassword.trim();

    if (!cleanName) {
      setError(isArabic ? 'يرجى إدخال اسم الموظف بالكامل.' : 'Please enter the employee full name.');
      return;
    }
    if (!cleanTitle) {
      setError(isArabic ? 'يرجى إدخال المسمى الوظيفي.' : 'Please enter the job title.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(isArabic ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setError(isArabic ? 'كلمة المرور المؤقتة يجب أن تتكون من 6 أحرف على الأقل.' : 'Temporary password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const payload = {
      email: cleanEmail,
      password: cleanPassword,
      fullName: cleanName,
      jobTitle: cleanTitle,
      role,
      permissions
    };

    try {
      // 1. Invoke Supabase Edge Function 'admin-create-user'
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('admin-create-user', {
        body: payload
      });

      if (edgeErr) {
        console.warn('Edge Function admin-create-user response notice:', edgeErr);
      }

      // Record new employee locally and in team list
      const newMember: TeamMemberRecord = {
        id: edgeData?.user?.id || `usr-${Date.now()}`,
        fullName: cleanName,
        jobTitle: cleanTitle,
        email: cleanEmail,
        role,
        permissions,
        createdAt: new Date().toISOString()
      };

      const updatedTeam = [newMember, ...teamList];
      setTeamList(updatedTeam);

      try {
        localStorage.setItem(`wisco_team_${currentUser?.uid || 'default'}`, JSON.stringify(updatedTeam));
      } catch (saveErr) {
        console.warn('Could not persist team list:', saveErr);
      }

      setLoading(false);
      setSuccessNotice(
        isArabic 
          ? `تم إنشاء حساب الموظف (${cleanName}) بنجاح!` 
          : `Employee account for (${cleanName}) created successfully!`
      );
      setCreatedCredentials({
        email: cleanEmail,
        tempPassword: cleanPassword,
        fullName: cleanName,
        role
      });

      // Reset form fields
      setFullName('');
      setJobTitle('');
      setEmail('');
      setTempPassword('');
      setRole('staff');
      setPermissions({
        clients: { view: true, edit: false },
        invoices: { view: true, edit: false },
        expenses: { view: true, edit: false },
        reports: { view: false, export: false }
      });
    } catch (err: any) {
      setLoading(false);
      console.error('Error invoking admin-create-user:', err);
      setError(err.message || (isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'Failed to create employee sub-account.'));
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `WISCO Sub-Account Credentials:\nName: ${createdCredentials.fullName}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}\nRole: ${createdCredentials.role}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="team-management-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="team-management-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isArabic ? 'إدارة الفريق والحسابات الفرعية' : 'Team & Sub-Accounts'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic 
                  ? 'إضافة موظفين جدد وتحديد مصفوفة الصلاحيات الدقيقة' 
                  : 'Add team members, assign roles, and configure fine-grained permissions'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-team-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Guard */}
        {!isSuperAdmin ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isArabic ? 'صلاحيات غير كافية' : 'Restricted Access'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {isArabic 
                ? 'هذه الميزة متاحة فقط للمشرف العام (Super Admin). دورك الحالي لا يسمح بإدارة حسابات الفريق.' 
                : 'This section is restricted strictly to users with the Super Admin role. Your current account role does not have permission to manage team sub-accounts.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab navigation: Add New vs Team Roster */}
            <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                id="tab-team-create"
                type="button"
                onClick={() => setActiveTab('create')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة موظف جديد' : 'Add New Employee'}</span>
              </button>
              <button
                id="tab-team-list"
                type="button"
                onClick={() => setActiveTab('list')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'list'
                    ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isArabic ? `أعضاء الفريق (${teamList.length})` : `Team Roster (${teamList.length})`}</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Notifications */}
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {successNotice && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span className="font-semibold">{successNotice}</span>
                </div>
              )}

              {/* Created Credentials Sharing Card */}
              {createdCredentials && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-sky-300">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      <span>{isArabic ? 'بيانات دخول الموظف الجديد' : 'New Employee Credentials Created'}</span>
                    </div>
                    <button
                      id="btn-copy-new-credentials"
                      type="button"
                      onClick={copyCredentials}
                      className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ البيانات' : 'Copy Credentials')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <div>
                      <span className="text-slate-400 select-none block text-[10px]">Email:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 select-all">{createdCredentials.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 select-none block text-[10px]">Temporary Password:</span>
                      <span className="font-bold text-blue-600 dark:text-sky-400 select-all">{createdCredentials.tempPassword}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic 
                      ? 'شارك هذه البيانات مع الموظف ليتمكن من تسجيل الدخول وتغيير كلمة المرور الخاصة به.' 
                      : 'Share these credentials with the employee. They can sign in and change their password in Account Settings.'}
                  </p>
                </div>
              )}

              {/* TAB 1: ADD NEW EMPLOYEE FORM */}
              {activeTab === 'create' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Employee Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isArabic ? 'الاسم بالكامل' : 'Employee Full Name'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                        <input
                          id="input-employee-full-name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Job Title */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isArabic ? 'المسمى الوظيفي' : 'Job Title'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                        <input
                          id="input-employee-job-title"
                          type="text"
                          required
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Senior Billing Specialist"
                          className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isArabic ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                        <input
                          id="input-employee-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah@agency.com"
                          className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isArabic ? 'الدور الوظيفي' : 'Role'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="select-employee-role"
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="staff">{isArabic ? 'موظف (Staff)' : 'Staff (Focused Access)'}</option>
                        <option value="admin">{isArabic ? 'مشرف (Admin)' : 'Admin (Operations & Workspace)'}</option>
                        <option value="super_admin">{isArabic ? 'مشرف عام (Super Admin)' : 'Super Admin (Unrestricted)'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Temporary Password with "Generate random" button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isArabic ? 'كلمة المرور المؤقتة' : 'Temporary Password'} <span className="text-red-500">*</span>
                      </label>
                      <button
                        id="btn-generate-random-password"
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isArabic ? 'توليد كلمة مرور عشوائية' : 'Generate random'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                      <input
                        id="input-employee-temp-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-24 rtl:pl-24 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rtl:right-auto rtl:left-3 px-2 py-1"
                      >
                        {showPassword ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'إظهار' : 'Show')}
                      </button>
                    </div>
                  </div>

                  {/* Fine-grained Access Checkboxes (Permissions Matrix) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                        <span>{isArabic ? 'مصفوفة الصلاحيات الدقيقة (JSON Matrix)' : 'Fine-Grained Access Permissions'}</span>
                      </h4>
                      {role === 'super_admin' && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {isArabic ? 'صلاحيات كاملة للمشرف العام' : 'Full access automatically granted'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Clients Module */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isArabic ? 'العملاء (Clients)' : 'Clients Module'}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-clients-view"
                              type="checkbox"
                              checked={Boolean(permissions.clients?.view)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('clients', 'view')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>View</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-clients-edit"
                              type="checkbox"
                              checked={Boolean(permissions.clients?.edit)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('clients', 'edit')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Edit / Delete</span>
                          </label>
                        </div>
                      </div>

                      {/* Invoices Module */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isArabic ? 'الفواتير (Invoices)' : 'Invoices Module'}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-invoices-view"
                              type="checkbox"
                              checked={Boolean(permissions.invoices?.view)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('invoices', 'view')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>View</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-invoices-edit"
                              type="checkbox"
                              checked={Boolean(permissions.invoices?.edit)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('invoices', 'edit')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Edit / Create</span>
                          </label>
                        </div>
                      </div>

                      {/* Expenses Module */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isArabic ? 'المصروفات (Expenses)' : 'Expenses Module'}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-expenses-view"
                              type="checkbox"
                              checked={Boolean(permissions.expenses?.view)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('expenses', 'view')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>View</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-expenses-edit"
                              type="checkbox"
                              checked={Boolean(permissions.expenses?.edit)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('expenses', 'edit')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Edit / Create</span>
                          </label>
                        </div>
                      </div>

                      {/* Financial Reports Module */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isArabic ? 'التقارير المالية (Reports)' : 'Financial Reports'}
                        </span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-reports-view"
                              type="checkbox"
                              checked={Boolean(permissions.reports?.view)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('reports', 'view')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>View</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                            <input
                              id="perm-reports-export"
                              type="checkbox"
                              checked={Boolean(permissions.reports?.export)}
                              disabled={role === 'super_admin'}
                              onChange={() => handleCheckboxChange('reports', 'export')}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Export</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      id="btn-submit-create-employee"
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{isArabic ? 'جاري الإنشاء...' : 'Creating Account...'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'إنشاء حساب الموظف' : 'Create Employee Sub-Account'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: TEAM ROSTER LIST */}
              {activeTab === 'list' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
                    <input
                      id="input-search-team"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={isArabic ? 'بحث بالاسم أو البريد أو المسمى الوظيفي...' : 'Search employees by name, title, or email...'}
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-3">
                    {teamList
                      .filter(m => 
                        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((member) => (
                        <div 
                          key={member.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white ${
                              member.role === 'super_admin'
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-600'
                                : member.role === 'admin'
                                ? 'bg-gradient-to-tr from-blue-600 to-sky-500'
                                : 'bg-gradient-to-tr from-slate-600 to-slate-700'
                            }`}>
                              {member.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {member.fullName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  member.role === 'super_admin'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : member.role === 'admin'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {member.role === 'super_admin' ? 'Super Admin' : member.role === 'admin' ? 'Admin' : 'Staff'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {member.jobTitle} • <span className="font-mono">{member.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Permissions summary pills */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              member.permissions?.clients?.edit ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              Clients: {member.permissions?.clients?.edit ? 'Edit' : member.permissions?.clients?.view ? 'View' : 'None'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              member.permissions?.invoices?.edit ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              Invoices: {member.permissions?.invoices?.edit ? 'Edit' : member.permissions?.invoices?.view ? 'View' : 'None'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              member.permissions?.reports?.export ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              Reports: {member.permissions?.reports?.export ? 'Export' : member.permissions?.reports?.view ? 'View' : 'None'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
