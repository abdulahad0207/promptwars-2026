import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateInputText,
  heuristicExtract,
  extractEventWithGemini,
  generateWeeklyDigestWithGemini,
} from './gemini';

describe('Gemini AI & Heuristic Parser Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('validateInputText', () => {
    it('rejects empty strings and whitespace-only inputs', () => {
      const empty = validateInputText('');
      expect(empty.isValid).toBe(false);
      expect(empty.error).toContain('cannot be empty');

      const whitespace = validateInputText('     \n\t   ');
      expect(whitespace.isValid).toBe(false);
      expect(whitespace.error).toContain('cannot be empty');
    });

    it('rejects non-string inputs safely', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInputText(null as any).isValid).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInputText(undefined as any).isValid).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInputText(12345 as any).isValid).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInputText({} as any).isValid).toBe(false);
    });

    it('accepts text within 5,000 character limit', () => {
      const validText = 'Hackathon tomorrow at Audi 2!';
      const res = validateInputText(validText);
      expect(res.isValid).toBe(true);
      expect(res.sanitized).toBe(validText);

      // Boundary: exactly 5000 chars
      const boundaryText = 'A'.repeat(5000);
      const boundaryRes = validateInputText(boundaryText);
      expect(boundaryRes.isValid).toBe(true);
      expect(boundaryRes.sanitized.length).toBe(5000);
    });

    it('rejects text exceeding 5,000 character limit', () => {
      const overlimitText = 'A'.repeat(5001);
      const res = validateInputText(overlimitText);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('too long');
      expect(res.error).toContain('5,001');
    });
  });

  describe('heuristicExtract (Local Smart Fallback)', () => {
    const mockRefDate = new Date('2026-10-31T10:00:00Z');

    it('extracts "tomorrow" as the day following reference date', () => {
      const text = '🚨 Physics Quiz tomorrow at 10:00 AM in LT-4. Bring ID card!';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.date).toBe('2026-11-01');
      expect(result.time).toBe('10:00 AM');
      expect(result.category).toBe('academic');
      expect(result.venue).toContain('LT-4');
    });

    it('extracts explicit dates formatted as YYYY-MM-DD', () => {
      const text = 'ACM Hackathon on 2026-11-15 from 14:00 - 18:00 in Auditorium';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.date).toBe('2026-11-15');
      expect(result.time).toBe('14:00 - 18:00');
      expect(result.category).toBe('club');
      expect(result.venue).toContain('Auditorium');
    });

    it('categorizes sports events accurately', () => {
      const text = 'Inter-college Football tournament trials tomorrow at 5pm on the Ground';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.category).toBe('sports');
      expect(result.time).toBe('5PM');
    });

    it('categorizes workshops and career fairs accurately', () => {
      const text = 'Hands-on AI Workshop & Resume Internship bootcamp on Nov 8';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.category).toBe('workshop');
    });

    it('categorizes social fests accurately', () => {
      const text = 'College Cultural Fest and DJ Party night this weekend';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.category).toBe('social');
    });

    it('handles messages with no recognizable date by defaulting to reference date', () => {
      const text = 'Lost and Found: Blue umbrella left in cafeteria';
      const result = heuristicExtract(text, mockRefDate);

      expect(result.date).toBe('2026-10-31');
      expect(result.category).toBe('other');
      expect(result.time).toBe('TBD');
    });
  });

  describe('extractEventWithGemini (API & Failed Mock Responses)', () => {
    it('throws error when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      await expect(extractEventWithGemini('Some announcement')).rejects.toThrow(
        'GEMINI_API_KEY environment variable is not configured.'
      );
    });

    it('handles successful API response with structured JSON', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      const mockPayload = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Midterm Physics Exam',
                    date: '2026-11-05',
                    time: '09:30 AM',
                    venue: 'Hall C',
                    category: 'academic',
                    summary: 'Chapters 4 to 8',
                    actionItem: 'Carry scientific calculator',
                    tags: ['physics', 'midterm'],
                  }),
                },
              ],
            },
          },
        ],
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockPayload,
        })
      );

      const result = await extractEventWithGemini('Physics exam on Nov 5 in Hall C');
      expect(result.title).toBe('Midterm Physics Exam');
      expect(result.date).toBe('2026-11-05');
      expect(result.time).toBe('09:30 AM');
      expect(result.venue).toBe('Hall C');
      expect(result.category).toBe('academic');
    });

    it('falls back to secondary model when primary model returns 503 (high demand)', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      const mockSuccessPayload = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'ACM HackSprint',
                    date: '2026-11-01',
                    time: '10:00 AM',
                    venue: 'Audi 3',
                    category: 'club',
                    summary: '24 hr hackathon',
                  }),
                },
              ],
            },
          },
        ],
      };

      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // First model returns 503 Service Unavailable
            return {
              ok: false,
              status: 503,
              text: async () => 'Model currently experiencing high demand',
            };
          }
          // Second model succeeds
          return {
            ok: true,
            status: 200,
            json: async () => mockSuccessPayload,
          };
        })
      );

      const result = await extractEventWithGemini('Hackathon tomorrow');
      expect(callCount).toBe(2);
      expect(result.title).toBe('ACM HackSprint');
      expect(result.category).toBe('club');
    });

    it('throws error when all models return failed responses (e.g. 500 error)', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        })
      );

      await expect(extractEventWithGemini('Test text')).rejects.toThrow(
        /status 500/
      );
    });

    it('handles empty response body from Gemini API gracefully', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ candidates: [] }),
        })
      );

      await expect(extractEventWithGemini('Test text')).rejects.toThrow();
    });

    it('handles malformed JSON returned in parts gracefully', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'NOT_VALID_JSON_STRING' }],
                },
              },
            ],
          }),
        })
      );

      await expect(extractEventWithGemini('Test text')).rejects.toThrow();
    });

    it('handles network failure (fetch throws TypeError) gracefully', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new TypeError('Failed to fetch (offline network)'))
      );

      await expect(extractEventWithGemini('Test text')).rejects.toThrow(
        'Failed to fetch (offline network)'
      );
    });
  });

  describe('generateWeeklyDigestWithGemini (API & Failed Mock Responses)', () => {
    const sampleEvents = [
      {
        title: 'Lab Submission',
        date: '2026-10-31',
        time: '4:30 PM',
        venue: 'Lab 4',
        category: 'academic',
        summary: 'Submit manual',
      },
    ];

    it('throws error if GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      await expect(generateWeeklyDigestWithGemini(sampleEvents)).rejects.toThrow(
        'GEMINI_API_KEY environment variable is not configured.'
      );
    });

    it('generates weekly digest successfully on mock response', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      const mockDigestText = `### 1. 🎯 The Week at a Glance\nA focused week with 1 urgent deadline.\n\n### 2. 🚨 Top 3 Non-Negotiables\n- Lab submission today.`;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: mockDigestText }],
                },
              },
            ],
          }),
        })
      );

      const digest = await generateWeeklyDigestWithGemini(sampleEvents);
      expect(digest).toContain('The Week at a Glance');
      expect(digest).toContain('Top 3 Non-Negotiables');
    });

    it('handles API errors during weekly digest generation and tries fallbacks', async () => {
      process.env.GEMINI_API_KEY = 'mock-key';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          text: async () => 'Quota exceeded / Rate limited',
        })
      );

      await expect(generateWeeklyDigestWithGemini(sampleEvents)).rejects.toThrow(
        /status 429/
      );
    });
  });
});
