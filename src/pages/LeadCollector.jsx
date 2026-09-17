import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Initialize your Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function LeadCollector() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingApi, setFetchingApi] = useState(false);

  // Search and Fetch Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTag, setCategoryTag] = useState('');

  // Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch saved leads from Supabase
  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // 2. Trigger automatic collection via your Vercel endpoint
  const handleCollectPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setFetchingApi(true);
    try {
      const res = await fetch('/api/fetch-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, category: categoryTag })
      });
      const data = await res.json();

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

  // 3. Filter Table Data
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (item.phone && item.phone.includes(tableSearch)) ||
      (item.email && item.email.toLowerCase().includes(tableSearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;

    const leadDate = new Date(item.created_at);
    const matchesStart = startDate ? leadDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? leadDate <= new Date(endDate + 'T23:59:59') : true;

    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  // 4. Export to Excel
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

  // Extract unique categories for the dropdown filter
  const uniqueCategories = ['ALL', ...new Set(leads.map((l) => l.category).filter(Boolean))];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Lead Collection & Discovery</h2>

      {/* Auto-Discovery Bar */}
      <form onSubmit={handleCollectPlaces} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="e.g. Restaurants in Amman, Gyms in Dubai..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          required
          style={{ flex: 2, padding: '10px' }}
        />
        <input
          type="text"
          placeholder="Custom Category Tag (e.g. Hospitality)"
          value={categoryTag}
          onChange={(e) => setCategoryTag(e.target.value)}
          style={{ flex: 1, padding: '10px' }}
        />
        <button type="submit" disabled={fetchingApi} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {fetchingApi ? 'Collecting...' : 'Collect Places'}
        </button>
      </form>

      {/* Table Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search filtered table..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          style={{ padding: '8px' }}
        />

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px' }}>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label style={{ fontSize: '12px' }}>From:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginLeft: '4px', padding: '6px' }} />
        </label>

        <label style={{ fontSize: '12px' }}>To:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ marginLeft: '4px', padding: '6px' }} />
        </label>

        <button onClick={exportToExcel} style={{ marginLeft: 'auto', padding: '8px 16px', background: '#107c41', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Export to Excel (.xlsx)
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading database records...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '8px' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Category</th>
              <th style={{ padding: '10px' }}>Phone</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Website</th>
              <th style={{ padding: '10px' }}>Collected On</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No leads found.</td></tr>
            ) : (
              filteredLeads.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '10px' }}>{item.category}</td>
                  <td style={{ padding: '10px' }}>{item.phone || '-'}</td>
                  <td style={{ padding: '10px' }}>{item.email || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    {item.website ? <a href={item.website} target="_blank" rel="noreferrer">Link</a> : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
