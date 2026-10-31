'use client';

import React from 'react';
import { CampusEvent } from '@/types';
import EventCard from './EventCard';
import { BellRing, CheckCircle2, Clock } from 'lucide-react';

interface NeedsAttentionTodayProps {
  todayEvents: CampusEvent[];
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (event: CampusEvent) => void;
  referenceDate?: Date;
}

export default function NeedsAttentionToday({
  todayEvents,
  onDelete,
  onTogglePin,
  onEdit,
  referenceDate,
}: NeedsAttentionTodayProps) {
  const count = todayEvents.length;

  return (
    <section
      aria-label="Needs attention today section"
      className="mb-8 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 text-white shadow-xs">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Needs Attention Today</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {count} {count === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Campus deadlines, submissions, and events scheduled for today.
            </p>
          </div>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300/60 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Happening today</span>
          </div>
        )}
      </div>

      {count > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              onEdit={onEdit}
              referenceDate={referenceDate}
              highlightToday={true}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/70 border border-amber-200/60 text-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">
            <strong>All clear for today!</strong> No campus deadlines or events are scheduled for today. Check upcoming events below or paste an announcement to add one.
          </p>
        </div>
      )}
    </section>
  );
}
