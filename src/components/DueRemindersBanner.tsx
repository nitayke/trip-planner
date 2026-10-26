'use client';

import React, { useEffect, useState } from 'react';
import { TripTask } from '../types/trip';
import { BellRing } from 'lucide-react';
import { formatDM } from '../lib/route';

interface DueRemindersBannerProps {
  tasks: TripTask[];
  onOpenTasks: () => void;
}

const SOON_DAYS = 3;

// A task comes up on its deadline, or on the date it is tied to a person
const dateOf = (t: TripTask) => t.dueDate ?? t.linkedDate;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Open tasks whose due date is today, overdue, or within the next few days
export function DueRemindersBanner({ tasks, onOpenTasks }: DueRemindersBannerProps) {
  // Computed on the client only (Next.js disallows `new Date()` during prerender).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  if (!today) return null;
  const limit = addDays(today, SOON_DAYS);
  const due = tasks
    .filter((t) => !t.isDone && dateOf(t) && dateOf(t)! <= limit)
    .sort((a, b) => dateOf(a)!.localeCompare(dateOf(b)!));
  if (due.length === 0) return null;

  return (
    <button
      onClick={onOpenTasks}
      className="mb-5 w-full rounded-2xl border border-amber-300 bg-amber-50 p-4 text-right shadow-xs transition hover:bg-amber-100/70"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <BellRing className="h-4 w-4" />
        <span>תזכורות שהגיע זמנן ({due.length})</span>
      </span>
      <ul className="mt-2 space-y-1">
        {due.slice(0, 5).map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-xs text-amber-950">
            <span className={`font-bold ${dateOf(t)! < today ? 'text-rose-700' : ''}`}>
              {dateOf(t)! < today ? 'באיחור' : dateOf(t) === today ? 'היום' : formatDM(dateOf(t)!)}
            </span>
            <span>{t.title}</span>
          </li>
        ))}
        {due.length > 5 && <li className="text-xs text-amber-800">ועוד {due.length - 5}…</li>}
      </ul>
    </button>
  );
}
