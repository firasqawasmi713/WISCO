import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Upload, Download, Trash2, File, Loader2 } from 'lucide-react';

interface DriveViewProps {
  userId?: string;
  lang?: string;
}

interface StorageFile {
  name: string;
  id?: string;
  created_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

export const DriveView: React.FC<DriveViewProps> = ({ userId, lang = 'en' }) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isArabic = lang === 'ar';
  const BUCKET_NAME = 'company_drive';

  const loadFiles = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Passing explicit empty path and search options prevents 400 Bad Request
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
          search: ''
        });

      if (error) throw error;

      // Filter out root metadata artifacts and hidden placeholders
      const validFiles = (data || []).filter(
        (f) => f && f.name && !f.name.startsWith('.') && f.name !== '.emptyFolderPlaceholder'
      );

      setFiles(validFiles as StorageFile[]);
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err?.message?.includes('not found') || err?.statusCode === 404 || err?.status === 404) {
        setFiles([]);
      } else {
        setErrorMessage(err.message || 'Failed to retrieve files');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErrorMessage('');

      // Clean file name to avoid invalid URI characters
      const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      e.target.value = '';
      await loadFiles();
    } catch (err: any) {
      console.error('Storage Upload Error:', err);
      setErrorMessage(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(fileName);

      if (error) throw error;

      const blobUrl = window.URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName.replace(/^\d+_/, '');
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (fileName: string) => {
    const confirmDelete = window.confirm(
      isArabic ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Are you sure you want to delete this file?'
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) throw error;
      setFiles((prev) => prev.filter((item) => item.name !== fileName));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isArabic ? 'الملفات' : 'Drive'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isArabic ? 'إدارة وتحميل الملفات والمستندات' : 'Upload, manage, and download your documents.'}
          </p>
        </div>

        <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all cursor-pointer ${
          uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{uploading ? (isArabic ? 'جاري الرفع...' : 'Uploading...') : (isArabic ? 'رفع ملف' : 'Upload Files')}</span>
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500">
          <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-sm">
            {isArabic ? 'لا توجد ملفات حالياً. اضغط على رفع ملف للبدء.' : 'No files found. Click "Upload Files" to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left rtl:text-right border-collapse text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">{isArabic ? 'الاسم' : 'Name'}</th>
                <th className="py-3 px-4">{isArabic ? 'الحجم' : 'Size'}</th>
                <th className="py-3 px-4 text-right rtl:text-left">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {files.map((file) => (
                <tr key={file.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                    <File className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate max-w-xs sm:max-w-md">{file.name.replace(/^\d+_/, '')}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatSize(file.metadata?.size)}
                  </td>
                  <td className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
                      title={isArabic ? 'تحميل' : 'Download'}
                    >
                      <Download className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title={isArabic ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4 inline" />
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
};
