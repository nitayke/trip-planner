'use client';

import React from 'react';
import { Trip } from '../types/trip';
import { Calendar, Cloud, CloudOff, Sparkles } from 'lucide-react';
import { routeStops, countryStyle, stopForDate } from '../lib/route';

interface HeaderProps {
  trip: Trip;
  isCloudConnected: boolean;
  onOpenCloudModal: () => void;
  onOpenAiChat: () => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function formatShort(date: string) {
  const [, m, d] = date.split('-');
  return `${Number(d)}.${Number(m)}`;
}

export function Header({ trip, isCloudConnected, onOpenCloudModal, onOpenAiChat }: HeaderProps) {
  // Computed on the client only (Next.js disallows `new Date()` during prerender).
  const [today, setToday] = React.useState<string | null>(null);
  React.useEffect(() => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setToday(iso);
  }, []);

  const totalDays =
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / DAY_MS) + 1;

  let countdown = '';
  if (today) {
    const diff = Math.round((new Date(trip.startDate).getTime() - new Date(today).getTime()) / DAY_MS);
    if (diff > 1) countdown = `עוד ${diff} ימים להמראה`;
    else if (diff === 1) countdown = 'טסים מחר!';
    else if (diff === 0) countdown = 'היום טסים! ✈️';
    else if (today <= trip.endDate) countdown = `יום ${-diff + 1} מתוך ${totalDays}`;
    else countdown = 'הטיול הסתיים 💛';
  }
  const currentStop = today ? stopForDate(today) : undefined;

  return (
    <header className="relative isolate overflow-hidden text-white">
      {/* Hero background */}
      <img
        src="/hero.jpg"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-950/30 via-stone-950/35 to-stone-950/85" />

      <div className="mx-auto max-w-6xl px-4 pt-5 pb-6 sm:pt-8 sm:pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium tracking-wide text-white/80">הטיול שלנו ✦</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCloudModal}
              title={isCloudConnected ? 'מסונכרן לענן' : 'הנתונים נשמרים כרגע רק בדפדפן הזה'}
              className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
            >
              {isCloudConnected ? (
                <Cloud className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <CloudOff className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span>{isCloudConnected ? 'מסונכרן' : 'מקומי בלבד'}</span>
            </button>
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-stone-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>עוזר AI</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mt-10 sm:mt-16">
          {countdown && (
            <span className="glass inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
              {countdown}
            </span>
          )}
          <h1 className="font-display mt-3 text-3xl leading-tight drop-shadow-md sm:text-5xl">{trip.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatShort(trip.startDate)}.{trip.startDate.slice(2, 4)} – {formatShort(trip.endDate)}.
              {trip.endDate.slice(2, 4)}
            </span>
            <span>·</span>
            <span>{totalDays} ימים</span>
            {currentStop && (
              <>
                <span>·</span>
                <span>
                  עכשיו ב{currentStop.name} {currentStop.emoji}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Route strip */}
        <div className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4">
          <ol className="flex min-w-max items-center gap-1.5">
            {routeStops.map((stop, i) => {
              const isCurrent = currentStop?.id === stop.id;
              const isPast = today ? stop.end < today : false;
              return (
                <li key={stop.id} className="flex items-center gap-1.5">
                  <div
                    className={`glass flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition ${
                      isCurrent ? 'ring-2 ring-amber-300 bg-white/30' : ''
                    } ${isPast ? 'opacity-60' : ''} ${stop.tentative ? 'border-dashed' : ''}`}
                  >
                    <span>{stop.emoji}</span>
                    <span className="font-semibold">{stop.name}</span>
                    <span className="text-white/70">
                      {formatShort(stop.start)}–{formatShort(stop.end)}
                    </span>
                    {i === 0 || routeStops[i - 1].country !== stop.country ? (
                      <span title={countryStyle[stop.country].label}>{countryStyle[stop.country].flag}</span>
                    ) : null}
                  </div>
                  {i < routeStops.length - 1 && <span className="text-white/50">‹</span>}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </header>
  );
}
