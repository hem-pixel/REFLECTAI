import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Development-only performance logging
const isDev = process.env.NODE_ENV !== 'production';
function perfLog(step: string, elapsedMs?: number) {
  if (isDev) {
    const timeStr = elapsedMs !== undefined ? ` (+${elapsedMs.toFixed(1)}ms)` : '';
    console.log(`[PERF SERVER] ${step}${timeStr}`);
  }
}

// Resilient Model Fallback Ladder
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

/**
 * Checks if a Gemini API error is transient/recoverable across fallback tiers.
 */
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

/**
 * Executes Gemini content generation with automated fallback ladder across availability tiers.
 * Set reasonable maxOutputTokens (600) and fast-fails unrecoverable errors.
 */
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

      // Fail fast if error is NOT recoverable (e.g., auth, bad parameters)
      if (!isRecoverableGeminiError(err)) {
        throw err;
      }
      // Otherwise proceed to next fallback model in the ladder
    }
  }

  throw lastError || new Error('All models in the fallback ladder failed.');
}

// Lazy SDK client retrieval
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

// Create modular API Router
const apiRouter = express.Router();

// API Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// AI Reflection and Conversational Journaling Endpoint
apiRouter.post('/gemini/reflect', async (req: Request, res: Response) => {
  const reqStart = Date.now();
  perfLog('backend request received');

  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect'; // reflect | summarize | brainstorm
    const streamRequested = body.stream !== false;

    if (!prompt) {
      res.status(400).json({ error: 'A valid non-empty "prompt" is required.' });
      return;
    }

    const ai = getGenAI();

    // Concise, High-Impact Friendly & Multilingual System Instructions
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

    // Optimize Conversation History: Send only recent context (last 6 messages)
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

    // Build multi-turn content
    const contents: any[] = [];
    for (const msg of recentHistory) {
      if ((msg.role === 'user' || msg.role === 'model') && msg.text?.trim()) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    // Append current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    if (streamRequested) {
      // Server-Sent Events (SSE) Streaming Response
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
            // Fail fast on unrecoverable errors (auth, bad input)
            break;
          }
          // Recoverable error: attempt next model in fallback ladder
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

    // Fallback standard JSON response if stream not requested
    perfLog('Gemini standard request start', Date.now() - reqStart);
    const result = await generateContentWithFallback(ai, {
      systemInstruction,
      contents,
      maxOutputTokens: 600,
    });

    perfLog(`Gemini response received with model ${result.modelUsed}`, Date.now() - reqStart);

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    const message = error?.message || 'Failed to generate reflection response.';
    const isKeyMissing = message.includes('GEMINI_API_KEY');
    res.status(isKeyMissing ? 503 : 500).json({
      error: message,
      code: isKeyMissing ? 'API_KEY_MISSING' : 'GENERATION_FAILED',
    });
  }
});

// Dedicated Title Generator for Journal Sessions
apiRouter.post('/gemini/title', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const entry = typeof body.entry === 'string' ? body.entry.trim() : '';

    if (!entry) {
      res.json({ title: 'New Reflection' });
      return;
    }

    const ai = getGenAI();
    const result = await generateContentWithFallback(ai, {
      systemInstruction: 'Generate a very simple, natural 2-5 word title for this journal entry using everyday English. No fancy or complicated words. Return ONLY the title text without quotes, punctuation, or preamble.',
      contents: [{ role: 'user', parts: [{ text: entry.slice(0, 1000) }] }],
      maxOutputTokens: 50,
    });

    const cleanTitle = result.text.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 60);
    res.json({ title: cleanTitle || 'Daily Reflection', modelUsed: result.modelUsed });
  } catch (err: any) {
    console.warn('Title generation failed, using fallback:', err?.message);
    res.json({ title: 'Daily Reflection' });
  }
});

// Personalized Micro-Habit Generator ("One small step for today")
apiRouter.post('/gemini/microhabit', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const reflectionText = typeof body.reflection === 'string' ? body.reflection.trim() : '';

    if (!reflectionText) {
      res.json({
        habit: 'Drink a glass of water and take 3 deep breaths.',
        modelUsed: 'fallback',
      });
      return;
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
    res.json({
      habit: cleanHabit || 'Take 5 minutes this evening to step away from screens and rest.',
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.warn('Micro-habit generation failed:', err?.message);
    res.json({
      habit: 'Take a short 5-minute break and stretch your body.',
      modelUsed: 'fallback',
    });
  }
});

// AI Insights Synthesis Endpoint
apiRouter.post('/gemini/insights', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const reflections = Array.isArray(body.reflections) ? body.reflections : [];

    if (reflections.length === 0) {
      res.json({
        frequentTopics: ['College & Study', 'Daily Work', 'Rest & Energy'],
        observations: [
          'You are starting your reflection habit. Writing regularly helps clear your head.',
        ],
        positivePatterns: ['Taking time to pause and write down your thoughts.'],
      });
      return;
    }

    const sample = reflections.slice(0, 10).map((r: any) => `Title: ${r.title}\nMood: ${r.mood || 'unspecified'}\nSnippet: ${r.snippet}`).join('\n---\n');

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
      contents: [{ role: 'user', parts: [{ text: `Here are the recent reflections to synthesize:\n${sample}` }] }],
      maxOutputTokens: 400,
    });

    try {
      const parsed = JSON.parse(result.text.replace(/```json\n?|```/g, '').trim());
      res.json(parsed);
    } catch {
      res.json({
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
    res.json({
      frequentTopics: ['Daily Focus', 'Rest & Energy', 'College & Work'],
      observations: [
        'Writing down your thoughts regularly helps you feel calmer and clearer.',
      ],
      positivePatterns: ['Making time for yourself each day to reflect.'],
    });
  }
});

// Mount modular API router at both /api and root for comprehensive deployment compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

async function start() {
  // Static assets from public directory (favicons, official logos)
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ReflectAI Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone server if not running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
export { app };
