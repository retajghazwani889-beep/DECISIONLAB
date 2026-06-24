export async function analyzeStartupIdea(description: string, isPremium: boolean = false) {
  try {
    const response = await fetch('/api/gemini/analyze-startup-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, isPremium })
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
    const response = await fetch('/api/gemini/generate-company-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
