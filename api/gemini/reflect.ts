import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

function perfLog(step: string, elapsedMs?: number) {
  if (isDev) {
    const timeStr = elapsedMs !== undefined ? ` (+${elapsedMs.toFixed(1)}ms)` : '';
    console.log(`[PERF SERVER] ${step}${timeStr}`);
  }
}

const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

function isRecoverableGeminiError(err: any): boolean {
  const status = err?.status || err?.statusCode || err?.code;
  const message = String(err?.message || '').toLowerCase();

  return (
    status === 503 ||
    status === 429 ||
    status === 404 ||
    status === 500 ||
    message.includes('unavailable') ||
    message.includes('resource_exhausted') ||
    message.includes('not found') ||
    message.includes('overloaded') ||
    message.includes('rate limit') ||
    message.includes('timeout')
  );
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    systemInstruction?: string;
    contents: any;
    maxOutputTokens?: number;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      perfLog(`Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxOutputTokens || 600,
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini API] Error with model ${model}:`, err?.message || err);
      lastError = err;

      if (!isRecoverableGeminiError(err)) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All models in the fallback ladder failed.');
}

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

function sendJson(res: any, statusCode: number, data: any) {
  if (res.headersSent) return;
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const reqStart = Date.now();
  perfLog('backend request received');

  try {
    const body = await readJsonBody(req);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const streamRequested = body.stream !== false;

    if (!prompt) {
      return sendJson(res, 400, { error: 'A valid non-empty "prompt" is required.' });
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
      res.statusCode = 200;
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

    return sendJson(res, 200, {
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    const message = error?.message || 'Failed to generate reflection response.';
    const isKeyMissing = message.includes('GEMINI_API_KEY');
    return sendJson(res, isKeyMissing ? 503 : 500, {
      error: message,
      code: isKeyMissing ? 'API_KEY_MISSING' : 'GENERATION_FAILED',
    });
  }
}
