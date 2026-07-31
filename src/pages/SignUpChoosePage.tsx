import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

// "How would you like to use DecisionLab?" — the first Sign Up step.
// Each card routes to that role's dedicated registration form.
export default function SignUpChoosePage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'founder',
      icon: Rocket,
      title: 'Founder',
      body: 'Build, validate, and grow startups.',
      cta: 'Continue as Founder',
      path: '/signup/founder',
    },
    {
      id: 'investor',
      icon: TrendingUp,
      title: 'Investor',
      body: 'Discover, evaluate, and connect with startups.',
      cta: 'Continue as Investor',
      path: '/investor-network',
      comingSoon: true,
    },
    {
      id: 'teamMember',
      icon: Users,
      title: 'Team Member',
      body: 'Join startups looking for developers, designers, marketers, advisors, and other professionals.',
      cta: 'Continue as Team Member',
      path: '/signup/team',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-3">Welcome to DecisionLab</h1>
          <p className="text-sm text-brand-text-secondary font-medium">Sign up as a Founder, Investor, or Team Member</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className={`bg-brand-section border border-brand-border rounded-[2rem] p-7 flex flex-col transition-all ${r.comingSoon ? 'opacity-60' : 'hover:border-brand-accent/40'}`}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Icon size={22} />
                  </div>
                  {r.comingSoon && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent border border-brand-accent/30 bg-brand-accent/10 px-2 py-1 rounded-full">Coming Soon</span>
                  )}
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight mb-2">{r.title}</h3>
                <p className="text-xs text-brand-text-secondary font-medium leading-relaxed flex-1">{r.body}</p>
                <button
                  onClick={() => !r.comingSoon && navigate(r.path)}
                  disabled={r.comingSoon}
                  className={`mt-6 w-full py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 ${r.comingSoon ? 'bg-brand-border text-brand-text-secondary cursor-not-allowed' : 'bg-brand-accent text-brand-bg hover:scale-[1.02] active:scale-95'}`}
                >
                  {r.cta} {!r.comingSoon && <ArrowRight size={13} />}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-brand-text-secondary font-medium mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-accent font-black hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}