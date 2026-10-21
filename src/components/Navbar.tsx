import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  ShieldCheck, 
  Menu, 
  X, 
  Smartphone, 
  Sparkles,
  ExternalLink,
  Lock,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
  onOpenInfo: (type: 'about' | 'contact' | 'guide') => void;
  onSelectCategory: (cat: string) => void;
  isAdmin: boolean;
  onAdminLogout: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenAdmin,
  onOpenInfo,
  onSelectCategory,
  isAdmin,
  onAdminLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#070913]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo */}
          <button 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-3 group text-left transition-transform active:scale-95"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-[1.5px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center relative overflow-hidden group-hover:bg-[#0f1422] transition-colors">
                {/* Custom APK Store Icon */}
                <Smartphone className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0b0f19] animate-pulse" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  ATL APPS
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
                  STORE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Verified Android APK Distribution
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNavClick('hero')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('all-apps')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              All Apps
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Categories
            </button>
            <button
              onClick={() => onOpenInfo('guide')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <span>Install Guide</span>
            </button>
            <button
              onClick={() => onOpenInfo('about')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => onOpenInfo('contact')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Icons: Search & Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSearch}
              aria-label="Search apps"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-sm shadow-sm"
            >
              <Search className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline text-xs text-slate-400">Search APKs...</span>
              <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">⌘K</kbd>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-1 pr-2">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  title="Logout Admin"
                  className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* Mobile menu hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#070913]/98 px-4 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => handleNavClick('hero')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-900/50 border border-white/5"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Home</span>
            </button>
            <button
              onClick={() => handleNavClick('all-apps')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-900/50 border border-white/5"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>All Apps</span>
            </button>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
              Quick Categories
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs text-slate-300">
              {['Tools', 'Entertainment', 'Games', 'Productivity', 'Utilities', 'Other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    handleNavClick('all-apps');
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 text-left"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 space-y-1 text-sm">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInfo('guide');
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Android Install Guide</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInfo('about');
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              About ATL APPS STORE
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInfo('contact');
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Contact Support
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
