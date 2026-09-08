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
    const reflectionText = typeof body.reflection === 'string' ? body.reflection.trim() : '';

    if (!reflectionText) {
      return sendJson(res, 200, {
        habit: 'Drink a glass of water and take 3 deep breaths.',
        modelUsed: 'fallback',
      });
    }

    const ai = getGenAI();
    let text = '';
    let modelUsed = 'gemini-3.6-flash';

    for (const model of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: reflectionText.slice(0, 2000) }] }],
          config: {
            systemInstruction: `You are a friendly life companion.
Based on the user's reflection, suggest ONE single, very simple, realistic action for today.
Requirements:
- Must take less than 10 minutes to do.
- Use simple, everyday words.
- Avoid fancy phrases like "prioritization routine" or "cognitive mindfulness".
- Example: "Before you sleep, write down the 3 things you want to finish tomorrow."
- Return ONLY the single micro-habit sentence. No quotes, intro, or bullet point.`,
            maxOutputTokens: 80,
            temperature: 0.7,
          },
        });
        text = response.text || '';
        modelUsed = model;
        break;
      } catch (err: any) {
        console.warn(`[Gemini Microhabit] Error with ${model}:`, err?.message);
      }
    }

    const cleanHabit = text.replace(/^["'\s•*-]+|["'\s]+$/g, '').trim();
    return sendJson(res, 200, {
      habit: cleanHabit || 'Take 5 minutes this evening to step away from screens and rest.',
      modelUsed,
    });
  } catch (err: any) {
    console.warn('Micro-habit generation failed:', err?.message);
    return sendJson(res, 200, {
      habit: 'Take a short 5-minute break and stretch your body.',
      modelUsed: 'fallback',
    });
  }
}
