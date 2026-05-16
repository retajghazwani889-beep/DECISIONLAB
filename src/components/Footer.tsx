import React from 'react';
import { Rocket, Twitter, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block group mb-4">
              <Logo showText size={20} />
            </Link>
            <p className="text-brand-text-secondary max-w-sm text-sm">
              Strategic venture analysis and institutional-grade insights for founders. 
              Validate your conviction with surgical precision.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-brand-text-primary mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-brand-text-secondary hover:text-brand-accent">Free Analysis</Link></li>
              <li><Link to="/premium" className="text-brand-text-secondary hover:text-brand-accent">Premium Analysis</Link></li>
              <li><Link to="/premium" className="text-brand-text-secondary hover:text-brand-accent">Investor Matching</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-brand-text-primary mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-brand-text-secondary hover:text-brand-accent">About Us</Link></li>
              <li><a href="#" className="text-brand-text-secondary hover:text-brand-accent">Privacy Policy</a></li>
              <li><a href="#" className="text-brand-text-secondary hover:text-brand-accent">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-brand-text-secondary">
            © {new Date().getFullYear()} DecisionLab. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="text-brand-text-secondary hover:text-brand-accent transition-colors"><Github size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
