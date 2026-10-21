import React, { useState } from 'react';
import { 
  X, 
  DownloadCloud, 
  HardDrive, 
  Star, 
  Smartphone, 
  CheckCircle2, 
  Calendar, 
  Share2, 
  ShieldCheck, 
  Copy, 
  Check, 
  QrCode, 
  Sparkles,
  ExternalLink,
  Info,
  ArrowDownToLine,
  ChevronRight
} from 'lucide-react';
import { AppItem } from '../types/app';
import confetti from 'canvas-confetti';

interface AppDetailModalProps {
  app: AppItem | null;
  onClose: () => void;
  onDownload: (app: AppItem) => void;
  onOpenGuide: () => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  onDownload,
  onOpenGuide,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  if (!app) return null;

  const downloadUrl = app.apkUrl && app.apkUrl.startsWith('http') ? app.apkUrl : window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadUrl)}&bgcolor=0b0f19&color=818cf8`;

  const handleCopyHash = () => {
    if (app.sha256) {
      navigator.clipboard.writeText(app.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${app.name} - Download Android APK`,
      text: `Download ${app.name} (${app.version}) for Android on ATL APPS STORE!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or failed, fallback to copy
        copyLinkFallback();
      }
    } else {
      copyLinkFallback();
    }
  };

  const copyLinkFallback = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleDownloadClick = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#38bdf8', '#34d399'],
      });
    } catch {
      // ignore
    }
    onDownload(app);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Background click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#090d1c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090d1c]/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {app.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {app.packageName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share App"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedShare ? 'Copied Link' : 'Share'}</span>
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              title="Scan QR to Download on Phone"
              className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-medium ${
                showQr ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Phone QR</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-6">

          {/* QR Code Banner (Toggleable) */}
          {showQr && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-slate-900 rounded-xl border border-indigo-500/40 shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for Mobile Download"
                  className="w-32 h-32 rounded-lg"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Scan to Download on Android Phone</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Point your Android camera or QR scanner at the code to instantly begin downloading <strong className="text-white">{app.name}</strong> onto your mobile device.
                </p>
                <div className="pt-1">
                  <button
                    onClick={onOpenGuide}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                  >
                    Need help installing APK files on Android?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Hero Card in Details */}
          <div className="flex flex-col sm:flex-row items-start gap-5 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 rounded-2xl border border-white/5">
            {/* App Icon */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-xl">
              <img
                src={app.iconUrl}
                alt={app.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Info & Badges */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {app.name}
                </h2>
                {app.featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-indigo-400 font-medium">{app.developer}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>&bull;</span>
                <span className="text-slate-300">Official Release</span>
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Version</p>
                  <p className="font-mono font-bold text-slate-200 mt-0.5">{app.version}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">File Size</p>
                  <p className="font-bold text-slate-200 mt-0.5">{app.fileSizeFormatted}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Downloads</p>
                  <p className="font-bold text-indigo-400 mt-0.5">{app.downloadCount.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Rating</p>
                  <p className="font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{app.rating.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Action Row */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Malware Scanned & Verified Clean APK</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct high-speed download link &bull; Requires {app.minAndroid}
              </p>
            </div>

            <button
              onClick={handleDownloadClick}
              className="w-full sm:w-auto glow-button px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Download APK ({app.fileSizeFormatted})</span>
            </button>
          </div>

          {/* Screenshots Gallery */}
          {app.screenshots && app.screenshots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                App Screenshots
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {app.screenshots.map((shot, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveScreenshot(shot)}
                    className="relative w-44 sm:w-56 h-72 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 cursor-pointer hover:border-indigo-500/50 transition-all shadow-md group"
                  >
                    <img
                      src={shot}
                      alt={`${app.name} preview ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              About This Application
            </h3>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {app.fullDescription || app.shortDescription}
            </div>
          </div>

          {/* What's New / Changelog */}
          {app.changelog && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>What's New in {app.version}</span>
              </h3>
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                {app.changelog}
              </div>
            </div>
          )}

          {/* Technical Specifications & Integrity */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Technical Details & Integrity
            </h3>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Package Name</span>
                  <span className="font-mono text-slate-200">{app.packageName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Minimum OS</span>
                  <span className="text-slate-200">{app.minAndroid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">APK Filename</span>
                  <span className="font-mono text-slate-200">{app.fileName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Last Updated</span>
                  <span className="text-slate-200">
                    {new Date(app.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* SHA-256 Checksum */}
              {app.sha256 && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">
                      SHA-256 Checksum (Tamper Proof)
                    </span>
                    <button
                      onClick={handleCopyHash}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Hash</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-black/50 font-mono text-[11px] text-slate-400 break-all select-all border border-white/5">
                    {app.sha256}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Android Installation Tip */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>First time installing an APK on your phone?</span>
            </div>
            <button
              onClick={onOpenGuide}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
            >
              <span>View Guide</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-white/10 bg-[#090d1c]/95 backdrop-blur-md flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            ATL APPS STORE &bull; Safe, Verified Android Distribution
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadClick}
              className="glow-button px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download APK</span>
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Screenshot Lightbox */}
      {activeScreenshot && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setActiveScreenshot(null)}
        >
          <button
            onClick={() => setActiveScreenshot(null)}
            className="absolute top-4 right-4 p-3 text-white bg-slate-800/80 rounded-full hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeScreenshot}
            alt="Preview enlarged"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};
