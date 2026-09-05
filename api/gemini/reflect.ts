import {
  getGenAI,
  generateContentWithFallback,
  MODEL_FALLBACK_LADDER,
  isRecoverableGeminiError,
  perfLog,
  parseRequestBody,
  type ChatMessage,
} from '../_gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const reqStart = Date.now();
  perfLog('backend request received');

  try {
    const body = parseRequestBody(req);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const streamRequested = body.stream !== false;

    if (!prompt) {
      return res.status(400).json({ error: 'A valid non-empty "prompt" is required.' });
    }

    const ai = getGenAI();

    let systemInstruction = `You are ReflectAI, a friendly, caring companion for personal journaling.
Speak in VERY SIMPLE, EVERYDAY ENGLISH that anyone can easily understand.
Sound like a calm, supportive friend—never a doctor, professor, or corporate assistant.

RULES:
1. Simple Words & Short Sentences: Use clear words (help, start, problem, think, feel, try). Avoid psychological or medical jargon. Never diagnose.
2. Casual & Multilingual: Understand slang, typos, Tamil, and Tanglish (e.g. "innaiku semma stress da").
   - If user writes in English: reply in simple English.
   - If user writes in Tamil script: reply in natural, simple Tamil.
   - If user writes in Tanglish: reply in friendly Tanglish or simple English.
3. Safety: Warmly support, gently offer crisis numbers (like 988) if harm is mentioned.`;

    if (mode === 'summarize') {
      systemInstruction += `\n\nTask: Summarize Mode. Use this exact simple format:
### What you shared
(1-2 simple sentences)

### What seems important
(1-2 simple sentences on core feelings or reasons)

### One thing you can try
(1 simple, practical step)`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\n\nTask: Brainstorm Mode. Format:
"Here are 3 simple things you can try:
1. [First simple step]
2. [Second simple step]
3. [Third simple step]"`;
    } else {
      systemInstruction += `\n\nTask: Reflect Mode. Keep response under 3 short paragraphs:
1. Warm acknowledgement of what they shared.
2. One simple, validating observation.
3. Exactly ONE simple follow-up question to help them think clearly.`;
    }

    const MAX_RECENT_TURNS = 6;
    let recentHistory = history;
    if (history.length > MAX_RECENT_TURNS) {
      const olderMessages = history.slice(0, -MAX_RECENT_TURNS);
      recentHistory = history.slice(-MAX_RECENT_TURNS);

      const olderSummary = olderMessages
        .filter((m) => m.role === 'user' && m.text)
        .map((m) => m.text.slice(0, 100))
        .join('; ')
        .slice(0, 250);

      if (olderSummary) {
        systemInstruction += `\n\nContext from earlier in session: User previously touched on: ${olderSummary}.`;
      }
    }

    const contents: any[] = [];
    for (const msg of recentHistory) {
      if ((msg.role === 'user' || msg.role === 'model') && msg.text?.trim()) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    if (streamRequested) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let streamCompleted = false;
      let lastStreamError: any = null;

      for (const model of MODEL_FALLBACK_LADDER) {
        try {
          perfLog(`Gemini stream request start with model: ${model}`, Date.now() - reqStart);
          const streamResponse = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction,
              maxOutputTokens: 600,
              temperature: 0.7,
            },
          });

          let chunkCount = 0;
          for await (const chunk of streamResponse) {
            const text = chunk.text || '';
            if (text) {
              if (chunkCount === 0) {
                perfLog(`Gemini first token received from ${model}`, Date.now() - reqStart);
              }
              chunkCount++;
              res.write(`data: ${JSON.stringify({ chunk: text, modelUsed: model })}\n\n`);
            }
          }

          perfLog(`Gemini stream completed with ${model} (${chunkCount} chunks)`, Date.now() - reqStart);
          res.write(`data: ${JSON.stringify({ done: true, modelUsed: model })}\n\n`);
          res.end();
          streamCompleted = true;
          break;
        } catch (err: any) {
          console.warn(`[Gemini API Stream] Model ${model} failed:`, err?.message || err);
          lastStreamError = err;

          if (!isRecoverableGeminiError(err)) {
            break;
          }
        }
      }

      if (!streamCompleted) {
        perfLog('Gemini stream failed across fallback ladder', Date.now() - reqStart);
        res.write(
          `data: ${JSON.stringify({
            error: lastStreamError?.message || 'Failed to generate response.',
            done: true,
          })}\n\n`
        );
        res.end();
      }
      return;
    }

    perfLog('Gemini standard request start', Date.now() - reqStart);
    const result = await generateContentWithFallback(ai, {
      systemInstruction,
      contents,
      maxOutputTokens: 600,
    });

    perfLog(`Gemini response received with model ${result.modelUsed}`, Date.now() - reqStart);

    return res.status(200).json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    const message = error?.message || 'Failed to generate reflection response.';
    const isKeyMissing = message.includes('GEMINI_API_KEY');
    return res.status(isKeyMissing ? 503 : 500).json({
      error: message,
      code: isKeyMissing ? 'API_KEY_MISSING' : 'GENERATION_FAILED',
    });
  }
}
