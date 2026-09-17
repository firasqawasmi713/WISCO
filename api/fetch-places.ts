import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_PLACES_API_KEY environment variable in Vercel' });
  }

  const supabaseUrl = 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://cplbrwzgfqfuolfowt.supabase.co';

  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase service role or anon key in Vercel' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Monthly quota safeguard (Max 3,000 places/month to ensure zero surprise costs)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from('business_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (!countErr && typeof count === 'number' && count >= 3000) {
      return res.status(429).json({ error: 'Free monthly quota safety limit (3,000) reached.' });
    }

    // 2. Query Google Places API (New) Text Search
    // Strict FieldMask ensures you stay on the lowest pricing SKU
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryType,places.nationalPhoneNumber,places.websiteUri'
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 20
      })
    });

    const data = await response.json();

    // Catch Google-specific errors (e.g. invalid key or unbilled project)
    if (data.error) {
      return res.status(400).json({ error: `Google API error: ${data.error.message || data.error.status}` });
    }

    if (!data.places || data.places.length === 0) {
      return res.status(200).json({ message: 'No places found for this query', inserted: 0 });
    }

    // 3. Format and clean records
    const leadsToInsert = data.places.map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      category: category || place.primaryType || 'General',
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      email: null
    }));

    // 4. Save to Supabase (skip duplicates)
    const { error: insertError } = await supabase
      .from('business_leads')
      .upsert(leadsToInsert, { onConflict: 'place_id', ignoreDuplicates: true });

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      found: leadsToInsert.length,
      message: `Successfully collected ${leadsToInsert.length} businesses.`
    });
  } catch (error: any) {
    console.error('Fetch places handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
