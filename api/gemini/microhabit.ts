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
    const reflectionText = typeof body.reflection === 'string' ? body.reflection.trim() : '';

    if (!reflectionText) {
      return res.status(200).json({
        habit: 'Drink a glass of water and take 3 deep breaths.',
        modelUsed: 'fallback',
      });
    }

    const ai = getGenAI();
    const result = await generateContentWithFallback(ai, {
      systemInstruction: `You are a friendly life companion.
Based on the user's reflection, suggest ONE single, very simple, realistic action for today.
Requirements:
- Must take less than 10 minutes to do.
- Use simple, everyday words.
- Avoid fancy phrases like "prioritization routine" or "cognitive mindfulness".
- Example: "Before you sleep, write down the 3 things you want to finish tomorrow."
- Return ONLY the single micro-habit sentence. No quotes, intro, or bullet point.`,
      contents: [{ role: 'user', parts: [{ text: reflectionText.slice(0, 2000) }] }],
      maxOutputTokens: 80,
    });

    const cleanHabit = result.text.replace(/^["'\s•*-]+|["'\s]+$/g, '').trim();
    return res.status(200).json({
      habit: cleanHabit || 'Take 5 minutes this evening to step away from screens and rest.',
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.warn('Micro-habit generation failed:', err?.message);
    return res.status(200).json({
      habit: 'Take a short 5-minute break and stretch your body.',
      modelUsed: 'fallback',
    });
  }
}
