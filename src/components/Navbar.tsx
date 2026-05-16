import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Rocket, User as UserIcon, LogOut, ChevronDown, Zap, Lock, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import Logo from './Logo';

interface NavbarProps {
  onOpenAccess: () => void;
}

export default function Navbar({ onOpenAccess }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-accent/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center">
            <Link to="/" className="group">
              <Logo showText showTagline size={28} />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {[
              { label: 'Insights', path: '/' },
              { label: 'Venture Studio', path: '/about' },
              { label: 'Executive Desk', path: '/dashboard', hidden: !user },
              { label: 'Deck Architect', path: '/pitch-deck', hidden: !user },
              { label: 'Comparison', path: '/compare', hidden: !user },
            ].map(link => (
              !link.hidden && (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className="px-6 py-3 text-xs font-black uppercase tracking-[0.3em] text-brand-text-secondary hover:text-brand-accent transition-all relative group font-display"
                >
                  <span className="relative z-10 font-display">{link.label}</span>
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              )
            ))}
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
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-brand-bg rounded-full shadow-lg" title="Access Online" />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-2">
                    <span className="text-sm font-black text-brand-text-primary uppercase tracking-tight">
                      {user.displayName?.split(' ')[0] || 'Member'}
                    </span>
                    <span className="text-xs font-bold text-brand-accent uppercase tracking-widest opacity-80">
                      {profile?.roleType || 'Authorized'}
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
                        <p className="text-sm font-black text-brand-text-primary uppercase tracking-tight truncate">{user.displayName || 'Authorized User'}</p>
                        <p className="text-xs font-black text-brand-accent uppercase tracking-widest mt-1 opacity-60">ID: {user.uid.slice(0, 8)}</p>
                      </div>
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-accent/10 rounded-xl transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <Database size={18} className="text-brand-accent" /> Venture Vault
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <Link
                          to="/premium"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Zap size={18} fill="currentColor" /> Premium Access
                          </div>
                        </Link>
                      </div>
                      <div className="mt-3 pt-3 border-t border-brand-accent/10">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-all"
                        >
                          <LogOut size={18} /> Terminate Session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAccess}
                className="flex items-center gap-3 px-10 py-4 bg-brand-accent text-brand-bg text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Lock className="w-4 h-4" />
                Initialize Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
