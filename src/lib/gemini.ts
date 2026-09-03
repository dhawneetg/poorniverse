// gemini.ts — Google Gemini AI Integration for smart student guidance

export async function askGeminiAdvisor(prompt: string): Promise<string> {
  const apiKey = (import.meta as any).env?.GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') || '';
  
  if (!apiKey) {
    return 'Please configure your GEMINI_API_KEY in .env or Settings to enable AI advisory insights.';
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an intelligent campus advisor for a 1st year B.Tech engineering student at Poornima College of Engineering (PCE Jaipur). Provide concise, practical, and direct advice (2-3 sentences max).
Prompt: ${prompt}`
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      return `Gemini API error: ${err.error?.message || 'Failed to generate advice'}`;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No advice generated.';
  } catch (error: any) {
    return `AI Connection Error: ${error.message}`;
  }
}
