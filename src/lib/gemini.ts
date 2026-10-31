import { EventCategory, ParseResult } from '@/types';

const MAX_INPUT_LENGTH = 5000;
const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

/**
 * Validates and sanitizes raw input text from WhatsApp / Email.
 */
export function validateInputText(text: unknown): { isValid: boolean; error?: string; sanitized: string } {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Input must be a text string', sanitized: '' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Input cannot be empty. Please paste an announcement.', sanitized: '' };
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      isValid: false,
      error: `Input is too long (${trimmed.length.toLocaleString()} characters). Maximum allowed is ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
      sanitized: '',
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Fallback heuristic extractor when Gemini API is unavailable, rate-limited, or offline.
 */
export function heuristicExtract(text: string, referenceDate: Date = new Date()): ParseResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 80) || 'Campus Announcement';

  // Search for date keywords
  let eventDate = referenceDate.toISOString().split('T')[0];
  const lower = text.toLowerCase();

  if (lower.includes('tomorrow')) {
    const tmrw = new Date(referenceDate);
    tmrw.setDate(tmrw.getDate() + 1);
    eventDate = tmrw.toISOString().split('T')[0];
  } else if (lower.includes('yesterday')) {
    const yest = new Date(referenceDate);
    yest.setDate(yest.getDate() - 1);
    eventDate = yest.toISOString().split('T')[0];
  } else {
    const dateMatch = text.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
    if (dateMatch) {
      eventDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
    }
  }

  // Time search
  let eventTime = 'TBD';
  const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\b/);
  if (timeMatch) {
    eventTime = timeMatch[1].toUpperCase();
  } else {
    const timeRangeMatch = text.match(/\b(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\b/);
    if (timeRangeMatch) {
      eventTime = timeRangeMatch[1];
    }
  }

  // Venue search
  let venue = 'Campus Venue TBD';
  const venueKeywords = ['audi', 'auditorium', 'hall', 'room', 'lt-', 'lab', 'ground', 'center', 'zoom', 'google meet'];
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    for (const kw of venueKeywords) {
      if (lineLower.includes(kw)) {
        venue = line.replace(/^(venue|location|place):?\s*/i, '').slice(0, 60);
        break;
      }
    }
    if (venue !== 'Campus Venue TBD') break;
  }

  // Category determination
  let category: EventCategory = 'other';
  if (/(exam|quiz|assignment|midterm|final|lecture|syllabus|prof|dr\.)/i.test(text)) {
    category = 'academic';
  } else if (/(workshop|hands-on|bootcamp|seminar|career|internship|resume|hiring)/i.test(text)) {
    category = 'workshop';
  } else if (/(club|recruitment|auditions|meeting|acm|gdsc|rotaract|ieee)/i.test(text)) {
    category = 'club';
  } else if (/(party|fest|dj|concert|cultural|movie|social|farewell|freshers)/i.test(text)) {
    category = 'social';
  } else if (/(cricket|football|basketball|badminton|tournament|sports|match|athletics)/i.test(text)) {
    category = 'sports';
  } else if (/(admin|notice|fee|library|maintenance|hostel|id card|circular)/i.test(text)) {
    category = 'administrative';
  }

  return {
    title,
    date: eventDate,
    time: eventTime,
    venue,
    category,
    summary: text.slice(0, 180) + (text.length > 180 ? '...' : ''),
    actionItem: 'Check details and mark your calendar.',
    tags: [category, 'announcement'],
  };
}

/**
 * Calls Gemini with candidate model fallback and structured JSON output.
 */
export async function extractEventWithGemini(
  rawText: string,
  clientTime?: string
): Promise<ParseResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const referenceDate = clientTime ? new Date(clientTime) : new Date();
  const currentDateStr = referenceDate.toISOString().split('T')[0];
  const currentDayName = referenceDate.toLocaleDateString('en-US', { weekday: 'long' });

  const prompt = `You are an expert student assistant parsing messy WhatsApp group chats, forwarded messages, professor emails, and campus bulletin notices.

Current reference date: ${currentDayName}, ${currentDateStr} (${referenceDate.toISOString()}).
Interpret relative words like "today", "tomorrow", "this Friday", "next Monday" relative to this reference date.

Extract the following information from the pasted announcement:
- title: Concise, clear, descriptive event/notice title (max 70 characters).
- date: YYYY-MM-DD format. If multi-day, choose the primary start date.
- time: Start time or time range (e.g. "14:00 - 17:00" or "4:00 PM"). If unspecified, use "TBD".
- venue: Location, building, room number, or online platform (e.g. "Auditorium Hall 2", "LT-3", "Zoom", "Library 2nd Floor"). If not found, use "Campus Venue TBD".
- category: One of EXACTLY: ["academic", "club", "workshop", "sports", "social", "administrative", "other"]
- summary: A student-focused summary (1-2 sentences) highlighting what it is, prerequisites, key rules, or perks (free food, certificates, etc.).
- actionItem: Clear action required if any (e.g. "Register on link before 5 PM", "Carry lab coat and ID card", "None").
- tags: Array of 2 to 4 short lowercase tag strings (e.g. ["hackathon", "pizza", "coding"]).

Return ONLY valid JSON conforming to the requested schema.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { text: `ANNOUNCEMENT TEXT TO PARSE:\n"""\n${rawText}\n"""` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD' },
          time: { type: 'STRING' },
          venue: { type: 'STRING' },
          category: {
            type: 'STRING',
            enum: ['academic', 'club', 'workshop', 'sports', 'social', 'administrative', 'other'],
          },
          summary: { type: 'STRING' },
          actionItem: { type: 'STRING' },
          tags: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
        required: ['title', 'date', 'time', 'venue', 'category', 'summary'],
      },
    },
  };

  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini (${model}) status ${response.status}: ${errorBody}`);
      }

      const responseData = await response.json();
      const textOutput = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error(`Gemini (${model}) returned an empty response.`);
      }

      const parsed = JSON.parse(textOutput) as ParseResult;

      // Validate category fallback
      const validCategories: EventCategory[] = [
        'academic',
        'club',
        'workshop',
        'sports',
        'social',
        'administrative',
        'other',
      ];
      if (!validCategories.includes(parsed.category)) {
        parsed.category = 'other';
      }

      return parsed;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${model} failed, trying next fallback:`, lastError.message);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}

/**
 * Generates an executive student weekly digest using Gemini.
 */
export async function generateWeeklyDigestWithGemini(
  events: Array<{
    title: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    summary: string;
    actionItem?: string;
  }>,
  clientTime?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const referenceDate = clientTime ? new Date(clientTime) : new Date();
  const dateStr = referenceDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const prompt = `You are "Campus Pulse", an intelligent, witty, supportive personal executive assistant for college students.
Today is ${dateStr}.

Here is the student's scheduled campus events and deadlines for this upcoming week:
${JSON.stringify(events, null, 2)}

Please generate a well-structured, inspiring, and concise "What Do I Need To Know This Week?" executive briefing in clean GitHub-flavored markdown.

Include these exact sections:
1. 🎯 **The Week at a Glance**: A 2-sentence vibe check on week intensity (chill, moderate, or crunch week) and what to watch out for.
2. 🚨 **Top 3 Non-Negotiables**: The 3 most critical deadlines or must-attend events with times and locations.
3. 🗓️ **Day-by-Day Playbook**: Chronological breakdown of highlights for each day of the week that has events.
4. ⚠️ **Clash & Crunch Alert**: Flag any overlapping times, busy clusters (e.g. back-to-back tests/fests), or potential prep bottlenecks.
5. ✅ **Quick Action Checklist**: Bullet list of concrete tasks to do right now (forms to submit, clothes/gear to pack, fees to pay).

Keep the tone encouraging, student-friendly, and sharp. Do not invent events not in the list.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
    },
  };

  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini (${model}) status ${response.status}: ${errText}`);
      }

      const responseData = await response.json();
      const textOutput = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error(`Gemini (${model}) returned an empty briefing.`);
      }

      return textOutput;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Weekly digest model ${model} failed, trying next fallback:`, lastError.message);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed for weekly digest.');
}
