import { CampusEvent } from '@/types';

/**
 * Normalizes text for comparison by removing punctuation, extra spaces, and lowercase.
 */
export function normalizeEventText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether two events are likely duplicates based on:
 * 1. Identical non-empty rawText, OR
 * 2. Identical normalized title + date, OR
 * 3. Identical normalized title + same date + same venue.
 */
export function areEventsDuplicates(
  eventA: Pick<CampusEvent, 'title' | 'date' | 'venue' | 'rawText'>,
  eventB: Pick<CampusEvent, 'title' | 'date' | 'venue' | 'rawText'>
): boolean {
  // Check exact raw text match
  if (
    eventA.rawText &&
    eventB.rawText &&
    eventA.rawText.trim().length > 15 &&
    eventA.rawText.trim() === eventB.rawText.trim()
  ) {
    return true;
  }

  const normTitleA = normalizeEventText(eventA.title);
  const normTitleB = normalizeEventText(eventB.title);
  const dateA = (eventA.date || '').trim();
  const dateB = (eventB.date || '').trim();

  if (normTitleA && normTitleB && normTitleA === normTitleB && dateA && dateB && dateA === dateB) {
    return true;
  }

  // Check venue + date + fuzzy title containment
  const venueA = normalizeEventText(eventA.venue);
  const venueB = normalizeEventText(eventB.venue);
  if (
    dateA &&
    dateA === dateB &&
    venueA &&
    venueB &&
    venueA === venueB &&
    (normTitleA.includes(normTitleB) || normTitleB.includes(normTitleA))
  ) {
    return true;
  }

  return false;
}

/**
 * Adds an event to the list with deduplication logic.
 * If a duplicate exists and allowDuplicates is false, it returns isDuplicate: true
 * and provides the id of the existing duplicate.
 */
export function addEventWithDeduplication(
  existingEvents: CampusEvent[],
  newEvent: CampusEvent,
  options: { allowDuplicates?: boolean; replaceExisting?: boolean } = {}
): {
  events: CampusEvent[];
  isDuplicate: boolean;
  duplicateId?: string;
} {
  const duplicate = existingEvents.find((existing) =>
    areEventsDuplicates(existing, newEvent)
  );

  if (duplicate && !options.allowDuplicates) {
    if (options.replaceExisting) {
      // Replace existing event with the updated one
      const updatedEvents = existingEvents.map((e) =>
        e.id === duplicate.id ? { ...newEvent, id: duplicate.id } : e
      );
      return {
        events: updatedEvents,
        isDuplicate: true,
        duplicateId: duplicate.id,
      };
    }

    return {
      events: existingEvents,
      isDuplicate: true,
      duplicateId: duplicate.id,
    };
  }

  return {
    events: [newEvent, ...existingEvents],
    isDuplicate: false,
  };
}

/**
 * Removes duplicate events from an array, keeping the earliest created or pinned ones.
 */
export function removeDuplicateEvents(events: CampusEvent[]): CampusEvent[] {
  const result: CampusEvent[] = [];

  for (const event of events) {
    const isDup = result.some((existing) => areEventsDuplicates(existing, event));
    if (!isDup) {
      result.push(event);
    }
  }

  return result;
}
