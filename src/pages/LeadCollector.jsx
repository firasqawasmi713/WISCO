import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import * as XLSX from 'xlsx';

export default function LeadCollector() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingApi, setFetchingApi] = useState(false);

  // Search and Fetch Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTag, setCategoryTag] = useState('');

  // Pagination State
  const [nextPageToken, setNextPageToken] = useState(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  // Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch leads strictly for the authenticated user
  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('business_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error loading user leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // 2. Trigger initial collection via your Vercel endpoint (Page 1)
  const handleCollectPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to collect leads.');
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

      if (!res.ok) throw new Error(data?.error || 'Failed to fetch places');

      alert(data.message || 'Collection successful!');
      
      // Store active search and token for "Load More"
      setActiveQuery(searchQuery);
      setActiveCategory(categoryTag);
      setNextPageToken(data.nextPageToken || null);

      loadLeads();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setFetchingApi(false);
    }
  };

  // 3. Trigger next page collection using nextPageToken (Pages 2 & 3)
  const handleLoadMorePlaces = async () => {
    if (!nextPageToken || !activeQuery) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to collect leads.');
      return;
    }

    setFetchingApi(true);
    try {
      const res = await fetch('/api/fetch-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: activeQuery, 
          category: activeCategory,
          userId: user.id,
          pageToken: nextPageToken // Pass the pagination token back
        })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server responded with status ${res.status}`);
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to fetch places');

      alert(data.message || 'Next batch collected successfully!');
      
      // Update token (will be null after page 3)
      setNextPageToken(data.nextPageToken || null);

      loadLeads();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setFetchingApi(false);
    }
  };

  // 4. Filter Table Data
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (item.phone && item.phone.includes(tableSearch)) ||
      (item.email && item.email.toLowerCase().includes(tableSearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;

    const leadDate = new Date(item.created_at);
    const matchesStart = startDate ? leadDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? leadDate <= new Date(endDate + 'T23:59:59') : true;

    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  // 5. Export to Excel
  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert('No data to export.');
      return;
    }

    const excelData = filteredLeads.map((item) => ({
      'Business Name': item.name,
      'Category': item.category || 'N/A',
      'Phone Number': item.phone || 'N/A',
      'Email': item.email || 'N/A',
      'Website': item.website || 'N/A',
      'Date Added': new Date(item.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `wiscolab_leads_${Date.now()}.xlsx`);
  };

  // Extract unique categories for dropdown filter
  const uniqueCategories = ['ALL', ...new Set(leads.map((l) => l.category).filter(Boolean))];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '22px', fontWeight: 'bold' }}>Lead Collection & Discovery</h2>

      {/* Auto-Discovery Bar */}
      <div style={{ marginBottom: '24px' }}>
        <form onSubmit={handleCollectPlaces} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="e.g. Restaurants in Amman, Gyms in Dubai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <input
            type="text"
            placeholder="Custom Category Tag (e.g. Hospitality)"
            value={categoryTag}
            onChange={(e) => setCategoryTag(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <button 
            type="submit" 
            disabled={fetchingApi} 
            style={{ 
              padding: '10px 20px', 
              cursor: fetchingApi ? 'not-allowed' : 'pointer',
              backgroundColor: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            {fetchingApi ? 'Collecting...' : 'Collect Places'}
          </button>
        </form>

        {/* Load More Button: shows when nextPageToken exists */}
        {nextPageToken && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleLoadMorePlaces}
              disabled={fetchingApi}
              style={{
                padding: '8px 16px',
                cursor: fetchingApi ? 'not-allowed' : 'pointer',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              {fetchingApi ? 'Fetching next batch...' : `Load More Leads for "${activeQuery}"`}
            </button>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              More places are available from Google for this search.
            </span>
          </div>
        )}
      </div>

      {/* Table Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search filtered table..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />

        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>From:
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
          />
        </label>

        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>To:
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
          />
        </label>

        <button 
          type="button"
          onClick={exportToExcel} 
          style={{ 
            marginLeft: 'auto', 
            padding: '8px 16px', 
            background: '#107c41', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Export to Excel (.xlsx)
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading database records...</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Website</th>
                <th style={{ padding: '12px' }}>Collected On</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No leads found.</td></tr>
              ) : (
                filteredLeads.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>{item.category}</td>
                    <td style={{ padding: '12px' }}>{item.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>{item.email || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      {item.website ? (
                        <a href={item.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          Visit
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
