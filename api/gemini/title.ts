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
    const entry = typeof body.entry === 'string' ? body.entry.trim() : '';

    if (!entry) {
      return res.status(200).json({ title: 'New Reflection' });
    }

    const ai = getGenAI();
    const result = await generateContentWithFallback(ai, {
      systemInstruction:
        'Generate a very simple, natural 2-5 word title for this journal entry using everyday English. No fancy or complicated words. Return ONLY the title text without quotes, punctuation, or preamble.',
      contents: [{ role: 'user', parts: [{ text: entry.slice(0, 1000) }] }],
      maxOutputTokens: 50,
    });

    const cleanTitle = result.text.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 60);
    return res.status(200).json({
      title: cleanTitle || 'Daily Reflection',
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.warn('Title generation failed, using fallback:', err?.message);
    return res.status(200).json({ title: 'Daily Reflection' });
  }
}
