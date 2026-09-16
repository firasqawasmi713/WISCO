import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  Mail, 
  MessageSquare, 
  Trash2, 
  File, 
  FileText, 
  Image as ImageIcon 
} from 'lucide-react';
import { supabase } from './services/supabase';

interface DriveFile {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export const DriveView: React.FC = () => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Fetch Files
  const fetchFiles = async () => {
    let query = supabase.from('files').select('*').order('created_at', { ascending: false });
    
    if (filterType !== 'all') {
      query = query.ilike('mime_type', `%${filterType}%`);
    }
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (!error && data) setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
  }, [searchTerm, filterType]);

  // Handle Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `drive/${Date.now()}_${file.name}`;

    const { error: storageError } = await supabase.storage
      .from('company_drive')
      .upload(filePath, file);

    if (!storageError) {
      await supabase.from('files').insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });
      fetchFiles();
    }
    setUploading(false);
  };

  // Handle Download
  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage
      .from('company_drive')
      .createSignedUrl(filePath, 60);

    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      a.click();
    }
  };

  // Handle Rename
  const handleRename = async (id: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('files')
      .update({ name: newName })
      .eq('id', id);

    if (!error) {
      setRenamingId(null);
      setNewName('');
      fetchFiles();
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, filePath: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    const { error: storageError } = await supabase.storage
      .from('company_drive')
      .remove([filePath]);

    if (!storageError) {
      await supabase.from('files').delete().eq('id', id);
      fetchFiles();
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('company_drive')
      .createSignedUrl(filePath, 86400); // 24hr valid link

    if (data?.signedUrl) {
      const text = encodeURIComponent(`Here is the shared file: ${data.signedUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // Share via Email (Resend API Route)
  const shareEmail = async (filePath: string, fileName: string) => {
    const recipient = prompt('Enter recipient email:');
    if (!recipient) return;

    const { data } = await supabase.storage
      .from('company_drive')
      .createSignedUrl(filePath, 86400);

    if (data?.signedUrl) {
      await fetch('/api/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailTo: recipient, fileUrl: data.signedUrl, fileName })
      });
      alert('Email sent successfully!');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Drive</h1>
        
        <label className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl cursor-pointer font-medium text-sm transition-all shadow-md shadow-blue-900/20">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Files List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Size</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {files.length > 0 ? (
              files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    {file.mime_type.includes('image') ? (
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-emerald-500" />
                    )}
                    {renamingId === file.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={file.name}
                          onChange={(e) => setNewName(e.target.value)}
                          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 rounded text-sm text-slate-800 dark:text-white outline-none"
                        />
                        <button onClick={() => handleRename(file.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition-colors">Save</button>
                        <button onClick={() => setRenamingId(null)} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded">Cancel</button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-800 dark:text-white">{file.name}</span>
                    )}
                  </td>
                  <td className="p-4">{(file.file_size / (1024 * 1024)).toFixed(2)} MB</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleDownload(file.file_path, file.name)} title="Download" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setRenamingId(file.id); setNewName(file.name); }} title="Rename" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-amber-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => shareWhatsApp(file.file_path)} title="Share on WhatsApp" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => shareEmail(file.file_path, file.name)} title="Share via Email" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(file.id, file.file_path)} title="Delete File" className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  No files found. Click "Upload Files" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
