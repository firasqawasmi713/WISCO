import { supabase } from './supabase';

// 1. Create a new company and make the caller the owner
export async function createCompany(companyName) {
  const { data, error } = await supabase.rpc('create_company_with_owner', {
    company_name: companyName
  });
  if (error) throw error;
  return data;
}

// 2. Fetch the current logged-in user's role and company
export async function getCurrentUserMembership() {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 3. Invite a team member using Supabase native auth
export async function inviteEmployee(email, role, companyId) {
  const { data: invite, error } = await supabase
    .from('company_invitations')
    .insert([{ company_id: companyId, email, role }])
    .select()
    .single();

  if (error) throw error;

  const { error: authError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { invite_token: invite.token, company_id: companyId }
    }
  });

  if (authError) throw authError;
  return invite;
}

export interface CreateMemberPayload {
  email: string;
  password?: string;
  role: string;
  department: string;
  companyId: string;
  permissions: Record<string, { view: boolean; edit: boolean }>;
}

export async function createDirectMember(payload: CreateMemberPayload) {
  const response = await fetch('/api/team/create-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create team member');
  }

  return data;
}
