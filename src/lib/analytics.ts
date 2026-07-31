declare function gtag(...args: any[]): void;

const fire = (eventName: string, params?: Record<string, string | number>) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, params);
    }
  } catch {
    // GA4 not loaded (dev/blocked) — silent
  }
};

export const track = {
  ideaSubmitted: () => fire('idea_submitted'),
  signupStarted: (method: 'email' | 'google') => fire('signup_started', { method }),
  signupCompleted: (method: 'email' | 'google') => fire('signup_completed', { method }),
  analysisStarted: () => fire('analysis_started'),
  analysisCompleted: () => fire('analysis_completed'),
  pitchDeckGenerated: () => fire('pitch_deck_generated'),
};
