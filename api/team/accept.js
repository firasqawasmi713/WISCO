import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Please log in to accept this invitation' });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data, error } = await supabase.rpc('accept_invitation', {
      invite_token: inviteToken
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.success) {
      return res.status(400).json({ error: data.error });
    }

    return res.status(200).json({ 
      success: true, 
      companyId: data.company_id,
      message: 'Successfully joined company' 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
