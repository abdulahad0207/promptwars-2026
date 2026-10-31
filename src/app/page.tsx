'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CampusEvent, EventCategory, UrgencyStatus } from '@/types';
import {
  evaluateEventStatus,
  getEventsNeedingAttentionToday,
  sortEvents,
} from '@/lib/dateLogic';
import { addEventWithDeduplication } from '@/lib/eventOperations';
import {
  getStoredEvents,
  saveStoredEvents,
  resetStoredEventsToDefault,
  exportEventsAsJson,
} from '@/lib/storage';
import Navbar from '@/components/Navbar';
import WelcomeBanner from '@/components/WelcomeBanner';
import NeedsAttentionToday from '@/components/NeedsAttentionToday';
import SearchFilterBar, { SortMode } from '@/components/SearchFilterBar';
import EventCard from '@/components/EventCard';
import PasteModal from '@/components/PasteModal';
import WeeklyDigestModal from '@/components/WeeklyDigestModal';
import EditEventModal from '@/components/EditEventModal';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';
import {
  CalendarSearch,
  Plus,
  RotateCcw,
  Inbox,
  FilterX,
} from 'lucide-react';

export default function CampusPulsePage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-10-31T12:00:00Z'));

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<UrgencyStatus | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setCurrentDate(new Date());
      const loaded = getStoredEvents();
      setEvents(loaded);
      setIsLoaded(true);
    }, 0);

    const intervalTimer = setInterval(() => setCurrentDate(new Date()), 60000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  // Save to localStorage whenever events change (after initial mount)
  useEffect(() => {
    if (isLoaded) {
      saveStoredEvents(events);
    }
  }, [events, isLoaded]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        setIsPasteModalOpen(true);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setIsDigestModalOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      } else if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSaveNewEvent = useCallback((eventData: Omit<CampusEvent, 'id' | 'createdAt'>) => {
    const newEvent: CampusEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => {
      const result = addEventWithDeduplication(prev, newEvent, { replaceExisting: true });
      return result.events;
    });
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  }, []);

  const handleEditSave = useCallback((updated: CampusEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEvent(null);
  }, []);

  const handleResetDemo = useCallback(() => {
    const demoEvents = resetStoredEventsToDefault();
    setEvents(demoEvents);
  }, []);

  const handleClearAll = useCallback(() => {
    setEvents([]);
  }, []);

  const handleExportJson = useCallback(() => {
    exportEventsAsJson(events);
  }, [events]);

  // Compute "Needs Attention Today" events using pure date logic
  const todayEvents = useMemo(() => {
    return getEventsNeedingAttentionToday(events, currentDate);
  }, [events, currentDate]);

  // Dynamic status & category counts for badge pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length, today: 0, urgent: 0, upcoming: 0, expired: 0 };
    events.forEach((e) => {
      const evalRes = evaluateEventStatus(e.date, e.time, currentDate);
      if (evalRes.isToday) counts.today++;
      else if (evalRes.isUrgent) counts.urgent++;
      else if (evalRes.isUpcoming) counts.upcoming++;
      else if (evalRes.isExpired) counts.expired++;
    });
    return counts;
  }, [events, currentDate]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    events.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Filter & Sort Events
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.actionItem && e.actionItem.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))) ||
          e.rawText.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Filter by Urgency Status
    if (selectedStatus !== 'all') {
      result = result.filter((e) => {
        const evalRes = evaluateEventStatus(e.date, e.time, currentDate);
        if (selectedStatus === 'today') return evalRes.isToday;
        if (selectedStatus === 'urgent') return evalRes.isUrgent && !evalRes.isToday;
        if (selectedStatus === 'upcoming') return evalRes.isUpcoming;
        if (selectedStatus === 'expired') return evalRes.isExpired;
        return true;
      });
    }

    // Sort
    return sortEvents(result, sortMode, currentDate);
  }, [events, searchQuery, selectedCategory, selectedStatus, sortMode, currentDate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        todayCount={todayEvents.length}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onOpenDigestModal={() => setIsDigestModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onResetDemo={handleResetDemo}
        onExportJson={handleExportJson}
        onClearAll={handleClearAll}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Guide Banner */}
        <WelcomeBanner
          onOpenPasteModal={() => setIsPasteModalOpen(true)}
          onOpenDigestModal={() => setIsDigestModalOpen(true)}
        />

        {/* Feature 3: Needs Attention Today Section (Pure date logic) */}
        <NeedsAttentionToday
          todayEvents={todayEvents}
          onDelete={handleDeleteEvent}
          onTogglePin={handleTogglePin}
          onEdit={(e) => setEditingEvent(e)}
          referenceDate={currentDate}
        />

        {/* Feature 2: Search, Filter, & Sort Controls */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortMode={sortMode}
          onSortChange={setSortMode}
          categoryCounts={categoryCounts}
          statusCounts={statusCounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Events Feed Section */}
        <section aria-label="Campus announcements feed">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarSearch className="w-4 h-4 text-blue-600" />
              <span>Campus Announcements</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filteredAndSortedEvents.length}
              </span>
            </h2>

            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          {/* Cards Grid / List */}
          {filteredAndSortedEvents.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'flex flex-col gap-3'
              }
            >
              {filteredAndSortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={handleDeleteEvent}
                  onTogglePin={handleTogglePin}
                  onEdit={(e) => setEditingEvent(e)}
                  referenceDate={currentDate}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            /* Complete Empty State */
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">Your campus feed is empty</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Start by pasting raw WhatsApp group messages, club forwards, or professor emails. Or load the realistic demo data to explore immediately.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Paste Announcement (N)</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Load Demo Sample Events</span>
                </button>
              </div>
            </div>
          ) : (
            /* Filter Empty State */
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                No events matched your current filters or search query.
              </p>
              <p className="text-xs text-slate-500">
                Try searching for different keywords or clear your active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Campus Pulse</span>
            <span>&bull;</span>
            <span>All items stored securely in client localStorage</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Shortcuts (?)
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="hover:text-blue-600 transition-colors"
            >
              Reset Demo
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="hover:text-blue-600 transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onSaveEvent={handleSaveNewEvent}
      />

      <WeeklyDigestModal
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        events={events}
      />

      <EditEventModal
        isOpen={!!editingEvent}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={handleEditSave}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
