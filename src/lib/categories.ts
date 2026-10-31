import { EventCategory } from '@/types';

export interface CategoryMeta {
  id: EventCategory;
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentBg: string;
}

export const CATEGORIES: Record<EventCategory, CategoryMeta> = {
  academic: {
    id: 'academic',
    label: 'Academic & Exams',
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
    accentBg: 'bg-blue-600',
  },
  club: {
    id: 'club',
    label: 'Clubs & Hackathons',
    colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-700',
    accentBg: 'bg-purple-600',
  },
  workshop: {
    id: 'workshop',
    label: 'Workshops & Career',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-700',
    accentBg: 'bg-emerald-600',
  },
  sports: {
    id: 'sports',
    label: 'Sports & Fitness',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-700',
    accentBg: 'bg-amber-600',
  },
  social: {
    id: 'social',
    label: 'Social & Fests',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-700',
    accentBg: 'bg-rose-600',
  },
  administrative: {
    id: 'administrative',
    label: 'Admin & Notices',
    colorClass: 'text-slate-700 bg-slate-100 border-slate-300',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    accentBg: 'bg-slate-600',
  },
  other: {
    id: 'other',
    label: 'Other Campus News',
    colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    badgeText: 'text-cyan-700',
    accentBg: 'bg-cyan-600',
  },
};

export const ALL_CATEGORIES: EventCategory[] = [
  'academic',
  'club',
  'workshop',
  'sports',
  'social',
  'administrative',
  'other',
];
