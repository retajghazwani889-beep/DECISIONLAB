import React from 'react';
import { Rocket, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

import Logo from './Logo';

// TikTok icon (lucide has no TikTok) — matches the 20px stroke style.
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block group mb-4">
              <Logo />
            </Link>
            <p className="text-base font-medium text-slate-300 tracking-[0.02em] opacity-95 max-w-sm">
              Turning your ideas into plans investors trust
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-brand-text-primary mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-brand-text-secondary hover:text-brand-accent">Free Analysis</Link></li>
              <li><Link to="/pricing" className="text-brand-text-secondary hover:text-brand-accent">Pricing</Link></li>
              <li><Link to="/investor-network" className="text-brand-text-secondary hover:text-brand-accent">For Investors</Link></li>
              <li><Link to="/team-members" className="text-brand-text-secondary hover:text-brand-accent">For Team Members</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-brand-text-primary mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-brand-text-secondary hover:text-brand-accent">About Us</Link></li>
              <li><Link to="/contact" className="text-brand-text-secondary hover:text-brand-accent">Contact Us</Link></li>
              <li><Link to="/faq" className="text-brand-text-secondary hover:text-brand-accent">FAQs</Link></li>
              <li><Link to="/privacy" className="text-brand-text-secondary hover:text-brand-accent">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-brand-text-secondary hover:text-brand-accent">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="text-brand-text-secondary hover:text-brand-accent">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-base font-medium text-slate-300 tracking-[0.02em] opacity-95">
            © {new Date().getFullYear()} DecisionLab All rights reserved
          </p>
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/decisionlabplatform/" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Instagram size={20} /></a>
            <a href="https://x.com/Decisionlab0" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Twitter size={20} /></a>
            <a href="https://www.linkedin.com/company/decisionlab-hub/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Linkedin size={20} /></a>
            <a href="https://www.tiktok.com/@decisionlab0" target="_blank" rel="noreferrer" aria-label="TikTok" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><TikTokIcon size={20} /></a>
            <a href="https://www.youtube.com/@DECISIONLAB0" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Youtube size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}