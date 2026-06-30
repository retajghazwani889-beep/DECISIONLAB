import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Rocket, User as UserIcon, LogOut, ChevronDown, Zap, Lock, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { safeLocalStorage as localStorage } from '../lib/storage';

import Logo from './Logo';

interface NavbarProps {
  onOpenAccess: () => void;
}

export default function Navbar({ onOpenAccess }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const isRetajProfile = 
    user?.email?.toLowerCase().includes('retaj') || 
    user?.email?.toLowerCase().includes('assad') ||
    user?.email?.toLowerCase() === 'retajghazwani889@gmail.com' ||
    user?.displayName?.toLowerCase().includes('retaj') ||
    user?.displayName?.toLowerCase().includes('assad') ||
    profile?.email?.toLowerCase().includes('retaj') ||
    profile?.displayName?.toLowerCase().includes('retaj');

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#102434]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center">
            <Link to="/" className="group">
              <Logo />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-row flex-nowrap whitespace-nowrap">
            {[
              { label: 'HOME', path: '/' },
              { label: 'ABOUT US', path: '/about' },
              { label: 'DASHBOARD', path: '/dashboard', hidden: !user && !localStorage.getItem('cached_analyses') },
              { label: 'PRICING', path: '/pricing' },
              { label: 'INVESTOR NETWORK', path: '/investor-network' },
            ].map(link => {
              if (link.hidden) return null;
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={cn(
                    "px-4 py-2.5 text-xs font-bold uppercase tracking-[0.05em] transition-all relative block select-none duration-300 font-sans whitespace-nowrap",
                    isActive 
                      ? cn(
                          "text-white rounded-lg border",
                          link.label === 'DASHBOARD'
                            ? "bg-[#1c354a] border-[#5da9ff] shadow-[0_0_18px_rgba(93,169,255,0.7)] animate-pulse"
                            : "frosted-slate-blue border-white/10 shadow-sm"
                        )
                      : "text-brand-text-secondary hover:text-white"
                  )}
                >
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-4 p-2 pr-6 rounded-2xl border border-brand-accent/10 bg-brand-accent/5 hover:bg-brand-accent/10 transition-all group"
                >
                  <div className="relative">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-xl border border-brand-accent/20 group-hover:border-brand-accent transition-colors" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-section border border-brand-accent/20 flex items-center justify-center">
                        <UserIcon size={16} className="text-brand-accent" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-brand-bg rounded-full shadow-lg" title="Online" />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-2">
                    <span className="text-sm font-black text-brand-text-primary uppercase tracking-tight whitespace-nowrap">
                      RETAJ
                    </span>
                    <span className="text-[12px] font-semibold text-[#5da9ff] uppercase tracking-[0.02em] opacity-95 whitespace-nowrap">
                      CHIEF EDITOR
                    </span>
                  </div>
                  <ChevronDown size={14} className={cn("text-brand-accent transition-transform duration-300", dropdownOpen && "rotate-180")} />
                </button>
 
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-72 bg-brand-section/95 backdrop-blur-3xl border border-brand-accent/20 rounded-[2.5rem] shadow-huge overflow-hidden z-[100] p-3"
                    >
                      <div className="px-6 py-5 border-b border-brand-accent/10 mb-3 bg-brand-accent/5 rounded-t-[2rem]">
                        <p className="text-sm font-black text-brand-text-primary uppercase tracking-tight truncate whitespace-nowrap">RETAJ GHAZWANI</p>
                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mt-1 opacity-60">ID: {user.uid.slice(0, 8)}</p>
                      </div>
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-accent/10 rounded-xl transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <Database size={18} className="text-brand-accent" /> Dashboard
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <Link
                          to="/pricing"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Zap size={18} fill="currentColor" /> Pricing
                          </div>
                        </Link>
                      </div>
                      <div className="mt-3 pt-3 border-t border-brand-accent/10">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-all"
                        >
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAccess}
                className="flex items-center gap-3 px-10 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Lock className="w-4 h-4" />
                Enter
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}