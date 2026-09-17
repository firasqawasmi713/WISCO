import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_PLACES_API_KEY environment variable' });
  }

  try {
    // 1. Check monthly collection limit to prevent charges (Cap at 3,000 places/month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('business_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (count >= 3000) {
      return res.status(429).json({ error: 'Free monthly quota safety limit (3,000) reached.' });
    }

    // 2. Call Google Places API (New) Text Search
    // Strict FieldMask: Request ONLY minimal fields to keep costs in the lowest tier
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
    if (!data.places || data.places.length === 0) {
      return res.status(200).json({ message: 'No places found', inserted: 0 });
    }

    // 3. Format and clean records
    const leadsToInsert = data.places.map((place) => ({
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      category: category || place.primaryType || 'General',
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      email: null // Google does not provide emails directly
    }));

    // 4. Save to Supabase (ignore duplicates if place_id already exists)
    const { error: insertError } = await supabase
      .from('business_leads')
      .upsert(leadsToInsert, { onConflict: 'place_id', ignoreDuplicates: true });

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      found: leadsToInsert.length,
      message: `Successfully collected ${leadsToInsert.length} businesses.`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
