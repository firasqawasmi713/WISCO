import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // 1. Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Resolve Environment Variables
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    'https://cplbrwzfgfvquolfowt.supabase.co';

  const serviceRoleKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SERVICE_ROLE || 
    '';

  if (!serviceRoleKey) {
    return res.status(500).json({ 
      error: 'SUPABASE_SERVICE_ROLE_KEY is missing from Vercel Environment Variables.' 
    });
  }

  // 3. Initialize Supabase Admin Client safely inside handler
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 4. Safe body extraction (handles both parsed objects & raw strings)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Malformed JSON payload' });
    }
  }

  const { email, password, role, department, permissions, companyId } = body || {};

  if (!email || !password || !companyId) {
    return res.status(400).json({ 
      error: `Missing parameters. email: ${!!email}, password: ${!!password}, companyId: ${!!companyId}` 
    });
  }

  try {
    // 5. Create Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { 
        company_id: companyId,
        role: role || 'member'
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 6. Insert into company_members
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

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    return res.status(200).json({ success: true, member: memberData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal execution crash' });
  }
}
