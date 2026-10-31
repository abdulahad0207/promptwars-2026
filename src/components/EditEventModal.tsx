'use client';

import React, { useState, useEffect } from 'react';
import { CampusEvent, EventCategory } from '@/types';
import { ALL_CATEGORIES, CATEGORIES } from '@/lib/categories';
import { X, Save, Calendar, Clock, MapPin, Tag } from 'lucide-react';

interface EditEventModalProps {
  isOpen: boolean;
  event: CampusEvent | null;
  onClose: () => void;
  onSave: (updatedEvent: CampusEvent) => void;
}

interface EditEventFormProps {
  event: CampusEvent;
  onClose: () => void;
  onSave: (updatedEvent: CampusEvent) => void;
}

function EditEventForm({ event, onClose, onSave }: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [venue, setVenue] = useState(event.venue);
  const [category, setCategory] = useState<EventCategory>(event.category);
  const [summary, setSummary] = useState(event.summary);
  const [actionItem, setActionItem] = useState(event.actionItem || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    onSave({
      ...event,
      title: title.trim(),
      date: date.trim(),
      time: time.trim() || 'TBD',
      venue: venue.trim() || 'Campus',
      category,
      summary: summary.trim(),
      actionItem: actionItem.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Time
          </label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            Venue
          </label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-purple-600" />
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none cursor-pointer"
          >
            {ALL_CATEGORIES.map((catKey) => (
              <option key={catKey} value={catKey}>
                {CATEGORIES[catKey].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Summary</label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Action Item / Note</label>
        <input
          type="text"
          value={actionItem}
          onChange={(e) => setActionItem(e.target.value)}
          placeholder="e.g. Register by 5 PM"
          className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}

export default function EditEventModal({
  isOpen,
  event,
  onClose,
  onSave,
}: EditEventModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 id="edit-modal-title" className="text-base font-bold text-slate-900">
            Edit Event Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <EditEventForm
          key={event.id}
          event={event}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
