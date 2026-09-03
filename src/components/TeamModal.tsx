import React, { useState, useEffect } from 'react';
import { getCurrentUserMembership, inviteEmployee } from '../services/teamService';

interface TeamModalProps {
  onClose: () => void;
}

export default function TeamModal({ onClose }: TeamModalProps) {
  const [membership, setMembership] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMembership() {
      try {
        const data = await getCurrentUserMembership();
        setMembership(data);
      } catch (err: any) {
        console.error('Failed to load membership:', err);
      }
    }
    loadMembership();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership?.company_id) return;

    setLoading(true);
    setStatus('');
    try {
      await inviteEmployee(email, role, membership.company_id);
      setStatus('Invitation sent successfully!');
      setEmail('');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const canInvite = membership?.role === 'owner' || membership?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-white space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-semibold">Team Management</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {canInvite ? (
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Employee Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="employee">Employee (Restricted View)</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Sending Invite...' : 'Send Invitation'}
            </button>

            {status && <p className="text-xs text-center mt-2 text-indigo-400">{status}</p>}
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            You must be a company Owner or Admin to invite new members.
          </p>
        )}
      </div>
    </div>
  );
}
