'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  HelpCircle,
  MoreVertical,
  RotateCcw,
  Download,
  Trash2,
  Calendar,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  todayCount: number;
  onOpenPasteModal: () => void;
  onOpenDigestModal: () => void;
  onOpenShortcutsModal: () => void;
  onResetDemo: () => void;
  onExportJson: () => void;
  onClearAll: () => void;
}

export default function Navbar({
  todayCount,
  onOpenPasteModal,
  onOpenDigestModal,
  onOpenShortcutsModal,
  onResetDemo,
  onExportJson,
  onClearAll,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-950">
                Campus Pulse
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-md uppercase">
                Student AI Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Messy messages &rarr; Instant structured schedule
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* What Do I Need To Know This Week Button */}
          <button
            type="button"
            onClick={onOpenDigestModal}
            title="Generate AI weekly briefing (W)"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">What do I need to know this week?</span>
            <span className="md:hidden">Weekly Digest</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 font-mono text-[10px] bg-indigo-100 text-indigo-800 rounded">
              W
            </kbd>
          </button>

          {/* Paste Announcement Button */}
          <button
            type="button"
            onClick={onOpenPasteModal}
            title="Paste raw WhatsApp or email message (N)"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Paste Announcement</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 font-mono text-[10px] bg-blue-700 text-blue-100 rounded">
              N
            </kbd>
          </button>

          {/* Shortcuts Info */}
          <button
            type="button"
            onClick={onOpenShortcutsModal}
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
            className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="More options"
              aria-label="Open options menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs font-medium text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onResetDemo();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span>Reset to demo sample events</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onExportJson();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export backup (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenShortcutsModal();
                    }}
                    className="sm:hidden w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>Keyboard shortcuts (?)</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm('Are you sure you want to delete all saved campus events?')) {
                        onClearAll();
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all events</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
