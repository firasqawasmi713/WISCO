// 1. Load leads only for the authenticated session
  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLeads([]);
        return;
      }

      const { data, error } = await supabase
        .from('business_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Pass userId in the POST payload
  const handleCollectPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in first.');
      return;
    }

    setFetchingApi(true);
    try {
      const res = await fetch('/api/fetch-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery, 
          category: categoryTag,
          userId: user.id 
        })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server responded with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to fetch places');

      alert(data.message || 'Collection successful!');
      setSearchQuery('');
      setCategoryTag('');
      loadLeads();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setFetchingApi(false);
    }
  };
