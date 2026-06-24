import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeLocalStorage as localStorage } from '../lib/storage';

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

export default function GuaranteedAnalysisLoader({ projectData, onPipelineComplete }: GuaranteedAnalysisLoaderProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const routeTriggered = useRef(false);

  const loadingMilestones = [
    "Analysis Processing",
    "Market Validation",
    "Startup Score Calculation",
    "Benchmarking",
    "Report Generation"
  ];

  const projectId = projectData?.id || projectData?.projectId || "active-workspace";
  const finalReportTargetUrl = `/dashboard/startup/${projectId}/overview`;

  const executeAbsoluteRedirect = () => {
    if (routeTriggered.current || !projectId) return;
    routeTriggered.current = true;

    if (onPipelineComplete && typeof onPipelineComplete === 'function') {
      onPipelineComplete({
        ...projectData,
        analysisStatus: "Complete",
        lastUpdatedDate: new Date().toISOString()
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAnalyzing');
      localStorage.setItem(`project_${projectId}_ready`, "true");
    }

    setTimeout(() => {
      navigate(finalReportTargetUrl, { replace: true });
    }, 0);
  };

  useEffect(() => {
    if (!projectId) return;

    // SHORT-CIRCUIT: already complete — skip loader entirely
    if (projectData?.analysisStatus === "Complete" || projectData?.reportExists) {
      const bypassTimer = setTimeout(() => {
        navigate(finalReportTargetUrl, { replace: true });
      }, 0);
      return () => clearTimeout(bypassTimer);
    }

    // ── FAST: 250ms per step → 5 steps = ~1.25s total ──
    const stepInterval = 250;
    const progressTimer = setInterval(() => {
      setActiveStep((prevIndex) => {
        if (prevIndex < loadingMilestones.length - 1) {
          return prevIndex + 1;
        } else {
          clearInterval(progressTimer);
          return prevIndex;
        }
      });
    }, stepInterval);

    // Hard failsafe at 2s (was 5s)
    const fallbackFailsafeTimeout = setTimeout(() => {
      if (!routeTriggered.current) {
        executeAbsoluteRedirect();
      }
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fallbackFailsafeTimeout);
    };
  }, [projectId, projectData]);

  useEffect(() => {
    if (activeStep === loadingMilestones.length - 1) {
      // 80ms gap so user briefly sees 100% before navigating (was 300ms)
      const completionTimer = setTimeout(() => {
        executeAbsoluteRedirect();
      }, 80);
      return () => clearTimeout(completionTimer);
    }
  }, [activeStep]);

  if (projectData?.analysisStatus === "Complete" || projectData?.reportExists) return null;

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
          <div 
            style={{
              ...styles.progressBarFill,
              width: `${((activeStep + 1) / loadingMilestones.length) * 100}%`
            }}
          />
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
    marginBottom: '12px'
  },
  progressBarFill: {
    backgroundColor: '#3B82F6',
    backgroundImage: 'linear-gradient(to right, #3B82F6, #60A5FA)',
    height: '100%',
    borderRadius: '100px',
    transition: 'width 200ms ease-out'
  },
  footerTrackerSubtext: {
    color: '#93A4B5',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    fontWeight: '500'
  }
};
