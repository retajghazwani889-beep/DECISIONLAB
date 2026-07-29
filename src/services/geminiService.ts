import { auth } from '../lib/firebase';

async function getIdToken(): Promise<string | undefined> {
  try { return await auth.currentUser?.getIdToken(); } catch { return undefined; }
}

export async function analyzeStartupIdea(description: string, _isPremium: boolean = false) {
  try {
    const idToken = await getIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const response = await fetch('/api/gemini/analyze-startup-idea', {
      method: 'POST',
      headers,
      body: JSON.stringify({ description })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Client Gemini service error (analyzeStartupIdea):", error);
    throw error;
  }
}

export async function generateCompanyAnalysis(profile: any) {
  try {
    const idToken = await getIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const response = await fetch('/api/gemini/generate-company-analysis', {
      method: 'POST',
      headers,
      body: JSON.stringify({ profile })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Client Gemini service error (generateCompanyAnalysis):", error);
    throw error;
  }
}
