import React from 'react';
import { 
  DownloadCloud, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

interface HeroProps {
  onExploreApps: () => void;
  onLatestReleases: () => void;
  totalApps: number;
  totalDownloads: number;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreApps,
  onLatestReleases,
  totalApps,
  totalDownloads,
}) => {
  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      {/* Background radial gradient glow lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide shadow-inner backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>OFFICIAL DISTRIBUTOR &bull; VERIFIED ANDROID APKS</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover Apps.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400">
              Download.
            </span>{' '}
            Experience.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            Explore apps developed and published by <strong className="text-white font-semibold">ATL APPS STORE</strong>. 
            Enjoy lightning-fast direct APK downloads with zero speed limits, zero intrusive tracking, and verified package security.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onExploreApps}
              className="glow-button px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform active:scale-95"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Explore Apps</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={onLatestReleases}
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/40 text-slate-200 hover:text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Latest Releases</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">100% Verified</p>
                <p className="text-[11px] text-slate-400">Malware & virus free</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Direct CDN</p>
                <p className="text-[11px] text-slate-400">High-speed downloads</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Android Ready</p>
                <p className="text-[11px] text-slate-400">Phones, Tablets & TVs</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Hardware Tuned</p>
                <p className="text-[11px] text-slate-400">Optimized performance</p>
              </div>
            </div>
          </div>

          {/* Live Store Metrics */}
          <div className="pt-2 flex items-center justify-center gap-6 sm:gap-12 border-t border-white/5">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {totalApps}
              </p>
              <p className="text-xs text-slate-400 font-medium">Published Apps</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                {totalDownloads > 0 ? totalDownloads.toLocaleString() : '50,000+'}
              </p>
              <p className="text-xs text-slate-400 font-medium">Total Downloads</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                4.9 <span className="text-amber-400 text-lg">★</span>
              </p>
              <p className="text-xs text-slate-400 font-medium">User Rating</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
