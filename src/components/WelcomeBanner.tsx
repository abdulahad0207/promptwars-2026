'use client';

import React, { useState } from 'react';
import { Sparkles, MessageSquareDashed, ArrowRight, X, CalendarCheck, Zap } from 'lucide-react';

interface WelcomeBannerProps {
  onOpenPasteModal: () => void;
  onOpenDigestModal: () => void;
}

export default function WelcomeBanner({
  onOpenPasteModal,
  onOpenDigestModal,
}: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Welcome guide"
      className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 shadow-lg"
    >
      {/* Background glow circle */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI-Powered Student Schedule Concierge</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss guide"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white max-w-2xl">
          Tired of chaotic WhatsApp class groups and lost emails?
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Paste any raw, messy text snippet. Gemini extracts the title, date, time, venue, and category into a smart card with pure date-driven urgency flags and 1-click calendar export.
        </p>

        {/* 3 Step Mini-Guide */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white">Paste Messy Text</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Forwards, emails, WhatsApp screenshots or club blurbs.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white">Gemini Extracts Details</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automatically determines date, time, venue, and category.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white">Never Miss Deadlines</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Prioritized as Today, Urgent, or Upcoming with .ICS & Google Cal sync.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenPasteModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <MessageSquareDashed className="w-4 h-4 text-slate-950" />
            <span>Try Pasting an Announcement (N)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>

          <button
            type="button"
            onClick={onOpenDigestModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Weekly AI Digest (W)</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
