import React, { useEffect, useState } from 'react';

export interface GuaranteedAnalysisLoaderProps {
  projectData?: {
    id?: string;
    projectId?: string;
    analysisStatus?: string;
    reportExists?: boolean;
    name?: string;
    description?: string;
    industry?: string;
    country?: string;
    stage?: string;
  };
  onPipelineComplete?: (data: any) => void;
}

// PURELY A LOADING SCREEN. This component no longer navigates on its own.
//
// Previously it ran a ~2s internal timer and then force-redirected to the
// report regardless of whether the analysis had actually finished. Because the
// real AI analysis takes much longer than 2s, that timer fired first and
// yanked the user off the loading screen before the report was ready.
//
// Now the page that shows this loader (AnalysisPage) keeps it mounted for as
// long as the analysis is genuinely running, and navigates to the report only
// once the analysis truly completes (or shows an error screen if it fails or
// times out). So this component just animates while it waits — it stays on
// screen the whole time and never redirects by itself.
export default function GuaranteedAnalysisLoader({ projectData }: GuaranteedAnalysisLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);

  const loadingMilestones = [
    "Analysis Processing",
    "Market Validation",
    "Startup Score Calculation",
    "Benchmarking",
    "Report Generation"
  ];

  useEffect(() => {
    // Cycle the milestone labels on a loop so the screen always looks active,
    // no matter how long the analysis takes. No navigation happens here.
    const labelTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % loadingMilestones.length);
    }, 1400);
    return () => clearInterval(labelTimer);
  }, []);

  return (
    <div style={styles.loaderOverlay}>
      <style>{`
        @keyframes dlPulse {
          0% { opacity: 0.6; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0.6; transform: scale(0.98); }
        }
        .dl-logo-pulse {
          animation: dlPulse 2s infinite ease-in-out;
        }
        @keyframes dlSlide {
          0% { left: -45%; }
          100% { left: 100%; }
        }
        .dl-indeterminate {
          position: relative;
          animation: dlSlide 1.4s infinite ease-in-out;
        }
      `}</style>

      <div style={styles.loaderContentBox}>
        <div className="dl-logo-pulse" style={styles.logoPulseContainer}>
          <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dlBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <filter id="glowEffectBlue" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glowEffectWhite" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d="M20 10 V90" stroke="url(#dlBlueGrad)" strokeWidth="12" strokeLinecap="round" filter="url(#glowEffectBlue)" />
            <path d="M12 22 H55 C80 22 92 35 92 50 C92 65 80 78 55 78 H12" stroke="url(#dlBlueGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glowEffectBlue)" />
            <path d="M45 38 V62 H68" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowEffectWhite)" />
          </svg>
        </div>

        <div style={styles.textTrackFrame}>
          <h2 style={styles.activeMilestoneLabel}>
            {loadingMilestones[activeStep]}
          </h2>
        </div>

        <div style={styles.progressBarTrack}>
          <div className="dl-indeterminate" style={styles.progressBarFill} />
        </div>

        <span style={styles.footerTrackerSubtext}>
          Workspace Loading Active
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loaderOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#102434',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  loaderContentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '400px',
    width: '100%',
    padding: '0 24px',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  logoPulseContainer: {
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textTrackFrame: {
    height: '32px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeMilestoneLabel: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '500',
    letterSpacing: '0.5px',
    margin: 0
  },
  progressBarTrack: {
    width: '100%',
    backgroundColor: '#1B3247',
    height: '6px',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '12px',
    position: 'relative'
  },
  progressBarFill: {
    backgroundColor: '#3B82F6',
    backgroundImage: 'linear-gradient(to right, #3B82F6, #60A5FA)',
    height: '100%',
    width: '45%',
    borderRadius: '100px'
  },
  footerTrackerSubtext: {
    color: '#93A4B5',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    fontWeight: '500'
  }
};