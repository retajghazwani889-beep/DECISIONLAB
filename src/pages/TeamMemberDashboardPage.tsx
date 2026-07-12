import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Search, FileText, Bookmark, User as UserIcon, Settings, Loader2 } from 'lucide-react';

interface TeamMemberDashboardPageProps {
  user: any;
}

type Tab = 'dashboard' | 'browse' | 'applications' | 'saved' | 'profile' | 'settings';

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse Startups', icon: Search },
  { id: 'applications', label: 'My Applications', icon: FileText },
  { id: 'saved', label: 'Saved Startups', icon: Bookmark },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TeamMemberDashboardPage({ user }: TeamMemberDashboardPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');

  const isTeamMember = (profile as any)?.accountType === 'teamMember';

  // Route protection: only team-member accounts.
  React.useEffect(() => {
    if (user === undefined) return;
    if (!user) { navigate('/'); return; }
    if (profile === null || profile === undefined) return;
    if (!isTeamMember) navigate('/');
  }, [user, profile, isTeamMember, navigate]);

  if (!user || !isTeamMember) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  const placeholder = (title: string, sub: string) => (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-black uppercase tracking-tight font-display text-brand-text-primary mb-2">{title}</h2>
      <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto">{sub}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max">
          <div className="bg-brand-section border border-brand-border rounded-[2rem] p-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'text-brand-text-secondary hover:text-white border border-transparent'}`}
                >
                  <Icon size={17} /> {n.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main>
          {tab === 'dashboard' && (
            <div>
              <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Team Member</span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-2">
                Welcome{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}
              </h1>
              <p className="text-sm text-brand-text-secondary font-medium mb-8">Find startups looking for people like you, apply, and track your applications.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => setTab('browse')} className="text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><Search size={22} /></div>
                  <div><h3 className="text-sm font-black uppercase tracking-tight">Browse Startups</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">See who's hiring.</p></div>
                </button>
                <button onClick={() => setTab('applications')} className="text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><FileText size={22} /></div>
                  <div><h3 className="text-sm font-black uppercase tracking-tight">My Applications</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">Track your progress.</p></div>
                </button>
              </div>
            </div>
          )}

          {tab === 'browse' && placeholder('Browse Startups', 'Startup listings looking for team members will appear here — coming in the next step.')}
          {tab === 'applications' && placeholder('My Applications', 'Applications you submit will be tracked here.')}
          {tab === 'saved' && placeholder('Saved Startups', 'Startups you save will appear here.')}
          {tab === 'profile' && placeholder('Profile', 'Your team-member profile — resume, skills, and links.')}
          {tab === 'settings' && placeholder('Settings', 'Account settings.')}
        </main>
      </div>
    </div>
  );
}