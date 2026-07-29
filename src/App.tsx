import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertTriangle, ExternalLink } from 'lucide-react';

// Pages
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import StartupDashboardPage from './pages/StartupDashboardPage';
import PremiumPage from './pages/PremiumPage';
import ComparisonPage from './pages/ComparisonPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TeamMembersLandingPage from './pages/TeamMembersLandingPage';
import { PrivacyPolicyPage, TermsOfServicePage, RefundPolicyPage } from './pages/LegalPages';
import FAQPage from './pages/FAQPage';
import InvestorNetworkPage from './pages/InvestorNetworkPage';
import InvestorMatchesPage from './pages/InvestorMatchesPage';
import InvestorHistoryPage from './pages/InvestorHistoryPage';
import InvestorSubmissionsPage from './pages/InvestorSubmissionsPage';
import TeamMemberDashboardPage from './pages/TeamMemberDashboardPage';
import LoginPage from './pages/LoginPage';
import SignUpChoosePage from './pages/SignUpChoosePage';
import FounderSignUpPage from './pages/FounderSignUpPage';
import InvestorSignUpPage from './pages/InvestorSignUpPage';
import TeamMemberSignUpPage from './pages/TeamMemberSignUpPage';
import FounderWelcomePage from './pages/FounderWelcomePage';
import StartupSetupWizard from './pages/StartupSetupWizard';
import MyStartupsPage from './pages/MyStartupsPage';
import PersonalProfilePage from './pages/PersonalProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import BillingPage from './pages/BillingPage';
import NotificationsPage from './pages/NotificationsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import StartupWorkspacePage from './pages/StartupWorkspacePage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RequireTier } from './components/UpgradeGate';
import VentureOperator from './components/VentureOperator';

// Pitch Deck Architect — live analysis-driven engine (replaces old PitchDeckArchitectPage)
import PitchDeckArchitectEngine from './pages/PitchDeckArchitectPage';
import NotFoundPage from './pages/NotFoundPage';

// Scrolls the window back to the top on every route change. Without this,
// React Router keeps the old scroll position — clicking a link from the
// middle of one page landed you in the middle of the next.
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { user, profile, loading, googleWorkspaceError, setGoogleWorkspaceError } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  // Hide navbar/footer on the pitch deck editor so it gets the full viewport
  const isArchitect = location.pathname.startsWith('/pitch-deck');

  // Resume a pending idea (typed on the homepage before signup/login).
  //  · Brand-new founders mid-onboarding (pricing → welcome → wizard): DON'T
  //    hijack them — the setup wizard picks the idea up and pre-fills it, so
  //    their analysis is built from the full questionnaire.
  //  · Existing users logging back in: go straight to analysis as promised.
  React.useEffect(() => {
    if (user && profile && profile.onboardingCompleted && !loading) {
      const p = location.pathname;
      const inOnboardingFlow = p.startsWith('/pricing') || p.startsWith('/welcome') || p.startsWith('/setup') || p.startsWith('/signup');
      if (inOnboardingFlow) return; // wizard will consume the idea
      const pendingIdea = localStorage.getItem('pending_analysis_idea');
      if (pendingIdea) {
        localStorage.removeItem('pending_analysis_idea');
        navigate('/analyze', { state: { idea: pendingIdea } });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  // ── HARD ROLE SEPARATION (all three roles) ────────────────────────────────
  // Each role sees ONLY its own logged-in area:
  //   · Team Member → /team (+ shared pages)
  //   · Investor    → investor dashboards + viewing matched startup reports
  //   · Founder     → founder dashboards/wizard/deck
  // Public pages (home, pricing, about, landings, signup, login) stay open —
  // switching roles is only possible by willingly logging out via the signup
  // guards. Shared account pages (/profile, /billing, /notifications,
  // /settings) stay open to every logged-in role.
  React.useEffect(() => {
    if (loading || !user || !profile) return;
    const p = location.pathname;
    const accountType = (profile as any)?.accountType || '';

    if (accountType === 'teamMember') {
      const blocked =
        p.startsWith('/dashboard') || p === '/analyze' || p === '/compare' ||
        p.startsWith('/pitch-deck') || p.startsWith('/startups') ||
        p.startsWith('/setup') || p.startsWith('/welcome') ||
        p.startsWith('/investor-matches') || p.startsWith('/investor-submissions') ||
        p.startsWith('/investor-history') || p.startsWith('/analysis/');
      if (blocked) navigate('/team', { replace: true });
      return;
    }

    if (accountType === 'investor') {
      const blocked =
        p === '/dashboard' ||            // exact: /dashboard/startup/:id report pages stay open so investors can view matched startups
        p === '/analyze' || p === '/compare' ||
        p.startsWith('/pitch-deck') || p.startsWith('/startups') ||
        p.startsWith('/setup') || p.startsWith('/welcome') ||
        p === '/team';
      if (blocked) navigate('/investor-matches', { replace: true });
      return;
    }

    // Founder (default role): no investor dashboards, no team member dashboard.
    const blocked =
      p === '/team' ||
      p.startsWith('/investor-matches') ||
      p.startsWith('/investor-submissions') ||
      p.startsWith('/investor-history');
    if (blocked) navigate('/startups', { replace: true });
  }, [user, profile, loading, location.pathname, navigate]);

  // Founder pages require a login. Logged-out visitors can't see the
  // dashboard/portfolio, comparisons, or pitch deck (browser cache no longer
  // exposes them). They're sent home to sign in first.
  React.useEffect(() => {
    if (loading || user) return;
    const p = location.pathname;
    const needsLogin =
      p.startsWith('/dashboard') ||   // includes /dashboard/startup/... report pages
      p === '/compare' ||
      p === '/analyze' ||
      p === '/team' ||
      p.startsWith('/investor-matches') ||
      p.startsWith('/investor-submissions') ||
      p.startsWith('/investor-history') ||
      p.startsWith('/pitch-deck') ||
      p.startsWith('/welcome') ||
      p.startsWith('/setup') ||
      p.startsWith('/startups') ||
      p.startsWith('/profile') || p === '/billing' || p === '/notifications' || p === '/settings';
    if (needsLogin) {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08131D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
          <div className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] animate-pulse">
            Initializing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary selection:bg-brand-accent/30 font-sans">

      {/* Navbar — hidden inside the deck editor */}
      {!isArchitect && (
        <div className="no-print">
          <ScrollToTop />
          <Navbar onOpenAccess={() => navigate('/signup')} />
        </div>
      )}

      {/* Google Workspace connection error banner */}
      {googleWorkspaceError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-[#0b131e] border border-red-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            <div className="flex items-start gap-4 mt-2">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                  Google Workspace connection prevented
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {googleWorkspaceError}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGoogleWorkspaceError(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer rounded-xl bg-slate-900 border border-slate-800"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setGoogleWorkspaceError(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl transition-all shadow-lg shadow-amber-400/10 flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={13} />
                Launch App in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`bg-brand-bg ${isArchitect ? '' : 'pt-16'}`}>
        <Routes>
          {/* ── Public pages ── */}
          <Route path="/"        element={<HomePage user={user} profile={profile} onOpenAccess={() => navigate('/signup')} />} />
          <Route path="/about"   element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/team-members" element={<TeamMembersLandingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/pricing" element={<PremiumPage user={user} profile={profile} />} />
          <Route path="/premium" element={<Navigate to="/pricing" replace />} />
          <Route path="/compare" element={<RequireTier tier="growth" featureName="Startup Comparisons"><ComparisonPage /></RequireTier>} />

          {/* ── Investor Network — Coming Soon, all routes redirect to pricing ── */}
          <Route path="/investor-network" element={<Navigate to="/pricing" replace />} />
          <Route path="/investor-matches" element={<Navigate to="/pricing" replace />} />
          <Route path="/investor-submissions" element={<Navigate to="/pricing" replace />} />
          <Route path="/investor-history" element={<Navigate to="/pricing" replace />} />
          <Route path="/team" element={<TeamMemberDashboardPage user={user} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpChoosePage />} />
          <Route path="/signup/founder" element={<FounderSignUpPage />} />
          <Route path="/signup/investor" element={<InvestorSignUpPage />} />
          <Route path="/signup/team" element={<TeamMemberSignUpPage />} />
          <Route path="/welcome/founder" element={<FounderWelcomePage />} />
          <Route path="/setup/startup" element={<StartupSetupWizard />} />
          <Route path="/startups" element={<MyStartupsPage />} />
          <Route path="/profile" element={<PersonalProfilePage />} />
          <Route path="/profile/:uid" element={<PublicProfilePage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/startups/:id" element={<StartupWorkspacePage />} />

          {/* ── Analysis ── */}
          <Route path="/analyze" element={<AnalysisPage key="analyze" user={user} profile={profile} />} />

          {/* ── Dashboard ── */}
          {/* Old dashboard retired — My Startups is the founder home. */}
          <Route path="/dashboard"                          element={<Navigate to="/startups" replace />} />
          <Route path="/dashboard/startup/:id"              element={<StartupDashboardPage user={user} profile={profile} />} />
          <Route path="/dashboard/startup/:id/overview"    element={<StartupDashboardPage user={user} profile={profile} />} />
          <Route path="/dashboard/startup/:id/report"      element={<StartupDashboardPage user={user} profile={profile} />} />
          <Route path="/analysis/:id"                       element={<StartupDashboardPage user={user} profile={profile} />} />

          {/* ── Pitch Deck Architect ──
               Reads ?projectId= from the URL and loads real Firestore analysis.
               Launched from ResultsDashboard via:
               <Link to={`/pitch-deck?projectId=${currentAnalysis.id}`}>Launch Deck Editor</Link>
               Requires login — redirects to home if not authenticated. */}
          <Route
            path="/pitch-deck"
            element={<RequireTier tier="growth" featureName="Pitch Deck Architect"><PitchDeckArchitectEngine /></RequireTier>}
          />
          {/* Catch-all: any unknown URL gets a proper 404 instead of a blank page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer — hidden inside the deck editor */}
      {!isArchitect && (
        <div className="no-print">
          <Footer />
        </div>
      )}

      <VentureOperator />

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}