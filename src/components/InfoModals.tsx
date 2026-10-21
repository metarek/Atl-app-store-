import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export type InfoModalType = 'about' | 'contact' | 'privacy' | 'terms' | 'guide';

interface InfoModalsProps {
  type: InfoModalType | null;
  onClose: () => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({ type, onClose }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  if (!type) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#090d1c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090d1c]/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              {type === 'guide' && <Smartphone className="w-5 h-5" />}
              {type === 'about' && <Layers className="w-5 h-5" />}
              {type === 'contact' && <Send className="w-5 h-5" />}
              {type === 'privacy' && <Lock className="w-5 h-5" />}
              {type === 'terms' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <h3 className="text-lg font-bold text-white capitalize">
              {type === 'guide' && 'How to Install APK on Android'}
              {type === 'about' && 'About ATL APPS STORE'}
              {type === 'contact' && 'Contact Us & Developer Support'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          
          {/* 1. ANDROID INSTALL GUIDE */}
          {type === 'guide' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Android allows users to install applications directly using <strong className="text-white">APK (.apk)</strong> packages. Follow these 3 easy steps to install any app downloaded from <strong className="text-indigo-400">ATL APPS STORE</strong>:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Download the APK File</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tap the "Download APK" button on any app in ATL APPS STORE. Your browser will prompt you that the file is downloading.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Allow "Install Unknown Apps"</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      When opening the file, Android might display a security dialog: <em>"For your security, your phone is not allowed to install unknown apps from this source"</em>.
                    </p>
                    <p className="text-xs text-indigo-300 mt-1">
                      Tap <strong>Settings</strong> &gt; toggle <strong>Allow from this source</strong> to ON.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Complete Installation</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Return to your browser or open the downloaded file from your Notifications / Downloads folder, tap <strong>Install</strong>, and enjoy!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>All APK binaries on ATL APPS STORE are digitally inspected and verified clean before publication.</span>
              </div>
            </div>
          )}

          {/* 2. ABOUT US */}
          {type === 'about' && (
            <div className="space-y-4">
              <p>
                <strong className="text-white text-base">ATL APPS STORE</strong> is an independent, premium Android application distribution platform. We develop and curate high-performance, ad-light, and privacy-respecting tools, entertainment software, games, and productivity applications for Android users worldwide.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400 mb-1">
                    Direct Distribution
                  </h4>
                  <p className="text-xs text-slate-400">
                    No middlemen, no forced account logins, no wait times. Immediate raw APK downloads with full cryptographic integrity checks.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400 mb-1">
                    Zero Malicious Bloat
                  </h4>
                  <p className="text-xs text-slate-400">
                    Every release is tested on actual Android hardware to prevent memory leaks, background battery drain, and unwanted tracking.
                  </p>
                </div>
              </div>

              <p className="text-slate-400 text-xs pt-2">
                Developed and maintained by the ATL APPS Engineering Team. Built with modern web engineering, Cloud Firestore compatibility, and hardened security standards.
              </p>
            </div>
          )}

          {/* 3. CONTACT US */}
          {type === 'contact' && (
            <div className="space-y-4">
              {contactSubmitted ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Message Sent Successfully!</h4>
                  <p className="text-xs text-slate-400">
                    Thank you for reaching out to ATL APPS STORE. Our developer team will respond to your inquiry shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Have feedback, feature requests, or application publication questions? Send us a message below:
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Alex Miller"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="e.g. alex@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Write your message here..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full glow-button py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message to Support</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-3">
              <p>
                At <strong className="text-white">ATL APPS STORE</strong>, privacy is a fundamental design principle.
              </p>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                1. No Personal Data Harvesting
              </h4>
              <p className="text-xs text-slate-400">
                We do not require users to create an account, provide phone numbers, or grant identity permissions to download applications.
              </p>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                2. Download Analytics
              </h4>
              <p className="text-xs text-slate-400">
                We track non-identifiable download frequencies with temporary IP-hashed deduplication windows solely to prevent malicious automated scraping and provide accurate download statistics.
              </p>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                3. Application Integrity
              </h4>
              <p className="text-xs text-slate-400">
                All uploaded APK binaries are scanned and stored with unique SHA-256 signatures so that end users can independently verify that the downloaded package is byte-for-byte identical to the developer release.
              </p>
            </div>
          )}

          {/* 5. TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-3">
              <p>
                By downloading software from <strong className="text-white">ATL APPS STORE</strong>, you agree to standard software usage terms.
              </p>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                1. License & Rights
              </h4>
              <p className="text-xs text-slate-400">
                Applications distributed on this website are the intellectual property of ATL APPS STORE and respective authors. Users are granted a personal, non-commercial license to install and run APKs on compatible Android devices.
              </p>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                2. Fair Use & Sideloading
              </h4>
              <p className="text-xs text-slate-400">
                Users are solely responsible for compliance with their local jurisdiction and mobile device manufacturer guidelines regarding sideloading third-party Android packages.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#090d1c]/95 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
