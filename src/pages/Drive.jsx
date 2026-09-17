import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this matches your Supabase client path

export default function Drive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Get current authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // 2. Fetch files once the user is identified
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // List files inside the user's specific folder: `${user.id}/`
      const { data, error } = await supabase.storage
        .from('user-drive')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setErrorMsg(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // 3. Upload a file
  const handleFileUpload = async (event) => {
    try {
      setErrorMsg('');
      const file = event.target.files[0];
      if (!file) return;

      setUploading(true);

      // Path format: userId/fileName
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from('user-drive')
        .upload(filePath, file);

      if (error) throw error;

      // Reset file input and refresh file list
      event.target.value = null;
      await loadFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // 4. Download a file
  const handleDownload = async (fileName) => {
    try {
      setErrorMsg('');
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user-drive')
        .download(filePath);

      if (error) throw error;

      // Trigger browser file download
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.replace(/^\d+_/, ''); // Clean timestamp prefix if present
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      setErrorMsg(err.message || 'Download failed');
    }
  };

  // 5. Delete a file
  const handleDelete = async (fileName) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${fileName}?`);
    if (!confirmed) return;

    try {
      setErrorMsg('');
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('user-drive')
        .remove([filePath]);

      if (error) throw error;

      // Remove from local list state
      setFiles(files.filter((item) => item.name !== fileName));
    } catch (err) {
      console.error('Delete failed:', err);
      setErrorMsg(err.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Personal Drive</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>Store, download, and manage your private files.</p>
        </div>

        {/* Upload Button */}
        <label style={{
          backgroundColor: uploading ? '#a0aec0' : '#2563eb',
          color: '#fff',
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontWeight: '500'
        }}>
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Files List / Table */}
      {loading ? (
        <p style={{ color: '#666' }}>Loading files...</p>
      ) : files.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#888' }}>
          No files uploaded yet. Click <strong>Upload File</strong> above to get started.
        </div>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem' }}>File Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                <th style={{ padding: '0.75rem 1rem' }}>Uploaded</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id || file.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                    {file.name.replace(/^\d+_/, '')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {formatFileSize(file.metadata?.size)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {file.created_at ? new Date(file.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDownload(file.name)}
                      style={{ marginRight: '0.5rem', padding: '0.35rem 0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      style={{ padding: '0.35rem 0.75rem', background: '#fff', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
