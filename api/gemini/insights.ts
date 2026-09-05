import {
  getGenAI,
  generateContentWithFallback,
  parseRequestBody,
} from '../_gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = parseRequestBody(req);
    const reflections = Array.isArray(body.reflections) ? body.reflections : [];

    if (reflections.length === 0) {
      return res.status(200).json({
        frequentTopics: ['College & Study', 'Daily Work', 'Rest & Energy'],
        observations: [
          'You are starting your reflection habit. Writing regularly helps clear your head.',
        ],
        positivePatterns: ['Taking time to pause and write down your thoughts.'],
      });
    }

    const sample = reflections
      .slice(0, 10)
      .map(
        (r: any) =>
          `Title: ${r.title}\nMood: ${r.mood || 'unspecified'}\nSnippet: ${r.snippet}`
      )
      .join('\n---\n');

    const ai = getGenAI();
    const result = await generateContentWithFallback(ai, {
      systemInstruction: `You are a friendly reflection assistant for ReflectAI.
Analyze the user's journal notes, moods, and titles.
Provide a clear, friendly summary using VERY SIMPLE, EVERYDAY WORDS in JSON format.
Rules:
- Strictly label these as AI-generated observations, NOT medical or psychological facts.
- Use simple words (no jargon like "cognitive pattern", "behavioral tendency", "emotional regulation").
- Identify 3-4 simple topics they talk about (e.g., "College & Study", "Deadlines", "Rest & Sleep", "Friends & Family").
- Identify 2-3 positive patterns in simple words (e.g., "You pause to check in with yourself", "You notice when things feel too busy").
- Identify 2-3 gentle, encouraging observations (e.g., "Writing things down seems to help you feel lighter").
Format response as valid JSON matching this schema:
{
  "frequentTopics": ["string", "string"],
  "positivePatterns": ["string", "string"],
  "observations": ["string", "string"]
}`,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Here are the recent reflections to synthesize:\n${sample}`,
            },
          ],
        },
      ],
      maxOutputTokens: 400,
    });

    try {
      const parsed = JSON.parse(result.text.replace(/```json\n?|```/g, '').trim());
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({
        frequentTopics: ['College & Work', 'Managing Energy', 'Daily Tasks'],
        positivePatterns: ['Taking time to pause and write how you feel.'],
        observations: [
          'Deadlines and busy days appear often in your recent reflections.',
          'Taking a moment to write things down seems to help you think more clearly.',
        ],
      });
    }
  } catch (err: any) {
    console.warn('AI insights generation failed:', err?.message);
    return res.status(200).json({
      frequentTopics: ['Daily Focus', 'Rest & Energy', 'College & Work'],
      observations: [
        'Writing down your thoughts regularly helps you feel calmer and clearer.',
      ],
      positivePatterns: ['Making time for yourself each day to reflect.'],
    });
  }
}
