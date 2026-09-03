import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Shield, 
  Briefcase, 
  Lock, 
  Mail, 
  Check, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Eye,
  Edit3
} from 'lucide-react';
import { getCurrentUserMembership, createDirectMember } from '../services/teamService';

interface TeamModalProps {
  onClose: () => void;
}

interface TabPermissionConfig {
  view: boolean;
  edit: boolean;
}

type NavTabKey = 'dashboard' | 'clients' | 'invoices' | 'spendings' | 'events' | 'reports';

const TAB_CONFIGS: { id: NavTabKey; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clients', label: 'Clients & Projects' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'spendings', label: 'Spendings & Expenses' },
  { id: 'events', label: 'Events & Calendar' },
  { id: 'reports', label: 'Financial Reports' },
];

export default function TeamModal({ onClose }: TeamModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [department, setDepartment] = useState('Finance');

  // Permissions Matrix
  const [permissions, setPermissions] = useState<Record<NavTabKey, TabPermissionConfig>>({
    dashboard: { view: true, edit: false },
    clients: { view: true, edit: false },
    invoices: { view: false, edit: false },
    spendings: { view: false, edit: false },
    events: { view: true, edit: false },
    reports: { view: false, edit: false },
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check Owner/Admin Status and retrieve companyId
  useEffect(() => {
    async function loadCompanyData() {
      try {
        const mem = await getCurrentUserMembership();
        if (mem) {
          setCompanyId(mem.company_id);
          setUserRole(mem.role);
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to authenticate permissions' });
      } finally {
        setLoading(false);
      }
    }
    loadCompanyData();
  }, []);

  const togglePermission = (tab: NavTabKey, field: 'view' | 'edit') => {
    setPermissions((prev) => {
      const current = prev[tab];
      const nextValue = !current[field];
      return {
        ...prev,
        [tab]: {
          ...current,
          [field]: nextValue,
          // If enabling edit, automatically enable view
          ...(field === 'edit' && nextValue ? { view: true } : {}),
          // If disabling view, automatically disable edit
          ...(field === 'view' && !nextValue ? { edit: false } : {}),
        },
      };
    });
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!companyId) {
      setFeedback({ type: 'error', message: 'No company account linked.' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      await createDirectMember({
        email: email.trim(),
        password,
        role,
        department,
        companyId,
        permissions,
      });

      setFeedback({
        type: 'success',
        message: `Account created for ${email}. They can log in immediately.`,
      });

      // Clear Inputs
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not provision member account.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorized = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F1E36] border border-slate-700/70 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[#162744]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold">Team Member Provisioning</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-slate-400">Verifying access level...</p>
            </div>
          ) : !isAuthorized ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">You must be a Company Owner or Admin to provision accounts.</p>
            </div>
          ) : (
            <form onSubmit={handleCreateMember} className="space-y-5">
              {/* Feedback Alert */}
              {feedback && (
                <div 
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm ${
                    feedback.type === 'success' 
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Member Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="w-full bg-black/20 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-black/20 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-[#11233F] border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white transition-all cursor-pointer appearance-none"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Finance, Sales, Operations"
                      className="w-full bg-black/20 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Granular Permissions Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tab & Action Permissions
                </label>
                <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-black/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-white/5 text-slate-300 font-semibold">
                        <th className="py-2.5 px-4">Section / Tab</th>
                        <th className="py-2.5 px-4 text-center w-24">Can View</th>
                        <th className="py-2.5 px-4 text-center w-24">Can Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {TAB_CONFIGS.map((tab) => {
                        const hasView = permissions[tab.id]?.view ?? false;
                        const hasEdit = permissions[tab.id]?.edit ?? false;

                        return (
                          <tr key={tab.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-200">
                              {tab.label}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => togglePermission(tab.id, 'view')}
                                className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center ${
                                  hasView 
                                    ? 'bg-sky-600 border-sky-500 text-white' 
                                    : 'bg-white/5 border-slate-700 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => togglePermission(tab.id, 'edit')}
                                className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center ${
                                  hasEdit 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-white/5 border-slate-700 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-xl text-slate-300 hover:bg-white/5 border border-transparent transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 transition-all text-white flex items-center gap-2 shadow-lg shadow-blue-900/40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Member...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create & Provision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
