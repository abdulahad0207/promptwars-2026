'use client';

import React, { useState } from 'react';
import { CampusEvent } from '@/types';
import {
  evaluateEventStatus,
  formatFriendlyDate,
  generateGoogleCalendarUrl,
  generateIcsData,
} from '@/lib/dateLogic';
import { CATEGORIES } from '@/lib/categories';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Pin,
  Trash2,
  Edit3,
  CalendarPlus,
  Download,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EventCardProps {
  event: CampusEvent;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (event: CampusEvent) => void;
  referenceDate?: Date;
  highlightToday?: boolean;
}

export default function EventCard({
  event,
  onDelete,
  onTogglePin,
  onEdit,
  referenceDate,
  highlightToday = false,
}: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const evaluation = evaluateEventStatus(event.date, event.time, referenceDate);
  const categoryMeta = CATEGORIES[event.category] || CATEGORIES.other;

  // Status badge styling
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
      {evaluation.formattedCountdown || 'Upcoming'}
    </span>
  );

  if (evaluation.isExpired) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {evaluation.formattedCountdown || 'Expired'}
      </span>
    );
  } else if (evaluation.isToday) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
        Needs Attention Today!
      </span>
    );
  } else if (evaluation.isUrgent) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
        Urgent: {evaluation.formattedCountdown}
      </span>
    );
  }

  const handleCopy = () => {
    const textToCopy = `📌 ${event.title}\n📅 Date: ${formatFriendlyDate(event.date)}\n⏰ Time: ${event.time}\n📍 Venue: ${event.venue}\n\n${event.summary}${event.actionItem ? `\n\n⚡ Action: ${event.actionItem}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    const icsContent = generateIcsData(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const googleCalUrl = generateGoogleCalendarUrl(event);

  return (
    <article
      tabIndex={0}
      aria-label={`${event.title}, scheduled for ${event.date}`}
      className={`group relative flex flex-col justify-between bg-white rounded-xl border transition-all duration-200 hover:shadow-md focus:shadow-md outline-none ${
        highlightToday
          ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
          : evaluation.isExpired
          ? 'border-slate-200 bg-slate-50/50 opacity-80'
          : event.isPinned
          ? 'border-indigo-300 bg-indigo-50/10 ring-1 ring-indigo-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Banner & Tags */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusBadge}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}
            >
              {categoryMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePin(event.id)}
              aria-label={event.isPinned ? 'Unpin event' : 'Pin event to top'}
              title={event.isPinned ? 'Unpin from top' : 'Pin to top'}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors ${
                event.isPinned ? 'text-indigo-600 bg-indigo-50' : ''
              }`}
            >
              <Pin className={`w-4 h-4 ${event.isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(event)}
              aria-label="Edit event details"
              title="Edit event"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(event.id)}
              aria-label="Delete announcement card"
              title="Delete card"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors">
          {event.title}
        </h3>

        {/* Date, Time, Venue */}
        <div className="mt-3.5 space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-800">{formatFriendlyDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{event.time || 'Time TBD'}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate" title={event.venue}>
              {event.venue || 'Venue TBD'}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3">
          {event.summary}
        </p>

        {/* Action item callout */}
        {event.actionItem && event.actionItem.toLowerCase() !== 'none' && (
          <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Action:</strong> {event.actionItem}
            </span>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Expand Raw Text Snippet */}
        {event.rawText && (
          <div className="mt-3 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showRaw ? 'Hide original message' : 'View original message'}</span>
              {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRaw && (
              <pre className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono text-slate-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {event.rawText}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-blue-700 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Cal</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadIcs}
            title="Download .ics file for Apple Calendar / Outlook"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.ICS</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy event details"
          title="Copy formatted details to clipboard"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
