export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category, userId, limit = 20 } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'User must be authenticated' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_PLACES_API_KEY in Vercel' });
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
    // 1. Check monthly safety limit (3,000 places total)
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

    // 2. Fetch Places from Google (supporting pagination up to requested limit)
    const targetCount = Math.min(Math.max(Number(limit) || 20, 1), 60); // Cap per run at 60
    let accumulatedPlaces: any[] = [];
    let nextPageToken: string | null = null;

    do {
      const pageSize = Math.min(targetCount - accumulatedPlaces.length, 20);
      const payload: any = {
        textQuery: query,
        pageSize: pageSize
      };
      if (nextPageToken) {
        payload.pageToken = nextPageToken;
      }

      const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryType,places.nationalPhoneNumber,places.websiteUri,nextPageToken'
        },
        body: JSON.stringify(payload)
      });

      const data = await googleRes.json();

      if (data.error) {
        return res.status(400).json({ error: `Google API error: ${data.error.message || data.error.status}` });
      }

      if (data.places && data.places.length > 0) {
        accumulatedPlaces.push(...data.places);
      }

      nextPageToken = data.nextPageToken || null;

      // Google requires a short pause between page tokens
      if (nextPageToken && accumulatedPlaces.length < targetCount) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        break;
      }
    } while (accumulatedPlaces.length < targetCount && nextPageToken);

    if (accumulatedPlaces.length === 0) {
      return res.status(200).json({ message: 'No places found for this query', inserted: 0 });
    }

    // 3. Format records
    const leadsToInsert = accumulatedPlaces.map((place: any) => ({
      user_id: userId,
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      category: category || place.primaryType || 'General',
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      email: null
    }));

    // 4. Upsert to Supabase: ignores existing duplicates for this specific user
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/business_leads?on_conflict=user_id,place_id`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify(leadsToInsert)
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase DB error: ${errText}`);
    }

    const insertedRows = await insertRes.json();
    const newCount = Array.isArray(insertedRows) ? insertedRows.length : 0;
    const dupCount = leadsToInsert.length - newCount;

    return res.status(200).json({
      success: true,
      found: leadsToInsert.length,
      inserted: newCount,
      message: newCount > 0 
        ? `Added ${newCount} new leads (${dupCount} duplicate places skipped).`
        : `All ${leadsToInsert.length} places are already saved in your leads table.`
    });
  } catch (error: any) {
    console.error('Fetch places handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
