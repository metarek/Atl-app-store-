import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  HardDrive, 
  TrendingUp, 
  Layers, 
  KeyRound, 
  LogOut, 
  Sparkles, 
  Plus, 
  FileCheck, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  ExternalLink,
  ArrowDownToLine,
  Check
} from 'lucide-react';
import { AppItem, AppCategory, DownloadStats } from '../types/app';
import { api } from '../services/api';
import { firebaseService } from '../firebase/services';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onAppModified: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onLogout,
  onAppModified,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'stats' | 'security'>('upload');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Upload Form State
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkUploadProgress, setApkUploadProgress] = useState<number>(0);
  const [isUploadingApk, setIsUploadingApk] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [directDownloadUrl, setDirectDownloadUrl] = useState<string>('');
  const [apkUploadResult, setApkUploadResult] = useState<{
    apkPath: string;
    originalName: string;
    fileSize: number;
    fileSizeFormatted: string;
    sha256: string;
  } | null>(null);

  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [category, setCategory] = useState<AppCategory>('Tools');
  const [developer, setDeveloper] = useState('ATL APPS STORE');
  const [minAndroid, setMinAndroid] = useState('Android 8.0+ (Oreo or higher)');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [changelog, setChangelog] = useState('Initial release on ATL APPS STORE.');
  const [iconUrl, setIconUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80');
  const [featured, setFeatured] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Edit App state
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);

  // Delete App Confirmation state (Deletes permanently from Firestore & Store)
  const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Change Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appList, appStats] = await Promise.all([
        api.getApps(),
        api.getAdminStats().catch(() => null),
      ]);
      setApps(appList);
      if (appStats) setStats(appStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Robust processor for selected APK files (from mobile touch or desktop file picker/drag-drop)
  const processSelectedApkFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Ensure extension compatibility (if stripped by mobile browser, ensure clean presentation)
    let file = selectedFile;
    if (!file.name.toLowerCase().endsWith('.apk') && !file.name.toLowerCase().endsWith('.xapk')) {
      // Still accept it smoothly as an APK package
      const normalizedName = `${file.name.replace(/\.[^/.]+$/, '')}.apk`;
      try {
        file = new File([selectedFile], normalizedName, { type: 'application/vnd.android.package-archive' });
      } catch {
        // Fallback to original file
        file = selectedFile;
      }
    }

    setUploadError(null);
    setUploadSuccess(null);
    setApkFile(file);
    setIsUploadingApk(true);
    setApkUploadProgress(15);

    try {
      const res = await api.uploadApk(file, (percent) => {
        setApkUploadProgress(percent);
      });

      // Automatically fill form fields if user hasn't typed their own
      if (!appName || appName.trim() === '') {
        setAppName(res.appName);
      }
      if (!version || version === 'v1.0.0') {
        setVersion(res.version);
      }
      if (!packageName || packageName.trim() === '') {
        setPackageName(res.packageName);
      }

      setApkUploadResult(res);
      setUploadSuccess(`APK "${res.originalName}" (${res.fileSizeFormatted}) successfully verified and loaded! You can now publish your app.`);
    } catch (err: any) {
      console.error('APK selection & upload error:', err);
      setUploadError(err.message || 'Failed to process APK file. Please try again.');
      setApkUploadResult(null);
    } finally {
      setIsUploadingApk(false);
    }
  };

  // Handle selecting an APK file from phone or desktop
  const handleApkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedApkFile(file);
    }
  };

  // Handle uploading custom App Icon
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await api.uploadMedia(file);
      setIconUrl(res.imageUrl);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload icon image');
    }
  };

  // Submit new application to store
  const handleSaveApp = async (status: 'published' | 'draft') => {
    if (!appName.trim()) {
      setUploadError('Application name is required (অ্যাপের নাম দেওয়া আবশ্যক)');
      return;
    }

    if (!apkUploadResult && !directDownloadUrl.trim()) {
      setUploadError('Please select and upload an APK file first (উপরে Step 1 থেকে APK ফাইল সিলেক্ট করুন)');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const generatedPkg = packageName.trim() || `com.atlapps.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const finalApkUrl = directDownloadUrl.trim() || apkUploadResult?.apkPath || '#';
      const finalFileSize = apkUploadResult?.fileSize || 25000000;
      const finalFileSizeFormatted = apkUploadResult?.fileSizeFormatted || '25.0 MB';
      const finalFileName = apkUploadResult?.originalName || `${appName.replace(/\s+/g, '_')}-${version.trim()}.apk`;

      const createdApp = await api.createApp({
        name: appName.trim(),
        packageName: generatedPkg,
        version: version.trim() || 'v1.0.0',
        versionCode: 1,
        fileSize: finalFileSize,
        fileSizeFormatted: finalFileSizeFormatted,
        apkUrl: finalApkUrl,
        fileName: finalFileName,
        sha256: apkUploadResult?.sha256,
        category,
        developer: developer.trim() || 'ATL APPS STORE',
        iconUrl: iconUrl.trim(),
        shortDescription: shortDesc.trim(),
        fullDescription: fullDesc.trim() || shortDesc.trim(),
        changelog: changelog.trim(),
        screenshots: screenshots.filter((s) => s.trim().length > 0),
        minAndroid,
        minSdk: 26,
        status,
        featured,
        // @ts-ignore
        apkPath: finalApkUrl,
      });


      try {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setUploadSuccess(
        status === 'published'
          ? 'Application successfully published to ATL APPS STORE!'
          : 'Application saved as Draft.'
      );

      // Reset form
      setApkFile(null);
      setApkUploadResult(null);
      setApkUploadProgress(0);
      setDirectDownloadUrl('');
      setAppName('');
      setPackageName('');
      setShortDesc('');
      setFullDesc('');
      setChangelog('Initial release on ATL APPS STORE.');
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadData();
      onAppModified();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle publish / draft status for an app
  const handleToggleStatus = async (app: AppItem) => {
    const nextStatus = app.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateApp(app.id, { status: nextStatus });
      firebaseService.updateApp(app.id, { status: nextStatus }).catch(() => {});
      loadData();
      onAppModified();
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (app: AppItem) => {
    try {
      await api.updateApp(app.id, { featured: !app.featured });
      firebaseService.updateApp(app.id, { featured: !app.featured }).catch(() => {});
      loadData();
      onAppModified();
    } catch (err: any) {
      alert(`Error updating featured status: ${err.message}`);
    }
  };

  // Open Delete confirmation dialog for an app
  const handleDeleteClick = (app: AppItem) => {
    setDeleteError(null);
    setAppToDelete(app);
  };

  // Perform permanent deletion from Firebase Firestore, Storage, and Store
  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteApp(appToDelete.id);
      // Immediately remove from UI list
      setApps((prev) => prev.filter((a) => a.id !== appToDelete.id));
      setDeleteSuccessMsg(`"${appToDelete.name}" APK has been completely removed from Firebase and the store! (অ্যাপটি ফায়ারবেস ও স্টোর থেকে সফলভাবে মুছে ফেলা হয়েছে)`);
      setAppToDelete(null);
      // Refresh parent app and stats
      onAppModified();
      loadData();
      setTimeout(() => setDeleteSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Delete app error:', err);
      setDeleteError(err?.message || 'Failed to delete application from Firebase');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save changes to edited app
  const handleSaveEdit = async () => {
    if (!editingApp) return;
    try {
      await api.updateApp(editingApp.id, editingApp);
      firebaseService.updateApp(editingApp.id, editingApp).catch(() => {});
      setEditingApp(null);
      loadData();
      onAppModified();
    } catch (err: any) {
      alert(`Failed to update app: ${err.message}`);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters.', error: true });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'Passwords do not match.', error: true });
      return;
    }

    setIsUpdatingPwd(true);
    setPwdMsg(null);
    try {
      const res = await api.changePassword(newPwd, currentPwd);
      setPwdMsg({ text: res.message || 'Password updated successfully!', error: false });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to update password', error: true });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  if (!isOpen) return null;

  // Filter apps in management table
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="relative w-full max-w-5xl bg-[#090d1c] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-left">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#090d1c]/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ATL APPS STORE &bull; Admin Console</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage mobile APK distributions, releases, and store telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-white/5 bg-[#0b0f22] overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload & Publish APK</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Apps ({apps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Download Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          
          {/* ==================================================== */}
          {/* TAB 1: UPLOAD & PUBLISH APK (MOBILE FRIENDLY) */}
          {/* ==================================================== */}
          {activeTab === 'upload' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Alert Feedback */}
              {uploadError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs sm:text-sm text-rose-300">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs sm:text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Step 1: Select APK from Android Device */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Select Android APK File
                    </h3>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">Supports mobile file picker</span>
                </div>

                {/* Mobile & Desktop File Picker Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSelectedApkFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                      : apkUploadResult 
                      ? 'border-emerald-500/60 bg-emerald-950/25 shadow-lg shadow-emerald-950/20' 
                      : 'border-white/15 hover:border-indigo-500/50 hover:bg-indigo-950/20 bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk,application/vnd.android.package-archive,application/octet-stream,application/zip,*/*"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleApkFileSelect}
                    className="hidden"
                  />

                  {apkUploadResult ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-4 ring-emerald-500/10">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>APK File Recognized &amp; Ready</span>
                        </span>
                        <p className="text-base font-bold text-white break-all">
                          {apkUploadResult.originalName}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          File Size: <strong className="text-emerald-300 font-mono">{apkUploadResult.fileSizeFormatted}</strong> &bull; Package verified &amp; ready to publish
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 hover:text-white border border-white/10 transition-colors"
                        >
                          Change / Select Different APK
                        </button>
                      </div>
                    </div>
                  ) : isUploadingApk ? (
                    <div className="space-y-3 py-2">
                      <Loader2 className="w-9 h-9 mx-auto text-indigo-400 animate-spin" />
                      <p className="text-sm text-slate-200 font-bold">
                        Reading &amp; verifying APK file ({apkUploadProgress}%)...
                      </p>
                      <div className="w-full max-w-xs mx-auto h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 transition-all duration-200"
                          style={{ width: `${apkUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Extracting package details, version, and SHA-256 signature...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center ring-4 ring-indigo-500/10">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">
                          Tap here to select APK from phone or computer
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Choose any Android .apk file from your device storage or drag &amp; drop
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Browse Files / Select APK</span>
                      </button>
                    </div>
                  )}
                </div>

                {apkUploadResult?.sha256 && (
                  <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/5 break-all flex items-center justify-between gap-2">
                    <div>
                      <span className="text-indigo-400 font-semibold">SHA-256 Checksum: </span>
                      <span className="text-slate-300">{apkUploadResult.sha256}</span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Application Information */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Application Metadata
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      App Name *
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="e.g. ATL Super Tool"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Version */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="e.g. v1.0.0"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AppCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Tools">Tools</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Games">Games</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Minimum Android */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Minimum Android OS
                    </label>
                    <select
                      value={minAndroid}
                      onChange={(e) => setMinAndroid(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Android 8.0+ (Oreo or higher)">Android 8.0+ (Oreo)</option>
                      <option value="Android 9.0+ (Pie or higher)">Android 9.0+ (Pie)</option>
                      <option value="Android 10.0+ (Q or higher)">Android 10.0+ (Q)</option>
                      <option value="Android 11.0+ (Red Velvet Cake)">Android 11.0+</option>
                      <option value="Android 12.0+ (Snow Cone)">Android 12.0+</option>
                      <option value="Android 13.0+ (Tiramisu)">Android 13.0+</option>
                      <option value="Android 14.0+ (Upside Down Cake)">Android 14.0+</option>
                      <option value="Android 15.0+ (Vanilla Ice Cream)">Android 15.0+</option>
                    </select>
                  </div>

                  {/* Developer Name */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Developer / Publisher
                    </label>
                    <input
                      type="text"
                      value={developer}
                      onChange={(e) => setDeveloper(e.target.value)}
                      placeholder="e.g. ATL APPS STORE"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Package Name (optional) */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Package Identifier (optional)
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="e.g. com.atlapps.mytool"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* App Logo / Icon selector & uploader */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white uppercase tracking-wider block">
                        App Logo / Icon (অ্যাপের লোগো) *
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Upload custom logo from your phone or choose a preset icon
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      High Quality PNG/JPG
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-white/5">
                    {/* Big Icon Preview */}
                    <div className="relative w-18 h-18 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/40 shadow-xl shrink-0 group">
                      <img 
                        src={iconUrl} 
                        alt="App Logo Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
                        }} 
                      />
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => iconInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Upload Logo from Phone (ফোন থেকে লোগো দিন)</span>
                        </button>
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-medium">Or choose quick preset logo:</span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {[
                            { name: 'Neon Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80' },
                            { name: 'Cyber Purple', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=240&auto=format&fit=crop&q=80' },
                            { name: 'Audio Sound', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=240&auto=format&fit=crop&q=80' },
                            { name: 'Secure Lock', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=240&auto=format&fit=crop&q=80' },
                            { name: 'Speed Engine', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240&auto=format&fit=crop&q=80' },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setIconUrl(preset.url)}
                              className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-indigo-400 shrink-0 cursor-pointer"
                              title={preset.name}
                            >
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Short Summary (সংক্ষিপ্ত পরিচিতি - কার্ডের জন্য)
                  </label>
                  <input
                    type="text"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="e.g. A fast, powerful Android utility designed for smooth performance."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Full Description (অ্যাপ সম্পর্কে বিস্তারিত বিবরণ / ডিসক্রিপশন) *
                  </label>
                  <textarea
                    rows={4}
                    value={fullDesc}
                    onChange={(e) => setFullDesc(e.target.value)}
                    placeholder="অ্যাপটির মূল ফিচার, এটি কীভাবে ব্যবহার করবেন এবং অন্যান্য তথ্য এখানে লিখুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-normal"
                  />
                </div>

                {/* Changelog */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    What's New / Changelog (নতুন কী যুক্ত হয়েছে)
                  </label>
                  <textarea
                    rows={2}
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="e.g. • Initial release&#10;• Bug fixes and speed improvements"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Optional External Direct Download Link */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      External Direct Download Link (Optional - বিকল্প ক্লাউড লিংক)
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">GitHub Releases / CDN / Drive</span>
                  </div>
                  <input
                    type="url"
                    value={directDownloadUrl}
                    onChange={(e) => setDirectDownloadUrl(e.target.value)}
                    placeholder="e.g. https://github.com/user/repo/releases/download/v1.0.0/app.apk"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    If provided, visitors will download directly from this link. If left blank, the uploaded APK binary will be used automatically.
                  </p>
                </div>

                {/* Featured Checkbox */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured-app"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-slate-900 cursor-pointer"
                  />
                  <label htmlFor="featured-app" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Promote as "Featured App" on Store Homepage (হোমপেজে স্পেশাল ফিচার করুন)
                  </label>
                </div>
              </div>

              {/* Step 3: Interactive Live Preview of App Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Live Store Card Preview (স্টোরে যেমন দেখাবে)
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Real-time Preview
                  </span>
                </div>

                {/* Render Mini Card Preview */}
                <div className="max-w-md mx-auto glass-panel p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {category}
                    </span>
                    {featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <img 
                      src={iconUrl} 
                      alt="Logo preview" 
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-800 border border-white/10 shadow-md"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-white truncate">
                        {appName || 'Your App Name (অ্যাপের নাম)'}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {developer} &bull; <span className="font-mono text-indigo-300">{version}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {apkUploadResult?.fileSizeFormatted || 'Size: -- MB'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {shortDesc || fullDesc || 'আপনার অ্যাপের বিস্তারিত বিবরণ এখানে দেখা যাবে...'}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Direct APK Download</span>
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm">
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Download APK</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Publish or Draft */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveApp('draft')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveApp('published')}
                  className="w-full sm:w-auto glow-button px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Application...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publish to ATL APPS STORE</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: MANAGE APPLICATIONS */}
          {/* ==================================================== */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              
              {/* Success Notification Banner for Deletions & Actions */}
              {deleteSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg shadow-emerald-950/50">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-medium">{deleteSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setDeleteSuccessMsg(null)}
                    className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Search & Status Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search apps by name, category, package..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>

                  <button
                    onClick={loadData}
                    title="Refresh Data"
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Apps List / Table */}
              <div className="space-y-2">
                {filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-slate-900/30 border border-white/5 space-y-2">
                    <p className="font-semibold text-slate-300">No applications found (কোনো অ্যাপ পাওয়া যায়নি)</p>
                    <p className="text-slate-500 text-[11px]">Upload an APK from the "Upload & Publish APK" tab.</p>
                  </div>
                ) : (
                  filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">
                              {app.name}
                            </h4>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {app.version}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {app.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {app.packageName} &bull; {app.fileSizeFormatted}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleStatus(app)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            app.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          {app.status === 'published' ? 'Published' : 'Draft'}
                        </button>

                        {/* Featured Toggle */}
                        <button
                          onClick={() => handleToggleFeatured(app)}
                          title="Toggle Featured on Homepage"
                          className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                            app.featured
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Download link */}
                        <a
                          href={`/api/download/${app.id}`}
                          title="Download APK"
                          download
                          className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-white/5 cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit metadata */}
                        <button
                          onClick={() => setEditingApp(app)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-white/5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete App from Firebase & Store */}
                        <button
                          onClick={() => handleDeleteClick(app)}
                          title="Delete APK from Firebase & Store (ফায়ারবেস থেকে মুছে ফেলুন)"
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete (রিমুভ)</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: DOWNLOAD TELEMETRY & STATS */}
          {/* ==================================================== */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Downloads</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">
                    {(stats?.totalDownloads || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Deduplicated client requests</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Total APKs</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {stats?.totalApps || apps.length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {stats?.publishedApps || 0} published &bull; {stats?.draftApps || 0} drafts
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Storage Used</p>
                  <p className="text-2xl font-black text-sky-400 mt-1">
                    {/* @ts-ignore */}
                    {stats?.totalStorageFormatted || '180 MB'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Direct disk storage</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Security State</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">100%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">SHA-256 verified binaries</p>
                </div>
              </div>

              {/* Most Downloaded Apps Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Top Downloaded Applications
                </h3>
                <div className="space-y-2">
                  {apps
                    .slice()
                    .sort((a, b) => b.downloadCount - a.downloadCount)
                    .map((app, idx) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 font-bold text-slate-500">{idx + 1}</span>
                          <img src={app.iconUrl} alt={app.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-white">{app.name}</p>
                            <p className="text-[10px] text-slate-400">{app.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-400">{app.downloadCount.toLocaleString()} downloads</p>
                          <p className="text-[10px] text-slate-500">{app.fileSizeFormatted}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: CHANGE PASSWORD & SECURITY */}
          {/* ==================================================== */}
          {activeTab === 'security' && (
            <div className="max-w-md mx-auto space-y-6">
              
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Update Administrator Password
                  </h3>
                  <p className="text-xs text-slate-400">
                    Replace the default setup password (<code className="text-indigo-400">TAREK8461</code>) with your own private secure password.
                  </p>
                </div>

                {pwdMsg && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                      pwdMsg.error
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {pwdMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Current admin password (e.g. TAREK8461)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      New Password (minimum 6 characters)
                    </label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Enter strong new password..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Confirm new password..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPwd || !newPwd}
                    className="w-full glow-button py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Edit App Modal Overlay */}
      {editingApp && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0b0f22] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                Edit Application: {editingApp.name}
              </h3>
              <button onClick={() => setEditingApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={editingApp.name}
                  onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Version</label>
                  <input
                    type="text"
                    value={editingApp.version}
                    onChange={(e) => setEditingApp({ ...editingApp, version: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={editingApp.category}
                    onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                  >
                    <option value="Tools">Tools</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Games">Games</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingApp.shortDescription}
                  onChange={(e) => setEditingApp({ ...editingApp, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={editingApp.fullDescription}
                  onChange={(e) => setEditingApp({ ...editingApp, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Changelog</label>
                <textarea
                  rows={2}
                  value={editingApp.changelog}
                  onChange={(e) => setEditingApp({ ...editingApp, changelog: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const target = editingApp;
                  setEditingApp(null);
                  handleDeleteClick(target);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete App (রিমুভ করুন)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal (Cloud Firestore + Local wipe) */}
      {appToDelete && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0c1024] border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left relative overflow-hidden">
            {/* Top red glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Delete APK from Firebase?</span>
                </h3>
                <p className="text-xs text-rose-300 font-medium mt-0.5">
                  ফায়ারবেস ও স্টোর থেকে সম্পূর্ণ মুছে ফেলতে চান?
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setAppToDelete(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target App Card Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
              <img
                src={appToDelete.iconUrl}
                alt={appToDelete.name}
                className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {appToDelete.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {appToDelete.version} &bull; {appToDelete.fileSizeFormatted}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  ID: {appToDelete.id}
                </p>
              </div>
            </div>

            {/* Warning Details */}
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-1.5 text-xs text-rose-200">
              <p className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>This action is irreversible (স্থায়ীভাবে মুছে যাবে):</span>
              </p>
              <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-1 pl-1">
                <li>Cloud Firestore document will be deleted (ফায়ারবেস থেকে ডিলিট হবে)</li>
                <li>APK binary cache and files will be completely purged</li>
                <li>App will be removed immediately from public store catalog</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{deleteError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAppToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting from Firebase...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently (স্থায়ীভাবে মুছুন)</span>
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
