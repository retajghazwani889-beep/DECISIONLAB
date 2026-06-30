import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { safeLocalStorage as localStorage } from './lib/storage';

// Pages
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import StartupDashboardPage from './pages/StartupDashboardPage';
import DashboardPage from './pages/DashboardPage';
import PremiumPage from './pages/PremiumPage';
import ComparisonPage from './pages/ComparisonPage';
import AboutPage from './pages/AboutPage';
import InvestorNetworkPage from './pages/InvestorNetworkPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VentureOperator from './components/VentureOperator';
import UserOnboarding from './components/UserOnboarding';

// Pitch Deck Architect — live analysis-driven engine (replaces old PitchDeckArchitectPage)
import PitchDeckArchitectEngine from './pages/PitchDeckArchitectPage';

function AppContent() {
  const { user, profile, loading, googleWorkspaceError, setGoogleWorkspaceError } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  // Hide navbar/footer on the pitch deck editor so it gets the full viewport
  const isArchitect = location.pathname.startsWith('/pitch-deck');

  // Trigger onboarding for new users
  React.useEffect(() => {
    if (user && !loading) {
      if (!profile || !profile.onboardingCompleted) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user, profile, loading]);

  // Resume a pending idea analysis after login / onboarding
  React.useEffect(() => {
    if (user && profile && profile.onboardingCompleted && !loading) {
      const pendingIdea = localStorage.getItem('pending_analysis_idea');
      if (pendingIdea) {
        localStorage.removeItem('pending_analysis_idea');
        navigate('/analyze', { state: { idea: pendingIdea } });
      }
    }
  }, [user, profile, loading, navigate]);

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
          <Navbar onOpenAccess={() => setIsOnboardingOpen(true)} />
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
          <Route path="/"        element={<HomePage user={user} profile={profile} onOpenAccess={() => setIsOnboardingOpen(true)} />} />
          <Route path="/about"   element={<AboutPage />} />
          <Route path="/pricing" element={<PremiumPage user={user} profile={profile} />} />
          <Route path="/premium" element={<Navigate to="/pricing" replace />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/investor-network" element={<InvestorNetworkPage user={user} onOpenAccess={() => setIsOnboardingOpen(true)} />} />

          {/* ── Analysis ── */}
          <Route path="/analyze" element={<AnalysisPage key="analyze" user={user} profile={profile} />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard"                          element={<DashboardPage user={user} profile={profile} />} />
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
            element={user ? <PitchDeckArchitectEngine /> : <Navigate to="/" replace />}
          />
        </Routes>
      </main>

      {/* Footer — hidden inside the deck editor */}
      {!isArchitect && (
        <div className="no-print">
          <Footer />
        </div>
      )}

      <VentureOperator />

      <UserOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
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