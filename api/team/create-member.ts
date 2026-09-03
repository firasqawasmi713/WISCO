import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Kept secure on server
);

export default async function handler(req: any, res: any) {
  const { email, password, role, department, permissions, companyId } = req.body;

  // 1. Create auth user with pre-set password & auto-confirm email
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) return res.status(400).json({ error: authError.message });

  // 2. Link the created user directly into company_members
  const { data: memberData, error: memberError } = await supabaseAdmin
    .from('company_members')
    .insert([{
      company_id: companyId,
      user_id: authData.user.id,
      role,
      department,
      permissions
    }])
    .select()
    .single();

  if (memberError) return res.status(400).json({ error: memberError.message });

  return res.status(200).json({ success: true, member: memberData });
}
