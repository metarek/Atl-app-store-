import React from 'react';
import { 
  DownloadCloud, 
  HardDrive, 
  Star, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  ArrowDownToLine,
  Eye
} from 'lucide-react';
import { AppItem } from '../types/app';
import confetti from 'canvas-confetti';

interface AppCardProps {
  app: AppItem;
  onSelectApp: (app: AppItem) => void;
  onDownloadApp: (app: AppItem, e: React.MouseEvent) => void;
  featured?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onSelectApp,
  onDownloadApp,
  featured = false,
}) => {
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#38bdf8', '#34d399'],
      });
    } catch {
      // ignore
    }
    onDownloadApp(app, e);
  };

  return (
    <div
      onClick={() => onSelectApp(app)}
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        featured
          ? 'bg-gradient-to-b from-[#111833] via-[#0d1226] to-[#0a0d1e] border-2 border-indigo-500/40 shadow-xl shadow-indigo-950/40 hover:border-indigo-400 hover:shadow-indigo-600/20'
          : 'glass-panel glass-panel-hover'
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {app.category}
        </span>

        <div className="flex items-center gap-1.5">
          {app.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Featured</span>
            </span>
          )}
          {app.status === 'draft' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Draft
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{app.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Main App Info Header */}
      <div className="flex items-start gap-3.5 mb-3">
        {/* App Icon */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
          <img
            src={app.iconUrl}
            alt={app.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback placeholder icon if external image fails
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Title & Developer */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate leading-tight">
            {app.name}
          </h3>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <span>{app.developer}</span>
            <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
              {app.version}
            </span>
            <span className="flex items-center gap-0.5 text-slate-400">
              <HardDrive className="w-3 h-3 text-slate-500" />
              {app.fileSizeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed font-normal">
        {app.shortDescription || 'High-performance Android APK release optimized for modern devices.'}
      </p>

      {/* Card Footer: Metadata and Action Buttons */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Downloads</span>
          <span className="text-xs font-bold text-slate-200">
            {app.downloadCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectApp(app);
            }}
            title="View Details"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadClick}
            className="glow-button px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
