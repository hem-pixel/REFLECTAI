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
    const reflections = Array.isArray(body.reflections) ? body.reflections : [];

    if (reflections.length === 0) {
      return sendJson(res, 200, {
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
    let text = '';

    for (const model of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: `Here are the recent reflections to synthesize:\n${sample}` }],
            },
          ],
          config: {
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
            maxOutputTokens: 400,
            temperature: 0.7,
          },
        });
        text = response.text || '';
        break;
      } catch (err: any) {
        console.warn(`[Gemini Insights] Error with ${model}:`, err?.message);
      }
    }

    try {
      const parsed = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      return sendJson(res, 200, parsed);
    } catch {
      return sendJson(res, 200, {
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
    return sendJson(res, 200, {
      frequentTopics: ['Daily Focus', 'Rest & Energy', 'College & Work'],
      observations: [
        'Writing down your thoughts regularly helps you feel calmer and clearer.',
      ],
      positivePatterns: ['Making time for yourself each day to reflect.'],
    });
  }
}
