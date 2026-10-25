'use client';

import React from 'react';
import { Trip } from '../types/trip';
import { Calendar, MapPin, Cloud, CloudOff, Sparkles, Heart } from 'lucide-react';

interface HeaderProps {
  trip: Trip;
  isCloudConnected: boolean;
  onOpenCloudModal: () => void;
  onOpenAiChat: () => void;
}

export function Header({
  trip,
  isCloudConnected,
  onOpenCloudModal,
  onOpenAiChat,
}: HeaderProps) {
  const [daysRemainingText, setDaysRemainingText] = React.useState<string>('מתכוננים לטיסה ✈️');

  React.useEffect(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(trip.startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) setDaysRemainingText(`עוד ${diffDays} ימים להמראה! 🚀`);
      else if (diffDays === 0) setDaysRemainingText(`היום טסים! איזה התרגשות! ✈️`);
      else setDaysRemainingText(`החופשה בעיצומה! תהנו מכל רגע! 🥂`);
    } catch {
      setDaysRemainingText('');
    }
  }, [trip.startDate]);

  return (
    <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-lg">
      {/* Background travel pattern / overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Main Trip Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Heart className="w-3 h-3 text-pink-300 fill-pink-300" />
                טיול זוגי
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/20 text-amber-200 border border-amber-400/30">
                {daysRemainingText}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              {trip.title}
            </h1>

            <div className="flex items-center gap-4 mt-2 text-blue-100 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-200 shrink-0" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-200 shrink-0" />
                <span>{trip.startDate} עד {trip.endDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons: Cloud Sync & AI Chat */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0">
            {/* Cloud Sync Status Button */}
            <button
              onClick={onOpenCloudModal}
              title={isCloudConnected ? "ענן מסונכרן חינם עם Supabase" : "לחץ לחיבור ענן 24/7 לטלפון"}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all ${
                isCloudConnected
                  ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/40 hover:bg-emerald-500/30"
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
              }`}
            >
              {isCloudConnected ? (
                <>
                  <Cloud className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="hidden xs:inline">סנכרון ענן פעיל</span>
                  <span className="xs:hidden">מסונכרן</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="hidden xs:inline">חיבור ענן לטלפון</span>
                  <span className="xs:hidden">חיבור ענן</span>
                </>
              )}
            </button>

            {/* AI Assistant Quick Trigger */}
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>עוזר AI</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
