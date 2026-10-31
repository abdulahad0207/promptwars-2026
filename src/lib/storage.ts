import { CampusEvent } from '@/types';
import { generateDefaultEvents } from './sampleData';

const STORAGE_KEY = 'campus_pulse_events_v1';

export function getStoredEvents(): CampusEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First-time initialization: preload rich realistic sample campus events
      const defaultEvents = generateDefaultEvents();
      saveStoredEvents(defaultEvents);
      return defaultEvents;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading campus events from localStorage:', error);
    return [];
  }
}

export function saveStoredEvents(events: CampusEvent[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving campus events to localStorage:', error);
  }
}

export function resetStoredEventsToDefault(): CampusEvent[] {
  const defaultEvents = generateDefaultEvents();
  saveStoredEvents(defaultEvents);
  return defaultEvents;
}

export function exportEventsAsJson(events: CampusEvent[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `campus-pulse-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
