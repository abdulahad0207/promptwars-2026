import { describe, it, expect } from 'vitest';
import {
  normalizeDateToStartOfDay,
  parseStartTime,
  evaluateEventStatus,
  getEventsNeedingAttentionToday,
  sortEvents,
  formatFriendlyDate,
  isEventInCurrentWeek,
  generateGoogleCalendarUrl,
  generateIcsData,
} from './dateLogic';
import { CampusEvent } from '@/types';

describe('Campus Pulse Date & Priority Logic', () => {
  // Fixed reference date: Saturday, Oct 31, 2026 at 11:30 AM
  const mockNow = new Date('2026-10-31T11:30:00');

  describe('normalizeDateToStartOfDay', () => {
    it('normalizes YYYY-MM-DD string to start of day', () => {
      const result = normalizeDateToStartOfDay('2026-10-31');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(9); // 0-indexed October
      expect(result?.getDate()).toBe(31);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
    });

    it('handles Date instances', () => {
      const d = new Date('2026-11-05T15:45:00');
      const normalized = normalizeDateToStartOfDay(d);
      expect(normalized?.getDate()).toBe(5);
      expect(normalized?.getHours()).toBe(0);
    });

    it('returns null for empty or whitespace-only inputs', () => {
      expect(normalizeDateToStartOfDay('')).toBeNull();
      expect(normalizeDateToStartOfDay('   ')).toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(normalizeDateToStartOfDay(null as any)).toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(normalizeDateToStartOfDay(undefined as any)).toBeNull();
    });

    it('returns null for completely invalid date strings', () => {
      expect(normalizeDateToStartOfDay('invalid-date-string')).toBeNull();
      expect(normalizeDateToStartOfDay('not-a-date')).toBeNull();
      expect(normalizeDateToStartOfDay('2026-99-99')).toBeNull();
    });

    it('handles valid leap year date (2024-02-29)', () => {
      const leapDay = normalizeDateToStartOfDay('2024-02-29');
      expect(leapDay).not.toBeNull();
      expect(leapDay?.getMonth()).toBe(1); // February
      expect(leapDay?.getDate()).toBe(29);
    });
  });

  describe('parseStartTime', () => {
    it('parses 12-hour format with AM and PM', () => {
      expect(parseStartTime('2:30 PM')).toEqual({ hours: 14, minutes: 30 });
      expect(parseStartTime('10:00 AM')).toEqual({ hours: 10, minutes: 0 });
      expect(parseStartTime('12:00 PM')).toEqual({ hours: 12, minutes: 0 });
      expect(parseStartTime('12:00 AM')).toEqual({ hours: 0, minutes: 0 });
      expect(parseStartTime('3pm')).toEqual({ hours: 15, minutes: 0 });
    });

    it('parses 24-hour format', () => {
      expect(parseStartTime('16:45')).toEqual({ hours: 16, minutes: 45 });
      expect(parseStartTime('08:15')).toEqual({ hours: 8, minutes: 15 });
    });

    it('returns null for non-time strings, empty, or whitespace values', () => {
      expect(parseStartTime('TBD')).toBeNull();
      expect(parseStartTime('All Day')).toBeNull();
      expect(parseStartTime('')).toBeNull();
      expect(parseStartTime('   ')).toBeNull();
      expect(parseStartTime(undefined)).toBeNull();
    });

    it('returns null for out-of-range times', () => {
      expect(parseStartTime('25:00')).toBeNull();
      expect(parseStartTime('12:99')).toBeNull();
      expect(parseStartTime('-05:00')).toBeNull();
    });
  });

  describe('evaluateEventStatus (Urgency and Expiration Logic)', () => {
    it('flags today events with future time as today and urgent', () => {
      // 2026-10-31 4:00 PM (later today relative to 11:30 AM)
      const res = evaluateEventStatus('2026-10-31', '4:00 PM', mockNow);
      expect(res.status).toBe('today');
      expect(res.isToday).toBe(true);
      expect(res.isUrgent).toBe(true);
      expect(res.isExpired).toBe(false);
      expect(res.daysDiff).toBe(0);
      expect(res.formattedCountdown).toBe('Happening today');
    });

    it('allows 1-hour grace period for today events before marking expired', () => {
      // Event was at 11:00 AM today, reference is 11:30 AM (30 min elapsed < 1h grace)
      const activeRes = evaluateEventStatus('2026-10-31', '11:00 AM', mockNow);
      expect(activeRes.status).toBe('today');
      expect(activeRes.isExpired).toBe(false);

      // Event was at 9:00 AM today, reference is 11:30 AM (2.5h elapsed > 1h grace)
      const expiredRes = evaluateEventStatus('2026-10-31', '9:00 AM', mockNow);
      expect(expiredRes.status).toBe('expired');
      expect(expiredRes.isExpired).toBe(true);
      expect(expiredRes.formattedCountdown).toBe('Ended today');
    });

    it('flags tomorrow (1 day ahead) as urgent', () => {
      const res = evaluateEventStatus('2026-11-01', '10:00 AM', mockNow);
      expect(res.status).toBe('urgent');
      expect(res.isUrgent).toBe(true);
      expect(res.isToday).toBe(false);
      expect(res.isUpcoming).toBe(false);
      expect(res.isExpired).toBe(false);
      expect(res.daysDiff).toBe(1);
      expect(res.formattedCountdown).toBe('Tomorrow');
    });

    it('flags 2 days ahead as urgent (within 48h window)', () => {
      const res = evaluateEventStatus('2026-11-02', '14:00', mockNow);
      expect(res.status).toBe('urgent');
      expect(res.isUrgent).toBe(true);
      expect(res.daysDiff).toBe(2);
    });

    it('flags 3 days ahead as upcoming (> 48 hours)', () => {
      const res = evaluateEventStatus('2026-11-03', '10:00 AM', mockNow);
      expect(res.status).toBe('upcoming');
      expect(res.isUpcoming).toBe(true);
      expect(res.isUrgent).toBe(false);
      expect(res.daysDiff).toBe(3);
    });

    it('flags past days (yesterday, last week) as expired', () => {
      const resYesterday = evaluateEventStatus('2026-10-30', undefined, mockNow);
      expect(resYesterday.status).toBe('expired');
      expect(resYesterday.isExpired).toBe(true);
      expect(resYesterday.daysDiff).toBe(-1);
      expect(resYesterday.formattedCountdown).toBe('Yesterday');

      const resLastWeek = evaluateEventStatus('2026-10-24', undefined, mockNow);
      expect(resLastWeek.status).toBe('expired');
      expect(resLastWeek.isExpired).toBe(true);
      expect(resLastWeek.daysDiff).toBe(-7);
      expect(resLastWeek.formattedCountdown).toBe('7 days ago');
    });

    it('safely handles empty string or missing date without throwing', () => {
      const resEmpty = evaluateEventStatus('', undefined, mockNow);
      expect(resEmpty.status).toBe('upcoming');
      expect(resEmpty.isExpired).toBe(false);
      expect(resEmpty.formattedCountdown).toBe('Date unconfirmed');

      const resWhitespace = evaluateEventStatus('   ', undefined, mockNow);
      expect(resWhitespace.status).toBe('upcoming');
      expect(resWhitespace.formattedCountdown).toBe('Date unconfirmed');
    });

    it('safely handles malformed and invalid date strings', () => {
      const res = evaluateEventStatus('unknown date string', undefined, mockNow);
      expect(res.status).toBe('upcoming');
      expect(res.isExpired).toBe(false);
      expect(res.formattedCountdown).toBe('Date unconfirmed');
    });
  });

  describe('formatFriendlyDate', () => {
    it('formats standard YYYY-MM-DD cleanly', () => {
      const formatted = formatFriendlyDate('2026-11-05');
      expect(formatted).toContain('Nov');
      expect(formatted).toContain('5');
      expect(formatted).toContain('2026');
    });

    it('falls back gracefully on empty or invalid date strings', () => {
      expect(formatFriendlyDate('')).toBe('Date TBD');
      expect(formatFriendlyDate('   ')).toBe('Date TBD');
      expect(formatFriendlyDate('invalid')).toBe('invalid');
    });
  });

  describe('getEventsNeedingAttentionToday', () => {
    const events: CampusEvent[] = [
      {
        id: '1',
        title: 'Morning Lab',
        date: '2026-10-31',
        time: '3:00 PM', // future today
        venue: 'Lab 1',
        category: 'academic',
        summary: 'Physics practicals',
        rawText: 'Lab today 3pm',
        createdAt: '2026-10-30T10:00:00Z',
      },
      {
        id: '2',
        title: 'Already Finished Morning Quiz',
        date: '2026-10-31',
        time: '7:00 AM', // past today
        venue: 'Online',
        category: 'academic',
        summary: 'Quiz ended',
        rawText: 'Quiz 7am',
        createdAt: '2026-10-30T10:00:00Z',
      },
      {
        id: '3',
        title: 'Tomorrow Hackathon',
        date: '2026-11-01',
        time: '10:00 AM',
        venue: 'Audi',
        category: 'club',
        summary: 'Hackathon kicks off',
        rawText: 'Hackathon tomorrow',
        createdAt: '2026-10-30T10:00:00Z',
      },
      {
        id: '4',
        title: 'Past Event Yesterday',
        date: '2026-10-30',
        time: '2:00 PM',
        venue: 'Room 101',
        category: 'social',
        summary: 'Meetup',
        rawText: 'Meetup yesterday',
        createdAt: '2026-10-29T10:00:00Z',
      },
    ];

    it('returns only events scheduled today that have not already expired', () => {
      const attentionItems = getEventsNeedingAttentionToday(events, mockNow);
      expect(attentionItems.length).toBe(1);
      expect(attentionItems[0].id).toBe('1');
      expect(attentionItems[0].title).toBe('Morning Lab');
    });

    it('returns empty array when passed an empty events list', () => {
      expect(getEventsNeedingAttentionToday([], mockNow)).toEqual([]);
    });
  });

  describe('sortEvents', () => {
    const events: CampusEvent[] = [
      {
        id: 'exp',
        title: 'Past Event',
        date: '2026-10-25',
        time: '12:00 PM',
        venue: 'Auditorium',
        category: 'social',
        summary: 'Old fest',
        rawText: '',
        createdAt: '2026-10-20T00:00:00Z',
      },
      {
        id: 'tomorrow',
        title: 'Tomorrow Workshop',
        date: '2026-11-01',
        time: '10:00 AM',
        venue: 'Room 202',
        category: 'workshop',
        summary: 'AI Workshop',
        rawText: '',
        createdAt: '2026-10-28T00:00:00Z',
      },
      {
        id: 'today',
        title: 'Today Submission',
        date: '2026-10-31',
        time: '5:00 PM',
        venue: 'Online Portal',
        category: 'academic',
        summary: 'Assignment 3',
        rawText: '',
        createdAt: '2026-10-29T00:00:00Z',
      },
      {
        id: 'future',
        title: 'Next Week Fest',
        date: '2026-11-10',
        time: '6:00 PM',
        venue: 'Grounds',
        category: 'social',
        summary: 'Annual fest',
        rawText: '',
        createdAt: '2026-10-27T00:00:00Z',
      },
    ];

    it('sorts by priority: today -> urgent (tomorrow) -> upcoming -> expired', () => {
      const sorted = sortEvents(events, 'priority', mockNow);
      expect(sorted.map((e) => e.id)).toEqual(['today', 'tomorrow', 'future', 'exp']);
    });

    it('sorts by nearest: today -> tomorrow -> next week -> expired at end', () => {
      const sorted = sortEvents(events, 'nearest', mockNow);
      expect(sorted.map((e) => e.id)).toEqual(['today', 'tomorrow', 'future', 'exp']);
    });

    it('sorts by furthest: future -> tomorrow -> today -> past', () => {
      const sorted = sortEvents(events, 'furthest', mockNow);
      expect(sorted[0].id).toBe('future');
      expect(sorted[sorted.length - 1].id).toBe('exp');
    });

    it('sorts by category alphabetically', () => {
      const sorted = sortEvents(events, 'category', mockNow);
      const categories = sorted.map((e) => e.category);
      expect(categories).toEqual(['academic', 'social', 'social', 'workshop']);
    });

    it('keeps pinned items at the top when sorting', () => {
      const withPinned: CampusEvent[] = [
        ...events,
        {
          id: 'pinned-future',
          title: 'Pinned Career Fair',
          date: '2026-11-15',
          time: '10:00 AM',
          venue: 'Gym',
          category: 'workshop',
          summary: 'Big job fair',
          rawText: '',
          createdAt: '2026-10-20T00:00:00Z',
          isPinned: true,
        },
      ];
      const sorted = sortEvents(withPinned, 'priority', mockNow);
      expect(sorted[0].id).toBe('pinned-future');
    });

    it('sorts by recently added when specified', () => {
      const sorted = sortEvents(events, 'recent', mockNow);
      expect(sorted[0].id).toBe('today'); // created on 10-29
      expect(sorted[sorted.length - 1].id).toBe('exp'); // created on 10-20
    });
  });

  describe('isEventInCurrentWeek', () => {
    it('returns true for events within 7 days', () => {
      expect(isEventInCurrentWeek('2026-10-31', mockNow)).toBe(true); // today
      expect(isEventInCurrentWeek('2026-11-01', mockNow)).toBe(true); // in 1 day
      expect(isEventInCurrentWeek('2026-11-07', mockNow)).toBe(true); // in 7 days
    });

    it('returns false for events beyond 7 days or past', () => {
      expect(isEventInCurrentWeek('2026-11-08', mockNow)).toBe(false); // in 8 days
      expect(isEventInCurrentWeek('2026-10-30', mockNow)).toBe(false); // yesterday
    });

    it('returns false for empty or invalid date strings', () => {
      expect(isEventInCurrentWeek('', mockNow)).toBe(false);
      expect(isEventInCurrentWeek('invalid-date', mockNow)).toBe(false);
    });
  });

  describe('Calendar integrations', () => {
    const sampleEvent: CampusEvent = {
      id: 'evt-123',
      title: 'CS 101 Midterm Exam',
      date: '2026-11-05',
      time: '14:00 - 16:00',
      venue: 'Main Auditorium Hall 3',
      category: 'academic',
      summary: 'Bring your student ID card and scientific calculator.',
      rawText: 'CS 101 exam Nov 5 at 2pm Hall 3',
      createdAt: '2026-10-30T00:00:00Z',
    };

    it('generates a valid Google Calendar URL', () => {
      const url = generateGoogleCalendarUrl(sampleEvent);
      expect(url).toContain('https://calendar.google.com/calendar/render');
      expect(url).toContain('CS+101+Midterm+Exam');
      expect(url).toContain('20261105T140000');
    });

    it('handles Google Calendar URL for event with missing/invalid date gracefully', () => {
      const badEvent: CampusEvent = { ...sampleEvent, date: '' };
      expect(generateGoogleCalendarUrl(badEvent)).toBe('#');
    });

    it('generates a valid .ics calendar payload', () => {
      const ics = generateIcsData(sampleEvent);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('SUMMARY:CS 101 Midterm Exam');
      expect(ics).toContain('LOCATION:Main Auditorium Hall 3');
      expect(ics).toContain('DTSTART:20261105T140000');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
