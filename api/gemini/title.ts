import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

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

const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await readJsonBody(req);
    const entry = typeof body.entry === 'string' ? body.entry.trim() : '';

    if (!entry) {
      return sendJson(res, 200, { title: 'New Reflection' });
    }

    const ai = getGenAI();
    let text = '';
    let modelUsed = 'gemini-3.6-flash';

    for (const model of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: entry.slice(0, 1000) }] }],
          config: {
            systemInstruction:
              'Generate a very simple, natural 2-5 word title for this journal entry using everyday English. No fancy or complicated words. Return ONLY the title text without quotes, punctuation, or preamble.',
            maxOutputTokens: 50,
            temperature: 0.7,
          },
        });
        text = response.text || '';
        modelUsed = model;
        break;
      } catch (err: any) {
        console.warn(`[Gemini Title] Error with ${model}:`, err?.message);
      }
    }

    const cleanTitle = text.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 60);
    return sendJson(res, 200, {
      title: cleanTitle || 'Daily Reflection',
      modelUsed,
    });
  } catch (err: any) {
    console.warn('Title generation failed, using fallback:', err?.message);
    return sendJson(res, 200, { title: 'Daily Reflection' });
  }
}
