'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
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

  const shortcuts = [
    { key: 'N or +', description: 'Paste and extract a new campus announcement' },
    { key: 'W', description: 'Open "What do I need to know this week?" AI digest' },
    { key: '/ or Ctrl+K', description: 'Focus and search campus events' },
    { key: 'Esc', description: 'Close any active modal or clear search input' },
    { key: '?', description: 'Open this keyboard shortcuts cheatsheet' },
    { key: 'Tab', description: 'Navigate through cards and action buttons' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-600" />
            <h2 id="shortcuts-title" className="text-base font-bold text-slate-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-slate-100">
          {shortcuts.map((sc, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-600">{sc.description}</span>
              <kbd className="px-2 py-1 font-mono font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded shadow-2xs whitespace-nowrap">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
