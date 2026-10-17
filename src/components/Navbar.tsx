import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Language, translations } from '../utils/i18n';
import { Globe, LogIn, LogOut, ShieldCheck, Radio, UserCheck } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenFoundersCommandCenter?: () => void;
  brandName?: string;
  tagline?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onOpenFoundersCommandCenter,
  brandName,
  tagline,
}) => {
  const { user, signInWithGoogle, signOutUser, loading, authError } = useAuth();
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                {brandName || t.appTitle}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Sovereign v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {tagline || t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right side tools */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Founder's Command Center Trigger */}
          {onOpenFoundersCommandCenter && (
            <button
              onClick={onOpenFoundersCommandCenter}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Open Founder's Executive Command Center"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {language === 'bn' ? 'কমান্ড সেন্টার' : "Founder's Hub"}
              </span>
            </button>
          )}

          {/* Cloud Status */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">Firestore Connected</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="Toggle Language / ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Auth section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          ) : user ? (
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 rounded-full pl-2 pr-1 py-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-indigo-400/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-semibold leading-tight text-white max-w-[120px] truncate">
                  {user.displayName || 'Nexus User'}
                </p>
                <p className="text-[10px] text-slate-400 max-w-[120px] truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={signOutUser}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.signInWithGoogle}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-red-950/80 border-t border-red-800/60 text-red-200 text-xs px-4 py-2 text-center">
          {authError}
        </div>
      )}
    </header>
  );
};
