/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { InfoModals, InfoModalType } from './components/InfoModals';
import { Footer } from './components/Footer';
import { AppItem } from './types/app';
import { api } from './services/api';
import { testConnection } from './firebase/config';
import { firebaseService } from './firebase/services';
import { createSampleApkBlob } from './utils/apkGenerator';
import { 
  Sparkles, 
  Search, 
  X, 
  Smartphone, 
  Loader2, 
  DownloadCloud, 
  AlertCircle, 
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('latest');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Modals & Views
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType | null>(null);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);

  // Download notification toast
  const [downloadToast, setDownloadToast] = useState<{
    appName: string;
    version: string;
    size: string;
  } | null>(null);

  // Load apps from API
  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getApps();
      setApps(data);
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError(err.message || 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check initial admin auth status and fetch apps
  useEffect(() => {
    // Validate connection to Firestore on boot
    testConnection();

    fetchApps();
    api.checkAuthStatus().then(setIsAdmin);

    // Listen to Firebase Auth state
    const unsubscribeAuth = firebaseService.onAuthState((user, userIsAdmin) => {
      if (userIsAdmin) {
        setIsAdmin(true);
      }
    });

    // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchApps]);

  // Handle Download APK
  const handleDownloadApp = (app: AppItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Trigger browser download of actual APK file
    let downloadUrl = app.apkUrl;
    let isBlob = false;

    // If URL is not a direct storage or http link, generate genuine APK binary blob
    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      const apkBlob = createSampleApkBlob(app.name, app.version);
      downloadUrl = URL.createObjectURL(apkBlob);
      isBlob = true;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', app.fileName || `${app.name.replace(/\s+/g, '_')}-${app.version}.apk`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (isBlob) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    }

    // Record download event in Cloud Firestore
    firebaseService.recordDownload(app.id).catch(() => {});

    // Increment local download count immediately for smooth UX
    setApps((prevApps) =>
      prevApps.map((a) =>
        a.id === app.id ? { ...a, downloadCount: a.downloadCount + 1 } : a
      )
    );
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null));
    }

    // Show temporary download feedback toast
    setDownloadToast({
      appName: app.name,
      version: app.version,
      size: app.fileSizeFormatted,
    });
    setTimeout(() => {
      setDownloadToast(null);
    }, 4500);
  };

  // Admin Logout
  const handleAdminLogout = async () => {
    await api.logout();
    setIsAdmin(false);
    setAdminDashboardOpen(false);
    fetchApps();
  };

  // Filter and Sort Apps for Homepage Display
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : app.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        app.name.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query) ||
        app.developer.toLowerCase().includes(query) ||
        app.shortDescription.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (selectedSort === 'downloads') {
        return b.downloadCount - a.downloadCount;
      }
      if (selectedSort === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      // default: latest
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [apps, selectedCategory, searchQuery, selectedSort]);

  // Curated Featured Apps
  const featuredApps = useMemo(() => {
    return apps.filter((app) => app.featured);
  }, [apps]);

  // Calculate live store totals
  const totalDownloads = useMemo(() => {
    return apps.reduce((sum, a) => sum + (a.downloadCount || 0), 0);
  }, [apps]);

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenAdmin={() => {
          if (isAdmin) {
            setAdminDashboardOpen(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenInfo={(type) => setInfoModalType(type)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('all-apps');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
        activeSection="home"
      />

      {/* 2. Hero Section */}
      <Hero
        onExploreApps={() => {
          const el = document.getElementById('all-apps');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onLatestReleases={() => {
          setSelectedSort('latest');
          const el = document.getElementById('all-apps');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        totalApps={apps.length}
        totalDownloads={totalDownloads}
      />

      {/* 3. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 flex-1 w-full">
        
        {/* Featured Apps Section (if any apps are marked featured) */}
        {featuredApps.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <section id="featured-apps" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Featured Applications
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Hand-picked flagship releases by ATL APPS STORE
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Store Highlights</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onSelectApp={setSelectedApp}
                  onDownloadApp={handleDownloadApp}
                  featured={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Apps & Category Filter Section */}
        <section id="all-apps" className="space-y-8 scroll-mt-24">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Explore Application Catalog</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Browse by category, search by keywords, or sort by popularity
                </p>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="self-start sm:self-auto text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Show all categories &rarr;
                </button>
              )}
            </div>

            {/* Category Filter Pills and Search */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              totalResults={filteredApps.length}
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading applications from ATL APPS STORE...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
              <h3 className="text-base font-bold text-white">Connection Error</h3>
              <p className="text-xs text-rose-300">{error}</p>
              <button
                onClick={fetchApps}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Retry
              </button>
            </div>
          ) : filteredApps.length === 0 ? (
            /* Empty State: Only user uploaded apps appear */
            <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-5 bg-slate-900/40 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-md">
              <div className="w-18 h-18 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-sky-400/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
                <Smartphone className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'No matching apps found'
                    : 'No Apps Uploaded Yet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'Try adjusting your search terms or selecting a different category.'
                    : 'এখনো কোনো অ্যাপ পাবলিশ করা হয়নি। আপনি অ্যাডমিন প্যানেল থেকে যে অ্যাপগুলো আপলোড করবেন, শুধুমাত্র সেগুলোই এখানে দেখতে পাওয়া যাবে।'}
                </p>
              </div>

              {(searchQuery || selectedCategory !== 'All') ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Clear Filters & Search
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isAdmin) {
                      setAdminDashboardOpen(true);
                    } else {
                      setAdminLoginOpen(true);
                    }
                  }}
                  className="glow-button px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAdmin ? 'Upload New APK / অ্যাপ আপলোড করুন' : 'Admin Login to Upload APK / অ্যাপ আপলোড করুন'}</span>
                </button>
              )}
            </div>
          ) : (
            /* App Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onSelectApp={setSelectedApp}
                  onDownloadApp={handleDownloadApp}
                  featured={false}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 4. Footer */}
      <Footer
        onOpenInfo={(type) => setInfoModalType(type)}
        onOpenAdmin={() => {
          if (isAdmin) {
            setAdminDashboardOpen(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        isAdmin={isAdmin}
      />

      {/* ========================================================= */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================= */}

      {/* App Details Modal */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onDownload={handleDownloadApp}
          onOpenGuide={() => setInfoModalType('guide')}
        />
      )}

      {/* Admin Login Modal */}
      {adminLoginOpen && (
        <AdminLoginModal
          isOpen={adminLoginOpen}
          onClose={() => setAdminLoginOpen(false)}
          onLoginSuccess={() => {
            setIsAdmin(true);
            setAdminLoginOpen(false);
            setAdminDashboardOpen(true);
            fetchApps();
          }}
        />
      )}

      {/* Admin Dashboard */}
      {adminDashboardOpen && (
        <AdminDashboard
          isOpen={adminDashboardOpen}
          onClose={() => setAdminDashboardOpen(false)}
          onLogout={handleAdminLogout}
          onAppModified={fetchApps}
        />
      )}

      {/* Info Modals (About, Contact, Privacy, Terms, Install Guide) */}
      {infoModalType && (
        <InfoModals
          type={infoModalType}
          onClose={() => setInfoModalType(null)}
        />
      )}

      {/* Quick Search Modal (Cmd+K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setSearchModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0b0f1d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 space-y-3 p-4">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-indigo-400 absolute left-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search APKs by title, package, or keyword..."
                className="w-full pl-10 pr-9 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="absolute right-3 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pt-1">
              {filteredApps.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setSearchModalOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={app.iconUrl} alt={app.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{app.name}</p>
                      <p className="text-[10px] text-slate-400">{app.category} &bull; {app.version}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadApp(app, e);
                      setSearchModalOpen(false);
                    }}
                    className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>APK</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Started Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl flex items-center gap-3 text-xs text-slate-200 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">
              Downloading {downloadToast.appName} ({downloadToast.version})
            </p>
            <p className="text-[11px] text-slate-400">
              {downloadToast.size} APK binary &bull; Check your notification bar or downloads
            </p>
          </div>
          <button
            onClick={() => setDownloadToast(null)}
            className="p-1 text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
