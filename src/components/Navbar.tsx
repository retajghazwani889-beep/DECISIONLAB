import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Rocket, User as UserIcon, LogOut, ChevronDown, Zap, Lock, Database, CreditCard, Bell, Settings, Home, Menu, X as CloseX } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu whenever the route changes.
  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Investor accounts get their own minimal nav — never the founder pages.
  // IMPORTANT: role flags require a signed-in user. If `user` is null, any
  // lingering profile object is stale (e.g. a slow fetch that resolved after
  // logout) and must never put the navbar into a logged-in mode.
  const isInvestor = !!user && (profile as any)?.accountType === 'investor';
  const isTeamMember = !!user && (profile as any)?.accountType === 'teamMember';
  // Investor "portal" area: also true (even when logged out) on investor pages,
  // so the investor sign-in page shows no founder nav and no founder ENTER button.
  const investorArea = isInvestor || location.pathname.startsWith('/investor-');
  const founderLinks = [
    { label: 'HOME', path: '/' },
    { label: 'ABOUT US', path: '/about' },
    { label: 'MY STARTUPS', path: '/startups', hidden: !user },
    { label: 'PRICING', path: '/pricing' },
    { label: 'INVESTOR NETWORK', path: '/investor-network' },
  ];
  const teamMemberLinks = [
    { label: 'DASHBOARD', path: '/team' },
    { label: 'BROWSE STARTUPS', path: '/team' },
    { label: 'MY APPLICATIONS', path: '/team' },
  ];
  const investorLinks = [
    { label: 'HOME', path: '/' },
    { label: 'MATCHES', path: '/investor-matches' },
    { label: 'SUBMISSIONS', path: '/investor-submissions' },
    { label: 'MATCH HISTORY', path: '/investor-history' },
  ];
  // Logged-in investor → matches link. Investor pages while logged out → no
  // center links (clean portal). Everyone else → founder links.
  const navLinks = isTeamMember ? teamMemberLinks : (isInvestor ? investorLinks : (investorArea ? [] : founderLinks));

  // Real identity, straight from the signed-in user's profile. `fullName` is what
  // the dropdown shows; `firstName` keeps the compact button tidy; `roleLabel` is
  // the role they chose at onboarding (or their investor badge). No hardcoded names.
  const fullName =
    profile?.displayName || (profile as any)?.fullName || user?.displayName || 'Member';
  const firstName = fullName.split(' ')[0] || fullName;
  const roleLabel = isTeamMember
    ? 'Team Member'
    : (isInvestor
        ? ((profile as any)?.investorBadge || 'Investor')
        : ((profile as any)?.roleType || 'Member'));

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      // Always leave protected pages on logout — for every account type.
      navigate('/', { replace: true });
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
            {navLinks.map(link => {
              if ((link as any).hidden) return null;
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path + '-' + link.label}
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

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="lg:hidden p-2.5 rounded-xl bg-brand-card border border-white/10 text-brand-text-primary hover:border-brand-accent/40 active:scale-95 transition-all"
            >
              {mobileOpen ? <CloseX size={18} /> : <Menu size={18} />}
            </button>
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
                      {firstName}
                    </span>
                    <span className="text-[12px] font-semibold text-[#5da9ff] uppercase tracking-[0.02em] opacity-95 whitespace-nowrap">
                      {roleLabel}
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
                        <p className="text-sm font-black text-brand-text-primary uppercase tracking-tight truncate whitespace-nowrap">{fullName}</p>
                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mt-1 opacity-60">ID: {user.uid.slice(0, 8)}</p>
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const item = (to: string, Icon: any, text: string) => (
                            <Link
                              key={to + text}
                              to={to}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-accent/10 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <Icon size={18} className="text-brand-accent" /> {text}
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          );
                          const items = [item('/profile', UserIcon, 'Personal Profile')];
                          if (isInvestor) {
                            items.push(item('/investor-matches', Database, 'My Matches'));
                            items.push(item('/investor-submissions', Database, 'Submissions'));
                            items.push(item('/billing', CreditCard, 'Billing & Subscription'));
                          } else if (isTeamMember) {
                            items.push(item('/team', Database, 'Dashboard'));
                          } else {
                            items.push(item('/startups', Rocket, 'My Startups'));
                            items.push(item('/compare', Zap, 'Compare Startups'));
                            items.push(item('/billing', CreditCard, 'Billing & Subscription'));
                          }
                          items.push(item('/notifications', Bell, 'Notifications'));
                          items.push(item('/settings', Settings, 'Account Settings'));
                          return items;
                        })()}
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
            ) : investorArea ? (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/"
                  className="px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-brand-text-secondary hover:text-white transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  <Home size={14} /> Back to Home
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all whitespace-nowrap"
                >
                  Log In
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-brand-text-secondary hover:text-white transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-3 px-10 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 group relative overflow-hidden whitespace-nowrap"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Lock className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile menu panel ── */}
        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t border-white/5 pt-4 space-y-1">
            {navLinks.map((link) => {
              if ((link as any).hidden) return null;
              return (
                <Link
                  key={'m-' + link.path + link.label}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.05em]",
                    location.pathname === link.path ? "bg-brand-accent/10 text-white" : "text-brand-text-secondary hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {!user && (
              <div className="pt-3 mt-2 border-t border-white/5 space-y-2">
                {investorArea && (
                  <Link to="/" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.05em] text-brand-text-secondary hover:text-white">
                    ← Back to Home
                  </Link>
                )}
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center bg-brand-card border border-white/10 text-brand-text-primary">
                  Log In
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center bg-brand-accent text-brand-bg">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}