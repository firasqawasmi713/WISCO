import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, department, permissions, companyId } = req.body;

  if (!email || !password || !companyId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 1. Create the auth user with predetermined password & confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_id: companyId }
    });

    if (authError) throw authError;

    // 2. Insert member record with department and custom permissions
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert([
        {
          company_id: companyId,
          user_id: authData.user.id,
          role: role || 'member',
          department: department || 'General',
          permissions: permissions || {
            dashboard: { view: true, edit: false },
            clients: { view: true, edit: false },
            invoices: { view: false, edit: false },
            spendings: { view: false, edit: false },
            events: { view: true, edit: false },
            reports: { view: false, edit: false }
          }
        }
      ])
      .select()
      .single();

    if (memberError) throw memberError;

    return res.status(200).json({ success: true, member: memberData });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Error creating team member' });
  }
}
