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
      path: '/signup/investor',
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
          <p className="text-sm text-brand-text-secondary font-medium">How would you like to use DecisionLab?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="bg-brand-section border border-brand-border rounded-[2rem] p-7 flex flex-col hover:border-brand-accent/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight mb-2">{r.title}</h3>
                <p className="text-xs text-brand-text-secondary font-medium leading-relaxed flex-1">{r.body}</p>
                <button
                  onClick={() => navigate(r.path)}
                  className="mt-6 w-full py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {r.cta} <ArrowRight size={13} />
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