export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category, userId } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'User must be authenticated' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_PLACES_API_KEY environment variable in Vercel' });
  }

  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    'https://cplbrwzfgfvqfuolfowt.supabase.co';

  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase Key in Vercel' });
  }

  try {
    // 1. Monthly quota check (Max 3,000 total across the app to stay $0)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/business_leads?created_at=gte.${startOfMonth.toISOString()}&select=id`,
      {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range-Unit': 'items',
          'Prefer': 'count=exact'
        }
      }
    );

    const contentRange = countRes.headers.get('content-range');
    const totalCount = contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;

    if (!isNaN(totalCount) && totalCount >= 3000) {
      return res.status(429).json({ error: 'Free monthly quota safety limit (3,000) reached.' });
    }

    // 2. Query Google Places API (New) Text Search
    const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
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

    const data = await googleRes.json();

    if (data.error) {
      return res.status(400).json({ error: `Google API error: ${data.error.message || data.error.status}` });
    }

    if (!data.places || data.places.length === 0) {
      return res.status(200).json({ message: 'No places found for this query', inserted: 0 });
    }

    // 3. Format leads with user_id attached
    const leadsToInsert = data.places.map((place: any) => ({
      user_id: userId,
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      category: category || place.primaryType || 'General',
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      email: null
    }));

    // 4. Save to Supabase resolving on (user_id, place_id)
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/business_leads?on_conflict=user_id,place_id`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify(leadsToInsert)
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase DB error: ${errText}`);
    }

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
