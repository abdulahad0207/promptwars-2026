export type EventCategory =
  | 'academic'
  | 'club'
  | 'workshop'
  | 'sports'
  | 'social'
  | 'administrative'
  | 'other';

export type UrgencyStatus = 'today' | 'urgent' | 'upcoming' | 'expired';

export interface CampusEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format preferably
  time: string; // e.g. "14:00 - 16:00" or "3:00 PM"
  venue: string;
  category: EventCategory;
  summary: string;
  rawText: string;
  actionItem?: string;
  tags?: string[];
  createdAt: string; // ISO date string
  isPinned?: boolean;
  isCompleted?: boolean;
}

export interface ParseResult {
  title: string;
  date: string;
  time: string;
  venue: string;
  category: EventCategory;
  summary: string;
  actionItem?: string;
  tags?: string[];
}

export interface EventStatusEvaluation {
  status: UrgencyStatus;
  isToday: boolean;
  isUrgent: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
  daysDiff: number; // positive = future, 0 = today, negative = past
  formattedCountdown: string;
  relativeLabel: string;
}
