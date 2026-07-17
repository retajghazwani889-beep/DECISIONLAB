import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

// Catch-all 404 page. Before this existed, any mistyped URL rendered the
// navbar and footer with a blank void in between.
export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
          <Compass size={26} />
        </div>
        <p className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] mb-4">404 — Page Not Found</p>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-4">
          This page doesn't exist
        </h1>
        <p className="text-sm text-brand-text-secondary font-medium leading-relaxed mb-10">
          The link may be broken or the page may have moved. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 px-10 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20"
        >
          <Home size={15} /> Back To Home
        </Link>
      </div>
    </div>
  );
}