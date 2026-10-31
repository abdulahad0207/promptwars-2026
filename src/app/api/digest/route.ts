import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyDigestWithGemini } from '@/lib/gemini';
import { CampusEvent } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected { events: CampusEvent[] }' },
        { status: 400 }
      );
    }

    const events: CampusEvent[] = body.events.slice(0, 30); // Cap at 30 events
    const clientTime: string | undefined = body.clientTime;

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        digest: `### 🎉 Clear Horizon This Week!
No campus events, deadlines, or exams are currently recorded for this upcoming week.

**What you can do:**
- Paste your messy WhatsApp class groups, club circulars, or professor emails using the **"Paste Announcement"** button above.
- Enjoy some well-deserved downtime or catch up on personal study projects!`,
        source: 'static',
      });
    }

    try {
      const digest = await generateWeeklyDigestWithGemini(
        events.map((e) => ({
          title: e.title,
          date: e.date,
          time: e.time,
          venue: e.venue,
          category: e.category,
          summary: e.summary,
          actionItem: e.actionItem,
        })),
        clientTime
      );

      return NextResponse.json({
        success: true,
        digest,
        source: 'gemini',
      });
    } catch (geminiError: unknown) {
      const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.warn('Gemini weekly digest generation failed, using structured fallback:', errorMsg);

      // Deterministic fallback weekly digest
      const count = events.length;
      const categoriesCount: Record<string, number> = {};
      events.forEach((e) => {
        categoriesCount[e.category] = (categoriesCount[e.category] || 0) + 1;
      });

      const topPriorities = events.slice(0, 3);
      const prioritiesList = topPriorities
        .map(
          (e, idx) =>
            `${idx + 1}. **${e.title}** (${e.category.toUpperCase()})  \n   📅 Date: ${e.date} | ⏰ Time: ${e.time} | 📍 Venue: ${e.venue}  \n   _${e.summary}_`
        )
        .join('\n\n');

      const dayBreakdown = events
        .map(
          (e) =>
            `- **${e.date} (${e.time})**: ${e.title} @ *${e.venue}* (${e.category})`
        )
        .join('\n');

      const fallbackDigest = `### 🎯 Weekly Campus Briefing (${count} scheduled item${count > 1 ? 's' : ''})

> **Heads Up:** Showing local structured digest (${!process.env.GEMINI_API_KEY ? 'Add GEMINI_API_KEY in .env.local for full AI synthesis' : 'Gemini offline'}).

#### 🚨 Key Upcoming Deadlines & Events
${prioritiesList}

#### 🗓️ Day-by-Day Schedule
${dayBreakdown}

#### ⚠️ Student Prep Tips
- Review the venues ahead of time so you aren't rushing across campus.
- Set reminder alarms for submissions due today and tomorrow.
- Carry relevant ID cards, practical lab manuals, or tickets.`;

      return NextResponse.json({
        success: true,
        digest: fallbackDigest,
        source: 'fallback',
        notice: errorMsg,
      });
    }
  } catch (error: unknown) {
    console.error('Unhandled server error in /api/digest:', error);
    return NextResponse.json(
      { error: 'An unexpected internal server error occurred while generating the weekly digest.' },
      { status: 500 }
    );
  }
}
