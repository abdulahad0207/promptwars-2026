'use client';

import React, { useRef } from 'react';
import { EventCategory, UrgencyStatus } from '@/types';
import { CATEGORIES, ALL_CATEGORIES } from '@/lib/categories';
import { Search, X, SlidersHorizontal, ArrowUpDown, LayoutGrid, List } from 'lucide-react';

export type SortMode = 'priority' | 'nearest' | 'furthest' | 'category' | 'recent';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: EventCategory | 'all';
  onCategoryChange: (category: EventCategory | 'all') => void;
  selectedStatus: UrgencyStatus | 'all';
  onStatusChange: (status: UrgencyStatus | 'all') => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortMode,
  onSortChange,
  categoryCounts,
  statusCounts,
  viewMode,
  onViewModeChange,
}: SearchFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 mb-6">
      {/* Top Search & Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input with Keyboard Shortcut */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, venues, topics, or paste keywords (Press / or Ctrl+K)..."
            aria-label="Search campus events"
            className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-2 pr-2 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              aria-label="Sort events"
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
            >
              <option value="priority">Priority: Urgent First</option>
              <option value="nearest">Date: Nearest First</option>
              <option value="furthest">Date: Furthest First</option>
              <option value="category">Category (A-Z)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Urgency Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm border-b border-slate-200">
        <button
          type="button"
          onClick={() => onStatusChange('all')}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Items ({statusCounts.all || 0})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('today')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors ${
            selectedStatus === 'today'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Needs Attention Today ({statusCounts.today || 0})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('urgent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
            selectedStatus === 'urgent'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-orange-700 bg-orange-50/80 hover:bg-orange-100 border border-orange-200/80'
          }`}
        >
          Urgent &lt;48h ({statusCounts.urgent || 0})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
            selectedStatus === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80'
          }`}
        >
          Upcoming ({statusCounts.upcoming || 0})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('expired')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
            selectedStatus === 'expired'
              ? 'bg-slate-600 text-white shadow-xs'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          Past / Expired ({statusCounts.expired || 0})
        </button>
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Category:
        </span>

        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-2.5 py-1 rounded-full font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({categoryCounts.all || 0})
        </button>

        {ALL_CATEGORIES.map((catKey) => {
          const meta = CATEGORIES[catKey];
          const count = categoryCounts[catKey] || 0;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => onCategoryChange(catKey)}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? `${meta.accentBg} text-white border-transparent shadow-xs`
                  : `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} hover:brightness-95`
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
