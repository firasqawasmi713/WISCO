import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, role, companyId } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: invite, error: dbError } = await supabase
      .from('company_invitations')
      .insert({
        email: email.trim().toLowerCase(),
        role,
        company_id: companyId
      })
      .select('token')
      .single();

    if (dbError) {
      return res.status(403).json({ error: dbError.message });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wiscolab.com';
    const inviteUrl = `${appUrl}/accept-invite?token=${invite.token}`;

    await resend.emails.send({
      from: 'WISCO <no-reply@wiscolab.com>',
      to: email,
      subject: "You've been invited to join WISCO",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #111;">
          <h2>Join your team on WISCO</h2>
          <p>You have been invited as <strong>${role}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">This invitation expires in 7 days.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'Invitation sent' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
