import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DashboardPage from './pages/DashboardPage';
import PremiumPage from './pages/PremiumPage';
import ComparisonPage from './pages/ComparisonPage';
import AboutPage from './pages/AboutPage';
import PitchDeckArchitectPage from './pages/PitchDeckArchitectPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VentureOperator from './components/VentureOperator';
import InstitutionalOnboarding from './components/InstitutionalOnboarding';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Determine if onboarding is needed
  React.useEffect(() => {
    if (user && !loading) {
      if (!profile || !profile.onboardingCompleted) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08131D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
          <div className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] animate-pulse">Initializing Protocol</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-brand-bg text-brand-text-primary selection:bg-brand-accent/30 font-sans">
        <div className="no-print">
          <Navbar onOpenAccess={() => setIsOnboardingOpen(true)} />
        </div>
        <main className="pt-16 bg-brand-bg">
          <Routes>
            <Route path="/" element={<HomePage user={user} profile={profile} onOpenAccess={() => setIsOnboardingOpen(true)} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/analyze" element={<AnalysisPage user={user} profile={profile} />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} profile={profile} /> : <Navigate to="/" />} />
            <Route path="/pitch-deck" element={user ? <PitchDeckArchitectPage /> : <Navigate to="/" />} />
            <Route path="/analysis/:id" element={user ? <AnalysisPage user={user} profile={profile} /> : <Navigate to="/" />} />
            <Route path="/premium" element={<PremiumPage user={user} profile={profile} />} />
            <Route path="/compare" element={user ? <ComparisonPage /> : <Navigate to="/" />} />
          </Routes>
        </main>
        <div className="no-print">
          <Footer />
        </div>
        <VentureOperator />
        
        <InstitutionalOnboarding 
          isOpen={isOnboardingOpen} 
          onClose={() => setIsOnboardingOpen(false)} 
        />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
