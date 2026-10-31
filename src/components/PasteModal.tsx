'use client';

import React, { useState, useEffect } from 'react';
import { CampusEvent, EventCategory, ParseResult } from '@/types';
import { ALL_CATEGORIES, CATEGORIES } from '@/lib/categories';
import { SAMPLE_PASTE_TEMPLATES, SampleTemplate } from '@/lib/sampleData';
import {
  X,
  Sparkles,
  ClipboardPaste,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: Omit<CampusEvent, 'id' | 'createdAt'>) => void;
}

const MAX_CHAR_LIMIT = 5000;

export default function PasteModal({ isOpen, onClose, onSaveEvent }: PasteModalProps) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Extracted preview state
  const [extractedData, setExtractedData] = useState<ParseResult | null>(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDate, setEditableDate] = useState('');
  const [editableTime, setEditableTime] = useState('');
  const [editableVenue, setEditableVenue] = useState('');
  const [editableCategory, setEditableCategory] = useState<EventCategory>('academic');
  const [editableSummary, setEditableSummary] = useState('');
  const [editableActionItem, setEditableActionItem] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const charCount = rawText.length;
  const isOverLimit = charCount > MAX_CHAR_LIMIT;

  const handleApplyTemplate = (tpl: SampleTemplate) => {
    setRawText(tpl.text);
    setError(null);
    setNotice(null);
    setExtractedData(null);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        setError(null);
        setNotice(null);
        setExtractedData(null);
      }
    } catch {
      setError('Unable to read from clipboard directly. Please paste manually (Ctrl+V).');
    }
  };

  const handleExtract = async (useFallback = false) => {
    if (!rawText.trim()) {
      setError('Please paste a message or select a sample template first.');
      return;
    }
    if (isOverLimit) {
      setError(`Text exceeds the maximum length of ${MAX_CHAR_LIMIT} characters.`);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch('/api/parse-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          clientTime: new Date().toISOString(),
          allowFallback: useFallback,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Server responded with status ${res.status}`);
      }

      if (json.notice) {
        setNotice(json.notice);
      }

      const data: ParseResult = json.data;
      setExtractedData(data);
      setEditableTitle(data.title || 'Campus Event');
      setEditableDate(data.date || new Date().toISOString().split('T')[0]);
      setEditableTime(data.time || 'TBD');
      setEditableVenue(data.venue || 'Campus');
      setEditableCategory(data.category || 'other');
      setEditableSummary(data.summary || '');
      setEditableActionItem(data.actionItem || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!editableTitle.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!editableDate.trim()) {
      setError('Date cannot be empty.');
      return;
    }

    onSaveEvent({
      title: editableTitle.trim(),
      date: editableDate.trim(),
      time: editableTime.trim() || 'TBD',
      venue: editableVenue.trim() || 'Campus',
      category: editableCategory,
      summary: editableSummary.trim() || 'No description provided.',
      actionItem: editableActionItem.trim() || undefined,
      rawText: rawText.trim(),
      tags: extractedData?.tags || [editableCategory],
    });

    // Reset and close
    setRawText('');
    setExtractedData(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-50/50 via-white to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="paste-modal-title" className="text-lg font-bold text-slate-900">
                Extract Campus Announcement
              </h2>
              <p className="text-xs text-slate-500">
                Paste messy WhatsApp group chats or professor emails — Gemini does the rest.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Demo Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Try Instant Sample Presets
              </span>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste from Clipboard
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PASTE_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 transition-colors text-left"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="raw-announcement" className="block text-xs font-semibold text-slate-700">
              Raw Message / Email Text
            </label>
            <div className="relative">
              <textarea
                id="raw-announcement"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (error) setError(null);
                }}
                rows={5}
                placeholder="Paste forwarded WhatsApp group message, email notification, or club announcement here..."
                className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                  isOverLimit
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-400">
                  Relative words like &quot;tomorrow&quot; or &quot;Friday&quot; are computed automatically.
                </span>
                <span
                  className={`font-mono text-xs ${
                    isOverLimit
                      ? 'text-red-600 font-bold'
                      : charCount > 4000
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                >
                  {charCount.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()} chars
                </span>
              </div>
            </div>
          </div>

          {/* Error & Notice Banners */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => handleExtract(true)}
                  className="mt-1 text-xs text-red-700 underline font-medium hover:text-red-900"
                >
                  Try parsing with smart heuristic fallback instead
                </button>
              </div>
            </div>
          )}

          {notice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Extract Button */}
          {!extractedData && (
            <button
              type="button"
              disabled={loading || !rawText.trim() || isOverLimit}
              onClick={() => handleExtract(false)}
              className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is extracting details...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract into Card with Gemini</span>
                </>
              )}
            </button>
          )}

          {/* Extracted Details Preview & Editor */}
          {extractedData && (
            <div className="border border-emerald-300 bg-emerald-50/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Extracted Event Card Preview
                </span>
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Re-extract
                </button>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Event Title</label>
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full p-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={editableDate}
                    onChange={(e) => setEditableDate(e.target.value)}
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
                    value={editableTime}
                    onChange={(e) => setEditableTime(e.target.value)}
                    placeholder="e.g. 14:00 - 16:00 or 3:00 PM"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Venue
                  </label>
                  <input
                    type="text"
                    value={editableVenue}
                    onChange={(e) => setEditableVenue(e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    Category
                  </label>
                  <select
                    value={editableCategory}
                    onChange={(e) => setEditableCategory(e.target.value as EventCategory)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none cursor-pointer"
                  >
                    {ALL_CATEGORIES.map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {CATEGORIES[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Summary / Notes</label>
                  <textarea
                    rows={2}
                    value={editableSummary}
                    onChange={(e) => setEditableSummary(e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Required Action / Deadline
                  </label>
                  <input
                    type="text"
                    value={editableActionItem}
                    onChange={(e) => setEditableActionItem(e.target.value)}
                    placeholder="e.g. Register before Friday 5 PM, carry ID card"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel (Esc)
          </button>

          {extractedData && (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Save to Campus Pulse</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
