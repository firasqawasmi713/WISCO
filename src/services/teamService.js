import { createClient } from '@supabase/supabase-js';

// Fallback to your active Supabase project endpoint if env vars are not set
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://cplbrwzfgfvquolfowt.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholderKey'; // Replace with your real Supabase anon key if not using env vars

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    .select('company_id, role, companies(name)')
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
