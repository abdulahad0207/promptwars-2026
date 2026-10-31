import { NextRequest, NextResponse } from 'next/server';
import { extractEventWithGemini, heuristicExtract, validateInputText } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON payload. Expected { text: string }' },
        { status: 400 }
      );
    }

    const { text, clientTime, allowFallback } = body;

    const validation = validateInputText(text);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Attempt Gemini extraction
    try {
      const extracted = await extractEventWithGemini(validation.sanitized, clientTime);
      return NextResponse.json({
        success: true,
        data: extracted,
        source: 'gemini',
      });
    } catch (geminiError: unknown) {
      const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.warn('Gemini extraction failed, evaluating fallback:', errorMsg);

      // If user allowed heuristic fallback or if API key is missing
      if (allowFallback || !process.env.GEMINI_API_KEY) {
        const fallbackResult = heuristicExtract(
          validation.sanitized,
          clientTime ? new Date(clientTime) : new Date()
        );
        return NextResponse.json({
          success: true,
          data: fallbackResult,
          source: 'heuristic',
          notice: !process.env.GEMINI_API_KEY
            ? 'GEMINI_API_KEY not configured on server; parsed with local smart heuristic.'
            : 'Gemini request encountered an issue; parsed with smart heuristic.',
        });
      }

      return NextResponse.json(
        {
          error: `Extraction failed: ${errorMsg}`,
          canFallback: true,
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    console.error('Unhandled server error in /api/parse-announcement:', error);
    return NextResponse.json(
      { error: 'An unexpected internal server error occurred while processing the announcement.' },
      { status: 500 }
    );
  }
}
