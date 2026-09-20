import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  Folder, 
  FileText, 
  FileImage, 
  FileArchive, 
  FileSpreadsheet, 
  FileCode, 
  Film, 
  Music, 
  File, 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  HardDrive, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { supabase } from '../services/supabase';

// Helper to format bytes into readable units
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper to format ISO date
const formatDate = (dateString, lang = 'en') => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Helper to determine the right icon based on file extension
const getFileIcon = (fileName) => {
  if (!fileName) return <File className="w-5 h-5 text-slate-400" />;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-sky-500" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <Film className="w-5 h-5 text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return <Music className="w-5 h-5 text-pink-500" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'sql'].includes(ext)) {
    return <FileCode className="w-5 h-5 text-indigo-500" />;
  }
  return <File className="w-5 h-5 text-slate-400" />;
};

export const Drive = ({
  userId: propUserId,
  lang = 'en',
  onShowToast
}) => {
  const isArabic = lang === 'ar';
  const fileInputRef = useRef(null);

  // States
  const [currentUserId, setCurrentUserId] = useState(propUserId || null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Internal toast state for standalone usage
  const [internalToast, setInternalToast] = useState(null);

  const notify = useCallback((message, type = 'info') => {
    if (onShowToast) {
      onShowToast(message, type);
    }
    setInternalToast({ message, type });
    setTimeout(() => {
      setInternalToast(null);
    }, 4000);
  }, [onShowToast]);

  // Resolve user ID
  useEffect(() => {
    let isMounted = true;
    async function resolveUser() {
      if (propUserId) {
        setCurrentUserId(propUserId);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted && user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.warn('Drive auth check notice:', err);
      }
    }
    resolveUser();
    return () => { isMounted = false; };
  }, [propUserId]);

  // Fetch files from Supabase Storage 'user-drive' bucket
  const fetchFiles = useCallback(async () => {
    const effectiveUid = currentUserId || propUserId;
    if (!effectiveUid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorBanner(null);

    try {
      const { data, error } = await supabase.storage
        .from('user-drive')
        .list(effectiveUid, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        // Handle common case where bucket doesn't exist yet
        if (error.message?.includes('Bucket not found') || error.error === 'Bucket not found' || error.statusCode === '404') {
          setErrorBanner({
            title: isArabic ? 'مستودع التخزين غير موجود' : 'Storage Bucket Not Found',
            message: isArabic 
              ? "يرجى إنشاء مستودع (Bucket) بالاسم 'user-drive' في لوحة تحكم Supabase Storage وتفعيل أذونات القراءة والكتابة للمستخدمين."
              : "Please create a bucket named 'user-drive' in your Supabase Storage dashboard with public/authenticated read and write permissions."
          });
          setFiles([]);
        } else {
          throw error;
        }
      } else {
        // Filter out empty folder placeholders
        const validFiles = (data || []).filter(item => 
          item.name && item.name !== '.emptyFolderPlaceholder'
        );
        setFiles(validFiles);
      }
    } catch (err) {
      console.error('Error fetching drive files:', err);
      notify(
        isArabic ? 'فشل تحميل ملفات التخزين السحابي.' : (err.message || 'Failed to fetch files from drive.'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, propUserId, isArabic, notify]);

  useEffect(() => {
    if (currentUserId || propUserId) {
      fetchFiles();
    } else {
      setIsLoading(false);
    }
  }, [currentUserId, propUserId, fetchFiles]);

  // Handle file upload
  const handleUploadFiles = async (fileList) => {
    const effectiveUid = currentUserId || propUserId;
    if (!effectiveUid) {
      notify(
        isArabic ? 'يرجى تسجيل الدخول أولاً لرفع الملفات إلى مساحتك الخاصة.' : 'Please sign in to upload files to your personal drive.',
        'error'
      );
      return;
    }

    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Clean file name to prevent path collision
      const sanitizedName = file.name.replace(/[/\\?%*:|"<>]/g, '-');
      const storagePath = `${effectiveUid}/${sanitizedName}`;

      setUploadProgressText(
        isArabic 
          ? `جارٍ رفع (${i + 1}/${fileList.length}): ${file.name}...` 
          : `Uploading (${i + 1}/${fileList.length}): ${file.name}...`
      );

      try {
        const { error } = await supabase.storage
          .from('user-drive')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          if (error.message?.includes('Bucket not found')) {
            setErrorBanner({
              title: isArabic ? 'مستودع التخزين غير موجود' : 'Storage Bucket Not Found',
              message: isArabic 
                ? "يرجى إنشاء مستودع (Bucket) بالاسم 'user-drive' في لوحة تحكم Supabase Storage."
                : "Please create a bucket named 'user-drive' in your Supabase Storage dashboard."
            });
          }
          failCount++;
        } else {
          successCount++;
        }
      } catch (uploadErr) {
        console.error(`Unexpected upload error for ${file.name}:`, uploadErr);
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgressText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      notify(
        isArabic 
          ? `تم رفع ${successCount} ملف(ات) بنجاح إلى Drive.` 
          : `Successfully uploaded ${successCount} file(s) to Drive.`,
        'success'
      );
      fetchFiles();
    }

    if (failCount > 0) {
      notify(
        isArabic 
          ? `فشل رفع ${failCount} ملف(ات). تحقق من صلاحيات مستودع التخزين.` 
          : `Failed to upload ${failCount} file(s). Check storage bucket permissions.`,
        'error'
      );
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Secure File Download
  const handleDownloadFile = async (file) => {
    const effectiveUid = currentUserId || propUserId;
    if (!effectiveUid) return;

    setDownloadingFile(file.name);
    try {
      const storagePath = `${effectiveUid}/${file.name}`;
      const { data, error } = await supabase.storage
        .from('user-drive')
        .download(storagePath);

      if (error) throw error;

      // Create a blob URL and trigger native browser download
      const blobUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      notify(
        isArabic ? `تم بدء تنزيل ${file.name}.` : `Downloading ${file.name}...`,
        'success'
      );
    } catch (err) {
      console.error('Download error:', err);
      notify(
        isArabic ? 'فشل تنزيل الملف من التخزين السحابي.' : (err.message || 'Failed to download file.'),
        'error'
      );
    } finally {
      setDownloadingFile(null);
    }
  };

  // File Deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const effectiveUid = currentUserId || propUserId;
    if (!effectiveUid) return;

    setIsDeleting(true);
    try {
      const storagePath = `${effectiveUid}/${fileToDelete.name}`;
      const { error } = await supabase.storage
        .from('user-drive')
        .remove([storagePath]);

      if (error) throw error;

      notify(
        isArabic ? `تم حذف الملف "${fileToDelete.name}" بنجاح.` : `File "${fileToDelete.name}" deleted successfully.`,
        'success'
      );

      setFileToDelete(null);
      fetchFiles();
    } catch (err) {
      console.error('Delete error:', err);
      notify(
        isArabic ? 'فشل حذف الملف.' : (err.message || 'Failed to delete file.'),
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered files
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Storage metrics
  const totalStorageBytes = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);

  return (
    <div id="drive-view-root" className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Standalone Toast Notice */}
      {internalToast && (
        <div 
          id="drive-toast-notification"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            internalToast.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : internalToast.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-400'
              : 'bg-blue-600/90 text-white border-blue-400'
          }`}
        >
          {internalToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{internalToast.message}</span>
          <button 
            onClick={() => setInternalToast(null)} 
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bucket Not Found Notice Banner */}
      {errorBanner && (
        <div 
          id="drive-bucket-warning-banner"
          className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-4"
        >
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold text-sm sm:text-base">{errorBanner.title}</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {errorBanner.message}
            </p>
          </div>
          <button 
            onClick={() => setErrorBanner(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div 
        id="drive-header-card"
        className="bg-gradient-to-r from-[#0F284E] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-200">
              <HardDrive className="w-3.5 h-3.5 text-sky-300" />
              <span>{isArabic ? 'مستودع Supabase السحابي: user-drive' : 'Supabase Storage: user-drive'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isArabic ? 'ملفاتك السحابية (Drive)' : 'Personal Cloud Drive'}
            </h2>
            <p className="text-sm text-sky-100 max-w-xl">
              {isArabic
                ? `مساحتك الخاصة لحفظ وإدارة المستندات، ملفات العقود، الفواتير، والأرشيف الشخصي بأمان تحت مسار: ${currentUserId ? `${currentUserId.slice(0, 8)}.../` : 'userId/'}`
                : `Upload, manage, and securely download your project files, contracts, PDFs, and assets organized under path: ${currentUserId ? `${currentUserId.slice(0, 8)}.../` : 'userId/'}`}
            </p>
          </div>

          {/* Quick Metrics & Upload Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">
                {isArabic ? 'إجمالي الملفات' : 'Total Files'}
              </p>
              <p className="text-lg font-black text-white">{files.length}</p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-right rtl:text-left">
              <p className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">
                {isArabic ? 'المساحة المستخدمة' : 'Storage Used'}
              </p>
              <p className="text-lg font-black text-sky-300">{formatBytes(totalStorageBytes)}</p>
            </div>

            {/* Hidden native input */}
            <input 
              ref={fileInputRef}
              id="drive-native-file-input"
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleUploadFiles(e.target.files)} 
              disabled={isUploading}
            />

            {/* Upload Action Button */}
            <button
              id="drive-btn-upload-top"
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 bg-white text-[#0F284E] hover:bg-sky-50 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{isArabic ? 'جارٍ الرفع...' : 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>{isArabic ? 'رفع ملفات جديدة' : 'Upload Files'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        id="drive-drag-drop-area"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-sky-400">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              {isUploading ? (
                uploadProgressText || (isArabic ? 'جارٍ رفع الملفات إلى Supabase Storage...' : 'Uploading files to Supabase Storage...')
              ) : (
                isArabic 
                  ? 'اسحب وأفلت الملفات هنا، أو اضغط للاختيار من جهازك' 
                  : 'Drag & drop files here, or click to browse'
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isArabic 
                ? 'يدعم جميع الصيغ: PDF، صور، مستندات، أرشيف ZIP، ملفات مضغوطة، جداول بيانات' 
                : 'Supports all file formats: PDF, Images, Word docs, ZIP archives, Spreadsheets, etc.'}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search Filter, View Toggle, Refresh */}
      <div 
        id="drive-controls-bar"
        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm"
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            id="drive-input-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث في أسماء الملفات...' : 'Search files by name...'}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View mode buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="drive-btn-view-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {isArabic ? 'جدول' : 'Table'}
            </button>
            <button
              id="drive-btn-view-grid"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {isArabic ? 'بطاقات' : 'Cards'}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            id="drive-btn-refresh-files"
            type="button"
            onClick={fetchFiles}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isArabic ? 'تحديث قائمة الملفات' : 'Refresh file list'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Display: Table or Card Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {isArabic ? 'جارٍ تحميل ملفات التخزين السحابي...' : 'Fetching your files from Supabase Drive...'}
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div 
          id="drive-empty-state"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Folder className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-800 dark:text-white">
              {searchQuery 
                ? (isArabic ? 'لا توجد ملفات مطابقة للبحث' : 'No matching files found')
                : (isArabic ? 'لا توجد ملفات مرفوعة بعد' : 'No files in your drive yet')}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchQuery 
                ? (isArabic ? 'جرب البحث بكلمات أخرى أو مسح حقل البحث.' : 'Try adjusting your search keywords.')
                : (isArabic ? 'ارفع أول ملف إلى مستودعك السحابي الآمن عبر الزر أعلاه.' : 'Upload your first document, contract, or image using the button above.')}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isArabic ? 'رفع ملفك الأول' : 'Upload First File'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div 
          id="drive-files-table-container"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">{isArabic ? 'اسم الملف' : 'File Name'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'الحجم' : 'File Size'}</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">{isArabic ? 'تاريخ الرفع' : 'Created Date'}</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right rtl:text-left">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredFiles.map((file) => (
                  <tr 
                    key={file.id || file.name}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Name + Icon */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {formatBytes(file.metadata?.size)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {formatDate(file.created_at || file.updated_at, lang)}
                    </td>

                    {/* Actions: Download + Delete */}
                    <td className="py-3.5 px-4 sm:px-6 text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download Button */}
                        <button
                          id={`btn-download-file-${file.name}`}
                          type="button"
                          disabled={downloadingFile === file.name}
                          onClick={() => handleDownloadFile(file)}
                          className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          title={isArabic ? 'تنزيل آمن' : 'Secure Download'}
                        >
                          {downloadingFile === file.name ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`btn-delete-file-${file.name}`}
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
                          title={isArabic ? 'حذف الملف' : 'Delete File'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div 
          id="drive-files-grid-container"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredFiles.map((file) => (
            <div
              key={file.id || file.name}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getFileIcon(file.name)}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>

              <div className="space-y-1">
                <h4 
                  className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate" 
                  title={file.name}
                >
                  {file.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatBytes(file.metadata?.size)}</span>
                  <span>{formatDate(file.created_at, lang)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={downloadingFile === file.name}
                  onClick={() => handleDownloadFile(file)}
                  className="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {downloadingFile === file.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isArabic ? 'تنزيل' : 'Download'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFileToDelete(file)}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
                  title={isArabic ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div 
          id="drive-delete-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            id="drive-delete-modal-card"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isArabic ? 'تأكيد حذف الملف' : 'Confirm File Deletion'}
                </h3>
              </div>
              <button 
                onClick={() => setFileToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isArabic 
                ? `هل أنت متأكد من رغبتك في حذف الملف "${fileToDelete.name}" نهائياً من مستودعك السحابي؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to permanently delete "${fileToDelete.name}" from your cloud drive? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                id="btn-confirm-delete-file"
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isArabic ? 'جارٍ الحذف...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{isArabic ? 'تأكيد الحذف' : 'Delete File'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drive;
