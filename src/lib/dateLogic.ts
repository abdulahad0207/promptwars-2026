import { CampusEvent, EventCategory, EventStatusEvaluation, UrgencyStatus } from '@/types';

/**
 * Normalizes any date string (ISO, YYYY-MM-DD, readable text) to a clean Date object at start of day (00:00:00).
 */
export function normalizeDateToStartOfDay(dateInput: string | Date): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const str = dateInput.trim();
  // Handle YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback to standard Date parsing
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * Extracts hour and minute from time strings like "14:30", "2:30 PM", "10:00 AM - 1:00 PM"
 */
export function parseStartTime(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toLowerCase();

  // Look for 12-hour format: "2:30 pm", "2 pm", "02:30pm"
  const twelveHourMatch = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
    const meridian = twelveHourMatch[3];

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // Look for 24-hour format: "14:30", "09:15"
  const twentyFourMatch = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourMatch) {
    const hours = parseInt(twentyFourMatch[1], 10);
    const minutes = parseInt(twentyFourMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes };
    }
  }

  return null;
}

/**
 * Resolves a reference Date safely without triggering SSR prerender blocks.
 */
function resolveReferenceDate(ref?: Date): Date {
  if (ref && !isNaN(ref.getTime())) return ref;
  // If window is available (client runtime) use new Date(), otherwise stable date
  if (typeof window !== 'undefined') {
    return new Date();
  }
  return new Date('2026-10-31T12:00:00Z');
}

/**
 * Evaluates urgency status (today, urgent, upcoming, expired) using pure deterministic date logic.
 *
 * Rules:
 * 1. Expired: Event date is in the past (< today), OR event is today and the event time has already elapsed.
 * 2. Today (Needs Attention Today): Event date is today and not yet expired.
 * 3. Urgent: Happening today OR within the next 48 hours (tomorrow / day after tomorrow).
 * 4. Upcoming: More than 48 hours in the future.
 */
export function evaluateEventStatus(
  dateStr: string,
  timeStr?: string,
  referenceDate?: Date
): EventStatusEvaluation {
  const ref = resolveReferenceDate(referenceDate);
  const eventDate = normalizeDateToStartOfDay(dateStr);
  const refStartOfDay = normalizeDateToStartOfDay(ref) || new Date(ref);
  refStartOfDay.setHours(0, 0, 0, 0);

  if (!eventDate) {
    return {
      status: 'upcoming',
      isToday: false,
      isUrgent: false,
      isUpcoming: true,
      isExpired: false,
      daysDiff: 0,
      formattedCountdown: 'Date unconfirmed',
      relativeLabel: 'Unconfirmed date',
    };
  }

  // Difference in calendar days
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = eventDate.getTime() - refStartOfDay.getTime();
  const daysDiff = Math.round(diffMs / msPerDay);

  // Time-aware check for events today or exact timestamps
  const parsedTime = parseStartTime(timeStr);
  let isPastTimeToday = false;

  if (daysDiff === 0 && parsedTime) {
    const eventTimeToday = new Date(refStartOfDay);
    eventTimeToday.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    // Allow a 1-hour grace period before marking as strictly expired
    const gracePeriodMs = 60 * 60 * 1000;
    if (ref.getTime() > eventTimeToday.getTime() + gracePeriodMs) {
      isPastTimeToday = true;
    }
  }

  const isToday = daysDiff === 0;
  const isPast = daysDiff < 0 || isPastTimeToday;
  // Urgent: today (if not expired) or within next 2 days (1 to 2 days)
  const isUrgent = !isPast && (isToday || (daysDiff > 0 && daysDiff <= 2));
  const isUpcoming = !isPast && daysDiff > 2;

  let status: UrgencyStatus;
  let formattedCountdown = '';
  let relativeLabel = '';

  if (isPast) {
    status = 'expired';
    if (isPastTimeToday) {
      formattedCountdown = 'Ended today';
      relativeLabel = 'Earlier today';
    } else {
      const absDays = Math.abs(daysDiff);
      formattedCountdown = absDays === 1 ? 'Yesterday' : `${absDays} days ago`;
      relativeLabel = absDays === 1 ? 'Yesterday' : `${absDays} days ago`;
    }
  } else if (isToday) {
    status = 'today';
    formattedCountdown = 'Happening today';
    relativeLabel = 'Today';
  } else if (isUrgent) {
    status = 'urgent';
    if (daysDiff === 1) {
      formattedCountdown = 'Tomorrow';
      relativeLabel = 'Tomorrow';
    } else {
      formattedCountdown = `In ${daysDiff} days`;
      relativeLabel = `In ${daysDiff} days`;
    }
  } else {
    status = 'upcoming';
    if (daysDiff <= 7) {
      formattedCountdown = `In ${daysDiff} days`;
      relativeLabel = `This coming week`;
    } else {
      const weeks = Math.round(daysDiff / 7);
      formattedCountdown = weeks === 1 ? 'Next week' : `In ${weeks} weeks`;
      relativeLabel = `In ${daysDiff} days`;
    }
  }

  return {
    status,
    isToday: isToday && !isPastTimeToday,
    isUrgent,
    isUpcoming,
    isExpired: isPast,
    daysDiff,
    formattedCountdown,
    relativeLabel,
  };
}

/**
 * Filter events that require attention today (happen today and are not expired).
 */
export function getEventsNeedingAttentionToday(
  events: CampusEvent[],
  referenceDate?: Date
): CampusEvent[] {
  const ref = resolveReferenceDate(referenceDate);
  return events.filter((e) => {
    const evalResult = evaluateEventStatus(e.date, e.time, ref);
    return evalResult.isToday;
  });
}

/**
 * Sorts events according to specified mode:
 * - 'nearest': Earliest future events first, expired at the bottom
 * - 'furthest': Furthest future events first
 * - 'priority': Today & Urgent first, then upcoming, then expired
 * - 'category': Alphabetically by category
 */
export function sortEvents(
  events: CampusEvent[],
  sortBy: 'nearest' | 'furthest' | 'priority' | 'category' | 'recent',
  referenceDate?: Date
): CampusEvent[] {
  const ref = resolveReferenceDate(referenceDate);
  return [...events].sort((a, b) => {
    // Pinned items always stay on top unless sorting by recent
    if (sortBy !== 'recent') {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }

    if (sortBy === 'recent') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }

    if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }

    const evalA = evaluateEventStatus(a.date, a.time, ref);
    const evalB = evaluateEventStatus(b.date, b.time, ref);

    if (sortBy === 'priority') {
      const priorityOrder: Record<UrgencyStatus, number> = {
        today: 0,
        urgent: 1,
        upcoming: 2,
        expired: 3,
      };
      const diff = priorityOrder[evalA.status] - priorityOrder[evalB.status];
      if (diff !== 0) return diff;
      return evalA.daysDiff - evalB.daysDiff;
    }

    if (sortBy === 'nearest') {
      // Put non-expired events before expired events
      if (evalA.isExpired && !evalB.isExpired) return 1;
      if (!evalA.isExpired && evalB.isExpired) return -1;
      return evalA.daysDiff - evalB.daysDiff;
    }

    if (sortBy === 'furthest') {
      return evalB.daysDiff - evalA.daysDiff;
    }

    return 0;
  });
}

/**
 * Formats a date string (YYYY-MM-DD) into student-friendly readable date
 * e.g. "Monday, Nov 2, 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  const d = normalizeDateToStartOfDay(dateStr);
  if (!d) return dateStr || 'Date TBD';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks if a given event falls in the current 7-day window (referenceDate to referenceDate + 7 days).
 */
export function isEventInCurrentWeek(
  dateStr: string,
  referenceDate?: Date
): boolean {
  const ref = resolveReferenceDate(referenceDate);
  const evalResult = evaluateEventStatus(dateStr, undefined, ref);
  return !evalResult.isExpired && evalResult.daysDiff >= 0 && evalResult.daysDiff <= 7;
}

/**
 * Generates Google Calendar Add URL
 */
export function generateGoogleCalendarUrl(event: CampusEvent): string {
  const d = normalizeDateToStartOfDay(event.date);
  if (!d) return '#';

  const startTime = parseStartTime(event.time);
  const startYear = d.getFullYear();
  const startMonth = String(d.getMonth() + 1).padStart(2, '0');
  const startDay = String(d.getDate()).padStart(2, '0');

  let startIso = `${startYear}${startMonth}${startDay}`;
  let endIso = `${startYear}${startMonth}${startDay}`;

  if (startTime) {
    const startHour = String(startTime.hours).padStart(2, '0');
    const startMin = String(startTime.minutes).padStart(2, '0');
    // Default 1 hour duration
    const endHour = String((startTime.hours + 1) % 24).padStart(2, '0');
    startIso += `T${startHour}${startMin}00`;
    endIso += `T${endHour}${startMin}00`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startIso}/${endIso}`,
    details: `${event.summary || ''}\n\nVenue: ${event.venue}\nCategory: ${event.category}`,
    location: event.venue || 'Campus',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an iCalendar (.ics) string for downloading
 */
export function generateIcsData(event: CampusEvent): string {
  const d = normalizeDateToStartOfDay(event.date) || new Date('2026-10-31T00:00:00Z');
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const startTime = parseStartTime(event.time);

  let dtStart = `${year}${month}${day}`;
  let dtEnd = `${year}${month}${day}`;

  if (startTime) {
    const h = String(startTime.hours).padStart(2, '0');
    const m = String(startTime.minutes).padStart(2, '0');
    const endH = String((startTime.hours + 1) % 24).padStart(2, '0');
    dtStart += `T${h}${m}00`;
    dtEnd += `T${endH}${m}00`;
  }

  const nowStamp = '20261031T113000Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Pulse//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@campuspulse.local`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.summary || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${(event.venue || '').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
