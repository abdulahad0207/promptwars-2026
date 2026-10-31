import { describe, it, expect } from 'vitest';
import {
  normalizeEventText,
  areEventsDuplicates,
  addEventWithDeduplication,
  removeDuplicateEvents,
} from './eventOperations';
import { CampusEvent } from '@/types';

describe('Campus Event Deduplication & Operations', () => {
  const baseEvent: CampusEvent = {
    id: 'evt-1',
    title: 'ACM Hackathon 2026',
    date: '2026-11-05',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    category: 'club',
    summary: '24-hour coding challenge',
    rawText: 'Join the ACM Hackathon on Nov 5 at Main Auditorium! Free food.',
    createdAt: '2026-10-31T00:00:00Z',
  };

  describe('normalizeEventText', () => {
    it('handles empty and undefined inputs', () => {
      expect(normalizeEventText('')).toBe('');
      expect(normalizeEventText(undefined)).toBe('');
    });

    it('strips punctuation and normalizes extra whitespace', () => {
      expect(normalizeEventText('  🚨 ACM!!  Hackathon - 2026??  ')).toBe('acm hackathon 2026');
    });
  });

  describe('areEventsDuplicates', () => {
    it('detects duplicate by exact rawText match', () => {
      const copy = {
        title: 'Different Title',
        date: '2026-12-01',
        venue: 'Room 101',
        rawText: 'Join the ACM Hackathon on Nov 5 at Main Auditorium! Free food.',
      };
      expect(areEventsDuplicates(baseEvent, copy)).toBe(true);
    });

    it('detects duplicate by matching title and date despite minor formatting differences', () => {
      const variation = {
        title: 'acm hackathon 2026!',
        date: '2026-11-05',
        venue: 'Main Auditorium Hall 1',
        rawText: 'A different forward of the same event',
      };
      expect(areEventsDuplicates(baseEvent, variation)).toBe(true);
    });

    it('detects duplicate by venue + date + title containment', () => {
      const similar = {
        title: 'ACM Hackathon',
        date: '2026-11-05',
        venue: 'Main Auditorium',
        rawText: '',
      };
      expect(areEventsDuplicates(baseEvent, similar)).toBe(true);
    });

    it('does not flag events on different dates as duplicates', () => {
      const differentDate = {
        ...baseEvent,
        date: '2026-11-06',
        rawText: 'Different message',
      };
      expect(areEventsDuplicates(baseEvent, differentDate)).toBe(false);
    });

    it('does not flag entirely distinct events as duplicates', () => {
      const distinct = {
        title: 'Physics Midterm Exam',
        date: '2026-11-05',
        venue: 'Exam Hall B',
        rawText: 'Physics midterm announcement',
      };
      expect(areEventsDuplicates(baseEvent, distinct)).toBe(false);
    });
  });

  describe('addEventWithDeduplication', () => {
    it('adds a unique new event to the beginning of the list', () => {
      const uniqueEvent: CampusEvent = {
        id: 'evt-2',
        title: 'Robotics Workshop',
        date: '2026-11-12',
        time: '2:00 PM',
        venue: 'Lab 3',
        category: 'workshop',
        summary: 'Hands-on Arduino',
        rawText: 'Robotics workshop',
        createdAt: '2026-10-31T01:00:00Z',
      };

      const result = addEventWithDeduplication([baseEvent], uniqueEvent);
      expect(result.isDuplicate).toBe(false);
      expect(result.events.length).toBe(2);
      expect(result.events[0].id).toBe('evt-2');
    });

    it('blocks duplicate addition when allowDuplicates is false', () => {
      const duplicateEvent: CampusEvent = {
        ...baseEvent,
        id: 'evt-new-id',
        title: 'ACM Hackathon 2026',
      };

      const result = addEventWithDeduplication([baseEvent], duplicateEvent);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateId).toBe('evt-1');
      expect(result.events.length).toBe(1);
    });

    it('replaces existing event when replaceExisting option is true', () => {
      const updatedDuplicate: CampusEvent = {
        ...baseEvent,
        id: 'evt-new-id',
        summary: 'Updated summary with more details on prizes',
      };

      const result = addEventWithDeduplication([baseEvent], updatedDuplicate, {
        replaceExisting: true,
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.events.length).toBe(1);
      expect(result.events[0].id).toBe('evt-1'); // preserves original id
      expect(result.events[0].summary).toBe('Updated summary with more details on prizes');
    });

    it('allows duplicates when allowDuplicates is explicitly set to true', () => {
      const duplicateEvent: CampusEvent = {
        ...baseEvent,
        id: 'evt-duplicate',
      };

      const result = addEventWithDeduplication([baseEvent], duplicateEvent, {
        allowDuplicates: true,
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.events.length).toBe(2);
    });
  });

  describe('removeDuplicateEvents', () => {
    it('removes duplicate events from a list preserving the first occurrence', () => {
      const duplicate1: CampusEvent = {
        ...baseEvent,
        id: 'evt-dup-1',
      };
      const duplicate2: CampusEvent = {
        ...baseEvent,
        id: 'evt-dup-2',
      };
      const otherEvent: CampusEvent = {
        id: 'evt-other',
        title: 'Chemistry Lab',
        date: '2026-11-08',
        time: '9:00 AM',
        venue: 'Lab 2',
        category: 'academic',
        summary: 'Titration practical',
        rawText: 'Chemistry practical on Nov 8',
        createdAt: '2026-10-31T02:00:00Z',
      };

      const rawList = [baseEvent, duplicate1, otherEvent, duplicate2];
      const deduplicated = removeDuplicateEvents(rawList);

      expect(deduplicated.length).toBe(2);
      expect(deduplicated.map((e) => e.id)).toEqual(['evt-1', 'evt-other']);
    });

    it('handles empty arrays gracefully', () => {
      expect(removeDuplicateEvents([])).toEqual([]);
    });
  });
});
