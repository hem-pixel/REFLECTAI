import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const isDev = process.env.NODE_ENV !== 'production';

export function perfLog(step: string, elapsedMs?: number) {
  if (isDev) {
    const timeStr = elapsedMs !== undefined ? ` (+${elapsedMs.toFixed(1)}ms)` : '';
    console.log(`[PERF SERVER] ${step}${timeStr}`);
  }
}

export const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export function isRecoverableGeminiError(err: any): boolean {
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

export async function generateContentWithFallback(
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

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

export function parseRequestBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
