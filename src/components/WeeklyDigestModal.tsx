'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CampusEvent } from '@/types';
import { isEventInCurrentWeek } from '@/lib/dateLogic';
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface WeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CampusEvent[];
}

export default function WeeklyDigestModal({ isOpen, onClose, events }: WeeklyDigestModalProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasTriggeredInitialFetch = useRef(false);

  // Filter events within this week (next 7 days)
  const thisWeekEvents = events.filter((e) => isEventInCurrentWeek(e.date));

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDigest(null);

    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: thisWeekEvents,
          clientTime: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate weekly digest.');
      }
      setDigest(data.digest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [thisWeekEvents]);

  // Auto-fetch when modal opens if not already fetched
  useEffect(() => {
    if (isOpen && !digest && !loading && !hasTriggeredInitialFetch.current) {
      hasTriggeredInitialFetch.current = true;
      const timer = setTimeout(() => {
        fetchDigest();
      }, 0);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      hasTriggeredInitialFetch.current = false;
    }
  }, [isOpen, digest, loading, fetchDigest]);

  const handleClose = useCallback(() => {
    stopSpeech();
    onClose();
  }, [stopSpeech, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (!digest) return;

    // Strip markdown formatting symbols for clean audio narration
    const plainText = digest
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/>/g, '')
      .replace(/- /g, '')
      .replace(/_/g, '');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = () => {
    if (!digest) return;
    navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-indigo-50/70 via-purple-50/40 to-blue-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="digest-modal-title" className="text-lg font-bold text-slate-900">
                What Do I Need To Know This Week?
              </h2>
              <p className="text-xs text-slate-500">
                Gemini executive student briefing ({thisWeekEvents.length} items scheduled this week)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchDigest}
              disabled={loading}
              title="Regenerate digest"
              aria-label="Regenerate weekly briefing"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close weekly briefing"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Analyzing your campus week with Gemini...
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Synthesizing deadlines, checking schedules for overlaps, and building your personal playbook.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Unable to generate briefing</span>
              </div>
              <p className="text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchDigest}
                className="text-xs font-semibold underline hover:text-red-900"
              >
                Click here to retry
              </button>
            </div>
          )}

          {!loading && digest && (
            <div className="prose-digest bg-slate-50/50 p-5 rounded-xl border border-slate-200">
              {digest.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-lg font-bold text-indigo-950 mt-4 mb-2 pb-1 border-b border-indigo-100">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }

                if (trimmed.startsWith('#### ')) {
                  return (
                    <h4 key={idx} className="text-base font-bold text-slate-800 mt-3 mb-1">
                      {trimmed.replace('#### ', '')}
                    </h4>
                  );
                }

                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/70 p-3 rounded-r-md text-xs text-indigo-900 my-2">
                      {trimmed.replace('> ', '')}
                    </blockquote>
                  );
                }

                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const items = trimmed.split('\n').filter(Boolean);
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1 text-sm text-slate-700 my-2">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          {item.replace(/^[-*]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Normal paragraph
                return (
                  <p key={idx} className="text-sm text-slate-700 leading-relaxed my-2">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Audio Readout & Copy */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              disabled={loading || !digest}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                isSpeaking
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !digest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Briefing</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
