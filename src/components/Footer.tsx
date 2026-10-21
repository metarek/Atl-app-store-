import React from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Heart, 
  ExternalLink, 
  Lock,
  ArrowUp
} from 'lucide-react';
import { InfoModalType } from './InfoModals';

interface FooterProps {
  onOpenInfo: (type: InfoModalType) => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenInfo,
  onOpenAdmin,
  isAdmin,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#050711] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="text-base font-black text-white tracking-wider">
                ATL APPS STORE
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-md text-xs">
              The premier Android APK distribution hub. High-speed direct downloads, cryptographically signed binaries, verified malware-free packages, and zero unnecessary data collection.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified APK Platform</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-white/5 text-[11px] font-semibold">
                <span>Android 8.0 &ndash; 15</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={scrollToTop}
                  className="hover:text-white transition-colors"
                >
                  Home Showcase
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('all-apps');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  All Applications
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('categories');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  App Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('guide')}
                  className="hover:text-white transition-colors text-indigo-400 hover:underline"
                >
                  How to Install APKs
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Administration */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenInfo('about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact & Inquiries
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={onOpenAdmin}
                  className="text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Lock className="w-3 h-3" />
                  <span>{isAdmin ? 'Admin Console' : 'Administrator Login'}</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} <strong className="text-slate-400 font-semibold">ATL APPS STORE</strong>. All rights reserved. Android is a trademark of Google LLC.
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
